'use client';

import { useForm } from '@tanstack/react-form';
import { FiTrash2 } from 'react-icons/fi';
import { ReminderPicker } from './ReminderPicker';
import { toDatetimeLocalValue, defaultReminderAt } from '@/lib/utils/dates';
import { CURRENCIES } from '@/lib/utils/currency';
import { subscriptionCreateSchema } from '@/app/features/subscriptions/schema';
import { useCreateSubscription } from '@/app/features/subscriptions/hooks/useCreateSubscription';
import { useUpdateSubscription } from '@/app/features/subscriptions/hooks/useUpdateSubscription';
import { useDeleteSubscription } from '@/app/features/subscriptions/hooks/useDeleteSubscription';
import type { Subscription } from '@/app/features/subscriptions/types';

const today = new Date();
const initialRenewalDate = today.toISOString().slice(0, 10);

interface SubscriptionFormProps {
  onDone?: () => void;
  existing?: Subscription;
}

// Pulls a display-ready message out of a TanStack Form field error, whether it
// came from our zod schema (an object with .message) or a plain string.
function firstErrorMessage(errors: unknown[]): string | null {
  if (!errors.length) return null;
  const err = errors[0] as { message?: string } | string;
  return typeof err === 'string' ? err : (err.message ?? null);
}

export function SubscriptionForm({ onDone, existing }: SubscriptionFormProps) {
  const isEditing = Boolean(existing);

  const createMutation = useCreateSubscription();
  const updateMutation = useUpdateSubscription();
  const deleteMutation = useDeleteSubscription();

  const form = useForm({
    defaultValues: {
      name: existing?.name ?? '',
      price: existing?.price ?? 0,
      currency: existing?.currency ?? 'USD',
      billing_cycle: existing?.billing_cycle ?? ('monthly' as const),
      renewal_date: existing?.renewal_date ?? initialRenewalDate,
      reminder_at: existing?.reminder_at
        ? toDatetimeLocalValue(new Date(existing.reminder_at))
        : toDatetimeLocalValue(defaultReminderAt(new Date(initialRenewalDate))),
      notify_email: existing?.notify_email ?? true,
      notify_push: existing?.notify_push ?? true,
    },
    // Same zod schema the API route validates against — one source of truth,
    // shared between client and server instead of two definitions to keep in sync.
    validators: {
      onSubmit: subscriptionCreateSchema,
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        reminder_at: new Date(value.reminder_at).toISOString(),
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: existing!.id, input: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onDone?.();
    },
  });

  const submitting = createMutation.isPending || updateMutation.isPending;
  const deleting = deleteMutation.isPending;

  async function handleDelete() {
    if (!existing) return;
    await deleteMutation.mutateAsync(existing.id);
    onDone?.();
  }

  return (
    <form
      onSubmit={(e) => {
        // This is the one native event this form still touches directly —
        // everything else flows through TanStack Form's own field API instead
        // of hand-typed onChange/onSubmit handlers per input.
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className='flex w-full flex-col gap-4'
    >
      <form.Field name='name'>
        {(field) => {
          const error = firstErrorMessage(field.state.meta.errors);
          return (
            <label className='flex flex-col gap-1 text-sm text-ink font-mono'>
              Name
              <input
                type='text'
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder='Netflix'
                className='rounded-md border border-sage bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine'
              />
              {error && <span className='text-xs text-rust'>{error}</span>}
            </label>
          );
        }}
      </form.Field>

      <div className='flex flex-col gap-3'>
        {/* Price + Currency */}
        <div className='flex gap-3'>
          <form.Field name='price'>
            {(field) => {
              const error = firstErrorMessage(field.state.meta.errors);

              return (
                <label className='flex flex-1 flex-col gap-1 text-sm text-ink'>
                  Price
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(e.target.valueAsNumber || 0)
                    }
                    onBlur={field.handleBlur}
                    placeholder='15.49'
                    className='rounded-md border border-sage bg-white px-3 py-2 font-mono text-sm text-ink outline-none focus:border-pine'
                  />
                  {error && <span className='text-xs text-rust'>{error}</span>}
                </label>
              );
            }}
          </form.Field>

          <form.Field name='currency'>
            {(field) => (
              <label className='flex w-28 flex-col gap-1 text-sm text-ink'>
                Currency
                <select
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className='rounded-md border border-sage bg-white px-3 py-2 font-mono text-sm text-ink outline-none focus:border-pine'
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </form.Field>
        </div>

        {/* Billing Cycle */}
        <form.Field name='billing_cycle'>
          {(field) => (
            <label className='flex flex-col gap-1 text-sm text-ink'>
              Cycle
              <select
                value={field.state.value}
                onChange={(e) =>
                  field.handleChange(e.target.value as 'monthly' | 'yearly')
                }
                className='rounded-md border border-sage bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine'
              >
                <option value='monthly'>Monthly</option>
                <option value='yearly'>Yearly</option>
              </select>
            </label>
          )}
        </form.Field>
      </div>

      <form.Field name='renewal_date'>
        {(field) => (
          <label className='flex flex-col gap-1 text-sm text-ink font-mono'>
            Renewal date
            <input
              type='date'
              value={field.state.value}
              onChange={(e) => {
                field.handleChange(e.target.value);
                // Only auto-suggest a new reminder time when adding fresh — don't
                // clobber a reminder the user already deliberately set on an edit.
                if (!isEditing) {
                  form.setFieldValue(
                    'reminder_at',
                    toDatetimeLocalValue(
                      defaultReminderAt(new Date(e.target.value)),
                    ),
                  );
                }
              }}
              onBlur={field.handleBlur}
              className='rounded-md border border-sage bg-white px-3 py-2 font-mono text-sm text-ink outline-none focus:border-pine'
            />
          </label>
        )}
      </form.Field>

      {/*
        ReminderPicker is a single compound input driving three form values at
        once (a datetime + two booleans). Nesting three form.Field renders lets
        it stay a plain, reusable component with one onChange callback, rather
        than rewriting it to know about TanStack Form's field API directly.
      */}
      <form.Field name='reminder_at'>
        {(reminderAtField) => (
          <form.Field name='notify_email'>
            {(emailField) => (
              <form.Field name='notify_push'>
                {(pushField) => {
                  const channelError = firstErrorMessage(
                    pushField.state.meta.errors,
                  );
                  return (
                    <div className='flex flex-col gap-1 font-mono'>
                      <ReminderPicker
                        reminderAt={reminderAtField.state.value}
                        notifyEmail={emailField.state.value}
                        notifyPush={pushField.state.value}
                        onChange={(next) => {
                          if (next.reminderAt !== undefined)
                            reminderAtField.handleChange(next.reminderAt);
                          if (next.notifyEmail !== undefined)
                            emailField.handleChange(next.notifyEmail);
                          if (next.notifyPush !== undefined)
                            pushField.handleChange(next.notifyPush);
                        }}
                      />
                      {channelError && (
                        <span className='text-xs text-rust'>
                          {channelError}
                        </span>
                      )}
                    </div>
                  );
                }}
              </form.Field>
            )}
          </form.Field>
        )}
      </form.Field>

      <div className='flex gap-2'>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <button
              type='submit'
              disabled={!canSubmit || submitting || deleting}
              className='flex-1 rounded-md bg-pine px-4 py-2 text-sm font-medium font-body text-paper transition-colors hover:bg-pine/90 disabled:opacity-60'
            >
              {isSubmitting || submitting
                ? 'Saving…'
                : isEditing
                  ? 'Save changes'
                  : 'Add subscription'}
            </button>
          )}
        </form.Subscribe>

        {isEditing && (
          <button
            type='button'
            onClick={handleDelete}
            disabled={submitting || deleting}
            className='flex items-center gap-1.5 rounded-md border border-rust px-4 py-2 text-sm font-medium font-body text-rust transition-colors hover:bg-rust/10 disabled:opacity-60'
          >
            <FiTrash2 className='h-4 w-4' />
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        )}
      </div>
    </form>
  );
}
