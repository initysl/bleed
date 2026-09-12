'use client';

import type { Subscription } from '@/app/features/subscriptions/types';
import { getBrandStyle } from '@/lib/utils/brandColors';
import { daysUntil } from '@/lib/utils/dates';
import { formatMoney } from '@/lib/utils/currency';

const UPCOMING_WINDOW_DAYS = 14;

export function UpcomingStrip({
  subscriptions,
  onSelect,
}: {
  subscriptions: Subscription[];
  // Renewing in a few days is the highest-intent moment in the product — it is
  // exactly when someone wants to act. These cards were plain divs, so there
  // was nothing to click.
  onSelect?: (subscription: Subscription) => void;
}) {
  const upcoming = subscriptions
    .map((sub) => ({ sub, days: daysUntil(sub.renewal_date) }))
    .filter(({ days }) => days >= 0 && days <= UPCOMING_WINDOW_DAYS)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <section className='w-full' aria-labelledby='upcoming-heading'>
      <div className='mb-2 flex items-center justify-between'>
        <h2
          id='upcoming-heading'
          className='text-xs font-medium uppercase tracking-wide text-ink/70'
        >
          Upcoming
        </h2>
      </div>

      {/* tabIndex on the scroller so a keyboard user can reach and scroll it;
          an overflow-x container that nothing can focus is unreachable without
          a pointer. */}
      <ul
        tabIndex={0}
        className='flex w-full list-none gap-3 overflow-x-auto p-0 pb-1 scrollbar-thin'
      >
        {upcoming.map(({ sub, days }) => {
          const style = getBrandStyle(sub.name);
          const textColor = style.text === 'light' ? '#F7F8F6' : '#1C2321';
          const when =
            days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'} left`;

          return (
            <li key={sub.id} className='min-w-35 shrink-0'>
              <button
                type='button'
                onClick={() => onSelect?.(sub)}
                disabled={!onSelect}
                style={{ backgroundColor: style.bg, color: textColor }}
                className='flex w-full flex-col gap-2 rounded-lg px-4 py-3 text-left transition-transform enabled:hover:scale-[1.02] enabled:active:scale-[0.98]'
                aria-label={`${sub.name}, ${formatMoney(
                  sub.price,
                  sub.currency,
                )} per ${sub.billing_cycle === 'yearly' ? 'year' : 'month'}, renews ${when.toLowerCase()}. Edit.`}
              >
                <span className='text-sm font-medium'>{sub.name}</span>
                <span className='font-mono text-lg tabular-nums'>
                  {formatMoney(sub.price, sub.currency)}
                </span>
                {/* The billing period is now stated. This showed raw `price`
                    while SubscriptionList showed `monthly_equivalent` for the
                    same row, so a yearly plan read as "$599.88" here and
                    "$49.99" two columns away, both unlabelled. */}
                <span className='text-xs opacity-80'>
                  {sub.billing_cycle === 'yearly' ? 'per year' : 'per month'}
                  {' · '}
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
