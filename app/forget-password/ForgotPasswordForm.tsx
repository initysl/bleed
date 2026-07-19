'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ForgotPasswordForm() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // The redirect target here matters: it needs to match the route your
    // Supabase project's "Reset Password" email template points to. See the
    // note in app/reset-password/page.tsx for the one-time dashboard setup step.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className='flex flex-col items-center gap-3 text-center'>
        <h1 className='font-(family-name:--font-display) text-2xl font-medium text-ink'>
          Check your email
        </h1>
        <p className='max-w-sm text-sm text-ink/60'>
          If an account exists for {email}, a password reset link is on its way.
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center gap-8'>
      <h1 className='font-(family-name:--font-display) text-2xl font-medium text-ink'>
        Reset your password
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

        {error && <p className='text-sm text-rust'>{error}</p>}

        <button
          type='submit'
          disabled={loading}
          className='rounded-md bg-pine px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine/90 disabled:opacity-60'
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </div>
  );
}
