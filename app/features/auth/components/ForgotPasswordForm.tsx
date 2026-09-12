'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from '@tanstack/react-form';
import { FiArrowLeft } from 'react-icons/fi';
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
    defaultValues: {
      email: '',
    },

    validators: {
      onSubmit: emailSchema,
    },

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
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        className='w-full max-w-[440px] rounded-sm border border-line bg-surface p-8 sm:p-10'
      >
        <div className='flex flex-col items-center text-center'>
          <div className='mx-auto mb-5 flex items-center justify-center'>
            <span className='font-display text-[19px] font-bold tracking-[0.14em]'>BLEED</span>
          </div>

          <h1 className='font-display text-3xl text-ink'>Check your inbox</h1>

          <p className='mt-4 text-sm leading-6 text-ink/60'>
            If an account exists for
          </p>

          <p className='mt-2 font-medium text-pine'>{sentTo}</p>

          <p className='mt-4 text-sm text-ink/55'>
            we&apos;ve sent instructions to reset your password.
          </p>

          <Link
            href='/login'
            className='mt-8 flex items-center gap-2 cursor-pointer rounded-sm bg-pine px-6 py-3 font-mono text-[11px] tracking-[0.1em] text-paper transition-colors hover:bg-pine-hover'
          >
            <FiArrowLeft />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
      }}
      className='w-full max-w-[440px] rounded-sm border border-line bg-surface p-8 sm:p-10'
    >
      {/* Header */}

      <div className='mb-10 text-center'>
        <div className='flex items-center justify-center'>
          <span className='font-display text-[19px] font-bold tracking-[0.14em]'>BLEED</span>
        </div>
        <p className='font-display mt-3 text-sm leading-6 text-ink/60'>
          Enter your email and we&apos;ll send you a secure link to reset your
          password.
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
        <form.Field name='email'>
          {(field) => {
            const error = firstErrorMessage(field.state.meta.errors);

            return (
              <div>
                <input
                  type='email'
                  placeholder='Email address'
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className='w-full rounded-sm border border-line bg-sunken px-4 py-3.5 font-mono text-[15px] text-ink transition-colors hover:border-line-strong focus:border-pine focus:bg-surface'
                />

                {error && <p className='mt-2 text-xs text-rust'>{error}</p>}
              </div>
            );
          }}
        </form.Field>

        {formError && (
          <div className='rounded-xl bg-rust/10 p-3 text-sm text-rust'>
            {formError}
          </div>
        )}

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <motion.button
              whileHover={{
                scale: 1.02,
              }}
              whileTap={{
                scale: 0.98,
              }}
              disabled={!canSubmit}
              className='w-full cursor-pointer rounded-sm border-0 bg-pine py-4 font-mono text-[12px] tracking-[0.12em] text-paper transition-colors hover:bg-pine-hover disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </motion.button>
          )}
        </form.Subscribe>

        <div className='pt-4 text-center'>
          <Link
            href='/login'
            className='inline-flex items-center gap-2 text-sm text-ink/55 transition hover:text-pine'
          >
            <FiArrowLeft />
            Back to Sign In
          </Link>
        </div>
      </form>
    </motion.div>
  );
}
