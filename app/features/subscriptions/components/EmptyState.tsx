'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { FiSettings, FiLogOut, FiPlus } from 'react-icons/fi';
import Image from 'next/image';
import { GhostTotal } from './GhostTotal';
import { EnableNotifications } from '@/app/features/notifications/components/EnableNotifications';
import { SubscriptionForm } from './SubscriptionForm';
import { InboxAddress } from '../../inbox/components/InboxAddress';
import { Modal } from '@/app/components/ui/Modal';

export function EmptyState({ inboxAddress }: { inboxAddress: string }) {
  const shouldReduceMotion = useReducedMotion();
  const [showForm, setShowForm] = useState(false);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.1 } },
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
      className='mx-auto flex w-full max-w-6xl flex-col min-h-screen px-4 sm:px-8 py-4 gap-8'
    >
      {/* Header — Preserved Exactly As Is */}
      <motion.header
        variants={item}
        className='sticky top-0 flex sm:p-0 p-5 w-full h-20 items-center justify-between backdrop-blur-xl rounded-2xl'
      >
        <Image
          src='/bleedlogo.svg'
          alt='Bleed logo'
          width={100}
          height={32}
          priority={true}
        />

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

      {/* Main Responsive Grid Layout */}
      <div className='flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto'>
        {/* Left Primary Hero Section (8 Columns on Desktop) */}
        <div className='lg:col-span-7 xl:col-span-8 flex flex-col justify-center space-y-6'>
          <motion.div variants={item} className='space-y-2'>
            <h1 className='font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink'>
              Nothing logged yet.
            </h1>
            <p className='font-mini text-base text-ink/60 max-w-lg'>
              Forward your first receipt below and watch your subscription
              metrics fill in automatically.
            </p>
          </motion.div>

          <motion.div variants={item} className='w-full'>
            <InboxAddress address={inboxAddress} />
          </motion.div>

          <motion.div variants={item} className='w-full'>
            {showForm ? (
              <Modal open={showForm} onClose={() => setShowForm(false)}>
                <SubscriptionForm onDone={() => setShowForm(false)} />
              </Modal>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className='font-mini text-sm text-ink/50 underline decoration-ink/20 underline-offset-4 hover:text-ink/70 transition-colors'
              >
                Or add one manually
              </button>
            )}
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
