'use client';

import { useId } from 'react';
import { motion } from 'framer-motion';
import { SPRING } from '@/lib/motion';

export interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (next: T) => void;
  /** Names the group for assistive tech, e.g. "Display currency". */
  label: string;
  size?: 'sm' | 'md';
}

/**
 * A segmented control where ONE indicator travels between cells, rather than
 * two backgrounds switching on and off.
 *
 * The travelling indicator is a shared layout animation: every cell renders
 * the same `layoutId`, so framer-motion interpolates the indicator's position
 * and width between whichever cells are involved. That means it also handles
 * cells of different widths — which a transform offset computed from an index
 * cannot — so the labels don't have to be padded to equal length.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  label,
  size = 'md',
}: SegmentedControlProps<T>) {
  // Scoped per instance, so two controls on one screen don't animate into
  // each other.
  const layoutId = useId();

  const pad = size === 'sm' ? 'px-2.5 py-1.5' : 'px-3.5 py-2';

  return (
    <div
      role='group'
      aria-label={label}
      className='relative flex overflow-hidden rounded-sm border border-line bg-surface'
    >
      {segments.map((seg) => {
        const active = seg.value === value;
        return (
          <button
            key={seg.value}
            type='button'
            aria-pressed={active}
            onClick={() => onChange(seg.value)}
            className={`relative ${pad} cursor-pointer font-mono text-label tracking-[0.1em] transition-colors duration-200 ${
              active ? 'text-paper' : 'text-ink/55 hover:text-ink'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={SPRING.snap}
                className='absolute inset-0 bg-ink'
                // Behind the label, which sits in its own stacking context.
                style={{ zIndex: 0 }}
              />
            )}
            <span className='relative z-10'>{seg.label}</span>
          </button>
        );
      })}
    </div>
  );
}
