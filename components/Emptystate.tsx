'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { EnableNotifications } from './EnableNotifications';
import { AddSubscriptionForm } from './AddSubscriptionForm';
import { InboxAddress } from './Inboxaddress';
import { GhostTotal } from './Ghosttotal';

export function EmptyState({ inboxAddress }: { inboxAddress: string }) {
  const shouldReduceMotion = useReducedMotion();
  const [showForm, setShowForm] = useState(false);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.12 } },
  };

  const item = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' as const },
    },
  };

  return (
    <motion.div
      variants={container}
      initial='hidden'
      animate='show'
      className='flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16'
    >
      <motion.div
        variants={item}
        className='flex w-full max-w-md items-center justify-between'
      >
        <h1 className='font-display text-2xl font-medium text-ink'>Bleed</h1>
        <div className='flex items-center gap-3'>
          <Link
            href='/settings'
            className='text-xs text-ink/40 underline decoration-ink/20 underline-offset-4 hover:text-ink/60'
          >
            Settings
          </Link>
          <form action='/auth/signout' method='post'>
            <button className='text-xs text-ink/40 underline decoration-ink/20 underline-offset-4 hover:text-ink/60'>
              Sign out
            </button>
          </form>
        </div>
      </motion.div>

      <motion.div variants={item} className='text-center'>
        <p className='text-lg text-ink'>Nothing logged yet.</p>
        <p className='mt-1 text-sm text-ink/60'>
          Forward your first receipt below and watch this fill in.
        </p>
      </motion.div>

      <motion.div variants={item}>
        <InboxAddress address={inboxAddress} />
      </motion.div>

      <motion.div variants={item} className='w-full max-w-md'>
        {showForm ? (
          <AddSubscriptionForm onDone={() => setShowForm(false)} />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className='text-sm text-ink/50 underline decoration-ink/20 underline-offset-4 hover:text-ink/70'
          >
            Or add one manually
          </button>
        )}
      </motion.div>

      <motion.div variants={item}>
        <GhostTotal />
      </motion.div>

      <motion.div variants={item}>
        <EnableNotifications />
      </motion.div>
    </motion.div>
  );
}
