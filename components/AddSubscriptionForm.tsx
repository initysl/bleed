'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReminderPicker } from './ReminderPicker';
import { defaultReminderAt, toDatetimeLocalValue } from '@/lib/dates';
import type { BillingCycle } from '@/types/subscription';

const today = new Date();
const initialRenewalDate = today.toISOString().slice(0, 10);

export function AddSubscriptionForm({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [renewalDate, setRenewalDate] = useState(initialRenewalDate);
  const [reminderAt, setReminderAt] = useState(
    toDatetimeLocalValue(defaultReminderAt(new Date(initialRenewalDate))),
  );
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleRenewalDateChange(value: string) {
    setRenewalDate(value);
    // Keep the reminder suggestion in sync until the user manually edits it themselves
    setReminderAt(toDatetimeLocalValue(defaultReminderAt(new Date(value))));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        price: parseFloat(price),
        billing_cycle: billingCycle,
        renewal_date: renewalDate,
        reminder_at: new Date(reminderAt).toISOString(),
        notify_email: notifyEmail,
        notify_push: notifyPush,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(
        body.error?.formErrors?.[0] ?? 'Something went wrong. Try again.',
      );
      return;
    }

    router.refresh();
    onDone?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='bg-white text-black rounded-md p-4 flex w-full max-w-md flex-col gap-4'
    >
      <label className='flex flex-col gap-1 text-sm'>
        Name
        <input
          type='text'
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder='Netflix'
          className='rounded-md border border-sage bg-white px-3 py-2 text-sm outline-none focus:border-pine'
        />
      </label>

      <div className='flex gap-3'>
        <label className='flex flex-1 flex-col gap-1 text-sm'>
          Price
          <input
            type='number'
            step='0.01'
            min='0'
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            placeholder='15.49'
            className='rounded-md border border-sage bg-white px-3 py-2 font-mono text-sm outline-none focus:border-pine'
          />
        </label>

        <label className='flex flex-1 flex-col gap-1 text-sm'>
          Billing cycle
          <select
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
            className='rounded-md border border-sage bg-white px-3 py-2 text-sm outline-none focus:border-pine'
          >
            <option value='monthly'>Monthly</option>
            <option value='yearly'>Yearly</option>
          </select>
        </label>
      </div>

      <label className='flex flex-col gap-1 text-sm'>
        Renewal date
        <input
          type='date'
          value={renewalDate}
          onChange={(e) => handleRenewalDateChange(e.target.value)}
          required
          className='rounded-md border border-sage bg-white px-3 py-2 font-mono text-sm outline-none focus:border-pine'
        />
      </label>

      <ReminderPicker
        reminderAt={reminderAt}
        notifyEmail={notifyEmail}
        notifyPush={notifyPush}
        onChange={(next) => {
          if (next.reminderAt !== undefined) setReminderAt(next.reminderAt);
          if (next.notifyEmail !== undefined) setNotifyEmail(next.notifyEmail);
          if (next.notifyPush !== undefined) setNotifyPush(next.notifyPush);
        }}
      />

      {error && <p className='text-sm text-rust'>{error}</p>}

      <button
        type='submit'
        disabled={submitting}
        className='rounded-md bg-pine px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine/90 disabled:opacity-60'
      >
        {submitting ? 'Adding…' : 'Add subscription'}
      </button>
    </form>
  );
}
