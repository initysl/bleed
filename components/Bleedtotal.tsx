'use client';

import { useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
} from 'framer-motion';

export function BleedTotal({ monthlyTotal }: { monthlyTotal: number }) {
  const shouldReduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => `$${v.toFixed(2)}`);

  useEffect(() => {
    if (shouldReduceMotion) {
      count.set(monthlyTotal);
      return;
    }
    const controls = animate(count, monthlyTotal, {
      duration: 1,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [monthlyTotal, shouldReduceMotion, count]);

  return (
    <div className='w-full max-w-md rounded-lg border border-sage bg-white/60 px-6 py-8 text-center'>
      <motion.p className='font-mono text-4xl tabular-nums text-pine'>
        {rounded}
      </motion.p>
      <p className='mt-2 text-xs uppercase tracking-wide text-ink/40'>
        per month, right now
      </p>
    </div>
  );
}
