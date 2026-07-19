import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSubscription } from '@/app/features/subscriptions/api/client';

export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}
