import type { Subscription } from '@/app/features/subscriptions/types';
import { getBrandStyle } from '@/lib/utils/brandColors';
import { daysUntil } from '@/lib/utils/dates';
import { formatMoney } from '@/lib/utils/currency';

const UPCOMING_WINDOW_DAYS = 14;

export function UpcomingStrip({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  const upcoming = subscriptions
    .map((sub) => ({ sub, days: daysUntil(sub.renewal_date) }))
    .filter(({ days }) => days >= 0 && days <= UPCOMING_WINDOW_DAYS)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <div className='w-full'>
      <div className='mb-2 flex items-center justify-between'>
        <span className='text-xs font-medium uppercase tracking-wide text-ink/50'>
          Upcoming
        </span>
      </div>

      <div className='flex w-full gap-3 overflow-x-auto pb-1'>
        {upcoming.map(({ sub, days }) => {
          const style = getBrandStyle(sub.name);
          const textColor = style.text === 'light' ? '#F7F8F6' : '#1C2321';

          return (
            <div
              key={sub.id}
              style={{ backgroundColor: style.bg, color: textColor }}
              className='flex min-w-[140px] flex-col gap-2 rounded-lg px-4 py-3'
            >
              <span className='text-sm font-medium'>{sub.name}</span>
              <span className='font-mono text-lg tabular-nums'>
                {formatMoney(sub.price, sub.currency)}
              </span>
              <span className='text-xs opacity-75'>
                {days === 0
                  ? 'Today'
                  : `${days} day${days === 1 ? '' : 's'} left`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
