'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import {
  FiMail,
  FiZap,
  FiCheck,
  FiCopy,
  FiBell,
  FiTrendingUp,
} from 'react-icons/fi';

import bleedLogo from '@/public/bleedlogo.svg';
import heroPhone from '@/public/hero-phone.png';
import addModalPhone from '@/public/add-modal-phone.png';
import fullDashboard from '@/public/full-dashboard.png';

interface LandingPageProps {
  isAuthenticated: boolean;
}

interface FeatureItem {
  readonly id: string;
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
  readonly tag: string;
}

const FEATURE_LIST = [
  {
    id: 'frictionless-logging',
    icon: <FiMail className='w-5 h-5' />,
    title: 'Frictionless Logging',
    description:
      'Forward any receipt or confirmation email directly to your custom Bleed inbox, or type plain text like "signed up for Spotify premium, $11.99/month".',
    tag: 'Auto-Extraction',
    theme: {
      bg: 'bg-emerald-50 text-emerald-600',
      hoverText: 'group-hover:text-emerald-600',
      hoverGlow: 'hover:shadow-[0_20px_40px_rgba(16,185,129,0.12)]',
    },
  },
  {
    id: 'real-bleed-dashboard',
    icon: <FiTrendingUp className='w-5 h-5' />,
    title: 'Real Bleed Dashboard',
    description:
      'View your total monthly and yearly spend with live metrics. Subscriptions are sorted by cost with automatic flags for unused services.',
    tag: 'Live Analytics',
    theme: {
      bg: 'bg-violet-50 text-violet-600',
      hoverText: 'group-hover:text-violet-600',
      hoverGlow: 'hover:shadow-[0_20px_40px_rgba(139,92,246,0.12)]',
    },
  },
  {
    id: 'proactive-nudges',
    icon: <FiBell className='w-5 h-5' />,
    title: 'Proactive Nudges',
    description:
      'Get email and push notifications days before your card is charged: "Netflix renews in 3 days — $15.49/mo. Cancel or keep?"',
    tag: 'Smart Alerts',
    theme: {
      bg: 'bg-amber-50 text-amber-600',
      hoverText: 'group-hover:text-amber-600',
      hoverGlow: 'hover:shadow-[0_20px_40px_rgba(245,158,11,0.12)]',
    },
  },
  {
    id: 'zero-effort-cycles',
    icon: <FiZap className='w-5 h-5' />,
    title: 'Zero-Effort Cycles',
    description:
      'After every renewal, Bleed automatically updates the next billing cycle. Set it once or forward a receipt, and never touch it again.',
    tag: 'Automated',
    theme: {
      bg: 'bg-sky-50 text-sky-600',
      hoverText: 'group-hover:text-sky-600',
      hoverGlow: 'hover:shadow-[0_20px_40px_rgba(14,165,233,0.12)]',
    },
  },
];

const EXAMPLE_INBOX_ADDRESS = 'you@bleed-demo.resend.app';

// --- Animation Variants ---
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function BleedLandingPage({
  isAuthenticated,
}: LandingPageProps): React.JSX.Element {
  const [copiedInbox, setCopiedInbox] = useState<boolean>(false);

  const ctaHref = isAuthenticated ? '/dashboard' : '/login';
  const ctaLabel = isAuthenticated ? 'Open Dashboard' : 'Get Started';
  const heroCtaLabel = isAuthenticated ? 'Open Dashboard' : 'Start Tracking';

  // Smooth Scroll Click Handler
  const handleScrollTo = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string,
  ) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      // Offsets scrolling position slightly to account for fixed header height
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleCopyInbox = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(EXAMPLE_INBOX_ADDRESS);
      setCopiedInbox(true);
      setTimeout(() => setCopiedInbox(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className='min-h-screen bg-white text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden scroll-smooth'>
      {/* Top Banner Navigation */}
      <header className='font-mono sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-100 px-6'>
        <div className='max-w-7xl mx-auto h-20 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Image src={bleedLogo} alt='Bleed Logo' width={100} priority />
          </div>

          <nav className='hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600'>
            <a
              href='#how-it-works'
              onClick={(e) => handleScrollTo(e, 'how-it-works')}
              className='hover:text-emerald-800 transition-colors'
            >
              How it Works
            </a>
            <a
              href='#features'
              onClick={(e) => handleScrollTo(e, 'features')}
              className='hover:text-emerald-800 transition-colors'
            >
              Features
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className='font-display relative overflow-hidden '>
        <div className='max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center'>
          {/* Hero Content */}
          <motion.div
            initial='hidden'
            animate='visible'
            variants={staggerContainer}
            className='lg:col-span-7 space-y-8'
          >
            <motion.h1
              variants={fadeInUp}
              className='text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.12]'
            >
              Stop recurring charges from draining your money.
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className='text-lg sm:text-xl text-zinc-600 max-w-2xl font-normal leading-relaxed'
            >
              No manual data entry. Forward receipts or type plain text - Bleed
              automatically extracts costs, tracks your real monthly spend, and
              nudges you right before you get charged.
            </motion.p>

            {/* Live Interactive Forwarding Card Preview */}
            <motion.div
              variants={fadeInUp}
              className='p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 max-w-xl space-y-3 shadow-sm'
            >
              <div className='flex items-center justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wide'>
                <span>Example Forwarding Address</span>
                <span>Frictionless Sync</span>
              </div>
              <div className='flex items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-zinc-200 shadow-xs'>
                <code className='text-sm font-mono text-zinc-800 truncate'>
                  {EXAMPLE_INBOX_ADDRESS}
                </code>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCopyInbox}
                  type='button'
                  className='px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-800 text-white hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shrink-0'
                >
                  {copiedInbox ? (
                    <>
                      <FiCheck className='w-3.5 h-3.5' /> Copied!
                    </>
                  ) : (
                    <>
                      <FiCopy className='w-3.5 h-3.5' /> Copy
                    </>
                  )}
                </motion.button>
              </div>
              <p className='text-xs text-zinc-500'>
                Every real account gets its own private version of this address
                - forward a receipt to it, and Bleed reads it automatically.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className='flex flex-wrap gap-4 pt-2'
            >
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={ctaHref}
                className='px-7 py-3.5 rounded-xl font-semibold bg-emerald-800 text-white hover:bg-emerald-900 transition-all shadow-md hover:shadow-lg flex items-center gap-2'
              >
                {heroCtaLabel}
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href='#how-it-works'
                onClick={(e) => handleScrollTo(e, 'how-it-works')}
                className='px-7 py-3.5 rounded-xl font-semibold bg-zinc-100 text-zinc-800 hover:bg-zinc-200 transition-colors'
              >
                See How It Works
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Hero App Mockup Stack */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className='lg:col-span-5 relative flex justify-center items-center'
          >
            <div className='relative w-full max-w-85 sm:max-w-95 aspect-9/18'>
              <motion.div
                initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
                animate={{ opacity: 1, scale: 0.9, rotate: -3 }}
                transition={{
                  duration: 0.9,
                  delay: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className='absolute -top-6 -left-12 sm:-left-20 w-[130%] h-[80%] overflow-hidden hidden sm:block '
              >
                <Image
                  src={heroPhone}
                  alt='Bleed Mobile App Interface'
                  fill
                  sizes='(max-width: 768px) 100vw, 50vw'
                  className='object-cover object-top'
                />
              </motion.div>

              {/* Main Mobile Screen Display */}
              <div className='relative z-10 w-full h-full rounded-[40px] overflow-hidden'>
                <Image
                  src={heroPhone}
                  alt='Bleed Mobile App Interface'
                  fill
                  sizes='(max-width: 768px) 100vw, 380px'
                  priority
                  className='object-cover'
                />
              </div>

              {/* Floating Live Alert Card Badge */}
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className='absolute -bottom-6 -left-6 z-20 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xl max-w-65 space-y-2'
              >
                <div className='flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider'>
                  <FiBell className='w-4 h-4 animate-ping' /> Proactive Nudge
                </div>
                <p className='text-xs text-zinc-700 font-medium leading-snug'>
                  "Netflix renews in 3 days — $15.49/mo. Cancel or keep?"
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Real Spend Highlight Strip */}
      <section
        id='how-it-works'
        className='py-20 bg-zinc-50/50 border-b border-zinc-100 scroll-mt-20'
      >
        <div className='max-w-7xl mx-auto px-6'>
          <motion.div
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeInUp}
            className='text-center max-w-3xl mx-auto space-y-4 mb-16'
          >
            <h2 className='font-mini text-xs font-bold text-emerald-800 uppercase tracking-widest'>
              How Bleed Operates
            </h2>
            <h3 className='font-display text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight'>
              Turn "forgot I was paying for this" into timely decisions.
            </h3>
            <p className='font-display text-zinc-600 text-base sm:text-lg'>
              Designed from the ground up to eliminate repetitive management and
              protect your monthly cash flow.
            </p>
          </motion.div>

          <motion.div
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className='grid grid-cols-1 md:grid-cols-3 gap-6'
          >
            {[
              {
                step: '01',
                tag: 'Input Layer',
                title: 'Forward or Type',
                text: 'Send any subscription receipt or invoice to your dedicated address, or type plain text directly into the quick logger.',
              },
              {
                step: '02',
                tag: 'Automation',
                title: 'Auto-Extract & Dashboard',
                text: 'Bleed reads price, recurring billing cycles, and next renewal dates automatically. Animated counters reveal your real monthly spend.',
              },
              {
                step: '03',
                tag: 'Notification',
                title: 'Get Nudged Before Charge',
                text: 'Receive proactive reminders via email and push notification days before renewal so you can cancel unused services effortlessly.',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
                className='group bg-white p-7 rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)] hover:border-slate-200/80 transition-all flex flex-col justify-between'
              >
                <div className='space-y-4'>
                  {/* Header: Step Icon + Stacked Header */}
                  <div className='flex items-start gap-4'>
                    <div className='font-mini w-12 h-12 rounded-full bg-pine text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm'>
                      {item.step}
                    </div>

                    <div className='space-y-0.5 pt-0.5'>
                      <h4 className='font-display text-lg font-bold text-slate-900 leading-snug'>
                        {item.title}
                      </h4>
                      <p className='font-display text-xs font-medium text-slate-400 tracking-wide'>
                        {item.tag}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className='text-slate-500 text-sm leading-relaxed pt-1'>
                    {item.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature Section with Live Screenshots */}
      <section
        id='features'
        className='py-24 bg-white border-b border-zinc-100 scroll-mt-20'
      >
        <div className='max-w-7xl mx-auto px-6 space-y-28'>
          {/* Feature 1: Frictionless Modal Form */}
          <motion.div
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className='grid grid-cols-1 lg:grid-cols-12 gap-12 items-center'
          >
            <motion.div variants={fadeInUp} className='lg:col-span-6 space-y-6'>
              <span className='font-mini px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider'>
                Zero Friction
              </span>
              <h3 className='font-display text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight'>
                No endless form fields or tedious typing.
              </h3>
              <p className='font-display text-zinc-600 text-base sm:text-lg leading-relaxed'>
                Whether adding manually or through email parsing, Bleed
                configures exact renewal dates, reminder schedules, and
                notification preference toggles in seconds.
              </p>

              <ul className='font-mini space-y-3 pt-2 text-zinc-700 font-medium'>
                {[
                  'Automatic detection of billing currencies and cycles',
                  'Customizable reminder lead times (e.g., 3 days prior)',
                  'Dual channel alerts: Email + Mobile Push',
                ].map((text, i) => (
                  <motion.li
                    key={i}
                    variants={fadeInUp}
                    className='flex items-center gap-3'
                  >
                    <FiCheck className='w-5 h-5 text-emerald-700 shrink-0' />
                    {text}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              variants={scaleIn}
              className='lg:col-span-6 flex justify-center'
            >
              <div className='relative w-full max-w-[320px] aspect-9/18 overflow-hidden'>
                <Image
                  src={addModalPhone}
                  alt='Bleed Add Subscription Modal Interface'
                  fill
                  sizes='(max-width: 768px) 100vw, 320px'
                  className='object-cover '
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Feature 2: Full Web Dashboard Showcase */}
          <motion.div
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className='grid grid-cols-1 lg:grid-cols-12 gap-12 items-center'
          >
            <motion.div
              variants={fadeInUp}
              className='lg:col-span-6 lg:order-2 space-y-6'
            >
              <span className='font-mini px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider'>
                Complete Visibility
              </span>
              <h3 className='font-display text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight'>
                Understand your true monthly and annual expenditure.
              </h3>
              <p className='font-display text-zinc-600 text-base sm:text-lg leading-relaxed'>
                Get a single, clean overview of upcoming bills, total monthly
                bleed, and active recurring services. Know exactly what you pay
                for and when.
              </p>
            </motion.div>

            <motion.div variants={scaleIn} className='lg:col-span-6 lg:order-1'>
              <div className='relative w-full aspect-16/10 rounded-2xl overflow-hidden shadow-2xl bg-zinc-50'>
                <Image
                  src={fullDashboard}
                  alt='Bleed Web Dashboard View'
                  fill
                  className='object-contain'
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Grid Features Listing */}
      <section className='py-24 bg-slate-50/50'>
        <div className='max-w-7xl mx-auto px-6'>
          <motion.div
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(220px,auto)]'
          >
            {FEATURE_LIST.map((feature, idx) => {
              // Assign specific Bento grid classes based on index
              const bentoSpanClass =
                idx === 0
                  ? 'lg:col-span-2' // Card 1: Wide horizontal feature
                  : idx === 1
                    ? 'lg:row-span-1' // Card 2: Tall vertical feature
                    : 'lg:col-span-1'; // Cards 3 & 4: Standard bento blocks

              return (
                <motion.div
                  key={feature.id}
                  variants={fadeInUp}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className={`group relative bg-white p-7 rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)] hover:border-slate-200/80 transition-all flex flex-col justify-between ${bentoSpanClass}`}
                >
                  {/* Top Content Area */}
                  <div className='space-y-4'>
                    <div className='flex items-start gap-4'>
                      {/* Unique Colored Icon Container */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform ${feature.theme.bg}`}
                      >
                        {feature.icon}
                      </div>

                      {/* Stacked Title & Category/Tag */}
                      <div className='space-y-0.5 pt-0.5'>
                        <h4 className='font-display text-lg font-bold text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors'>
                          {feature.title}
                        </h4>
                        <p className='font-mini text-xs font-medium text-slate-400 tracking-wide uppercase'>
                          {feature.tag}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className='font-display text-slate-500 text-sm leading-relaxed pt-1 max-w-2xl'>
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Call to Action Footer Section */}
      <section className='py-24 bg-zinc-900 text-white relative overflow-hidden'>
        <motion.div
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className='max-w-5xl mx-auto px-6 text-center space-y-8 relative z-10'
        >
          <motion.h2
            variants={fadeInUp}
            className='font-display text-3xl sm:text-5xl font-extrabold tracking-tight'
          >
            Ready to stop the subscription bleed?
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className='font-mono text-zinc-400 text-lg max-w-2xl mx-auto'
          >
            Forward your first receipt and see your real monthly spend in under
            a minute.
          </motion.p>
          <motion.div
            variants={fadeInUp}
            className='flex flex-wrap gap-4 justify-center pt-4'
          >
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href={ctaHref}
              className='font-mono px-8 py-4 rounded-xl font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-all shadow-lg flex items-center gap-2'
            >
              {ctaLabel}
            </motion.a>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer Navigation */}
      <footer className='font-mono py-12 bg-white border-t border-zinc-100 text-sm text-zinc-500'>
        <div className='max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6'>
          <div className='flex items-center gap-3'>
            <Image
              src={bleedLogo}
              alt='Bleed Logo Footer'
              width={100}
              className='grayscale opacity-80'
            />
          </div>

          <p className='text-xs'>
            © {new Date().getFullYear()} Bleed. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
