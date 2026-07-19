'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { FiPlus, FiX, FiSettings, FiLogOut } from 'react-icons/fi';
import type { Subscription } from '@/app/features/subscriptions/types';
import type { NeedsReviewItem } from '@/app/features/needs-review/types';
import { useSubscriptions } from '@/app/features/subscriptions/hooks/useSubscriptions';
import { useNeedsReview } from '@/app/features/needs-review/hooks/useNeedsReview';
import { BleedTotal } from './BleedTotal';
import { SubscriptionList } from './SubscriptionList';
import { UpcomingStrip } from './UpcomingStrip';
import { SubscriptionForm } from './SubscriptionForm';
import { InboxAddress } from '../../inbox/components/InboxAddress';
import { NeedsReviewList } from '@/app/features/needs-review/components/NeedsReviewList';

export function Dashboard({
  initialSubscriptions,
  initialNeedsReview,
  inboxAddress,
}: {
  initialSubscriptions: Subscription[];
  initialNeedsReview: NeedsReviewItem[];
  inboxAddress: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [showForm, setShowForm] = useState(false);

  // Hydrated with server-fetched data for instant first paint; TanStack Query
  // takes over from here, refetching automatically whenever a mutation invalidates it.
  const { data: subscriptions } = useSubscriptions(initialSubscriptions);
  const { data: needsReview } = useNeedsReview(initialNeedsReview);

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
      className='mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16 lg:max-w-5xl'
    >
      <motion.div variants={item} className='relative w-full'>
        <div className='flex w-full items-center justify-between gap-3'>
          <h1 className='font-(family-name:--font-display) text-2xl font-medium text-ink'>
            Bleed
          </h1>
          <div className='flex items-center gap-3'>
            <Link
              href='/settings'
              className='flex items-center gap-1 text-xs text-ink/40 hover:text-ink/60'
            >
              <FiSettings className='h-3.5 w-3.5' />
              Settings
            </Link>
            <form action='/auth/signout' method='post'>
              <button className='flex items-center gap-1 text-xs text-ink/40 hover:text-ink/60'>
                <FiLogOut className='h-3.5 w-3.5' />
                Sign out
              </button>
            </form>
            <button
              onClick={() => setShowForm((v) => !v)}
              className='flex items-center gap-1.5 rounded-md bg-pine px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-pine/90'
            >
              {showForm ? (
                <FiX className='h-3.5 w-3.5' />
              ) : (
                <FiPlus className='h-3.5 w-3.5' />
              )}
              {showForm ? 'Cancel' : 'Add subscription'}
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
              className='absolute right-0 top-full z-10 mt-2 w-full max-w-md rounded-lg border border-sage bg-paper p-4 shadow-lg'
            >
              <SubscriptionForm onDone={() => setShowForm(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={item} className='w-full'>
        <NeedsReviewList items={needsReview} />
      </motion.div>

      <div
        className="flex flex-col gap-6
          lg:grid lg:grid-cols-[1fr_1.6fr] lg:items-start lg:gap-8
          lg:[grid-template-areas:'total_list'_'upcoming_list'_'inbox_list']"
      >
        <motion.div
          variants={item}
          className='w-full lg:sticky lg:top-16 lg:[grid-area:total]'
        >
          <BleedTotal subscriptions={subscriptions} />
        </motion.div>

        <motion.div
          variants={item}
          className='w-full lg:sticky lg:top-52 lg:[grid-area:upcoming]'
        >
          <UpcomingStrip subscriptions={subscriptions} />
        </motion.div>

        <motion.div variants={item} className='w-full lg:[grid-area:list]'>
          <SubscriptionList subscriptions={subscriptions} />
        </motion.div>

        <motion.div
          variants={item}
          className='w-full lg:sticky lg:bottom-4 lg:[grid-area:inbox]'
        >
          <InboxAddress address={inboxAddress} />
        </motion.div>
      </div>
    </motion.div>
  );
}
