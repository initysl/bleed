import { useQuery } from '@tanstack/react-query';
import { fetchNeedsReview } from '@/app/features/needs-review/api/client';
import type { NeedsReviewItem } from '@/app/features/needs-review/types';

export function useNeedsReview(initialData: NeedsReviewItem[]) {
  return useQuery({
    queryKey: ['needs-review'],
    queryFn: fetchNeedsReview,
    initialData,
  });
}
