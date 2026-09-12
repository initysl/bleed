'use client';

import { useState } from 'react';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import type { Subscription } from '@/app/features/subscriptions/types';
import { formatMoney } from '@/lib/utils/currency';
import { useCountUp } from '@/app/features/subscriptions/hooks/useCountUp';

// A small muted palette for differentiating currency cards — deliberately NOT
// the bright per-brand colors used for subscription rows elsewhere, since these
// are "wallet" cards representing your own money, not third-party brands.
const CARD_COLORS = ['#2F6F5E', '#B08D57', '#3A5568', '#6B4C3A', '#4A5D4E'];

interface StackCardProps {
  currency: string;
  amount: number;
  color: string;
  index: number;
  total: number;
  onDragEnd: (offsetY: number, index: number) => void;
  onActivate: () => void;
}

function StackCard({
  currency,
  amount,
  color,
  index,
  total,
  onDragEnd,
  onActivate,
}: StackCardProps) {
  const yMotion = useMotionValue(0);
  const offset = index * 14;
  const scale = 1 - index * 0.04;
  const zIndex = total - index;

  return (
    <motion.div
      drag='y'
      dragConstraints={{ top: -12, bottom: 0 }}
      dragElastic={0.15}
      onDragEnd={(_e, info) => {
        yMotion.set(0);
        onDragEnd(info.offset.y, index);
      }}
      style={{
        y: yMotion,
        zIndex,
        translateY: -offset,
        scale,
        backgroundColor: color,
      }}
      whileHover={{ scale: scale + 0.02 }}
      whileTap={{ scale: Math.max(scale - 0.03, 0.9) }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      // Reordering was drag-only, which made the currency switcher completely
      // inoperable without a pointer. Click and Enter/Space now cycle the stack
      // too, so it works from the keyboard and for anyone who can't drag.
      role='button'
      tabIndex={0}
      aria-label={`${currency}: ${formatMoney(amount, currency)}. Activate to bring the next currency forward.`}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate();
        }
      }}
      className='absolute left-1/2 top-0 flex h-20 w-[92%] -translate-x-1/2 cursor-grab items-center justify-between rounded-2xl px-5 text-paper shadow-md active:cursor-grabbing'
    >
      <span className='text-sm font-medium'>{currency}</span>
      <span className='font-mono text-lg tabular-nums'>
        {formatMoney(amount, currency)}
      </span>
    </motion.div>
  );
}

export function BleedWallet({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  const [hidden, setHidden] = useState(false);

  const totalsByCurrency = subscriptions.reduce<Record<string, number>>(
    (acc, sub) => {
      acc[sub.currency] = (acc[sub.currency] ?? 0) + sub.monthly_equivalent;
      return acc;
    },
    {},
  );

  const [stack, setStack] = useState<string[]>([]);

  // Keep the stack's currency list in step with the data as subscriptions
  // change, without resetting the user's current front-of-stack choice.
  //
  // Derived, not synced in an effect. `stack` holds only the user's chosen
  // ORDER; which currencies actually exist comes from the data every render.
  // The previous version wrote this into state from inside a useEffect, which
  // cascades an extra render on every data change (and is the
  // react-hooks/set-state-in-effect error).
  const currencies = Object.keys(totalsByCurrency);
  const orderedCurrencies = [
    ...stack.filter((c) => currencies.includes(c)),
    ...currencies.filter((c) => !stack.includes(c)),
  ];

  // Both write the FULL derived order back into state, so `stack` always
  // stays a complete, valid ordering of the currencies that currently exist.
  function moveTopToBack() {
    setStack([...orderedCurrencies.slice(1), orderedCurrencies[0]]);
  }
  function moveBackToTop() {
    setStack([
      orderedCurrencies[orderedCurrencies.length - 1],
      ...orderedCurrencies.slice(0, -1),
    ]);
  }
  function handleDragEnd(offsetY: number, index: number) {
    if (index === 0 && offsetY < -16) moveTopToBack();
    if (index === orderedCurrencies.length - 1 && offsetY > 16) moveBackToTop();
  }

  const frontCurrency = orderedCurrencies[0];
  const frontTotal = frontCurrency ? totalsByCurrency[frontCurrency] : 0;
  const displayValue = useCountUp(hidden ? 0 : frontTotal, 0.6);

  if (orderedCurrencies.length === 0) {
    return (
      <div className='w-full rounded-2xl bg-pine px-6 py-6 text-left'>
        <p className='text-xs uppercase tracking-wide text-paper/60'>
          Monthly bleed
        </p>
        <p className='mt-1 font-mono text-4xl tabular-nums text-paper'>$0.00</p>
      </div>
    );
  }

  return (
    <div className='relative w-full'>
      {/* Card stack — only rendered above the wallet body when there's more than
          one currency to browse between. A single currency has nothing to drag
          to, so it skips straight to a plain card. */}
      {orderedCurrencies.length > 1 && (
        <div className='relative z-10 h-16 px-1'>
          <AnimatePresence>
            {orderedCurrencies.map((currency, index) => (
              <StackCard
                key={currency}
                currency={currency}
                amount={totalsByCurrency[currency]}
                color={CARD_COLORS[index % CARD_COLORS.length]}
                index={index}
                total={orderedCurrencies.length}
                onDragEnd={handleDragEnd}
                onActivate={moveTopToBack}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <div
        className={`flex flex-col items-center gap-1 rounded-2xl border border-dashed border-paper/30 bg-pine px-6 py-6 text-center ${
          orderedCurrencies.length > 1 ? 'mt-4' : ''
        }`}
      >
        <p className='font-mono text-4xl tabular-nums text-paper'>
          {hidden ? '••••••' : formatMoney(displayValue, frontCurrency)}
        </p>
        <p className='text-xs uppercase tracking-wide text-paper/60'>
          {frontCurrency} monthly bleed
          {orderedCurrencies.length > 1 &&
            ` · ${orderedCurrencies.length} currencies`}
        </p>

        <button
          onClick={() => setHidden((v) => !v)}
          className='mt-3 flex items-center gap-1.5 rounded-full border border-paper/40 px-3 py-1 text-xs text-paper transition-colors hover:bg-paper/10'
        >
          {hidden ? (
            <FiEye className='h-3.5 w-3.5' />
          ) : (
            <FiEyeOff className='h-3.5 w-3.5' />
          )}
          {hidden ? 'Show balance' : 'Hide balance'}
        </button>
      </div>
    </div>
  );
}
