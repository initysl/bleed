import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dismissReview } from '@/app/features/needs-review/api/client';

// onError is deliberately present on every mutation in this app.
//
// TanStack Form re-throws after a failed submit, and these hooks previously had
// only onSuccess — so a 400/429/500 produced an unhandled promise rejection, the
// button flipped back from "Saving..." to its normal label, and nothing else
// happened. The user had no way to tell the save had failed, so they clicked
// again. Logging here guarantees a trace even if a caller forgets to render
// mutation.error.
export function useDismissReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dismissReview,
    onError: (error) => {
      console.error(`[dismissing review item]`, error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['needs-review'] });
    },
  });
}
