'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiTrash2 } from 'react-icons/fi';
import { Modal } from '@/app/components/ui/Modal';

export function DeleteAccountButton({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typedEmail, setTypedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setOpen(false);
    setTypedEmail('');
    setError(null);
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);

    const res = await fetch('/api/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmEmail: typedEmail }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Something went wrong. Try again.');
      return;
    }

    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className='flex items-center gap-2 rounded-md border border-rust px-4 py-2 text-sm font-medium text-rust transition-colors hover:bg-rust/10'
      >
        <FiTrash2 className='h-4 w-4' />
        Delete account
      </button>

      <Modal open={open} onClose={handleClose} title='Delete account'>
        <div className='flex flex-col gap-3'>
          <p className='text-sm text-ink'>
            This permanently deletes your account, every subscription you've
            tracked, and all reminder history. This can't be undone.
          </p>
          <label className='flex flex-col gap-1 text-sm text-ink'>
            Type <span className='font-mono'>{email}</span> to confirm
            <input
              type='text'
              value={typedEmail}
              onChange={(e) => setTypedEmail(e.target.value)}
              className='rounded-md border border-sage bg-white px-3 py-2 text-sm text-ink outline-none focus:border-rust'
            />
          </label>

          {error && <p className='text-sm text-rust'>{error}</p>}

          <div className='flex gap-2'>
            <button
              onClick={handleDelete}
              disabled={typedEmail !== email || loading}
              className='rounded-md bg-rust px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-rust/90 disabled:opacity-40'
            >
              {loading ? 'Deleting…' : 'Permanently delete'}
            </button>
            <button
              onClick={handleClose}
              className='rounded-md border border-sage px-4 py-2 text-sm text-ink/60 hover:text-ink'
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
