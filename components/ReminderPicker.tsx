'use client';

interface ReminderPickerProps {
  reminderAt: string; // datetime-local formatted string
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
  const isLastChannel = (channel: 'email' | 'push') =>
    channel === 'email' ? !notifyPush : !notifyEmail;

  return (
    <fieldset className='flex flex-col gap-3 rounded-lg border border-sage p-4'>
      <legend className='px-1 text-xs font-medium uppercase tracking-wide text-ink/50'>
        Remind me
      </legend>

      <label className='flex flex-col gap-1 text-sm text-ink'>
        Date & time
        <input
          type='datetime-local'
          value={reminderAt}
          onChange={(e) => onChange({ reminderAt: e.target.value })}
          required
          className='rounded-md border border-sage bg-white px-3 py-2 font-mono text-sm text-ink outline-none focus:border-pine'
        />
      </label>

      <div className='flex flex-col gap-2'>
        <label className='flex items-center gap-2 text-sm text-ink'>
          <input
            type='checkbox'
            checked={notifyEmail}
            disabled={notifyEmail && isLastChannel('email')}
            onChange={(e) => onChange({ notifyEmail: e.target.checked })}
            className='h-4 w-4 accent-pine'
          />
          Email
        </label>

        <label className='flex items-center gap-2 text-sm text-ink'>
          <input
            type='checkbox'
            checked={notifyPush}
            disabled={notifyPush && isLastChannel('push')}
            onChange={(e) => onChange({ notifyPush: e.target.checked })}
            className='h-4 w-4 accent-pine'
          />
          Push notification
        </label>
      </div>

      <p className='text-xs text-ink/40'>
        At least one channel has to stay on.
      </p>
    </fieldset>
  );
}
