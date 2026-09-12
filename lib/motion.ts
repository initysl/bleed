import type { Transition, Variants } from 'framer-motion';

/**
 * One motion vocabulary for the whole app.
 *
 * The rule this encodes: motion marks a state change — arriving, selecting,
 * expanding, confirming — and nothing else. Nothing loops. Everything is
 * interruptible. Anything that cannot state which state change it marks does
 * not get animated.
 *
 * Reduced motion is handled globally by <MotionConfig reducedMotion="user">
 * in providers/MotionProvider.tsx, which strips transform and layout
 * animation while leaving opacity intact. Individual components should NOT
 * re-implement that check; the CSS half lives in app/globals.css.
 */

/** Decelerating, never overshooting. Everything the user initiated. */
export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

/** Seconds. Named for the event, not the number. */
export const DURATION = {
  /** A press, a tint, a colour swap. Below ~100ms reads as instant. */
  press: 0.12,
  /** A selection landing: an edge wipe, a chip filling. */
  select: 0.18,
  /** Something physically travelling: a switch thumb, a sliding indicator. */
  travel: 0.22,
  /** A panel unfolding in place. */
  unfold: 0.26,
  /** A block arriving on first paint. */
  arrive: 0.52,
  /** The meter counting to a new figure. */
  meter: 0.8,
} as const;

/** The default transition. Use this unless there is a reason not to. */
export const ease: Transition = {
  duration: DURATION.arrive,
  ease: EASE_OUT_EXPO,
};

/**
 * Springs, for anything that should feel physical rather than timed —
 * switch thumbs, chevrons, drag. Stiffness over duration: a spring
 * interrupted mid-flight resolves from where it is, which a tween cannot.
 */
export const SPRING = {
  /** Crisp, minimal overshoot. Switches, chips, sliding indicators. */
  snap: { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 },
  /** Softer, for larger surfaces like the mobile drawer. */
  panel: { type: 'spring', stiffness: 260, damping: 30 },
} satisfies Record<string, Transition>;

/* -------------------------------------------------------------------------
   Variants
   ------------------------------------------------------------------------- */

/**
 * A block arriving. Paired with `staggerContainer` on a parent to make a
 * column of panels resolve in reading order.
 *
 * Note the deliberate lack of a `hidden` opacity:0 on anything that is the
 * page's LCP element — a headline that starts invisible cannot paint until
 * the JS bundle hydrates, which is what made the old marketing hero blank
 * below the fold when scripting was slow.
 */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: ease },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

/** A row or drawer unfolding in place, rather than appearing. */
export const unfold: Variants = {
  hidden: { opacity: 0, height: 0 },
  show: {
    opacity: 1,
    height: 'auto',
    transition: { duration: DURATION.unfold, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: DURATION.select, ease: EASE_OUT_EXPO },
  },
};

/** A modal panel. The backdrop is faster than the panel, deliberately. */
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export const modalPanel: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATION.unfold, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    y: 6,
    scale: 0.99,
    transition: { duration: DURATION.select, ease: EASE_OUT_EXPO },
  },
};

/** An alert dropping into place above the control that caused it. */
export const alertIn: Variants = {
  hidden: { opacity: 0, y: -4 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.unfold, ease: EASE_OUT_EXPO },
  },
  exit: { opacity: 0, y: -4, transition: { duration: DURATION.press } },
};

/**
 * Press feedback. A button compresses into the surface rather than changing
 * colour — applied as whileTap so it cannot get stuck in the pressed state.
 */
export const press = {
  whileTap: { y: 1 },
  transition: { duration: DURATION.press, ease: EASE_OUT_EXPO },
} as const;
