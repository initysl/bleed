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
        className='sticky top-0  flex sm:p-0 p-5 w-full h-20 items-center justify-between backdrop-blur-xl rounded-2xl'
      >
        <Image
          src='/bleedlogo.svg'
          alt='Bleed logo'
          width={100}
          height={32}
          priority={true}
        />

        <div className='flex items-center gap-2'>
          {/* Settings Link Pill */}
          <Link
            href='/settings'
            className='group inline-flex items-center gap-1.5 rounded-full border border-sage/60 bg-white px-3 py-1.5 font-mono text-xs font-medium text-ink/70 shadow-xs transition-all hover:border-sage hover:bg-sage/15 hover:text-ink active:scale-95'
            title='Settings'
          >
            <FiSettings
              className='text-ink/60 transition-transform duration-300 group-hover:rotate-45'
              size={14}
            />
            <span className='hidden sm:inline'>Settings</span>
          </Link>

          {/* Sign Out Button Pill */}
          <form action='/auth/signout' method='post' className='inline-flex'>
            <button
              type='submit'
              className='group inline-flex items-center gap-1.5 rounded-2xl border border-sage/60 bg-white px-3 py-1.5 font-mono text-xs font-medium text-ink/60 shadow-xs transition-all hover:border-red-200 hover:bg-red-50/60 hover:text-red-600 active:scale-95'
              title='Sign out'
            >
              <FiLogOut
                className='text-ink/50 transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:text-red-600'
                size={14}
              />
              <span className='hidden sm:inline'>Sign out</span>
            </button>
          </form>

          {/* Primary Action Button (Add Subscription Pill) */}
          <button
            type='button'
            onClick={() => setShowForm(true)}
            className='inline-flex items-center gap-1.5 rounded-lg bg-pine px-3.5 py-1.5 font-mono text-xs font-semibold text-paper shadow-sm transition-all hover:bg-pine/90 hover:shadow active:scale-95'
          >
            <FiPlus size={15} />
            <span className='hidden sm:inline'>Add subscription</span>
            <span className='sm:hidden'>Add</span>
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
          className='space-y-5 md:sticky md:top-24 md:self-start min-w-0'
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
