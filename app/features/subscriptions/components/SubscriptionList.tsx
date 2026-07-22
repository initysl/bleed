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
    <div className='flex flex-col gap-4'>
      {sorted.map((sub) => {
        const isEditing = editingId === sub.id;
        const style = getBrandStyle(sub.name);

        return (
          <motion.div
            layout
            key={sub.id}
            transition={{
              layout: {
                duration: 0.28,
                ease: 'easeInOut',
              },
            }}
            className='overflow-hidden rounded-2xl border border-sage/60 bg-paper shadow-sm transition-shadow hover:shadow-md'
          >
            <button
              onClick={() => setEditingId(isEditing ? null : sub.id)}
              className='w-full text-left transition-colors hover:bg-black/2'
            >
              <div className='flex items-start justify-between p-4'>
                {/* LEFT */}

                <div className='flex gap-4'>
                  <div
                    style={{ backgroundColor: style.bg }}
                    className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-sm'
                  >
                    {sub.name.charAt(0).toUpperCase()}
                  </div>

                  <div className='space-y-2'>
                    <div>
                      <h3 className='text-[15px] font-medium text-ink font-mono'>
                        {sub.name}
                      </h3>

                      <p className='text-xs text-ink/50 font-mono'>
                        {sub.billing_cycle === 'monthly'
                          ? 'Monthly subscription'
                          : 'Yearly subscription'}
                      </p>
                    </div>

                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='font-mini rounded-full bg-pine/10 px-2 py-1 text-xs font-medium text-pine'>
                        Renews {formatDate(sub.renewal_date)}
                      </span>

                      {isLikelyUnused(sub) && (
                        <span className='rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700'>
                          Unused
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT */}

                <div className='ml-4 flex shrink-0 flex-col items-end font-body'>
                  <span className='text-lg font-medium text-ink'>
                    {formatMoney(sub.monthly_equivalent, sub.currency)}
                  </span>

                  <div className='mt-1 flex items-center gap-2'>
                    <span className='text-xs text-ink/45'>/month</span>

                    <motion.div
                      animate={{
                        rotate: isEditing ? 180 : 0,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 350,
                        damping: 22,
                      }}
                      className='rounded-full p-1 text-ink/40'
                    >
                      <FiChevronDown size={18} />
                    </motion.div>
                  </div>
                </div>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isEditing && (
                <motion.div
                  initial={{
                    height: 0,
                    opacity: 0,
                  }}
                  animate={{
                    height: 'auto',
                    opacity: 1,
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.25,
                    ease: 'easeOut',
                  }}
                  className='overflow-hidden'
                >
                  <div className='border-t border-sage bg-paper p-4'>
                    <div className='mb-4 flex items-center justify-between'>
                      <h4 className='text-xs text-ink/50 transition hover:text-ink'>
                        Edit subscription
                      </h4>

                      {/* <button
                        onClick={() => setEditingId(null)}
                        className='text-xs text-ink/50 transition hover:text-ink'
                      >
                        Close
                      </button> */}
                    </div>

                    <div className='max-h-40 overflow-y-auto'>
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
