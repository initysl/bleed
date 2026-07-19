'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Subscription } from '@/app/features/subscriptions/types';
import { SubscriptionForm } from './SubscriptionForm';
import { getBrandStyle } from '@/lib/utils/brandColors';
import { formatMoney } from '@/lib/utils/currency';

const UNUSED_THRESHOLD_DAYS = 60;

function isLikelyUnused(sub: Subscription): boolean {
  if (!sub.last_used_at) return false;
  const daysSinceUse =
    (Date.now() - new Date(sub.last_used_at).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUse > UNUSED_THRESHOLD_DAYS;
}

export function SubscriptionList({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = [...subscriptions].sort(
    (a, b) => b.monthly_equivalent - a.monthly_equivalent,
  );

  return (
    <div className='flex w-full flex-col gap-2'>
      {sorted.map((sub) => {
        const isEditing = editingId === sub.id;
        const style = getBrandStyle(sub.name);
        const isLight = style.text === 'light';
        const textColor = isLight ? '#F7F8F6' : '#1C2321';
        const mutedTextColor = isLight
          ? 'rgba(247,248,246,0.75)'
          : 'rgba(28,35,33,0.6)';
        const badgeBg = isLight
          ? 'rgba(247,248,246,0.2)'
          : 'rgba(28,35,33,0.1)';

        return (
          <div key={sub.id} className='overflow-hidden rounded-lg'>
            <button
              onClick={() => setEditingId(isEditing ? null : sub.id)}
              style={{ backgroundColor: style.bg }}
              className='flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-transform active:scale-[0.99]'
            >
              <div className='flex items-center gap-3'>
                <span
                  style={{ backgroundColor: badgeBg, color: textColor }}
                  className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-semibold'
                >
                  {sub.name.charAt(0).toUpperCase()}
                </span>
                <div className='flex flex-col'>
                  <span
                    style={{ color: textColor }}
                    className='text-sm font-medium'
                  >
                    {sub.name}
                  </span>
                  <span style={{ color: mutedTextColor }} className='text-xs'>
                    Renews {new Date(sub.renewal_date).toLocaleDateString()}
                    {isLikelyUnused(sub) && ' · not used in a while'}
                  </span>
                </div>
              </div>
              <span
                style={{ color: textColor }}
                className='font-mono text-sm tabular-nums'
              >
                {formatMoney(sub.monthly_equivalent, sub.currency)}
                <span style={{ color: mutedTextColor }}>/mo</span>
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isEditing && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className='overflow-hidden'
                >
                  <div className='border border-t-0 border-sage bg-paper px-4 py-4'>
                    <SubscriptionForm
                      existing={sub}
                      onDone={() => setEditingId(null)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
