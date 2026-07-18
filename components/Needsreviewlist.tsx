'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface NeedsReviewItem {
  id: string;
  subject: string | null;
  raw_email_snippet: string | null;
  reason: string | null;
  created_at: string;
}

export function NeedsReviewList({ items }: { items: NeedsReviewItem[] }) {
  const router = useRouter();
  const [dismissing, setDismissing] = useState<string | null>(null);

  if (items.length === 0) return null;

  async function handleDismiss(id: string) {
    setDismissing(id);
    await fetch(`/api/needs-review/${id}`, { method: 'DELETE' });
    setDismissing(null);
    router.refresh();
  }

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
              onClick={() => handleDismiss(item.id)}
              disabled={dismissing === item.id}
              className='shrink-0 text-xs text-ink/40 underline decoration-ink/20 underline-offset-4 hover:text-ink/60 disabled:opacity-50'
            >
              {dismissing === item.id ? '…' : 'Dismiss'}
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
