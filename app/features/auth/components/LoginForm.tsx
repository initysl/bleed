'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setCheckEmail(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/');
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className='flex flex-col items-center gap-3 text-center'>
        <h1 className='font-(family-name:--font-display) text-2xl font-medium text-ink'>
          Check your email
        </h1>
        <p className='max-w-sm text-sm text-ink/60'>
          We sent a confirmation link to {email}. Click it to finish setting up
          your account.
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center gap-8'>
      <h1 className='font-(family-name:--font-display) text-2xl font-medium text-ink'>
        Bleed
      </h1>

      <form
        onSubmit={handleSubmit}
        className='flex w-full max-w-sm flex-col gap-4'
      >
        <label className='flex flex-col gap-1 text-sm text-ink'>
          Email
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className='rounded-md border border-sage bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine'
          />
        </label>

        <label className='flex flex-col gap-1 text-sm text-ink'>
          Password
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className='rounded-md border border-sage bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine'
          />
        </label>

        {error && <p className='text-sm text-rust'>{error}</p>}

        <button
          type='submit'
          disabled={loading}
          className='rounded-md bg-pine px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine/90 disabled:opacity-60'
        >
          {loading ? '…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>

        <button
          type='button'
          onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
          className='text-sm text-ink/50 underline decoration-ink/20 underline-offset-4 hover:text-ink/70'
        >
          {mode === 'signup'
            ? 'Already have an account? Sign in'
            : 'New here? Create an account'}
        </button>
      </form>
    </div>
  );
}
