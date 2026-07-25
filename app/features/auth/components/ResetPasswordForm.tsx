'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { createClient } from '@/lib/supabase/client';
import { newPasswordSchema } from '@/app/features/auth/schema';
import Image from 'next/image';
import Logo from '@/public/bleedlogo.svg';

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
    defaultValues: {
      password: '',
      confirm: '',
    },
    validators: {
      onSubmit: newPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setFormError(null);

      const { error } = await supabase.auth.updateUser({
        password: value.password,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    },
  });

  return (
    <div className='w-full max-w-md rounded-4xl bg-white p-10'>
      <div className='mb-8 text-center'>
        <div className='flex items-center justify-center'>
          <Image src={Logo} alt='Bleed logo' width={150} priority={true} />
        </div>

        <h1 className='font-display text-xl text-ink'>Create New Password</h1>

        <p className='mt-2 text-sm leading-6 text-ink/55'>
          Your new password must be different from the one you previously used.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className='space-y-5'
      >
        <form.Field name='password'>
          {(field) => {
            const error = firstErrorMessage(field.state.meta.errors);

            return (
              <div>
                <input
                  type='password'
                  autoComplete='new-password'
                  placeholder='New password'
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className='h-14 w-full rounded-full border border-sage/40 bg-[#F7F7F7] px-6 text-sm outline-none transition focus:border-pine focus:bg-white'
                />

                {error && <p className='mt-2 text-xs text-rust'>{error}</p>}
              </div>
            );
          }}
        </form.Field>

        <form.Field name='confirm'>
          {(field) => {
            const error = firstErrorMessage(field.state.meta.errors);

            return (
              <div>
                <input
                  type='password'
                  autoComplete='new-password'
                  placeholder='Confirm new password'
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className='h-14 w-full rounded-full border border-sage/40 bg-[#F7F7F7] px-6 text-sm outline-none transition focus:border-pine focus:bg-white'
                />

                {error && <p className='mt-2 text-xs text-rust'>{error}</p>}
              </div>
            );
          }}
        </form.Field>

        {formError && (
          <div className='rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-rust'>
            {formError}
          </div>
        )}

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <button
              type='submit'
              disabled={!canSubmit}
              className='h-14 w-full rounded-full bg-pine font-medium text-paper transition hover:bg-pine/90 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isSubmitting ? 'Saving...' : 'Update Password'}
            </button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
