import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dismissReview } from '@/app/features/needs-review/api/client';

export function useDismissReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dismissReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['needs-review'] });
    },
  });
}
