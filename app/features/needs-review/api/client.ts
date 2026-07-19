import type { NeedsReviewItem } from '@/app/features/needs-review/types';

export async function fetchNeedsReview(): Promise<NeedsReviewItem[]> {
  const res = await fetch('/api/needs-review');
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'Request failed');
  return body.data;
}

export async function dismissReview(id: string): Promise<void> {
  const res = await fetch(`/api/needs-review/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Request failed');
  }
}
