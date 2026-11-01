export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'bleed-theme';

/**
 * Fired after a same-tab preference change.
 *
 * The native `storage` event only reaches OTHER tabs, so without this the tab
 * doing the writing would never learn that its own store changed.
 */
export const THEME_CHANGE_EVENT = 'bleed:themechange';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * Runs before the browser paints anything, injected as a blocking inline
 * script in the document head.
 *
 * It has to be a string rather than an imported function because it must
 * execute ahead of hydration — indeed ahead of React existing at all. If the
 * theme were applied in an effect instead, every single page load in dark mode
 * would paint the light theme first and then snap, which is the flash this
 * exists to prevent.
 *
 * Deliberately total: any throw here (Safari private mode denying
 * localStorage, a corrupted value) must still leave a usable light document
 * rather than an unthemed one, so the whole body is wrapped and the fallback
 * writes an explicit attribute.
 */
export const THEME_SCRIPT = `(function(){try{
var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
var m=window.matchMedia('(prefers-color-scheme: dark)').matches;
var t=(s==='light'||s==='dark')?s:(m?'dark':'light');
document.documentElement.setAttribute('data-theme',t);
}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

/** Resolves a stored preference against the OS setting. */
export function resolveTheme(
  preference: ThemePreference,
  prefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light';
  return preference;
}

export function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    // Private browsing and blocked site data both throw on access rather than
    // returning null, so this cannot be a plain null check.
    return 'system';
  }
}

export function writeStoredPreference(preference: ThemePreference) {
  try {
    if (preference === 'system') {
      // Absence means "follow the OS", so the script picks up later OS changes
      // instead of being pinned to whatever it resolved to today.
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    }
  } catch {
    // Non-fatal: the theme still applies for this session, it just won't be
    // remembered. Failing the toggle over this would be worse.
  }
}
