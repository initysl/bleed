'use client';

import { motion } from 'framer-motion';
import type { Subscription } from '@/app/features/subscriptions/types';
import { getBrandStyle } from '@/lib/utils/brandColors';
import { daysUntil } from '@/lib/utils/dates';
import { formatMoney } from '@/lib/utils/currency';
import { SPRING } from '@/lib/motion';

const WINDOW_DAYS = 14;
/** Inside this many days, a renewal is flagged rather than merely listed. */
const IMMINENT_DAYS = 2;

export function UpcomingStrip({
  subscriptions,
  selectedId,
  onSelect,
}: {
  subscriptions: Subscription[];
  /** The subscription currently open in the ledger, if any. */
  selectedId?: string | null;
  onSelect?: (subscription: Subscription) => void;
}) {
  const upcoming = subscriptions
    .map((sub) => ({ sub, days: daysUntil(sub.renewal_date) }))
    .filter(({ days }) => days >= 0 && days <= WINDOW_DAYS)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  // A tick a day, taller every seventh. The ruler is what turns a list of
  // dates into a shape you can read — three charges bunched at the end of the
  // week look different from three spread across a fortnight.
  const ticks = Array.from({ length: WINDOW_DAYS + 1 }, (_, day) => ({
    day,
    major: day % 7 === 0,
  }));

  return (
    <section
      className='w-full rounded-sm border border-line bg-surface p-[22px]'
      aria-labelledby='upcoming-heading'
    >
      <h3 id='upcoming-heading' className='section-label m-0 mb-[22px]'>
        <span className='text-pine'>02</span>&nbsp; NEXT {WINDOW_DAYS} DAYS
      </h3>

      <div className='relative mb-1.5 h-[34px]'>
        <div className='absolute inset-x-0 top-[22px] h-px bg-line' />

        {ticks.map(({ day, major }) => (
          <div
            key={day}
            className='absolute w-px bg-line'
            style={{
              left: `calc(${(day / WINDOW_DAYS) * 100}% - 0.5px)`,
              top: major ? 14 : 18,
              height: major ? 9 : 5,
            }}
          />
        ))}

        {upcoming.map(({ sub, days }) => {
          const style = getBrandStyle(sub.name);
          const selected = selectedId === sub.id;
          return (
            <motion.button
              key={sub.id}
              type='button'
              onClick={() => onSelect?.(sub)}
              aria-label={`${sub.name}, renews in ${days} ${days === 1 ? 'day' : 'days'}`}
              aria-pressed={selected}
              animate={{ scale: selected ? 1.5 : 1 }}
              whileHover={{ scale: selected ? 1.5 : 1.35 }}
              transition={SPRING.snap}
              className='absolute top-4 -ml-1 h-[9px] w-[9px] cursor-pointer rounded-full border-0 p-0 shadow-[0_0_0_2px_var(--color-surface)]'
              style={{
                left: `${(days / WINDOW_DAYS) * 100}%`,
                background:
                  days <= IMMINENT_DAYS ? 'var(--color-rust)' : style.bg,
              }}
            />
          );
        })}
      </div>

      <div className='mb-[18px] flex justify-between'>
        <span className='font-mono text-[10px] text-ink/40'>TODAY</span>
        <span className='font-mono text-[10px] text-ink/40'>+7D</span>
        <span className='font-mono text-[10px] text-ink/40'>+{WINDOW_DAYS}D</span>
      </div>

      <ul className='m-0 flex list-none flex-col p-0'>
        {upcoming.map(({ sub, days }) => {
          const style = getBrandStyle(sub.name);
          const imminent = days <= IMMINENT_DAYS;
          const selected = selectedId === sub.id;
          const when =
            days === 0 ? 'TODAY' : `${days} DAY${days === 1 ? '' : 'S'}`;

          return (
            <li key={sub.id}>
              <button
                type='button'
                onClick={() => onSelect?.(sub)}
                aria-pressed={selected}
                // The whole row is the target, not just the name — this is the
                // highest-intent moment in the product and the old cards were
                // plain divs with nothing to click.
                className={`group relative flex w-full cursor-pointer items-center gap-3 border-0 border-t border-line-soft bg-transparent p-2 text-left transition-colors duration-150 ${
                  selected ? 'bg-sunken' : 'hover:bg-sunken'
                }`}
              >
                <span
                  className='h-[22px] w-[3px] rounded-xs'
                  style={{
                    background: imminent ? 'var(--color-rust)' : style.bg,
                  }}
                />
                <span className='flex-grow truncate text-[13px] text-ink'>
                  {sub.name}
                </span>
                <span className='font-mono text-[12px] text-ink/60 tnum'>
                  {formatMoney(sub.price, sub.currency)}
                </span>
                {/* States the period, because the ledger shows monthly
                    equivalent for the same row — a yearly plan otherwise reads
                    as two different numbers two columns apart. */}
                <span className='font-mono text-[10px] text-ink/45'>
                  {sub.billing_cycle === 'yearly' ? '/YR' : '/MO'}
                </span>
                <span
                  className={`rounded-xs px-[7px] py-[3px] font-mono text-tag ${
                    imminent
                      ? 'bg-rust-tint text-rust'
                      : 'bg-line-soft text-ink/55'
                  }`}
                >
                  {when}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
