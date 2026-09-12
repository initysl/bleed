'use client';

import { useState } from 'react';
import type { Subscription } from '@/app/features/subscriptions/types';
import { formatMoney } from '@/lib/utils/currency';
import { useCountUp } from '@/app/features/subscriptions/hooks/useCountUp';

// Split currency into main integer string and muted decimal string
function FormattedAmount({
  amount,
  currency,
}: {
  amount: number;
  currency: string;
}) {
  const animatedValue = useCountUp(amount);
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

  // The user's *preference*, which may not be present in the current data —
  // derived rather than synced. This used to be state kept in step by an effect
  // whose dependency array contained `currencies`, a fresh array identity on
  // every render, so the effect re-ran after every single render and called
  // setState from inside it (the react-hooks/set-state-in-effect error).
  // Deriving needs no effect and cannot fall out of step.
  const [preferredCurrency, setPreferredCurrency] = useState<string | null>(
    null,
  );
  const activeCurrency =
    preferredCurrency && currencies.includes(preferredCurrency)
      ? preferredCurrency
      : (currencies[0] ?? 'USD');

  const handleCurrencySelect = (currency: string) => {
    setPreferredCurrency(currency);
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
                // These are a toggle set, not plain buttons — without
                // aria-pressed a screen reader gives no indication which
                // currency is currently shown. The inactive text was ink/50
                // (~3:1); ink/70 clears 4.5:1 against the sage tint.
                aria-pressed={isActive}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-paper text-ink shadow-sm'
                    : 'bg-sage/20 text-ink/70 hover:bg-sage/40 hover:text-ink'
                }`}
              >
                <span aria-hidden='true'>{getFlag(curr)}</span>
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
          <span className='text-xs text-ink/70 font-medium'>Monthly bleed</span>
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
