'use client';

import { MotionConfig } from 'framer-motion';
import { EASE_OUT_EXPO, DURATION } from '@/lib/motion';

/**
 * Global motion configuration.
 *
 * `reducedMotion="user"` makes framer-motion honour the operating system's
 * prefers-reduced-motion setting for every animation in the app: transform
 * and layout animation are dropped while opacity still crossfades, which is
 * the behaviour the spec actually asks for.
 *
 * This replaces the per-component useReducedMotion() checks that previously
 * covered 3 of ~14 animation sites — the kind of guard that is only ever as
 * good as the last person who remembered it. The CSS half (transitions and
 * keyframes, which nothing in JS touches) lives in app/globals.css.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      reducedMotion='user'
      transition={{ duration: DURATION.arrive, ease: EASE_OUT_EXPO }}
    >
      {children}
    </MotionConfig>
  );
}
