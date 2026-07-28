'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { createClient } from '@/lib/supabase/client';
import { emailSchema } from '@/app/features/auth/schema';

function firstErrorMessage(errors: unknown[]): string | null {
  if (!errors.length) return null;
  const err = errors[0] as { message?: string } | string;
  return typeof err === 'string' ? err : (err.message ?? null);
}

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const supabase = createClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: '' },
    validators: { onSubmit: emailSchema },
    onSubmit: async ({ value }) => {
      setFormError(null);

      // Sends a confirmation link to the NEW address — the email isn't
      // actually changed until that link is clicked.
      const { error } = await supabase.auth.updateUser({ email: value.email });

      if (error) {
        setFormError(error.message);
        return;
      }

      setSentTo(value.email);
    },
  });

  if (sentTo) {
    return (
      <p className='font-display text-sm text-ink/60'>
        Check {sentTo} for a confirmation link. Your email won't change until
        you click it.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className='flex flex-col gap-3'
    >
      <form.Field name='email'>
        {(field) => {
          const error = firstErrorMessage(field.state.meta.errors);
          return (
            <label className='flex flex-col gap-1 text-sm text-ink'>
              New email
              <input
                type='email'
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={currentEmail}
                className='font-mini rounded-md border border-sage bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine'
              />
              {error && <span className='text-xs text-rust'>{error}</span>}
            </label>
          );
        }}
      </form.Field>

      {formError && <p className='text-sm text-rust'>{formError}</p>}

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <button
            type='submit'
            disabled={!canSubmit}
            className='font-mini self-start rounded-md bg-pine px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine/90 disabled:opacity-60'
          >
            {isSubmitting ? 'Sending…' : 'Update email'}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
