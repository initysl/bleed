import type { Subscription } from '@/types/subscription';

const UNUSED_THRESHOLD_DAYS = 60;

function isLikelyUnused(sub: Subscription): boolean {
  if (!sub.last_used_at) return false; // no data — don't accuse, just stay quiet
  const daysSinceUse =
    (Date.now() - new Date(sub.last_used_at).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUse > UNUSED_THRESHOLD_DAYS;
}

export function SubscriptionList({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  const sorted = [...subscriptions].sort(
    (a, b) => b.monthly_equivalent - a.monthly_equivalent,
  );

  return (
    <ul className='flex w-full flex-col divide-y divide-sage rounded-lg border border-sage bg-white/60'>
      {sorted.map((sub) => (
        <li
          key={sub.id}
          className='flex items-center justify-between gap-3 px-4 py-3'
        >
          <div className='flex flex-col'>
            <span className='text-sm font-medium text-ink'>{sub.name}</span>
            <span className='text-xs text-ink/50'>
              Renews {new Date(sub.renewal_date).toLocaleDateString()}
              {isLikelyUnused(sub) && (
                <span className='ml-2 text-rust'>· not used in a while</span>
              )}
            </span>
          </div>
          <span className='font-mono text-sm tabular-nums text-ink'>
            ${sub.monthly_equivalent.toFixed(2)}
            <span className='text-ink/40'>/mo</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
