import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSubscription } from '@/app/features/subscriptions/api/client';
import type { SubscriptionInput } from '@/app/features/subscriptions/types';

// onError is deliberately present on every mutation in this app.
//
// TanStack Form re-throws after a failed submit, and these hooks previously had
// only onSuccess — so a 400/429/500 produced an unhandled promise rejection, the
// button flipped back from "Saving..." to its normal label, and nothing else
// happened. The user had no way to tell the save had failed, so they clicked
// again. Logging here guarantees a trace even if a caller forgets to render
// mutation.error.
export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubscriptionInput }) =>
      updateSubscription(id, input),
    onError: (error) => {
      console.error(`[updating subscription]`, error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}
