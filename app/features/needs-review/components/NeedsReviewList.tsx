'use client';

import { FiX } from 'react-icons/fi';
import { useDismissReview } from '@/app/features/needs-review/hooks/useDismissReview';
import type { NeedsReviewItem } from '@/app/features/needs-review/types';

export function NeedsReviewList({ items }: { items: NeedsReviewItem[] }) {
  const dismissMutation = useDismissReview();

  if (items.length === 0) return null;

  return (
    <div className='w-full rounded-lg border border-rust/30 bg-rust/5 p-4'>
      <p className='text-xs font-medium uppercase tracking-wide text-rust'>
        Needs review — couldn't auto-add{' '}
        {items.length > 1 ? `these ${items.length}` : 'this one'}
      </p>
      <div className='mt-3 flex flex-col gap-3'>
        {items.map((item) => (
          <div
            key={item.id}
            className='flex items-start justify-between gap-3 rounded-md bg-white/60 px-3 py-2'
          >
            <div className='flex flex-col'>
              <span className='text-sm font-medium text-ink'>
                {item.subject || 'No subject'}
              </span>
              <span className='text-xs text-ink/50'>
                {item.reason ||
                  "Couldn't confidently extract subscription details"}
              </span>
            </div>
            <button
              onClick={() => dismissMutation.mutate(item.id)}
              disabled={dismissMutation.isPending}
              className='flex shrink-0 items-center gap-1 text-xs text-ink/40 hover:text-ink/60 disabled:opacity-50'
            >
              <FiX className='h-3.5 w-3.5' />
              Dismiss
            </button>
          </div>
        ))}
      </div>
      <p className='mt-3 text-xs text-ink/40'>
        Add these manually below if you still want them tracked.
      </p>
    </div>
  );
}
