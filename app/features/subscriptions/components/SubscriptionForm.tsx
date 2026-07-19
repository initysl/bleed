'use client';

import { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { ReminderPicker } from './ReminderPicker';
import { toDatetimeLocalValue, defaultReminderAt } from '@/lib/utils/dates';
import { CURRENCIES } from '@/lib/utils/currency';
import { useCreateSubscription } from '@/app/features/subscriptions/hooks/useCreateSubscription';
import { useUpdateSubscription } from '@/app/features/subscriptions/hooks/useUpdateSubscription';
import { useDeleteSubscription } from '@/app/features/subscriptions/hooks/useDeleteSubscription';
import type {
  BillingCycle,
  Subscription,
} from '@/app/features/subscriptions/types';

const today = new Date();
const initialRenewalDate = today.toISOString().slice(0, 10);

interface SubscriptionFormProps {
  onDone?: () => void;
  /** Pass an existing subscription to switch the form into edit mode, pre-filled. */
  existing?: Subscription;
}

export function SubscriptionForm({ onDone, existing }: SubscriptionFormProps) {
  const isEditing = Boolean(existing);

  const createMutation = useCreateSubscription();
  const updateMutation = useUpdateSubscription();
  const deleteMutation = useDeleteSubscription();

  const [name, setName] = useState(existing?.name ?? '');
  const [price, setPrice] = useState(existing?.price?.toString() ?? '');
  const [currency, setCurrency] = useState(existing?.currency ?? 'USD');
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
  const [error, setError] = useState<string | null>(null);

  const submitting = createMutation.isPending || updateMutation.isPending;
  const deleting = deleteMutation.isPending;

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
    setError(null);

    const payload = {
      name,
      price: parseFloat(price),
      currency,
      billing_cycle: billingCycle,
      renewal_date: renewalDate,
      reminder_at: new Date(reminderAt).toISOString(),
      notify_email: notifyEmail,
      notify_push: notifyPush,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: existing!.id, input: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onDone?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Try again.',
      );
    }
  }

  async function handleDelete() {
    if (!existing) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(existing.id);
      onDone?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't delete. Try again.",
      );
    }
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

        <label className='flex w-24 flex-col gap-1 text-sm text-ink'>
          Currency
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className='rounded-md border border-sage bg-white px-3 py-2 font-mono text-sm text-ink outline-none focus:border-pine'
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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
            className='flex items-center gap-1.5 rounded-md border border-rust px-4 py-2 text-sm font-medium text-rust transition-colors hover:bg-rust/10 disabled:opacity-60'
          >
            <FiTrash2 className='h-4 w-4' />
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        )}
      </div>
    </form>
  );
}
