'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { GhostTotal } from './Ghosttotal';
import { InboxAddress } from './Inboxaddress';
import { EnableNotifications } from './EnableNotifications';

export function EmptyState() {
  const shouldReduceMotion = useReducedMotion();

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
      <motion.h1
        variants={item}
        className='font-[family-name:var(--font-display)] text-2xl font-medium text-ink'
      >
        Bleed
      </motion.h1>

      <motion.div variants={item} className='text-center'>
        <p className='text-lg text-ink'>Nothing logged yet.</p>
        <p className='mt-1 text-sm text-ink/60'>
          Forward your first receipt below and watch this fill in.
        </p>
      </motion.div>

      <motion.div variants={item}>
        <InboxAddress />
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
