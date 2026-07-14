'use client';

import { useState } from 'react';

const INBOX_ADDRESS =
  process.env.NEXT_PUBLIC_INBOUND_ADDRESS ?? 'you@bleed-xxxx.resend.app';

export function InboxAddress() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(INBOX_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className='w-full max-w-md'>
      <div className='flex items-center justify-between gap-3 rounded-lg border border-sage bg-white/60 px-4 py-3'>
        <span className='font-mono text-sm text-ink truncate'>
          {INBOX_ADDRESS}
        </span>
        <button
          onClick={handleCopy}
          className='shrink-0 rounded-md bg-pine px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-pine/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine'
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className='mt-3 text-sm text-ink/60'>
        Forward any subscription receipt here. Bleed reads it and adds it to
        your list — no typing required.
      </p>
    </div>
  );
}
