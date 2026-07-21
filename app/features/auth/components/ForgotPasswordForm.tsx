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

export function ForgotPasswordForm() {
  const supabase = createClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: '' },
    validators: { onSubmit: emailSchema },
    onSubmit: async ({ value }) => {
      setFormError(null);

      const { error } = await supabase.auth.resetPasswordForEmail(value.email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      setSentTo(value.email);
    },
  });

  if (sentTo) {
    return (
      <div className='flex flex-col items-center gap-3 text-center'>
        <h1 className='font-display text-2xl font-medium text-ink'>
          Check your email
        </h1>
        <p className='max-w-sm text-sm text-ink/60'>
          If an account exists for {sentTo}, a password reset link is on its
          way.
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center gap-8'>
      <h1 className='font-display text-2xl font-medium text-ink'>
        Reset your password
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className='flex w-full max-w-sm flex-col gap-4'
      >
        <form.Field name='email'>
          {(field) => {
            const error = firstErrorMessage(field.state.meta.errors);
            return (
              <label className='flex flex-col gap-1 text-sm text-ink'>
                Email
                <input
                  type='email'
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className='rounded-md border border-sage bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine'
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
              className='rounded-md bg-pine px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine/90 disabled:opacity-60'
            >
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
