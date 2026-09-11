'use client';

import { useEffect } from 'react';

// Root error boundary. Without this file, an unhandled render or data error
// anywhere in the app showed Next's default error screen in development and a
// bare, unstyled "Application error" in production, with no way back.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app] unhandled error:', error);
  }, [error]);

  return (
    <main className='mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center'>
      <h1 className='font-display text-2xl font-medium text-ink'>
        Something went wrong.
      </h1>
      <p className='font-mono text-sm text-ink/70'>
        This one is on us, not you. Your subscriptions are safe — nothing was
        changed.
      </p>

      {/* The digest is the only handle on a production error, where the real
          message is withheld from the client. Surfacing it means a user can
          quote something actionable in a bug report. */}
      {error.digest && (
        <p className='font-mono text-xs text-ink/50'>
          Reference: {error.digest}
        </p>
      )}

      <div className='mt-2 flex gap-3'>
        <button
          type='button'
          onClick={reset}
          className='rounded-md bg-pine px-4 py-2 font-body text-sm font-medium text-paper transition-colors hover:bg-pine/90'
        >
          Try again
        </button>
        <a
          href='/dashboard'
          className='rounded-md border border-sage px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:bg-sage/30'
        >
          Back to dashboard
        </a>
      </div>
    </main>
  );
}
