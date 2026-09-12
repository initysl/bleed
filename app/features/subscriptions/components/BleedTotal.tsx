'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Subscription } from '@/app/features/subscriptions/types';
import { moneyParts, formatMoney } from '@/lib/utils/currency';
import { useCountUp } from '@/app/features/subscriptions/hooks/useCountUp';
import { SegmentedControl } from '@/app/components/ui/SegmentedControl';
import { DURATION, EASE_OUT_EXPO } from '@/lib/motion';

// Tints of the single accent, in descending order. The largest subscription
// takes the strongest tone, so the bar reads as a ranking and not a palette.
const TINTS = ['var(--color-pine)', 'var(--color-pine-60)', 'var(--color-pine-35)', 'var(--color-pine-20)'];

function Amount({ amount, currency }: { amount: number; currency: string }) {
  // Animates from the PREVIOUS value, so switching currency or adding a
  // subscription reads as the meter moving rather than resetting.
  const animated = useCountUp(amount, DURATION.meter);
  const { symbol, whole, fraction } = moneyParts(animated, currency);

  return (
    <h2 className='flex items-baseline gap-[3px]'>
      <span className='font-mono text-[22px] text-ink/40 tnum'>{symbol}</span>
      <span className='font-display text-meter font-bold text-ink tnum'>
        {whole}
      </span>
      {fraction && (
        <span className='font-display text-[26px] font-medium text-ink/35 tnum'>
          {fraction}
        </span>
      )}
      <span className='ml-1.5 font-mono text-[11px] tracking-[0.1em] text-ink/40'>
        /MO
      </span>
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
  const byCurrency = subscriptions.reduce<Record<string, Subscription[]>>(
    (acc, sub) => {
      (acc[sub.currency] ??= []).push(sub);
      return acc;
    },
    {},
  );

  const currencies = Object.keys(byCurrency).sort();

  // The user's preference, which may not exist in the current data — derived
  // rather than synced in an effect, so there is no cascading render and no
  // way for the two to fall out of step.
  const [preferred, setPreferred] = useState<string | null>(null);
  const active =
    preferred && currencies.includes(preferred)
      ? preferred
      : (currencies[0] ?? 'USD');

  const rows = byCurrency[active] ?? [];
  const total = rows.reduce((sum, s) => sum + s.monthly_equivalent, 0);

  // Top four by cost, so the bar stays legible; everything else is one
  // remainder segment rather than a row of slivers.
  const ranked = [...rows].sort(
    (a, b) => b.monthly_equivalent - a.monthly_equivalent,
  );
  const lead = ranked.slice(0, 4);
  const restTotal = ranked
    .slice(4)
    .reduce((sum, s) => sum + s.monthly_equivalent, 0);

  const segments = [
    ...lead.map((s, i) => ({
      key: s.id,
      name: s.name,
      value: s.monthly_equivalent,
      color: TINTS[i],
    })),
    ...(restTotal > 0
      ? [{ key: '__rest', name: 'Everything else', value: restTotal, color: 'var(--color-line)' }]
      : []),
  ];

  function selectCurrency(next: string) {
    setPreferred(next);
    onCurrencyChange?.(next);
  }

  return (
    <section className='w-full rounded-sm border border-line bg-surface p-[22px] pb-[18px]'>
      <div className='mb-5 flex items-center justify-between gap-3'>
        <h3 className='section-label m-0'>
          <span className='text-pine'>01</span>&nbsp; MONTHLY BLEED
        </h3>

        {currencies.length > 1 && (
          <SegmentedControl
            label='Display currency'
            size='sm'
            value={active}
            onChange={selectCurrency}
            segments={currencies.map((c) => ({ value: c, label: c }))}
          />
        )}
      </div>

      <Amount amount={total} currency={active} />

      {/* Proportion bar. Keyed on the currency so the segments re-grow when
          the meter switches books — the growth IS the signal that the number
          underneath now refers to something else. */}
      <div key={active} className='mt-5 mb-2.5 flex h-1.5 gap-0.5'>
        {segments.map((seg, i) => (
          <motion.div
            key={seg.key}
            title={`${seg.name} — ${formatMoney(seg.value, active)}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: 0.76,
              ease: EASE_OUT_EXPO,
              delay: 0.1 + i * 0.08,
            }}
            className='origin-left rounded-xs'
            style={{ flexGrow: seg.value, background: seg.color }}
          />
        ))}
      </div>

      <div className='mt-3.5 flex justify-between border-t border-line pt-3'>
        <span className='font-mono text-[11px] text-ink/55'>
          {rows.length} ACTIVE
        </span>
        <span className='font-mono text-[11px] text-ink/55 tnum'>
          {formatMoney(total * 12, active)} / YEAR
        </span>
      </div>
    </section>
  );
}
