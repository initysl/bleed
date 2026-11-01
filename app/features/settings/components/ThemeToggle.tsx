'use client';

import { useId } from 'react';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';
import { useTheme } from '@/providers/ThemeProvider';
import type { ThemePreference } from '@/lib/theme';

const OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: typeof FiSun;
}[] = [
  { value: 'light', label: 'Light', icon: FiSun },
  { value: 'dark', label: 'Dark', icon: FiMoon },
  { value: 'system', label: 'System', icon: FiMonitor },
];

export function ThemeToggle() {
  const { preference, resolved, setPreference } = useTheme();
  const groupId = useId();

  return (
    <div>
      {/* A radiogroup rather than three buttons: these are three mutually
          exclusive states of one setting, so arrow keys should move between
          them and only the selected one should be a tab stop. */}
      <div
        role='radiogroup'
        aria-labelledby={groupId}
        className='inline-flex w-full gap-1 rounded-xl border border-sage/50 bg-paper/60 p-1 sm:w-auto'
      >
        {OPTIONS.map((option) => {
          const active = preference === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type='button'
              role='radio'
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => setPreference(option.value)}
              className={`font-mini flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:flex-none ${
                active
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-ink/50 hover:bg-sage/20 hover:text-ink'
              }`}
            >
              <Icon size={14} aria-hidden='true' />
              {option.label}
            </button>
          );
        })}
      </div>

      <p id={groupId} className='mt-2 font-mono text-[11px] text-ink/50'>
        {preference === 'system'
          ? `Following your device, which is currently ${resolved}.`
          : `Always ${preference}, whatever your device is set to.`}
      </p>
    </div>
  );
}
