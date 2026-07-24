'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { FiLogOut, FiPlus, FiSettings } from 'react-icons/fi';
import type { NeedsReviewItem } from '@/app/features/needs-review/types';
import type { Subscription } from '@/app/features/subscriptions/types';
import { useNeedsReview } from '@/app/features/needs-review/hooks/useNeedsReview';
import { useSubscriptions } from '@/app/features/subscriptions/hooks/useSubscriptions';
import { Modal } from '@/app/components/ui/Modal';
import { InboxAddress } from '@/app/features/inbox/components/InboxAddress';
import { NeedsReviewList } from '@/app/features/needs-review/components/NeedsReviewList';
import { BleedTotal } from './BleedTotal';
import { SubscriptionForm } from './SubscriptionForm';
import { SubscriptionList } from './SubscriptionList';
import { UpcomingStrip } from './UpcomingStrip';

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
    show: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const item = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 10,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <motion.main
      variants={container}
      initial='hidden'
      animate='show'
      className='mx-auto flex w-full max-w-5xl flex-col gap-6 p-2 '
    >
      {/* Sticky Header */}
      <motion.header
        variants={item}
        className='sticky top-0 z-50 flex sm:p-0 p-5 w-full h-20 items-center justify-between backdrop-blur-xl rounded-2xl'
      >
        <div className='flex items-center gap-1'>
          <Image
            src='/logo.svg'
            alt='Bleed logo'
            width={32}
            height={32}
            priority={true}
          />
          <span className='font-display text-base text-ink'>leed</span>
        </div>

        <div className='flex items-center gap-4'>
          <Link
            href='/settings'
            className='group flex items-center gap-1 text-xs text-ink/50 transition hover:text-ink'
          >
            <FiSettings size={18} />

            <span className='relative hidden font-display sm:inline'>
              Settings
              <span className='absolute bottom-0 left-0 h-px w-0 bg-current transition-all duration-300 group-hover:w-full' />
            </span>
          </Link>

          <form action='/auth/signout' method='post'>
            <button className='group flex items-center gap-1 text-xs text-ink/50 transition hover:text-ink'>
              <FiLogOut size={18} />

              <span className='relative hidden font-display sm:inline'>
                Sign out
                <span className='absolute bottom-0 left-0 h-px w-0 bg-current transition-all duration-300 group-hover:w-full' />
              </span>
            </button>
          </form>

          <button
            onClick={() => setShowForm(true)}
            className='flex items-center gap-2 rounded-xl bg-pine px-4 py-2 text-xs font-medium text-paper transition hover:bg-pine/90'
          >
            <FiPlus size={18} />

            <span className='hidden font-display sm:inline'>
              Add subscription
            </span>
          </button>
        </div>
      </motion.header>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title='Add a subscription'
      >
        <SubscriptionForm onDone={() => setShowForm(false)} />
      </Modal>

      <motion.div variants={item}>
        <NeedsReviewList items={needsReview} />
      </motion.div>

      {/* Dashboard Layout */}
      <div className='grid gap-10 md:grid-cols-[420px_minmax(0,1fr)]'>
        {/* Left Sidebar */}
        <motion.aside
          variants={item}
          className='space-y-5 md:sticky md:top-24 md:self-start'
        >
          <BleedTotal subscriptions={subscriptions} />

          <UpcomingStrip subscriptions={subscriptions} />

          <InboxAddress address={inboxAddress} />
        </motion.aside>

        {/* Right Content */}
        <motion.section variants={item} className='min-w-0'>
          <SubscriptionList subscriptions={subscriptions} />
        </motion.section>
      </div>
    </motion.main>
  );
}
