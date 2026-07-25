'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from '@tanstack/react-form';
import { FiArrowLeft, FiMail } from 'react-icons/fi';
import { createClient } from '@/lib/supabase/client';
import { emailSchema } from '@/app/features/auth/schema';
import Image from 'next/image';
import Logo from '@/public/bleedlogo.svg';

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
        className='w-full max-w-md rounded-4xl border border-white/50 bg-white/80 p-10'
      >
        <div className='flex flex-col items-center text-center'>
          <div className='mx-auto mb-5 flex items-center justify-center'>
            <Image src={Logo} alt='Bleed logo' width={150} priority={true} />
          </div>

          <h1 className='font-display text-3xl text-ink'>Check your inbox</h1>

          <p className='mt-4 text-sm leading-6 text-ink/60'>
            If an account exists for
          </p>

          <p className='mt-2 font-medium text-pine'>{sentTo}</p>

          <p className='mt-4 text-sm text-ink/55'>
            we've sent instructions to reset your password.
          </p>

          <Link
            href='/login'
            className='mt-8 flex items-center gap-2 rounded-full bg-pine px-6 py-3 text-paper transition hover:bg-pine/90'
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
      className='w-full max-w-md rounded-4xl border border-white/50 bg-white/75 p-10'
    >
      {/* Header */}

      <div className='mb-10 text-center'>
        <div className='flex items-center justify-center'>
          <Image src={Logo} alt='Bleed logo' width={150} priority={true} />
        </div>

        <h1 className='font-display text-xl text-ink'>Forgot Password?</h1>

        <p className='mt-3 text-sm leading-6 text-ink/60'>
          Enter your email and we'll send you a secure link to reset your
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
                  className='h-14 w-full rounded-full border border-sage/50 bg-paper px-5 text-sm outline-none transition focus:border-pine focus:ring-4 focus:ring-pine/10'
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
              className='h-14 w-full rounded-full bg-pine font-medium text-paper disabled:opacity-50'
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
