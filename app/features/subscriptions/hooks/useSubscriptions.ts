import { useQuery } from '@tanstack/react-query';
import { fetchSubscriptions } from '@/app/features/subscriptions/api/client';
import type { Subscription } from '@/app/features/subscriptions/types';

// initialData comes from the server component's fetch (app/page.tsx) so the first
// paint has real data with no loading spinner — this hook only actually goes to
// the network on refetch, e.g. after a mutation invalidates the cache.
export function useSubscriptions(initialData: Subscription[]) {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: fetchSubscriptions,
    initialData,
  });
}
