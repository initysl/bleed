'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Subscription } from '@/types/subscription';
import { BleedTotal } from './Bleedtotal';
import { SubscriptionList } from './Subscriptionlist';
import { UpcomingStrip } from './UpcomingStrip';
import { AddSubscriptionForm } from './AddSubscriptionForm';
import { InboxAddress } from './Inboxaddress';
import { NeedsReviewItem, NeedsReviewList } from './Needsreviewlist';

export function Dashboard({
  subscriptions,
  inboxAddress,
  needsReview,
}: {
  subscriptions: Subscription[];
  inboxAddress: string;
  needsReview: NeedsReviewItem[];
}) {
  const shouldReduceMotion = useReducedMotion();
  const [showForm, setShowForm] = useState(false);

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
              className='absolute right-0 top-full z-10 mt-2 w-full max-w-md rounded-lg border border-sage bg-paper p-4 shadow-lg'
            >
              <AddSubscriptionForm onDone={() => setShowForm(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={item} className='w-full'>
        <NeedsReviewList items={needsReview} />
      </motion.div>

      {/*
        Mobile: everything below just stacks in natural document order
        (Total, Upcoming, List, Inbox) — no grid applied below the lg breakpoint.

        Desktop (lg+): a two-column layout via named grid-template-areas.
        List gets the wide "main content" column; Total/Upcoming/Inbox group
        into a narrower sidebar column, sticky so it stays in view while the
        list scrolls. Areas (not row/col-span math) mean this stays correct
        regardless of how tall the list or sidebar end up being.
      */}
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
