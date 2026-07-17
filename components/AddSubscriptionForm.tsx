'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReminderPicker } from './ReminderPicker';
import { toDatetimeLocalValue, defaultReminderAt } from '@/lib/dates';
import type { BillingCycle, Subscription } from '@/types/subscription';

const today = new Date();
const initialRenewalDate = today.toISOString().slice(0, 10);

interface AddSubscriptionFormProps {
  onDone?: () => void;
  /** Pass an existing subscription to switch the form into edit mode, pre-filled. */
  existing?: Subscription;
}

export function AddSubscriptionForm({
  onDone,
  existing,
}: AddSubscriptionFormProps) {
  const router = useRouter();
  const isEditing = Boolean(existing);

  const [name, setName] = useState(existing?.name ?? '');
  const [price, setPrice] = useState(existing?.price?.toString() ?? '');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    existing?.billing_cycle ?? 'monthly',
  );
  const [renewalDate, setRenewalDate] = useState(
    existing?.renewal_date ?? initialRenewalDate,
  );
  const [reminderAt, setReminderAt] = useState(
    existing?.reminder_at
      ? toDatetimeLocalValue(new Date(existing.reminder_at))
      : toDatetimeLocalValue(defaultReminderAt(new Date(initialRenewalDate))),
  );
  const [notifyEmail, setNotifyEmail] = useState(
    existing?.notify_email ?? true,
  );
  const [notifyPush, setNotifyPush] = useState(existing?.notify_push ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleRenewalDateChange(value: string) {
    setRenewalDate(value);
    // Only auto-suggest a new reminder time when adding fresh — don't clobber
    // a reminder the user already deliberately set on an existing subscription.
    if (!isEditing) {
      setReminderAt(toDatetimeLocalValue(defaultReminderAt(new Date(value))));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      name,
      price: parseFloat(price),
      billing_cycle: billingCycle,
      renewal_date: renewalDate,
      reminder_at: new Date(reminderAt).toISOString(),
      notify_email: notifyEmail,
      notify_push: notifyPush,
    };

    const res = await fetch(
      isEditing ? `/api/subscriptions/${existing!.id}` : '/api/subscriptions',
      {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(
        body.error?.formErrors?.[0] ??
          body.error ??
          'Something went wrong. Try again.',
      );
      return;
    }

    router.refresh();
    onDone?.();
  }

  async function handleDelete() {
    if (!existing) return;
    setDeleting(true);
    setError(null);

    const res = await fetch(`/api/subscriptions/${existing.id}`, {
      method: 'DELETE',
    });

    setDeleting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't delete. Try again.");
      return;
    }

    router.refresh();
    onDone?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='flex w-full max-w-md flex-col gap-4'
    >
      <label className='flex flex-col gap-1 text-sm text-ink'>
        Name
        <input
          type='text'
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder='Netflix'
          className='rounded-md border border-sage bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine'
        />
      </label>

      <div className='flex gap-3'>
        <label className='flex flex-1 flex-col gap-1 text-sm text-ink'>
          Price
          <input
            type='number'
            step='0.01'
            min='0'
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            placeholder='15.49'
            className='rounded-md border border-sage bg-white px-3 py-2 font-mono text-sm text-ink outline-none focus:border-pine'
          />
        </label>

        <label className='flex flex-1 flex-col gap-1 text-sm text-ink'>
          Billing cycle
          <select
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
            className='rounded-md border border-sage bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine'
          >
            <option value='monthly'>Monthly</option>
            <option value='yearly'>Yearly</option>
          </select>
        </label>
      </div>

      <label className='flex flex-col gap-1 text-sm text-ink'>
        Renewal date
        <input
          type='date'
          value={renewalDate}
          onChange={(e) => handleRenewalDateChange(e.target.value)}
          required
          className='rounded-md border border-sage bg-white px-3 py-2 font-mono text-sm text-ink outline-none focus:border-pine'
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

      <div className='flex gap-2'>
        <button
          type='submit'
          disabled={submitting || deleting}
          className='flex-1 rounded-md bg-pine px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine/90 disabled:opacity-60'
        >
          {submitting
            ? 'Saving…'
            : isEditing
              ? 'Save changes'
              : 'Add subscription'}
        </button>

        {isEditing && (
          <button
            type='button'
            onClick={handleDelete}
            disabled={submitting || deleting}
            className='rounded-md border border-rust px-4 py-2 text-sm font-medium text-rust transition-colors hover:bg-rust/10 disabled:opacity-60'
          >
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        )}
      </div>
    </form>
  );
}
