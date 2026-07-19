'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    // By the time this page loads, /auth/confirm has already verified the
    // recovery link and established a temporary session — updateUser() here
    // sets the new password on that session.
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className='flex flex-col items-center gap-8'>
      <h1 className='font-(family-name:--font-display) text-2xl font-medium text-ink'>
        Set a new password
      </h1>

      <form
        onSubmit={handleSubmit}
        className='flex w-full max-w-sm flex-col gap-4'
      >
        <label className='flex flex-col gap-1 text-sm text-ink'>
          New password
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className='rounded-md border border-sage bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine'
          />
        </label>

        <label className='flex flex-col gap-1 text-sm text-ink'>
          Confirm new password
          <input
            type='password'
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          {loading ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </div>
  );
}
