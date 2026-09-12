'use client';

import { Switch } from '@/app/components/ui/Switch';

interface ReminderPickerProps {
  reminderAt: string;
  notifyEmail: boolean;
  notifyPush: boolean;
  onChange: (next: {
    reminderAt?: string;
    notifyEmail?: boolean;
    notifyPush?: boolean;
  }) => void;
}

export function ReminderPicker({
  reminderAt,
  notifyEmail,
  notifyPush,
  onChange,
}: ReminderPickerProps) {
  // The last enabled channel is locked rather than silently rejected — and
  // the Switch renders the reason instead of merely going dim, so a keyboard
  // user reaches it and hears why.
  const emailIsLast = notifyEmail && !notifyPush;
  const pushIsLast = notifyPush && !notifyEmail;
  const lockCopy = 'One channel stays on. Enable the other to switch this off.';

  return (
    <fieldset className='m-0 rounded-sm border border-line bg-surface p-4'>
      <legend className='section-label float-none m-0 px-1.5'>REMIND ME</legend>

      <label className='mt-1 block'>
        <span className='mb-1.5 block font-mono text-label tracking-[0.14em] text-ink/55'>
          DATE &amp; TIME
        </span>
        <input
          type='datetime-local'
          value={reminderAt}
          onChange={(e) => onChange({ reminderAt: e.target.value })}
          required
          className='w-full cursor-pointer rounded-sm border border-line bg-sunken px-3 py-2.5 font-mono text-[14px] text-ink transition-colors hover:border-line-strong focus:border-pine focus:bg-surface'
        />
      </label>

      <div className='mt-2 flex flex-col'>
        <div className='border-t border-line-soft'>
          <Switch
            label='Email'
            checked={notifyEmail}
            lockedReason={emailIsLast ? lockCopy : null}
            onChange={(next) => onChange({ notifyEmail: next })}
          />
        </div>
        <div className='border-t border-line-soft'>
          <Switch
            label='Push notification'
            checked={notifyPush}
            lockedReason={pushIsLast ? lockCopy : null}
            onChange={(next) => onChange({ notifyPush: next })}
          />
        </div>
      </div>
    </fieldset>
  );
}
