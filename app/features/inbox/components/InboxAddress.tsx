'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { DURATION, EASE_OUT_EXPO } from '@/lib/motion';

export function InboxAddress({
  address,
  /** Set on the dashboard, where this is the third panel in the rail. */
  index,
}: {
  address: string;
  index?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleCopy() {
    setCopyFailed(false);

    // navigator.clipboard rejects on insecure origins, inside some iframes,
    // and on permission denial — and is undefined in older contexts.
    // Unguarded this was an unhandled rejection with no fallback and no
    // message, on the single action the whole product depends on.
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyFailed(true);
      inputRef.current?.select();
    }
  }

  return (
    <section className='w-full rounded-sm border border-line bg-surface p-[22px]'>
      <h3 className='section-label m-0 mb-3.5'>
        {index && <span className='text-pine'>{index}&nbsp; </span>}
        INBOUND ADDRESS
      </h3>

      <div className='flex items-stretch overflow-hidden rounded-sm border border-line'>
        {/* A readonly input rather than a <span>. The address used to be
            truncated text, so a user who could not use the clipboard API had
            no way to select the full value at all. */}
        <input
          ref={inputRef}
          type='text'
          value={address}
          readOnly
          aria-label='Your forwarding address'
          onFocus={(e) => e.currentTarget.select()}
          className='min-w-0 flex-1 truncate border-0 bg-sunken px-3 py-2.5 font-mono text-[12px] text-ink'
        />
        <button
          type='button'
          onClick={handleCopy}
          className={`flex shrink-0 cursor-pointer items-center gap-1.5 border-0 border-l border-line px-4 font-mono text-[10px] tracking-[0.1em] transition-colors duration-150 ${
            copied ? 'bg-pine text-paper' : 'bg-surface text-pine hover:bg-line-soft'
          }`}
        >
          {/* The icon swaps on a crossfade rather than a hard cut, which is
              what makes the confirmation read as the same control changing
              state instead of two different buttons. */}
          <AnimatePresence mode='wait' initial={false}>
            <motion.span
              key={copied ? 'done' : 'idle'}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: DURATION.press, ease: EASE_OUT_EXPO }}
              className='flex items-center'
            >
              {copied ? (
                <FiCheck className='h-3.5 w-3.5' aria-hidden='true' />
              ) : (
                <FiCopy className='h-3.5 w-3.5' aria-hidden='true' />
              )}
            </motion.span>
          </AnimatePresence>
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>

      {/* aria-live so the confirmation reaches a screen reader; the label swap
          on the button is purely visual and announces nothing. */}
      <p aria-live='polite' className='sr-only'>
        {copied ? 'Address copied to clipboard' : ''}
      </p>

      {copyFailed && (
        <p role='alert' className='mt-2 font-mono text-[11px] text-rust'>
          Couldn&apos;t copy automatically &mdash; the address is selected, so
          press Ctrl/Cmd+C.
        </p>
      )}

      <p className='mt-3 text-[12px] leading-relaxed text-ink/60'>
        Forward any receipt here. Bleed reads the amount, cycle and renewal
        date, then logs it &mdash; no typing.
      </p>
    </section>
  );
}
