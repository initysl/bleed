'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/**
 * Animates a number towards `target` and returns the current value.
 *
 * A hook, named as one. Both BleedTotal and BleedWallet previously declared
 * their own `function CountUp({ target })` and called it as a bare function
 * from inside another component's body. That happened to work — the hooks
 * landed on the calling component's fiber — but it violates the Rules of Hooks
 * and breaks the moment either call becomes conditional.
 *
 * Two behaviours worth keeping in mind:
 *  - It animates from the PREVIOUS value, not from zero. Both copies restarted
 *    at 0 on every change, so switching a currency or adding a subscription
 *    replayed a climb from $0.00, which reads as a glitch rather than a flourish.
 *  - It respects prefers-reduced-motion by returning the target directly.
 */
export function useCountUp(target: number, duration = 0.8): number {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(target);
  const previous = useRef(target);

  useEffect(() => {
    if (reduceMotion) {
      previous.current = target;
      return;
    }

    const controls = animate(previous.current, target, {
      duration,
      ease: 'easeOut',
      onUpdate: setDisplay,
      onComplete: () => {
        previous.current = target;
      },
    });

    return () => {
      controls.stop();
      previous.current = target;
    };
  }, [target, duration, reduceMotion]);

  return reduceMotion ? target : display;
}
