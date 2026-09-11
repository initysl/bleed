'use client';

import { useCallback, useEffect, useRef } from 'react';

// Elements that can hold focus. :not([tabindex='-1']) keeps
// programmatically-focusable-but-not-tabbable elements out of the Tab cycle,
// and :not(:disabled) matches what the browser itself skips.
const FOCUSABLE = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * The four things every modal surface owes a keyboard or screen-reader user:
 * Escape closes it, Tab stays inside it, focus moves into it on open, and focus
 * returns to the trigger on close. Plus a body scroll lock.
 *
 * Shared by the Modal and the dashboard's mobile drawer. The drawer previously
 * had none of it — no Escape, no scroll lock (the page scrolled underneath it),
 * no focus management, and no role="dialog" — while the Modal had only the
 * scroll lock and Escape. Keeping one implementation means the drawer cannot
 * quietly drift out of step with the Modal again.
 *
 * Attach the returned ref to the dialog panel, and give that panel
 * `tabIndex={-1}` so it can receive focus when it holds nothing focusable.
 */
export function useDialogBehavior<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
) {
  const panelRef = useRef<T>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const getFocusable = useCallback(
    () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      ),
    [],
  );

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // Wrap at both ends. Without this, tabbing past the last control moved
      // focus to the page behind the backdrop — invisible, and on a page that
      // is scroll-locked, so there was no way to tell where focus had gone.
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, getFocusable]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // Deferred a frame so the element exists and has been laid out — a panel
    // still animating in from `x: 100%` has no offsetParent yet.
    const frame = requestAnimationFrame(() => {
      const focusable = getFocusable();
      (focusable[0] ?? panelRef.current)?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      // Hand focus back where it came from, so closing doesn't dump the user at
      // the top of the document.
      previouslyFocused.current?.focus();
    };
  }, [open, getFocusable]);

  return panelRef;
}
