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

// Split currency into main integer string and muted decimal string
function FormattedAmount({
  amount,
  currency,
}: {
  amount: number;
  currency: string;
}) {
  const animatedValue = CountUp({ target: amount });
  const formatted = formatMoney(animatedValue, currency);

  // Match currency string parts (e.g., "$80,883.59" -> "$80,883" & ".59")
  const parts = formatted.match(/^([^\d]*[\d,]+)(\.\d+)?$/);
  const mainPart = parts ? parts[1] : formatted;
  const decimalPart = parts && parts[2] ? parts[2] : '';

  return (
    <h2 className='font-display text-4xl sm:text-5xl tracking-tight text-ink tabular-nums'>
      {mainPart}
      {decimalPart && (
        <span className='text-ink/35 font-normal'>{decimalPart}</span>
      )}
    </h2>
  );
}

export function BleedTotal({
  subscriptions,
  onCurrencyChange,
}: {
  subscriptions: Subscription[];
  onCurrencyChange?: (currency: string) => void;
}) {
  // Aggregate data by currency
  const totalsByCurrency = subscriptions.reduce<
    Record<string, { total: number; count: number }>
  >((acc, sub) => {
    if (!acc[sub.currency]) {
      acc[sub.currency] = { total: 0, count: 0 };
    }
    acc[sub.currency].total += sub.monthly_equivalent;
    acc[sub.currency].count += 1;
    return acc;
  }, {});

  const currencies = Object.keys(totalsByCurrency);
  const [activeCurrency, setActiveCurrency] = useState<string>(
    currencies[0] ?? 'USD',
  );

  // Fallback sync when subscriptions array changes
  useEffect(() => {
    if (currencies.length > 0 && !currencies.includes(activeCurrency)) {
      setActiveCurrency(currencies[0]);
    }
  }, [currencies, activeCurrency]);

  const handleCurrencySelect = (currency: string) => {
    setActiveCurrency(currency);
    if (onCurrencyChange) onCurrencyChange(currency);
  };

  const currentData = totalsByCurrency[activeCurrency] ?? {
    total: 0,
    count: 0,
  };

  // Quick Currency Flag Helper (Optional enhancement)
  const getFlag = (code: string) => {
    switch (code.toUpperCase()) {
      case 'USD':
        return '🇺🇸';
      case 'EUR':
        return '🇪🇺';
      case 'GBP':
        return '🇬🇧';
      case 'CAD':
        return '🇨🇦';
      case 'NGN':
        return '🇳🇬';
      default:
        return '🌐';
    }
  };

  return (
    <div className='w-full rounded-2xl bg-white border border-sage/60 p-6 sm:p-7 shadow-sm'>
      {/* 1. Currency Selector Pill Row */}
      {currencies.length > 1 && (
        <div className='flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none'>
          {currencies.map((curr) => {
            const isActive = curr === activeCurrency;
            return (
              <button
                key={curr}
                type='button'
                onClick={() => handleCurrencySelect(curr)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-paper text-ink shadow-sm'
                    : 'bg-sage/20 text-ink/50 hover:bg-sage/40 hover:text-ink'
                }`}
              >
                <span>{getFlag(curr)}</span>
                <span className='uppercase'>{curr}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Primary Balance Display */}
      <div className='space-y-1'>
        <FormattedAmount amount={currentData.total} currency={activeCurrency} />

        {/* Metric Subtitle */}
        <div className='flex items-center gap-2 pt-1'>
          <span className='text-xs text-ink/50 font-medium'>Monthly bleed</span>
          <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600'>
            <span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
            {currentData.count}{' '}
            {currentData.count === 1 ? 'active sub' : 'active subs'}
          </span>
        </div>
      </div>
    </div>
  );
}
