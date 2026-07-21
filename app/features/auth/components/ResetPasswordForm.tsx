'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { createClient } from '@/lib/supabase/client';
import { newPasswordSchema } from '@/app/features/auth/schema';

function firstErrorMessage(errors: unknown[]): string | null {
  if (!errors.length) return null;
  const err = errors[0] as { message?: string } | string;
  return typeof err === 'string' ? err : (err.message ?? null);
}

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { password: '', confirm: '' },
    validators: { onSubmit: newPasswordSchema },
    onSubmit: async ({ value }) => {
      setFormError(null);

      // By the time this page loads, /auth/confirm has already verified the
      // recovery link and established a temporary session.
      const { error } = await supabase.auth.updateUser({
        password: value.password,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      router.push('/');
      router.refresh();
    },
  });

  return (
    <div className='flex flex-col items-center gap-8'>
      <h1 className='font-display text-2xl font-medium text-ink'>
        Set a new password
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className='flex w-full max-w-sm flex-col gap-4'
      >
        <form.Field name='password'>
          {(field) => {
            const error = firstErrorMessage(field.state.meta.errors);
            return (
              <label className='flex flex-col gap-1 text-sm text-ink'>
                New password
                <input
                  type='password'
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

        <form.Field name='confirm'>
          {(field) => {
            const error = firstErrorMessage(field.state.meta.errors);
            return (
              <label className='flex flex-col gap-1 text-sm text-ink'>
                Confirm new password
                <input
                  type='password'
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
              {isSubmitting ? 'Saving…' : 'Set new password'}
            </button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
