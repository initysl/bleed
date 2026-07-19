import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSubscription } from '@/app/features/subscriptions/api/client';
import type { SubscriptionInput } from '@/app/features/subscriptions/types';

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubscriptionInput }) =>
      updateSubscription(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}
