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
    <div className='bg-yellow-600 w-full rounded-lg bg-pine px-6 py-6 text-left'>
      <p className='text-xs uppercase tracking-wide text-paper/60'>
        Monthly bleed
      </p>
      <p className='mt-1 font-mono text-4xl tabular-nums text-paper'>
        ${display.toFixed(2)}
      </p>
      <p className='mt-1 text-sm text-paper/70'>
        ${(monthlyTotal * 12).toFixed(2)} / year
      </p>
    </div>
  );
}
