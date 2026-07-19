'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const supabase = createClient();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Supabase sends a confirmation link to the NEW address (and, depending on
    // your project's auth settings, also a notice to the old one) — the email
    // isn't actually changed until that link is clicked.
    const { error } = await supabase.auth.updateUser({ email: newEmail });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <p className='text-sm text-ink/60'>
        Check {newEmail} for a confirmation link. Your email won't change until
        you click it.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
      <label className='flex flex-col gap-1 text-sm text-ink'>
        New email
        <input
          type='email'
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder={currentEmail}
          required
          className='rounded-md border border-sage bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine'
        />
      </label>

      {error && <p className='text-sm text-rust'>{error}</p>}

      <button
        type='submit'
        disabled={loading}
        className='self-start rounded-md bg-pine px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine/90 disabled:opacity-60'
      >
        {loading ? 'Sending…' : 'Update email'}
      </button>
    </form>
  );
}
