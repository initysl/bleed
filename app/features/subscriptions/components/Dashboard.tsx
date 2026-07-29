'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiPlus, FiSettings, FiMenu, FiX } from 'react-icons/fi';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      className='mx-auto flex w-full max-w-5xl flex-col gap-3 sm:gap-6 p-2'
    >
      {/* Sticky Header */}
      <motion.header
        variants={item}
        className='sticky top-0 z-30 flex w-full items-center justify-between px-3 py-2.5 backdrop-blur-xl rounded-xl'
      >
        <Image
          src='/bleedlogo.svg'
          alt='Bleed logo'
          width={100}
          height={32}
          priority={true}
        />

        {/* Desktop Navigation (sm and up) */}
        <div className='hidden sm:flex items-center rounded-full border border-sage/50 bg-white/70 p-1.5 shadow-xs backdrop-blur-md'>
          <Link
            href='/settings'
            className='group inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-medium text-ink/70 transition-all hover:bg-white hover:text-ink hover:shadow-2xs active:scale-95'
            title='Settings'
          >
            <FiSettings
              className='text-ink/60 transition-transform duration-300 group-hover:rotate-45'
              size={14}
            />
            <span>Settings</span>
          </Link>

          <form action='/auth/signout' method='post' className='inline-flex'>
            <button
              type='submit'
              className='group inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-medium text-ink/60 transition-all hover:bg-red-50 hover:text-red-600 active:scale-95'
              title='Sign out'
            >
              <FiLogOut
                className='text-ink/50 transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:text-red-600'
                size={14}
              />
              <span>Sign out</span>
            </button>
          </form>

          {/* Embedded CTA inside the capsule */}
          <button
            type='button'
            onClick={() => setShowForm(true)}
            className='ml-1 inline-flex items-center gap-1.5 rounded-full bg-pine px-3.5 py-1 font-mono text-xs font-semibold text-paper transition-all hover:bg-pine/90 active:scale-95'
          >
            <FiPlus size={14} />
            <span>Add</span>
          </button>
        </div>

        {/* Mobile Hamburger Trigger (below sm) */}
        <div className='flex sm:hidden items-center gap-2'>
          <button
            type='button'
            onClick={() => setMobileMenuOpen(true)}
            className='inline-flex items-center justify-center rounded-full  bg-white p-2.5 text-ink/80 shadow-xs transition-all active:scale-95'
            aria-label='Open navigation menu'
          >
            <FiMenu size={20} />
          </button>
        </div>
      </motion.header>

      {/* Slide-In Side Drawer Menu (Mobile) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Darkened Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className='fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:hidden'
            />

            {/* Sliding Panel from Right */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className='fixed top-0 right-0 bottom-0 z-50 flex w-4/5 max-w-xs flex-col justify-between border-l border-sage/60 bg-white p-6 shadow-2xl sm:hidden'
            >
              {/* Drawer Header with Close Icon */}
              <div className='space-y-6'>
                <div className='flex items-center justify-between border-b border-sage/30 pb-4'>
                  <Image
                    src='/bleedlogo.svg'
                    alt='Bleed logo'
                    width={80}
                    height={26}
                  />
                  <button
                    type='button'
                    onClick={() => setMobileMenuOpen(false)}
                    className='rounded-full p-2 text-ink/60 hover:bg-sage/15 hover:text-ink transition-colors'
                    aria-label='Close menu'
                  >
                    <FiX size={20} />
                  </button>
                </div>

                {/* Navigation Items */}
                <nav className='flex flex-col gap-2'>
                  <button
                    type='button'
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowForm(true);
                    }}
                    className='flex w-full items-center gap-3 rounded-2xl bg-pine px-4 py-3 font-mono text-xs font-semibold text-paper shadow-sm active:scale-98 transition-all'
                  >
                    <FiPlus size={18} />
                    <span>Add Subscription</span>
                  </button>

                  <Link
                    href='/settings'
                    onClick={() => setMobileMenuOpen(false)}
                    className='flex items-center gap-3 rounded-2xl border border-sage/40 bg-paper/50 px-4 py-3 font-mono text-xs font-medium text-ink/80 hover:bg-sage/15 transition-colors'
                  >
                    <FiSettings size={18} className='text-ink/60' />
                    <span>Settings</span>
                  </Link>
                </nav>
              </div>

              {/* Bottom Sign Out Action */}
              <div className='border-t border-sage/30 pt-4'>
                <form action='/auth/signout' method='post' className='w-full'>
                  <button
                    type='submit'
                    className='flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50/50 px-4 py-3 font-mono text-xs font-medium text-red-600 hover:bg-red-100/50 transition-colors'
                  >
                    <FiLogOut size={18} />
                    <span>Sign out</span>
                  </button>
                </form>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

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
