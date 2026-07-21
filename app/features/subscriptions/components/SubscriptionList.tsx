'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SubscriptionForm } from './SubscriptionForm';
import { getBrandStyle } from '@/lib/utils/brandColors';
import { formatMoney } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';
import type { Subscription } from '../types';
import { FiChevronDown } from 'react-icons/fi';

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
    <div className='flex w-full flex-col gap-4'>
      {sorted.map((sub) => {
        const isEditing = editingId === sub.id;
        const style = getBrandStyle(sub.name);

        return (
          <div
            key={sub.id}
            className='overflow-hidden rounded-lg border border-sage/60 bg-paper shadow-sm'
          >
            <button
              onClick={() => setEditingId(isEditing ? null : sub.id)}
              className='w-full text-left transition-colors hover:bg-black/5'
            >
              <div className='flex items-start justify-between p-2 '>
                {/* Left */}
                <div className='flex gap-4'>
                  <div
                    style={{ backgroundColor: style.bg }}
                    className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-normal text-white'
                  >
                    {sub.name.charAt(0).toUpperCase()}
                  </div>

                  <div className='flex flex-col gap-2'>
                    <div>
                      <h3 className='text-base font-normal text-ink'>
                        {sub.name}
                      </h3>

                      <p className='text-xs text-ink/50'>
                        {sub.billing_cycle === 'monthly'
                          ? 'Monthly subscription'
                          : 'Yearly subscription'}
                      </p>
                    </div>

                    <div className='flex flex-wrap gap-2'>
                      <span className='text-xs font-medium text-pine'>
                        Renews {formatDate(sub.renewal_date)}
                      </span>

                      {isLikelyUnused(sub) && (
                        <span className=' bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700'>
                          Unused
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className='flex flex-col items-end'>
                  <span className='font-mono text-sm font-normal text-ink'>
                    {formatMoney(sub.monthly_equivalent, sub.currency)}
                  </span>

                  <span className='text-xs text-ink/45'>/month</span>
                </div>
              </div>

              <div className='border-t border-sage/50 p-2'>
                <motion.span
                  animate={{
                    rotate: isEditing ? 90 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className='text-lg text-ink/40 flex justify-end '
                >
                  <FiChevronDown size={18} />
                </motion.span>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isEditing && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
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
                  <div className='border-t border-sage bg-paper p-2'>
                    <div className='max-h-38 overflow-y-auto'>
                      <SubscriptionForm
                        existing={sub}
                        onDone={() => setEditingId(null)}
                      />
                    </div>
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
