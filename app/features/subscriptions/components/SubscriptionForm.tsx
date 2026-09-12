'use client';

import { useId, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import { ReminderPicker } from './ReminderPicker';
import {
  toDatetimeLocalValue,
  defaultReminderAt,
  formatDateOnly,
  parseDateOnly,
} from '@/lib/utils/dates';
import { CURRENCIES } from '@/lib/utils/currency';
import { subscriptionCreateSchema } from '@/app/features/subscriptions/schema';
import { useCreateSubscription } from '@/app/features/subscriptions/hooks/useCreateSubscription';
import { useUpdateSubscription } from '@/app/features/subscriptions/hooks/useUpdateSubscription';
import { useDeleteSubscription } from '@/app/features/subscriptions/hooks/useDeleteSubscription';
import type { Subscription } from '@/app/features/subscriptions/types';

// Computed per render, not once at module scope. A module-level `new Date()` is
// evaluated at first import, so a tab left open across midnight kept offering
// yesterday as the default renewal date.
//
// formatDateOnly rather than toISOString().slice(0, 10): the latter reports the
// UTC day, so a user in Los Angeles opening the form at 5pm got tomorrow's date
// pre-filled.
function todayAsDateOnly() {
  return formatDateOnly(new Date());
}

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
  const initialRenewalDate = todayAsDateOnly();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const errorId = useId();

  const createMutation = useCreateSubscription();
  const updateMutation = useUpdateSubscription();
  const deleteMutation = useDeleteSubscription();

  const form = useForm({
    defaultValues: {
      name: existing?.name ?? '',
      price: existing?.price ?? 0,
      currency: existing?.currency ?? 'NGN',
      billing_cycle: existing?.billing_cycle ?? ('monthly' as const),
      renewal_date: existing?.renewal_date ?? initialRenewalDate,
      reminder_at: existing?.reminder_at
        ? toDatetimeLocalValue(new Date(existing.reminder_at))
        : toDatetimeLocalValue(
            defaultReminderAt(parseDateOnly(initialRenewalDate)),
          ),
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

      // Caught, not allowed to propagate. TanStack Form re-throws whatever the
      // submit handler rejects with, and form.handleSubmit() is called
      // un-awaited from the onSubmit below — so an uncaught rejection here
      // became an unhandled promise rejection and the user saw the button
      // simply return to its resting state with no explanation.
      try {
        setSubmitError(null);
        if (isEditing) {
          await updateMutation.mutateAsync({ id: existing!.id, input: payload });
        } else {
          await createMutation.mutateAsync(payload);
        }
        onDone?.();
      } catch (err) {
        setSubmitError(
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.',
        );
      }
    },
  });

  const submitting = createMutation.isPending || updateMutation.isPending;
  const deleting = deleteMutation.isPending;
  const busy = submitting || deleting;

  async function handleDelete() {
    if (!existing) return;

    // Destructive and irreversible, and it used to fire on a single click with
    // no undo and no confirmation at all.
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    try {
      setSubmitError(null);
      await deleteMutation.mutateAsync(existing.id);
      onDone?.();
    } catch (err) {
      setConfirmingDelete(false);
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Could not remove this subscription.',
      );
    }
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
          // aria-describedby links the message to the input, and aria-invalid
          // marks the field itself — without both, the error text was visible
          // but entirely invisible to a screen reader.
          const msgId = `${errorId}-name`;
          return (
            <label className='flex flex-col gap-1.5'>
              <span className='font-mono text-label tracking-[0.14em] text-ink/55'>SERVICE</span>
              <input
                type='text'
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder='Netflix'
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? msgId : undefined}
                className='w-full rounded-sm border border-line bg-sunken px-3 py-2.5 text-[15px] text-ink transition-colors hover:border-line-strong focus:border-pine focus:bg-surface'
              />
              {error && (
                <span id={msgId} className='font-mono text-[11px] text-rust'>
                  {error}
                </span>
              )}
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

              const msgId = `${errorId}-price`;
              return (
                <label className='flex flex-1 flex-col gap-1.5'>
                  <span className='font-mono text-label tracking-[0.14em] text-ink/55'>PRICE</span>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    // Empty renders as an empty box rather than a literal 0.
                    // Previously `valueAsNumber || 0` coerced a cleared field to
                    // 0, so the input looked empty while holding a value that
                    // then failed validation with "Price must be greater than
                    // 0" — an error about something the user could not see.
                    value={
                      Number.isFinite(field.state.value) &&
                      field.state.value !== 0
                        ? field.state.value
                        : (field.state.value === 0 && field.state.meta.isDirty
                            ? 0
                            : '')
                    }
                    onChange={(e) => {
                      const n = e.target.valueAsNumber;
                      field.handleChange(Number.isNaN(n) ? 0 : n);
                    }}
                    onBlur={field.handleBlur}
                    placeholder='15.49'
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? msgId : undefined}
                    className='w-full rounded-sm border border-line bg-sunken px-3 py-2.5 font-mono text-[14px] text-ink transition-colors hover:border-line-strong focus:border-pine focus:bg-surface'
                  />
                  {error && (
                    <span id={msgId} className='font-mono text-[11px] text-rust'>
                      {error}
                    </span>
                  )}
                </label>
              );
            }}
          </form.Field>

          <form.Field name='currency'>
            {(field) => (
              <label className='flex w-28 flex-col gap-1.5'>
                <span className='font-mono text-label tracking-[0.14em] text-ink/55'>CURRENCY</span>
                <select
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className='w-full rounded-sm border border-line bg-sunken px-3 py-2.5 font-mono text-[14px] text-ink transition-colors hover:border-line-strong focus:border-pine focus:bg-surface'
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
            <label className='flex flex-col gap-1.5'>
                <span className='font-mono text-label tracking-[0.14em] text-ink/55'>BILLING CYCLE</span>
              <select
                value={field.state.value}
                onChange={(e) =>
                  field.handleChange(e.target.value as 'monthly' | 'yearly')
                }
                className='w-full rounded-sm border border-line bg-sunken px-3 py-2.5 text-[15px] text-ink transition-colors hover:border-line-strong focus:border-pine focus:bg-surface'
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
            <span className='font-mono text-label tracking-[0.14em] text-ink/55'>NEXT RENEWAL</span>
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
                    // parseDateOnly: <input type="date"> yields "YYYY-MM-DD",
                    // which new Date() reads as UTC midnight — west of UTC that
                    // is the previous calendar day, so the suggested reminder
                    // came out a day early.
                    toDatetimeLocalValue(
                      defaultReminderAt(parseDateOnly(e.target.value)),
                    ),
                  );
                }
              }}
              onBlur={field.handleBlur}
              className='w-full rounded-sm border border-line bg-sunken px-3 py-2.5 font-mono text-[14px] text-ink transition-colors hover:border-line-strong focus:border-pine focus:bg-surface'
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
                        <span className='font-mono text-[11px] text-rust'>
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

      {/* The form's own failure state. role='alert' so it is announced rather
          than silently appearing, and aria-live='assertive' because the user is
          waiting on this specific result. */}
      {submitError && (
        <div
          id={errorId}
          role='alert'
          aria-live='assertive'
          className='flex items-start gap-2 rounded-sm border border-rust-line bg-rust-tint px-3 py-2.5 text-[13px] leading-snug text-rust'
        >
          <FiAlertCircle className='mt-0.5 h-4 w-4 shrink-0' aria-hidden='true' />
          <span>{submitError}</span>
        </div>
      )}

      <div className='flex gap-2'>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <button
              type='submit'
              disabled={!canSubmit || busy}
              aria-busy={isSubmitting || submitting}
              aria-describedby={submitError ? errorId : undefined}
              className='flex-1 cursor-pointer rounded-sm border-0 bg-pine px-4 py-3 font-mono text-[11px] tracking-[0.12em] text-paper transition-colors hover:bg-pine-hover disabled:cursor-not-allowed disabled:opacity-60'
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
            onBlur={() => setConfirmingDelete(false)}
            // `busy` rather than `submitting || deleting` so a delete can't be
            // triggered while a save is already in flight.
            disabled={busy}
            className={`focus-rust flex cursor-pointer items-center gap-1.5 rounded-sm border px-4 py-3 font-mono text-[11px] tracking-[0.1em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              confirmingDelete
                ? 'border-rust bg-rust text-paper'
                : 'border-rust bg-transparent text-rust hover:bg-rust-tint'
            }`}
          >
            <FiTrash2 className='h-4 w-4' aria-hidden='true' />
            {deleting
              ? 'Removing…'
              : confirmingDelete
                ? 'Tap again to confirm'
                : 'Remove'}
          </button>
        )}
      </div>
    </form>
  );
}
