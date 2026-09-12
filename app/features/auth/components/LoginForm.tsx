'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from '@tanstack/react-form';
import { FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import { createClient } from '@/lib/supabase/client';
import { loginSchema } from '@/app/features/auth/schema';
import { SegmentedControl } from '@/app/components/ui/SegmentedControl';
import { modalPanel, alertIn, press } from '@/lib/motion';

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

      router.push('/dashboard');
      router.refresh();
    },
  });

  if (checkEmail) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className='w-full max-w-[440px] rounded-sm border border-line bg-surface p-8 sm:p-10'
      >
        <div className='flex flex-col items-center text-center'>
          <div className='mb-6 flex h-16 w-16 items-center justify-center rounded-sm bg-pine/10'>
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
            className='mt-8 cursor-pointer rounded-sm bg-pine px-6 py-3 font-mono text-[11px] tracking-[0.1em] text-paper transition-colors hover:bg-pine-hover'
          >
            Back to Sign In
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={modalPanel}
      initial='hidden'
      animate='show'
      className='w-full max-w-[440px] rounded-sm border border-line bg-surface p-8 sm:p-10'
    >
      {/* One switch instead of a sentence at the bottom of the form: the two
          modes are peers, and the indicator travelling between them says so. */}
      <SegmentedControl
        label='Sign in or create an account'
        value={mode}
        onChange={setMode}
        segments={[
          { value: 'signin' as const, label: 'SIGN IN' },
          { value: 'signup' as const, label: 'CREATE ACCOUNT' },
        ]}
      />

      <h1 className='mt-8 mb-2 font-display text-[28px] font-bold tracking-[-0.02em] text-ink'>
        {mode === 'signup' ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className='mb-7 text-[15px] leading-relaxed text-ink/65'>
        {mode === 'signup'
          ? 'One address to forward receipts to, and a running total you can act on.'
          : 'Manage your subscriptions and see what renews next.'}
      </p>

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
                <label
                  htmlFor={field.name}
                  className='mb-1.5 block font-mono text-label tracking-[0.14em] text-ink/55'
                >
                  EMAIL
                </label>
                <input
                  id={field.name}
                  type='email'
                  autoComplete='email'
                  name={field.name}
                  placeholder='you@example.com'
                  aria-invalid={error ? true : undefined}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className='w-full rounded-sm border border-line bg-sunken px-4 py-3.5 font-mono text-[15px] text-ink transition-colors hover:border-line-strong focus:border-pine focus:bg-surface'
                />

                {error && <p className='mt-2 font-mono text-[11px] text-rust'>{error}</p>}
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
                <label
                  htmlFor={field.name}
                  className='mb-1.5 block font-mono text-label tracking-[0.14em] text-ink/55'
                >
                  PASSWORD
                </label>
                <div className='relative'>
                  <input
                    id={field.name}
                    aria-invalid={error ? true : undefined}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={
                      mode === 'signup' ? 'new-password' : 'current-password'
                    }
                    placeholder='At least 8 characters'
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className='w-full rounded-sm border border-line bg-sunken px-4 py-3.5 pr-20 font-mono text-[15px] text-ink transition-colors hover:border-line-strong focus:border-pine focus:bg-surface'
                  />

                  {/* Named and stateful: this was an unlabelled button, so a
                      screen reader announced it as "button" with no hint of
                      what it did or whether the password was showing. */}
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className='absolute top-1/2 right-2 flex -translate-y-1/2 cursor-pointer items-center gap-1.5 rounded-sm px-2.5 py-2 font-mono text-[10px] tracking-[0.1em] text-pine transition-colors hover:bg-line-soft'
                  >
                    {showPassword ? (
                      <FiEyeOff size={14} aria-hidden='true' />
                    ) : (
                      <FiEye size={14} aria-hidden='true' />
                    )}
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>

                {error && <p className='mt-2 font-mono text-[11px] text-rust'>{error}</p>}
              </div>
            );
          }}
        </form.Field>

        {mode === 'signin' && (
          <div className='flex justify-end'>
            <Link
              href='/forgot-password'
              className='font-mono text-[11px] tracking-[0.06em] text-ink/60 transition-colors hover:text-pine'
            >
              Forgot your password?
            </Link>
          </div>
        )}

        {formError && (
          <motion.div
            variants={alertIn}
            initial='hidden'
            animate='show'
            role='alert'
            className='rounded-sm border border-rust-line bg-rust-tint px-3 py-2.5 text-[13px] leading-snug text-rust'
          >
            {formError}
          </motion.div>
        )}

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <motion.button
              type='submit'
              {...press}
              disabled={!canSubmit || Boolean(isSubmitting)}
              aria-busy={Boolean(isSubmitting)}
              className='w-full cursor-pointer rounded-sm border-0 bg-pine py-4 font-mono text-[12px] tracking-[0.12em] text-paper transition-colors hover:bg-pine-hover disabled:cursor-not-allowed disabled:opacity-50'
            >
              {/* Signing up used to say "Signing in..." while it created the
                  account. */}
              {isSubmitting
                ? mode === 'signup'
                  ? 'CREATING ACCOUNT...'
                  : 'SIGNING IN...'
                : mode === 'signup'
                  ? 'CREATE ACCOUNT'
                  : 'SIGN IN'}
            </motion.button>
          )}
        </form.Subscribe>

        {/* The "OR" divider that used to sit here was removed: it visually
            promises an alternative sign-in method, and the only thing following
            it is the mode-toggle sentence below. There is no social auth. */}

        <p className='text-center font-mono text-[11px] leading-relaxed text-ink/45'>
          By continuing you agree to the Terms and Privacy Policy.
        </p>
      </form>
    </motion.div>
  );
}
