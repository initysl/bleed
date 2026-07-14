import type { Subscription } from '@/types/subscription';
import { SubscriptionRow } from './Subscriptionrow';

export function SubscriptionList({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  return (
    <div className='w-full max-w-md rounded-lg border border-sage bg-white/60 px-5 py-2'>
      {subscriptions.map((sub) => (
        <SubscriptionRow key={sub.id} subscription={sub} />
      ))}
    </div>
  );
}
