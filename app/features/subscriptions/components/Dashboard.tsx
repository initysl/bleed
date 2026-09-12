'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiPlus, FiSettings, FiMenu, FiX } from 'react-icons/fi';
import type { NeedsReviewItem } from '@/app/features/needs-review/types';
import type { Subscription } from '@/app/features/subscriptions/types';
import { useNeedsReview } from '@/app/features/needs-review/hooks/useNeedsReview';
import { useSubscriptions } from '@/app/features/subscriptions/hooks/useSubscriptions';
import { Modal } from '@/app/components/ui/Modal';
import { useDialogBehavior } from '@/app/components/ui/useDialogBehavior';
import { InboxAddress } from '@/app/features/inbox/components/InboxAddress';
import { EnableNotifications } from '@/app/features/notifications/components/EnableNotifications';
import { NeedsReviewList } from '@/app/features/needs-review/components/NeedsReviewList';
import { BleedTotal } from './BleedTotal';
import { SubscriptionForm } from './SubscriptionForm';
import { SubscriptionList } from './SubscriptionList';
import { UpcomingStrip } from './UpcomingStrip';
import { riseIn, staggerContainer, SPRING, press } from '@/lib/motion';

export function Dashboard({
  initialSubscriptions,
  initialNeedsReview,
  inboxAddress,
}: {
  initialSubscriptions: Subscription[];
  initialNeedsReview: NeedsReviewItem[];
  inboxAddress: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Lifted out of SubscriptionList so UpcomingStrip can open an editor too.
  const [editingId, setEditingId] = useState<string | null>(null);

  // Escape, focus trap, initial focus, focus restoration and scroll lock —
  // the same behaviour the Modal gets, from the same hook.
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const drawerRef = useDialogBehavior<HTMLElement>(
    mobileMenuOpen,
    closeMobileMenu,
  );

  const { data: subscriptions } = useSubscriptions(initialSubscriptions);
  const { data: needsReview } = useNeedsReview(initialNeedsReview);

  // No local reduced-motion guard: MotionConfig in providers/MotionProvider
  // applies it globally, so transforms drop and opacity stays.
  return (
    <motion.main
      variants={staggerContainer}
      initial='hidden'
      animate='show'
      className='mx-auto flex w-full max-w-6xl flex-col'
    >
      {/* ===== Masthead ===== */}
      <motion.header
        variants={riseIn}
        className='sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-6 border-b border-line bg-paper/90 px-4 backdrop-blur-xl sm:px-8'
      >
        {/* A wordmark rather than bleedlogo.svg, which is a 245 KB file drawn
            on eight surfaces. Type the app already loads costs nothing. */}
        <h1 className='m-0 flex items-baseline gap-3.5 font-display text-[19px] font-bold tracking-[0.14em]'>
          BLEED
          <span className='hidden font-mono text-label font-medium text-ink/45 sm:inline'>
            SUBSCRIPTION METER
          </span>
        </h1>

        <div className='hidden items-center gap-2 sm:flex'>
          <Link
            href='/settings'
            className='group inline-flex items-center gap-1.5 rounded-sm px-3 py-2 font-mono text-[11px] tracking-[0.1em] text-ink/65 transition-colors hover:bg-line-soft hover:text-ink'
          >
            <FiSettings
              aria-hidden='true'
              className='transition-transform duration-300 group-hover:rotate-45'
              size={13}
            />
            SETTINGS
          </Link>

          <form action='/auth/signout' method='post' className='inline-flex'>
            <button
              type='submit'
              className='group inline-flex items-center gap-1.5 rounded-sm px-3 py-2 font-mono text-[11px] tracking-[0.1em] text-ink/65 transition-colors hover:bg-rust-tint hover:text-rust'
            >
              <FiLogOut
                aria-hidden='true'
                className='transition-transform duration-200 group-hover:-translate-x-0.5'
                size={13}
              />
              SIGN OUT
            </button>
          </form>

          <motion.button
            type='button'
            onClick={() => setShowForm(true)}
            {...press}
            className='ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-sm border-0 bg-pine px-4 py-2.5 font-mono text-[11px] tracking-[0.1em] text-paper transition-colors hover:bg-pine-hover'
          >
            <FiPlus aria-hidden='true' size={13} />
            LOG SUBSCRIPTION
          </motion.button>
        </div>

        <button
          type='button'
          onClick={() => setMobileMenuOpen(true)}
          aria-label='Open navigation menu'
          aria-expanded={mobileMenuOpen}
          className='flex h-11 w-11 cursor-pointer items-center justify-center rounded-sm border border-line bg-surface text-ink/80 sm:hidden'
        >
          <FiMenu size={19} aria-hidden='true' />
        </button>
      </motion.header>

      {/* ===== Mobile drawer ===== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={closeMobileMenu}
              className='fixed inset-0 z-40 bg-ink/40 backdrop-blur-xs sm:hidden'
            />

            <motion.aside
              ref={drawerRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={SPRING.panel}
              role='dialog'
              aria-modal='true'
              aria-label='Navigation menu'
              tabIndex={-1}
              className='fixed inset-y-0 right-0 z-50 flex w-4/5 max-w-xs flex-col justify-between border-l border-line bg-surface p-6 outline-none sm:hidden'
            >
              <div className='space-y-6'>
                <div className='flex items-center justify-between border-b border-line pb-4'>
                  <span className='font-display text-[17px] font-bold tracking-[0.14em]'>
                    BLEED
                  </span>
                  <button
                    type='button'
                    onClick={closeMobileMenu}
                    className='flex h-11 w-11 cursor-pointer items-center justify-center rounded-sm text-ink/60 transition-colors hover:bg-line-soft hover:text-ink'
                    aria-label='Close menu'
                  >
                    <FiX size={19} aria-hidden='true' />
                  </button>
                </div>

                <nav className='flex flex-col gap-1'>
                  <button
                    type='button'
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowForm(true);
                    }}
                    className='flex min-h-11 cursor-pointer items-center gap-2.5 rounded-sm border-0 bg-pine px-4 font-mono text-[11px] tracking-[0.1em] text-paper'
                  >
                    <FiPlus size={14} aria-hidden='true' />
                    LOG SUBSCRIPTION
                  </button>

                  <Link
                    href='/settings'
                    onClick={closeMobileMenu}
                    className='flex min-h-11 items-center gap-2.5 rounded-sm px-4 font-mono text-[11px] tracking-[0.1em] text-ink/75 transition-colors hover:bg-line-soft'
                  >
                    <FiSettings size={14} aria-hidden='true' />
                    SETTINGS
                  </Link>
                </nav>
              </div>

              <form action='/auth/signout' method='post'>
                <button
                  type='submit'
                  className='flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-sm border border-line px-4 font-mono text-[11px] tracking-[0.1em] text-ink/70 transition-colors hover:border-rust-line hover:bg-rust-tint hover:text-rust'
                >
                  <FiLogOut size={14} aria-hidden='true' />
                  SIGN OUT
                </button>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title='Log a subscription'
      >
        <SubscriptionForm onDone={() => setShowForm(false)} />
      </Modal>

      <div className='flex flex-col gap-5 px-4 py-6 sm:px-8'>
        <motion.div variants={riseIn}>
          <NeedsReviewList items={needsReview} />
        </motion.div>

        <div className='grid gap-6 md:grid-cols-[420px_minmax(0,1fr)]'>
          <motion.aside
            variants={riseIn}
            className='flex min-w-0 flex-col gap-5 md:sticky md:top-24 md:self-start'
          >
            <BleedTotal subscriptions={subscriptions} />

            {/* The ruler and the ledger are two views of the same data, so
                they share one selection: picking a marker opens that row
                below, and the marker grows to show which one is open. */}
            <UpcomingStrip
              subscriptions={subscriptions}
              selectedId={editingId}
              onSelect={(sub) =>
                setEditingId(editingId === sub.id ? null : sub.id)
              }
            />

            <InboxAddress address={inboxAddress} index='03' />

            {/* Push is the headline feature, and this prompt only ever
                rendered inside EmptyState — so once a user had one
                subscription they never saw it again outside Settings. It
                returns null once permission is granted. */}
            <EnableNotifications />
          </motion.aside>

          <motion.section variants={riseIn} className='min-w-0'>
            <SubscriptionList
              subscriptions={subscriptions}
              editingId={editingId}
              onEditingChange={setEditingId}
            />
          </motion.section>
        </div>
      </div>
    </motion.main>
  );
}
