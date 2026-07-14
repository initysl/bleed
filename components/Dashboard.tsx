'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { Subscription } from '@/types/subscription';
import { BleedTotal } from './Bleedtotal';
import { InboxAddress } from './Inboxaddress';
import { SubscriptionList } from './Subscriptionlist';

export function Dashboard({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  const shouldReduceMotion = useReducedMotion();
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

  return (
    <motion.div
      variants={container}
      initial='hidden'
      animate='show'
      className='mx-auto flex max-w-md flex-col items-center gap-6 px-6 py-16'
    >
      <motion.h1
        variants={item}
        className='self-start font-(family-name:--font-display) text-2xl font-medium text-ink'
      >
        Bleed
      </motion.h1>

      <motion.div variants={item} className='w-full'>
        <BleedTotal monthlyTotal={monthlyTotal} />
      </motion.div>

      <motion.div variants={item} className='w-full'>
        <SubscriptionList subscriptions={subscriptions} />
      </motion.div>

      <motion.div variants={item} className='w-full'>
        <InboxAddress />
      </motion.div>
    </motion.div>
  );
}
