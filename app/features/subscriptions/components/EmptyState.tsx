'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiSettings, FiLogOut, FiPlus } from 'react-icons/fi';
import { riseIn, staggerContainer, press } from '@/lib/motion';
import { GhostTotal } from './GhostTotal';
import { EnableNotifications } from '@/app/features/notifications/components/EnableNotifications';
import { SubscriptionForm } from './SubscriptionForm';
import { InboxAddress } from '../../inbox/components/InboxAddress';
import { Modal } from '@/app/components/ui/Modal';

export function EmptyState({ inboxAddress }: { inboxAddress: string }) {
  const [showForm, setShowForm] = useState(false);

  // Reduced motion is applied globally by MotionConfig, so no local guard.
  const container = staggerContainer;
  const item = riseIn;

  return (
    <motion.div
      variants={container}
      initial='hidden'
      animate='show'
      className='mx-auto flex min-h-screen w-full max-w-6xl flex-col'
    >
      {/* Header — Preserved Exactly As Is */}
      <motion.header
        variants={item}
        className='sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-6 border-b border-line bg-paper/90 px-4 backdrop-blur-xl sm:px-8'
      >
        <h1 className='m-0 flex items-baseline gap-3.5 font-display text-[19px] font-bold tracking-[0.14em]'>
          BLEED
          <span className='hidden font-mono text-label font-medium text-ink/45 sm:inline'>
            SUBSCRIPTION METER
          </span>
        </h1>

        <div className='flex items-center gap-2'>
          <Link
            href='/settings'
            className='group inline-flex items-center gap-1.5 rounded-sm px-3 py-2 font-mono text-[11px] tracking-[0.1em] text-ink/65 transition-colors hover:bg-line-soft hover:text-ink'
          >
            <FiSettings aria-hidden='true' size={13} />
            <span className='hidden sm:inline'>SETTINGS</span>
          </Link>

          <form action='/auth/signout' method='post' className='inline-flex'>
            <button
              type='submit'
              className='inline-flex items-center gap-1.5 rounded-sm px-3 py-2 font-mono text-[11px] tracking-[0.1em] text-ink/65 transition-colors hover:bg-rust-tint hover:text-rust'
            >
              <FiLogOut aria-hidden='true' size={13} />
              <span className='hidden sm:inline'>SIGN OUT</span>
            </button>
          </form>

          <motion.button
            type='button'
            onClick={() => setShowForm(true)}
            {...press}
            className='inline-flex cursor-pointer items-center gap-1.5 rounded-sm border-0 bg-pine px-4 py-2.5 font-mono text-[11px] tracking-[0.1em] text-paper transition-colors hover:bg-pine-hover'
          >
            <FiPlus aria-hidden='true' size={13} />
            <span className='hidden sm:inline'>LOG SUBSCRIPTION</span>
          </motion.button>
        </div>
      </motion.header>

      {/* Main Responsive Grid Layout */}
      <div className='my-auto grid flex-1 grid-cols-1 items-start gap-10 px-4 py-10 sm:px-8 lg:grid-cols-12'>
        {/* Left Primary Hero Section (8 Columns on Desktop) */}
        <div className='lg:col-span-7 xl:col-span-8 flex flex-col justify-center space-y-6'>
          <motion.div variants={item} className='space-y-2'>
            <h1 className='m-0 font-display text-[34px] font-bold tracking-[-0.02em] text-ink sm:text-[40px]'>
              Forward one receipt. That&rsquo;s the setup.
            </h1>
            <p className='mt-4 max-w-[52ch] text-[16px] leading-relaxed text-ink/68'>
              Bleed reads the amount, the billing cycle and the renewal date
              out of the email, logs it, and warns you three days before the
              money leaves.
            </p>
          </motion.div>

          <motion.div variants={item} className='w-full'>
            <InboxAddress address={inboxAddress} index='01' />
          </motion.div>

          <motion.div variants={item} className='w-full'>
            {/* The Modal is rendered unconditionally and gated by `open`, not
                mounted only while open. Unmounting it removed the element
                AnimatePresence needs to animate out, so this modal vanished
                instantly while the identical one in Dashboard faded — same
                component, two different behaviours. The button stays visible
                underneath, which is also what the Modal's focus-restore
                expects to return focus to. */}
            <button
              type='button'
              onClick={() => setShowForm(true)}
              className='cursor-pointer border-0 bg-transparent p-0 font-mono text-[11px] tracking-[0.1em] text-pine underline decoration-pine/40 underline-offset-4 transition-colors hover:text-pine-hover'
            >
              Or add one manually
            </button>
            <Modal
              open={showForm}
              onClose={() => setShowForm(false)}
              // Was omitted, so aria-label resolved to undefined and this was
              // an aria-modal dialog with no accessible name at all.
              title='Add a subscription'
            >
              <SubscriptionForm onDone={() => setShowForm(false)} />
            </Modal>
          </motion.div>
        </div>

        {/* Right Sidebar Widgets Section (4 Columns on Desktop) */}
        <div className='lg:col-span-5 xl:col-span-4 flex flex-col gap-6'>
          <motion.div variants={item} className='w-full'>
            <GhostTotal />
          </motion.div>

          <motion.div variants={item} className='w-full'>
            <EnableNotifications />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
