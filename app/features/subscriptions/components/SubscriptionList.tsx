'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

import { SubscriptionForm } from './SubscriptionForm';
import { getBrandStyle } from '@/lib/utils/brandColors';
import { formatMoney } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';

import type { Subscription } from '../types';

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
    <div className='flex flex-col gap-3'>
      {sorted.map((sub) => {
        const isEditing = editingId === sub.id;
        const style = getBrandStyle(sub.name);
        const unused = isLikelyUnused(sub);

        return (
          <motion.div
            layout
            key={sub.id}
            transition={{
              layout: {
                duration: 0.25,
                ease: 'easeInOut',
              },
            }}
            className={`overflow-hidden rounded-lg border bg-white transition-all duration-200 ${
              isEditing
                ? 'border-ink/20 shadow-md ring-1 ring-ink/10'
                : 'border-sage/60 shadow-sm hover:border-sage/80 hover:shadow'
            }`}
          >
            {/* Clickable Header Row */}
            <button
              type='button'
              onClick={() => setEditingId(isEditing ? null : sub.id)}
              className='w-full text-left transition-colors hover:bg-sage/10 p-4 sm:p-5'
            >
              <div className='flex items-center justify-between gap-4'>
                {/* Left Side: Avatar & Name/Metadata */}
                <div className='flex items-center gap-3.5 min-w-0'>
                  {/* Brand Avatar / Badge */}
                  <div
                    style={{ backgroundColor: style.bg }}
                    className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm font-mono'
                  >
                    {sub.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Title and Pills */}
                  <div className='min-w-0 space-y-1'>
                    <div className='flex items-center gap-2'>
                      <h3 className='text-sm font-bold text-ink font-display truncate'>
                        {sub.name}
                      </h3>

                      {unused && (
                        <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-700'>
                          <span className='h-1.5 w-1.5 rounded-full bg-amber-500' />
                          Unused
                        </span>
                      )}
                    </div>

                    <div className='text-xs font-mono text-ink/50'>
                      <span>Renews {formatDate(sub.renewal_date)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Cost & Chevron */}
                <div className='flex items-center gap-3 shrink-0'>
                  <div className='text-right'>
                    <span className='font-display text-base sm:text-lg font-bold text-ink tabular-nums block'>
                      {formatMoney(sub.monthly_equivalent, sub.currency)}
                    </span>
                    <span className='text-[10px] font-mono text-ink/40 block'>
                      /month
                    </span>
                  </div>

                  <motion.div
                    animate={{ rotate: isEditing ? 180 : 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 22,
                    }}
                    className='rounded-lg p-1.5 text-ink/40 bg-sage/20 hover:text-ink'
                  >
                    <FiChevronDown size={16} />
                  </motion.div>
                </div>
              </div>
            </button>

            {/* Expandable Form Drawer */}
            <AnimatePresence initial={false}>
              {isEditing && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: 0.22,
                    ease: 'easeInOut',
                  }}
                  className='overflow-hidden border-t border-sage/40 bg-paper/50'
                >
                  <div className='p-4 sm:p-5'>
                    <div className='mb-3 flex items-center justify-between border-b border-sage/30 pb-2'>
                      <span className='text-xs font-mono font-semibold uppercase tracking-wider text-ink/50'>
                        Edit Subscription
                      </span>
                      <button
                        type='button'
                        onClick={() => setEditingId(null)}
                        className='text-xs font-mono text-ink/40 hover:text-ink transition-colors'
                      >
                        Cancel
                      </button>
                    </div>

                    <div className='max-h-40 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-pine/65'>
                      <SubscriptionForm
                        existing={sub}
                        onDone={() => setEditingId(null)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
