'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ChangePasswordForm() {
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setPassword('');
    setConfirm('');
    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
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
      {success && <p className='text-sm text-pine'>Password updated.</p>}

      <button
        type='submit'
        disabled={loading}
        className='self-start rounded-md bg-pine px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine/90 disabled:opacity-60'
      >
        {loading ? 'Saving…' : 'Update password'}
      </button>
    </form>
  );
}
