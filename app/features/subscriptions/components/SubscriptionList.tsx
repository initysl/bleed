'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { SubscriptionForm } from './SubscriptionForm';
import { getBrandStyle } from '@/lib/utils/brandColors';
import { formatMoney } from '@/lib/utils/currency';
import { formatDate, parseDateOnly } from '@/lib/utils/dates';
import { SPRING, unfold, EASE_OUT_EXPO, DURATION } from '@/lib/motion';

import type { Subscription } from '../types';

const UNUSED_THRESHOLD_DAYS = 60;

export type LedgerSort = 'cost' | 'renewal';

const SORTS: { id: LedgerSort; label: string }[] = [
  { id: 'cost', label: 'COST ↓' },
  { id: 'renewal', label: 'RENEWAL' },
];

/** Shared by the header rule and every row, so columns cannot drift apart. */
const COLUMNS =
  'grid-cols-[minmax(0,1fr)_96px_132px_128px_20px] gap-4';

function isLikelyUnused(sub: Subscription): boolean {
  if (!sub.last_used_at) return false;
  // last_used_at is a `date` column, so it must be read as a local calendar
  // day rather than as UTC midnight — see parseDateOnly.
  const days =
    (Date.now() - parseDateOnly(sub.last_used_at).getTime()) / 86_400_000;
  return days > UNUSED_THRESHOLD_DAYS;
}

export function SubscriptionList({
  subscriptions,
  editingId: controlledEditingId,
  onEditingChange,
}: {
  subscriptions: Subscription[];
  /** Optional controlled mode, so UpcomingStrip can open a row. */
  editingId?: string | null;
  onEditingChange?: (id: string | null) => void;
}) {
  const [uncontrolledId, setUncontrolledId] = useState<string | null>(null);
  const [sort, setSort] = useState<LedgerSort>('cost');

  const isControlled = onEditingChange !== undefined;
  const editingId = isControlled ? controlledEditingId : uncontrolledId;
  const setEditingId = isControlled ? onEditingChange : setUncontrolledId;

  const sorted = [...subscriptions].sort((a, b) =>
    sort === 'cost'
      ? b.monthly_equivalent - a.monthly_equivalent
      : parseDateOnly(a.renewal_date).getTime() -
        parseDateOnly(b.renewal_date).getTime(),
  );

  const fromEmail = subscriptions.filter((s) => s.source === 'email').length;

  return (
    <section className='w-full self-start rounded-sm border border-line bg-surface'>
      <div className='flex items-center justify-between p-[22px] pb-4'>
        <h3 className='section-label m-0'>
          <span className='text-pine'>04</span>&nbsp; LEDGER
        </h3>

        <div className='flex gap-1.5'>
          {SORTS.map((option) => {
            const on = sort === option.id;
            return (
              <button
                key={option.id}
                type='button'
                aria-pressed={on}
                onClick={() => setSort(option.id)}
                className={`cursor-pointer rounded-sm border px-2.5 py-1.5 font-mono text-[10px] tracking-[0.08em] transition-colors duration-150 ${
                  on
                    ? 'border-line bg-surface text-ink'
                    : 'border-transparent bg-transparent text-ink/50 hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`grid ${COLUMNS} border-b border-line px-[22px] pb-2.5 font-mono text-[10px] tracking-[0.12em] text-ink/40`}
      >
        <span>SERVICE</span>
        <span>CYCLE</span>
        <span>RENEWS</span>
        <span className='text-right'>MONTHLY</span>
        <span />
      </div>

      {/* `layout` on each row is what makes re-sorting legible: rows travel to
          their new position instead of the list blinking into a different
          order, so you can see WHERE a subscription went. This is the one
          thing here that CSS genuinely cannot do. */}
      <ul className='m-0 flex list-none flex-col p-0'>
        {sorted.map((sub) => {
          const open = editingId === sub.id;
          const style = getBrandStyle(sub.name);
          const unused = isLikelyUnused(sub);
          const panelId = `ledger-row-${sub.id}`;

          return (
            <motion.li
              key={sub.id}
              layout
              transition={{ layout: { duration: 0.32, ease: EASE_OUT_EXPO } }}
              className='border-b border-line-soft'
            >
              <motion.button
                type='button'
                onClick={() => setEditingId(open ? null : sub.id)}
                aria-expanded={open}
                aria-controls={panelId}
                whileTap={{ y: 1 }}
                transition={{ duration: DURATION.press }}
                className={`group relative grid w-full ${COLUMNS} cursor-pointer items-center border-0 bg-transparent px-[22px] py-3.5 text-left text-ink transition-colors duration-150 ${
                  open ? 'bg-surface' : 'hover:bg-sunken'
                }`}
              >
                {/* Accent edge: armed on hover, locked on while open. */}
                <span
                  aria-hidden='true'
                  className={`absolute inset-y-0 left-0 w-0.5 origin-center bg-pine transition-transform duration-200 ease-[var(--ease-out-expo)] ${
                    open ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'
                  }`}
                />

                <span className='flex min-w-0 items-center gap-3'>
                  <span
                    aria-hidden='true'
                    className='flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-sm font-mono text-[11px] font-bold'
                    style={{
                      backgroundColor: style.bg,
                      // getBrandStyle declares this precisely so the glyph can
                      // contrast with the brand colour. Hardcoding white put
                      // Hulu at ~1.6:1 and Spotify at ~2.2:1.
                      color: style.text === 'dark' ? '#1C2321' : '#FFFFFF',
                    }}
                  >
                    {sub.name.charAt(0).toUpperCase()}
                  </span>
                  <span className='truncate text-[14px]'>{sub.name}</span>
                  {unused && (
                    <span className='shrink-0 rounded-xs bg-rust-tint px-1.5 py-0.5 font-mono text-tag text-rust'>
                      UNUSED
                    </span>
                  )}
                </span>

                <span className='font-mono text-[11px] tracking-[0.06em] text-ink/55'>
                  {sub.billing_cycle === 'yearly' ? 'YEARLY' : 'MONTHLY'}
                </span>
                <span className='font-mono text-[12px] text-ink/70 tnum'>
                  {formatDate(sub.renewal_date)}
                </span>
                <span className='text-right font-mono text-[14px] tnum'>
                  {formatMoney(sub.monthly_equivalent, sub.currency)}
                </span>
                <motion.span
                  aria-hidden='true'
                  animate={{ rotate: open ? 90 : 0 }}
                  transition={SPRING.snap}
                  className='text-right font-mono text-[12px] text-ink/30'
                >
                  &rsaquo;
                </motion.span>
              </motion.button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    id={panelId}
                    variants={unfold}
                    initial='hidden'
                    animate='show'
                    exit='exit'
                    className='overflow-hidden bg-surface'
                  >
                    {/* No max-height. This was a 160px scroll box around a
                        ~400px form, so users edited through a porthole and
                        scrolled an inner pane to reach Save. */}
                    <div className='border-t border-line-soft px-[22px] py-5'>
                      <SubscriptionForm
                        existing={sub}
                        onDone={() => setEditingId(null)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </ul>

      <div className='flex justify-between p-[22px] py-4'>
        <span className='font-mono text-[11px] text-ink/45'>
          {subscriptions.length} LOGGED &middot; {fromEmail} FROM EMAIL
        </span>
      </div>
    </section>
  );
}
