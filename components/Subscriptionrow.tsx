import { differenceInDays, format, parseISO } from 'date-fns';
import type { Subscription } from '@/types/subscription';

export function SubscriptionRow({
  subscription,
}: {
  subscription: Subscription;
}) {
  const isUnused =
    !subscription.last_used_at ||
    differenceInDays(new Date(), parseISO(subscription.last_used_at)) > 60;

  const renewsIn = differenceInDays(
    parseISO(subscription.renewal_date),
    new Date(),
  );

  return (
    <div className='flex items-center justify-between gap-4 border-b border-sage/60 py-3 last:border-none'>
      <div className='min-w-0'>
        <p className='truncate text-sm font-medium text-ink'>
          {subscription.name}
        </p>
        <p className='text-xs text-ink/50'>
          Renews{' '}
          {renewsIn <= 0
            ? 'today'
            : `in ${renewsIn} day${renewsIn === 1 ? '' : 's'}`}
          {' · '}
          {format(parseISO(subscription.renewal_date), 'MMM d')}
        </p>
      </div>

      <div className='flex items-center gap-3 shrink-0'>
        {isUnused && (
          <span className='rounded-full bg-rust/10 px-2 py-0.5 text-[11px] font-medium text-rust'>
            Unused 60+ days
          </span>
        )}
        <span className='font-mono text-sm tabular-nums text-ink'>
          ${subscription.monthly_equivalent.toFixed(2)}
          <span className='text-ink/40'>/mo</span>
        </span>
      </div>
    </div>
  );
}
