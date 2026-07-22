'use client';

import { useState } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import { Modal } from '@/app/components/ui/Modal';
import { ChangeEmailForm } from './ChangeEmailForm';
import { ChangePasswordForm } from './ChangePasswordForm';

export function UpdateAccountButton({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className='font-mini flex items-center gap-2 rounded-md border border-sage px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-sage/30'
      >
        <FiEdit2 size={18} />
        Update
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title='Update account info'
      >
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col gap-2'>
            <p className='text-xs font-medium uppercase tracking-wide text-ink/50'>
              Email
            </p>
            <ChangeEmailForm currentEmail={currentEmail} />
          </div>

          <div className='flex flex-col gap-2 border-t border-sage pt-4'>
            <p className='text-xs font-medium uppercase tracking-wide text-ink/50'>
              Password
            </p>
            <ChangePasswordForm />
          </div>
        </div>
      </Modal>
    </>
  );
}
