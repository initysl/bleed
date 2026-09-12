'use client';

import { useRef, useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

export function InboxAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleCopy() {
    setCopyFailed(false);

    // navigator.clipboard rejects on insecure origins, inside some iframes, and
    // on permission denial — and clipboard itself is undefined in older
    // contexts. Unguarded, this was an unhandled rejection with no fallback and
    // no message, on the single action the whole product depends on. (The
    // landing page's copy of this already had a try/catch; this one didn't.)
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fall back to selecting the text so the user can copy it by hand.
      setCopyFailed(true);
      inputRef.current?.select();
    }
  }

  return (
    <div className='w-full max-w-md'>
      <div className='flex items-center justify-between gap-3 rounded-2xl bg-white/60 px-4 py-3'>
        {/* A readonly input rather than a <span>. The address was truncated
            text, so a user who couldn't use the clipboard API had no way to
            select the full value at all. An input is selectable, scrollable,
            and still not editable. */}
        <input
          ref={inputRef}
          type='text'
          value={address}
          readOnly
          aria-label='Your forwarding address'
          onFocus={(e) => e.currentTarget.select()}
          className='font-mini min-w-0 flex-1 truncate bg-transparent text-sm text-ink'
        />
        <button
          type='button'
          onClick={handleCopy}
          className='flex shrink-0 items-center gap-1.5 rounded-md bg-pine px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-pine/90'
        >
          {copied ? (
            <FiCheck className='h-3.5 w-3.5' aria-hidden='true' />
          ) : (
            <FiCopy className='h-3.5 w-3.5' aria-hidden='true' />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* aria-live so the confirmation reaches a screen reader. The "Copied"
          swap on the button is purely visual and announces nothing. */}
      <p aria-live='polite' className='sr-only'>
        {copied ? 'Address copied to clipboard' : ''}
      </p>

      {copyFailed && (
        <p role='alert' className='font-mini mt-2 text-xs text-rust'>
          Couldn&apos;t copy automatically — the address is selected, so press
          Ctrl/Cmd+C.
        </p>
      )}

      <p className='font-mini mt-3 text-sm text-ink/70'>
        Forward any subscription receipt here. Bleed reads it and adds it to
        your list &mdash; no typing required.
      </p>
    </div>
  );
}
