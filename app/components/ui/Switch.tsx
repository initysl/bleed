'use client';

import { useId } from 'react';
import { motion } from 'framer-motion';
import { SPRING } from '@/lib/motion';

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Visible label. Required — it is what names the control to assistive tech. */
  label: string;
  /** Optional supporting line under the label. */
  description?: string;
  /** Shown in rust with role="alert" rather than as muted helper text. */
  error?: string | null;
  /**
   * Why the control cannot be used right now. Rendering the reason rather
   * than a bare disabled state is the difference between "locked" and
   * "broken" — used for the last-enabled reminder channel.
   */
  lockedReason?: string | null;
  disabled?: boolean;
}

/**
 * A switch, built on a real button with role="switch".
 *
 * Two things the previous implementation got wrong, fixed here by
 * construction: the label was a SIBLING span with nothing connecting it, so
 * screen readers announced "switch, on" with no indication of what; and the
 * control was 36x20, under the 24x24 WCAG 2.2 target minimum.
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  error,
  lockedReason,
  disabled,
}: SwitchProps) {
  const labelId = useId();
  const descId = useId();
  const locked = Boolean(lockedReason);
  const inert = disabled || locked;
  const hint = error ?? lockedReason ?? description;

  return (
    <div className='flex items-center justify-between gap-4 py-3.5'>
      <span className='min-w-0'>
        <span id={labelId} className='block text-[15px] text-ink'>
          {label}
        </span>
        {hint && (
          <span
            id={descId}
            role={error ? 'alert' : undefined}
            className={`mt-0.5 block font-mono text-[11px] leading-relaxed ${
              error || locked ? 'text-rust' : 'text-ink/55'
            }`}
          >
            {hint}
          </span>
        )}
      </span>

      <button
        type='button'
        role='switch'
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={hint ? descId : undefined}
        // aria-disabled rather than `disabled` when locked: a disabled button
        // is removed from the tab order, so a keyboard user never reaches it
        // and never hears why it can't be changed.
        aria-disabled={inert || undefined}
        onClick={() => {
          if (inert) return;
          onChange(!checked);
        }}
        className={`relative flex h-6 w-11 shrink-0 items-center rounded-xs p-0.5 transition-colors duration-150 ${
          checked ? 'bg-pine' : 'bg-line-strong'
        } ${inert ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        {/* The thumb travels on a spring, so an interrupted toggle resolves
            from wherever it is rather than snapping. */}
        <motion.span
          layout
          transition={SPRING.snap}
          className='block h-5 w-5 rounded-xs bg-white shadow-sm'
          style={{ marginLeft: checked ? 'auto' : 0 }}
        />
      </button>
    </div>
  );
}
