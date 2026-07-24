'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from '@tanstack/react-form';
import { FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import { createClient } from '@/lib/supabase/client';
import { loginSchema } from '@/app/features/auth/schema';

function firstErrorMessage(errors: unknown[]): string | null {
  if (!errors.length) return null;

  const err = errors[0] as { message?: string } | string;

  return typeof err === 'string' ? err : (err.message ?? null);
}

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const [showPassword, setShowPassword] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  const [checkEmail, setCheckEmail] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },

    validators: {
      onSubmit: loginSchema,
    },

    onSubmit: async ({ value }) => {
      setFormError(null);

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp(value);

        if (error) {
          setFormError(error.message);
          return;
        }

        setCheckEmail(value.email);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword(value);

      if (error) {
        setFormError(error.message);
        return;
      }

      router.push('/');
      router.refresh();
    },
  });

  if (checkEmail) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className='w-full max-w-md rounded-4xl border border-white/50 bg-white/80 p-10'
      >
        <div className='flex flex-col items-center text-center'>
          <div className='mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-pine/10'>
            <FiCheckCircle className='text-pine' size={34} />
          </div>

          <h1 className='font-display text-3xl text-ink'>Check your email</h1>

          <p className='mt-4 text-sm leading-6 text-ink/60'>
            We sent a confirmation link to
          </p>

          <p className='mt-2 font-medium text-pine'>{checkEmail}</p>

          <button
            onClick={() => {
              setMode('signin');
              setCheckEmail(null);
            }}
            className='mt-8 rounded-full bg-pine px-6 py-3 text-paper transition hover:bg-pine/90'
          >
            Back to Sign In
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className='w-full max-w-md rounded-4xl border border-white/50 bg-white/75 p-10'
    >
      <div className='mb-10 text-center'>
        <Image
          src='/logo.svg'
          alt='Bleed logo'
          width={32}
          height={32}
          priority={true}
          style={{ height: 'auto' }}
        />

        <p className='mt-3 text-sm leading-6 text-ink/60'>
          Stop paying for subscriptions you've forgotten.
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
        {/* EMAIL */}

        <form.Field name='email'>
          {(field) => {
            const error = firstErrorMessage(field.state.meta.errors);

            return (
              <div>
                <input
                  type='email'
                  placeholder='Email'
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

        {/* PASSWORD */}
        <form.Field name='password'>
          {(field) => {
            const error = firstErrorMessage(field.state.meta.errors);

            return (
              <div>
                <div className='relative'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Password'
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className='h-14 w-full rounded-full border border-sage/50 bg-paper px-5 pr-14 text-sm outline-none transition focus:border-pine focus:ring-4 focus:ring-pine/10'
                  />

                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-pine'
                  >
                    {showPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>

                {error && <p className='mt-2 text-xs text-rust'>{error}</p>}
              </div>
            );
          }}
        </form.Field>

        {mode === 'signin' && (
          <div className='flex justify-end'>
            <Link
              href='/forgot-password'
              className='text-sm text-ink/55 transition hover:text-pine'
            >
              Forgot Password?
            </Link>
          </div>
        )}

        {formError && <div className='text-sm text-rust'>{formError}</div>}

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!canSubmit}
              className='h-14 w-full rounded-full bg-pine font-medium text-paper shadow-lg transition hover:bg-pine/90 disabled:opacity-50'
            >
              {isSubmitting
                ? 'Signing in...'
                : mode === 'signup'
                  ? 'Create Account'
                  : 'Sign In'}
            </motion.button>
          )}
        </form.Subscribe>

        <div className='flex items-center gap-4 pt-2'>
          <div className='h-px flex-1 bg-sage' />
          <span className='text-xs uppercase tracking-wider text-ink/45'>
            OR
          </span>
          <div className='h-px flex-1 bg-sage' />
        </div>

        <p className='text-center text-sm text-ink/55'>
          {mode === 'signup'
            ? 'Already have an account? '
            : "Don't have an account? "}

          <button
            type='button'
            onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
            className='font-medium text-pine hover:underline'
          >
            {mode === 'signup' ? 'Sign In' : 'Create one'}
          </button>
        </p>
      </form>
    </motion.div>
  );
}
