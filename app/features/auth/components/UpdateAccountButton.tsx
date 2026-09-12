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
      {/* Icon-only, so it needs a name of its own — without one a screen
          reader announces nothing but "button". The title gives sighted
          mouse users the same label on hover. */}
      <button
        type='button'
        onClick={() => setOpen(true)}
        aria-label='Update account email and password'
        title='Update account'
        className='flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink transition-colors hover:bg-sage/30'
      >
        <FiEdit2 size={18} aria-hidden='true' />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title='Update account info'
      >
        <div className='font-display flex flex-col gap-6'>
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
