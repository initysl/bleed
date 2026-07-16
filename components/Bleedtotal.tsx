'use client';

import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

export function BleedTotal({ monthlyTotal }: { monthlyTotal: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, monthlyTotal, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (value) => setDisplay(value),
    });
    return () => controls.stop();
  }, [monthlyTotal]);

  return (
    <div className='w-full rounded-lg border border-sage bg-white/60 px-6 py-8 text-center'>
      <p className='font-mono text-4xl tabular-nums text-ink'>
        ${display.toFixed(2)}
      </p>
      <p className='mt-2 text-xs uppercase tracking-wide text-ink/50'>
        per month
      </p>
      <p className='mt-1 text-xs text-ink/40'>
        ${(monthlyTotal * 12).toFixed(2)} / year
      </p>
    </div>
  );
}
