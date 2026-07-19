'use client';

import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';
import type { Subscription } from '@/app/features/subscriptions/types';
import { formatMoney } from '@/lib/utils/currency';

function CountUp({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, target, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (value) => setDisplay(value),
    });
    return () => controls.stop();
  }, [target]);

  return display;
}

function MonthlyDisplay({
  monthly,
  currency,
}: {
  monthly: number;
  currency: string;
}) {
  const value = CountUp({ target: monthly });
  return (
    <p className='mt-1 font-mono text-4xl tabular-nums text-paper'>
      {formatMoney(value, currency)}
    </p>
  );
}

export function BleedTotal({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  // Group by currency rather than summing everything into one number —
  // blending currencies silently is the fastest way to break a user's trust
  // in a finance tool, even if the intent is just "show me one total."
  const totalsByCurrency = subscriptions.reduce<Record<string, number>>(
    (acc, sub) => {
      acc[sub.currency] = (acc[sub.currency] ?? 0) + sub.monthly_equivalent;
      return acc;
    },
    {},
  );

  const currencies = Object.keys(totalsByCurrency);

  if (currencies.length === 0) {
    return (
      <div className='w-full rounded-lg bg-pine px-6 py-6 text-left'>
        <p className='text-xs uppercase tracking-wide text-paper/60'>
          Monthly bleed
        </p>
        <p className='mt-1 font-mono text-4xl tabular-nums text-paper'>$0.00</p>
      </div>
    );
  }

  if (currencies.length === 1) {
    const currency = currencies[0];
    const monthly = totalsByCurrency[currency];
    return (
      <div className='w-full rounded-lg bg-pine px-6 py-6 text-left'>
        <p className='text-xs uppercase tracking-wide text-paper/60'>
          Monthly bleed
        </p>
        <MonthlyDisplay monthly={monthly} currency={currency} />
        <p className='mt-1 text-sm text-paper/70'>
          {formatMoney(monthly * 12, currency)} / year
        </p>
      </div>
    );
  }

  return (
    <div className='w-full rounded-lg bg-pine px-6 py-6 text-left'>
      <p className='text-xs uppercase tracking-wide text-paper/60'>
        Monthly bleed, by currency
      </p>
      <div className='mt-2 flex flex-col gap-2'>
        {currencies.map((currency) => (
          <div key={currency} className='flex items-baseline justify-between'>
            <span className='font-mono text-2xl tabular-nums text-paper'>
              {formatMoney(totalsByCurrency[currency], currency)}
            </span>
            <span className='text-xs text-paper/60'>{currency}/mo</span>
          </div>
        ))}
      </div>
    </div>
  );
}
