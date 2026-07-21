'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { FiPlus, FiSettings, FiLogOut } from 'react-icons/fi';
import type { Subscription } from '@/app/features/subscriptions/types';
import type { NeedsReviewItem } from '@/app/features/needs-review/types';
import { useSubscriptions } from '@/app/features/subscriptions/hooks/useSubscriptions';
import { useNeedsReview } from '@/app/features/needs-review/hooks/useNeedsReview';
import { BleedTotal } from './BleedTotal';
import { SubscriptionList } from './SubscriptionList';
import { UpcomingStrip } from './UpcomingStrip';
import { SubscriptionForm } from './SubscriptionForm';
import { InboxAddress } from '@/app/features/inbox/components/InboxAddress';
import { NeedsReviewList } from '@/app/features/needs-review/components/NeedsReviewList';
import { Modal } from '@/app/components/ui/Modal';

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

  return (
    <motion.div
      variants={container}
      initial='hidden'
      animate='show'
      className='mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16 lg:max-w-5xl'
    >
      <motion.div
        variants={item}
        className='flex w-full items-center justify-between gap-3'
      >
        <h1 className='font-display text-2xl font-medium text-ink'>Bleed</h1>
        <div className='flex items-center gap-3'>
          <Link
            href='/settings'
            className='flex items-center gap-1 text-xs text-ink/40 hover:text-ink/60'
          >
            <FiSettings size={18} />
            Settings
          </Link>
          <form action='/auth/signout' method='post'>
            <button className='flex items-center gap-1 text-xs text-ink/40 hover:text-ink/60'>
              <FiLogOut size={18} />
              Sign out
            </button>
          </form>
          <button
            onClick={() => setShowForm(true)}
            className='flex items-center gap-1.5 rounded-md bg-pine px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-pine/90'
          >
            <FiPlus size={18} />
            Add subscription
          </button>
        </div>
      </motion.div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title='Add a subscription'
      >
        <SubscriptionForm onDone={() => setShowForm(false)} />
      </Modal>

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
