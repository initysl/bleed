'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from 'react';
import {
  readStoredPreference,
  resolveTheme,
  writeStoredPreference,
  THEME_CHANGE_EVENT,
  type ResolvedTheme,
  type ThemePreference,
} from '@/lib/theme';

interface ThemeContextValue {
  /** What the user chose: light, dark, or defer to the OS. */
  preference: ThemePreference;
  /** What that actually resolves to right now. */
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * The theme lives in localStorage and in the OS setting — two external stores,
 * neither owned by React. useSyncExternalStore is the primitive built for
 * exactly that, and unlike a useEffect + setState pair it reads the real value
 * during the first committed render rather than one render later.
 *
 * Both snapshots return a plain string, which matters: useSyncExternalStore
 * re-renders whenever the snapshot is not referentially equal to the last one,
 * so returning a fresh object each call would loop forever.
 */
function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);

  media.addEventListener('change', onChange);
  // Same tab (our own writes) and other tabs (the native event), so changing
  // the theme in Settings updates every open tab.
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);

  return () => {
    media.removeEventListener('change', onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getPreference(): ThemePreference {
  return readStoredPreference();
}

function getResolved(): ResolvedTheme {
  return resolveTheme(
    readStoredPreference(),
    window.matchMedia(DARK_QUERY).matches,
  );
}

// The server cannot know either value. It renders the neutral default, and
// because these are also used as the hydration snapshot, the client's first
// render matches the server's HTML exactly. The visible document is already
// correct regardless — the inline script set data-theme before React loaded.
const getServerPreference = (): ThemePreference => 'system';
const getServerResolved = (): ResolvedTheme => 'light';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preference = useSyncExternalStore(
    subscribe,
    getPreference,
    getServerPreference,
  );
  const resolved = useSyncExternalStore(
    subscribe,
    getResolved,
    getServerResolved,
  );

  // Pushing React's state out to the DOM is what an effect is actually for.
  // This covers the OS flipping while the preference is 'system'.
  //
  // It writes the LIVE value rather than `resolved`. During hydration
  // `resolved` is the server snapshot — always 'light' — and only corrects on
  // the re-render after. Writing it would flip a dark page to light for that
  // one render, long enough for framer-motion's layout reads to lock light
  // colours in as the start of every `transition-colors`, so each dark page
  // load visibly faded from light to dark.
  useEffect(() => {
    const live = getResolved();
    document.documentElement.setAttribute('data-theme', live);

    // Colours the browser's own chrome — the address bar on Android, the
    // status bar on an installed PWA. A static value in <head> would follow
    // the OS rather than an explicit choice, so it is driven from the
    // resolved theme instead.
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (meta) {
      meta.content = live === 'dark' ? '#111816' : '#f7f8f6';
    }
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    writeStoredPreference(next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return context;
}
