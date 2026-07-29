'use client';

import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

export function InboxAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className='w-full max-w-md'>
      <div className='flex items-center justify-between gap-3 rounded-2xl bg-white/60 px-4 py-3'>
        <span className='font-mini text-sm text-ink truncate'>{address}</span>
        <button
          onClick={handleCopy}
          className='flex shrink-0 items-center gap-1.5 rounded-md bg-pine px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-pine/90 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-pine'
        >
          {copied ? (
            <FiCheck className='h-3.5 w-3.5' />
          ) : (
            <FiCopy className='h-3.5 w-3.5' />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className='font-mini mt-3 text-sm text-ink/60'>
        Forward any subscription receipt here. Bleed reads it and adds it to
        your list - no typing required.
      </p>
    </div>
  );
}
