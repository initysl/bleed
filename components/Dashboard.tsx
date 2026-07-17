'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Subscription } from '@/types/subscription';
import { BleedTotal } from './Bleedtotal';
import { SubscriptionList } from './Subscriptionlist';
import { UpcomingStrip } from './UpcomingStrip';
import { AddSubscriptionForm } from './AddSubscriptionForm';
import { InboxAddress } from './Inboxaddress';

export function Dashboard({
  subscriptions,
  inboxAddress,
}: {
  subscriptions: Subscription[];
  inboxAddress: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [showForm, setShowForm] = useState(false);
  const monthlyTotal = subscriptions.reduce(
    (sum, s) => sum + s.monthly_equivalent,
    0,
  );

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' as const },
    },
  };

  const popover = {
    hidden: {
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.95,
      y: shouldReduceMotion ? 0 : -8,
    },
    show: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.2, ease: 'easeOut' as const },
    },
    exit: {
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.95,
      y: shouldReduceMotion ? 0 : -8,
      transition: { duration: 0.15, ease: 'easeIn' as const },
    },
  };

  return (
    <motion.div
      variants={container}
      initial='hidden'
      animate='show'
      className='mx-auto flex max-w-md flex-col items-center gap-6 px-6 py-16'
    >
      <motion.div variants={item} className='relative w-full'>
        <div className='flex w-full items-center justify-between gap-3'>
          <h1 className='font-(family-name:--font-display) text-2xl font-medium text-ink'>
            Bleed
          </h1>
          <div className='flex items-center gap-3'>
            <form action='/auth/signout' method='post'>
              <button className='text-xs text-ink/40 underline decoration-ink/20 underline-offset-4 hover:text-ink/60'>
                Sign out
              </button>
            </form>
            <button
              onClick={() => setShowForm((v) => !v)}
              className='rounded-md bg-pine px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-pine/90'
            >
              {showForm ? 'Cancel' : '+ Add subscription'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              variants={popover}
              initial='hidden'
              animate='show'
              exit='exit'
              style={{ transformOrigin: 'top right' }}
              className='absolute right-0 top-full z-10 mt-2 w-full rounded-lg border border-sage bg-paper p-4 shadow-lg'
            >
              <AddSubscriptionForm onDone={() => setShowForm(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={item} className='w-full'>
        <BleedTotal monthlyTotal={monthlyTotal} />
      </motion.div>

      <motion.div variants={item} className='w-full'>
        <UpcomingStrip subscriptions={subscriptions} />
      </motion.div>

      <motion.div variants={item} className='w-full'>
        <SubscriptionList subscriptions={subscriptions} />
      </motion.div>

      <motion.div variants={item} className='w-full'>
        <InboxAddress address={inboxAddress} />
      </motion.div>
    </motion.div>
  );
}
