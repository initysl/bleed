'use client';

import { useId, useState } from 'react';
import { FiAlertCircle, FiChevronDown, FiX } from 'react-icons/fi';
import { useDismissReview } from '@/app/features/needs-review/hooks/useDismissReview';
import type { NeedsReviewItem } from '@/app/features/needs-review/types';

export function NeedsReviewList({ items }: { items: NeedsReviewItem[] }) {
  const dismissMutation = useDismissReview();
  // Which item is currently in flight, so one dismiss doesn't disable every
  // button in the list. The shared mutation object made all of them pending at
  // once, with no indication of which was actually being dismissed.
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const headingId = useId();

  if (items.length === 0) return null;

  function dismiss(id: string) {
    setError(null);
    setDismissingId(id);
    dismissMutation.mutate(id, {
      onError: () => {
        // Previously this had no onError at all, so a failed dismiss was
        // completely silent: the button re-enabled and the item stayed put,
        // which reads as a dead click.
        setError('Could not dismiss that item. Please try again.');
        setDismissingId(null);
      },
      onSettled: () => setDismissingId(null),
    });
  }

  return (
    // A labelled region, so this is reachable by landmark navigation. It is the
    // most urgent thing on the page and used to be an unlabelled div whose
    // heading was a <p>.
    <section
      aria-labelledby={headingId}
      className='w-full rounded-sm border border-rust-line bg-rust-tint p-4'
    >
      <h2
        id={headingId}
        className='m-0 font-mono text-label tracking-[0.14em] text-rust'
      >
        Needs review &mdash; couldn&apos;t auto-add{' '}
        {items.length > 1 ? `these ${items.length}` : 'this one'}
      </h2>

      {error && (
        <p
          role='alert'
          className='mt-2 flex items-center gap-1.5 text-xs text-rust'
        >
          <FiAlertCircle className='h-3.5 w-3.5 shrink-0' aria-hidden='true' />
          {error}
        </p>
      )}

      <ul className='mt-3 flex list-none flex-col gap-3 p-0'>
        {items.map((item) => {
          const isDismissing = dismissingId === item.id;
          const isExpanded = expandedId === item.id;
          const panelId = `review-snippet-${item.id}`;

          return (
            <li
              key={item.id}
              className='rounded-sm border border-rust-line/50 bg-surface px-3 py-2.5'
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='flex min-w-0 flex-col'>
                  <span className='truncate text-sm font-medium text-ink'>
                    {item.subject || 'No subject'}
                  </span>
                  <span className='text-xs text-ink/60'>
                    {item.reason ??
                      'Could not confidently extract subscription details'}
                  </span>
                </div>

                <div className='flex shrink-0 items-center gap-2'>
                  {/* The email text was already being fetched and carried all
                      the way into this component, and then never rendered — so
                      the user was told to "add it manually" with no way to see
                      the price, date or vendor without leaving the app and
                      digging the message out of their own mail client. */}
                  {item.raw_email_snippet && (
                    <button
                      type='button'
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      className='flex items-center gap-1 rounded px-1.5 py-1 text-xs text-ink/60 transition-colors hover:bg-sage/30 hover:text-ink'
                    >
                      <FiChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        aria-hidden='true'
                      />
                      {isExpanded ? 'Hide email' : 'View email'}
                    </button>
                  )}

                  <button
                    type='button'
                    onClick={() => dismiss(item.id)}
                    // Scoped to this row only.
                    disabled={isDismissing}
                    className='flex items-center gap-1 rounded px-1.5 py-1 text-xs text-ink/60 transition-colors hover:bg-sage/30 hover:text-ink disabled:opacity-50'
                  >
                    <FiX className='h-3.5 w-3.5' aria-hidden='true' />
                    {isDismissing ? 'Dismissing…' : 'Dismiss'}
                  </button>
                </div>
              </div>

              {isExpanded && item.raw_email_snippet && (
                <pre
                  id={panelId}
                  className='mt-2 max-h-48 overflow-auto rounded-sm border border-line bg-sunken p-2.5 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap text-ink/80 scrollbar-thin'
                >
                  {item.raw_email_snippet}
                </pre>
              )}
            </li>
          );
        })}
      </ul>

      <p className='mt-3 text-xs text-ink/60'>
        Add these manually below if you still want them tracked.
      </p>
    </section>
  );
}
