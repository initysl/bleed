'use client';

import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import Image from 'next/image';
import Logo from '@/public/bleedlogo.svg';
import React, { useEffect } from 'react';

const MotionLink = motion.create(Link);

const fadeUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: 'easeOut' },
  },
});

const staggerContainer = (stagger = 0.12, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

interface FloatingCardProps {
  className: string;
  entranceDelay: number;
  floatDelay?: string;
  children: React.ReactNode;
}

function FloatingCard({
  className,
  entranceDelay,
  floatDelay,
  children,
}: FloatingCardProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .animate-marquee {
        animation: marquee 25s linear infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: entranceDelay, ease: 'easeOut' }}
      className={className}
    >
      {/*
        The continuous bob loop is a plain CSS keyframe (animate-float), kept
        deliberately separate from this wrapper's framer-motion entrance.
        Both animating `transform` on the SAME element would fight each other —
        framer writes inline styles that would override or conflict with the
        CSS keyframe. Splitting entrance (outer, one-time) from the idle loop
        (inner, continuous) avoids that entirely.
      */}
      <div
        className={`rounded-2xl border border-ink/10 bg-white shadow-xl ${
          shouldReduceMotion ? '' : 'animate-float'
        }`}
        style={floatDelay ? { animationDelay: floatDelay } : undefined}
      >
        {children}
      </div>
    </motion.div>
  );
}

export function LandingPage({ isAuthenticated }: { isAuthenticated: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const ctaHref = isAuthenticated ? '/dashboard' : '/login';
  const ctaLabel = isAuthenticated ? 'Open dashboard' : 'Get started';

  const howItWorksSteps = [
    {
      num: '1',
      title: 'Forward the receipt',
      desc: 'When you get a subscription confirmation or invoice, just forward it to your personal Bleed address.',
    },
    {
      num: '2',
      title: 'Bleed reads it',
      desc: 'Our parser extracts the service name, price, billing cycle, and currency — no templates needed.',
    },
    {
      num: '3',
      title: 'Stay in control',
      desc: 'Review your dashboard, see total monthly spend, and get warned before any renewal hits your card.',
    },
  ];

  const subscriptionRows = [
    {
      name: 'Spotify',
      cycle: 'Monthly',
      price: '$10.99',
      color: 'bg-red-500',
      initial: 'S',
    },
    {
      name: 'Netflix',
      cycle: 'Monthly',
      price: '$15.49',
      color: 'bg-blue-500',
      initial: 'N',
    },
    {
      name: 'Figma',
      cycle: 'Annual',
      price: '$144/yr',
      color: 'bg-amber-500',
      initial: 'F',
    },
  ];

  const spendBars = [
    { label: 'Jan', width: '45%', value: '$45' },
    { label: 'Feb', width: '62%', value: '$62' },
    { label: 'Mar', width: '78%', value: '$78' },
    { label: 'Apr', width: '55%', value: '$55' },
  ];

  return (
    <main className='min-h-screen bg-white text-ink p-5'>
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className='flex items-center justify-between'
      >
        <Link
          href='/'
          className='flex items-center gap-2.5 text-xl font-semibold'
        >
          <Image src={Logo} alt='Bleed logo' width={100} priority={true} />
        </Link>

        <ul className='font-display hidden items-center gap-8 md:flex'>
          <li>
            <Link
              href='#features'
              className='text-sm font-medium text-ink/60 transition-colors hover:text-ink'
            >
              Features
            </Link>
          </li>
          <li>
            <Link
              href='#how'
              className='text-sm font-medium text-ink/60 transition-colors hover:text-ink'
            >
              How it works
            </Link>
          </li>
          <li>
            <Link
              href='#'
              className='text-sm font-medium text-ink/60 transition-colors hover:text-ink'
            >
              Resources
            </Link>
          </li>
        </ul>

        <div className='font-mono flex items-center gap-3'>
          <Link
            href={ctaHref}
            className='rounded-lg px-4 py-2 text-sm font-medium text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink'
          >
            {isAuthenticated ? 'Open dashboard' : 'Sign in'}
          </Link>
          <MotionLink
            href={ctaHref}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className='rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90'
          >
            {ctaLabel}
          </MotionLink>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className='font-display relative mx-auto max-w-7xl pb-32 pt-12 text-center'>
        <div
          className='pointer-events-none absolute inset-0 opacity-[0.35]'
          style={{
            backgroundImage:
              'radial-gradient(circle, currentColor 0.8px, transparent 0.8px)',
            backgroundSize: '24px 24px',
          }}
        />

        <motion.div
          variants={staggerContainer(0.15)}
          initial='hidden'
          animate='show'
          className='relative z-10'
        >
          <motion.h1
            variants={fadeUp(0.05)}
            className='mx-auto max-w-3xl text-5xl font-semibold leading-[1.08] tracking-tight md:text-6xl lg:text-7xl'
          >
            Forward, don&apos;t type.
            <span className='block text-ink/30'>Track every subscription.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp(0.1)}
            className='mx-auto mt-6 max-w-lg text-lg leading-relaxed text-ink/60'
          >
            Forward a subscription receipt and Bleed logs it automatically. See
            your real monthly spend, and get reminded before anything renews.
          </motion.p>

          <motion.div variants={fadeUp(0.15)}>
            <MotionLink
              href={ctaHref}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className='font-mono mt-8 inline-flex items-center gap-2 rounded-xl bg-pine px-7 py-3.5 text-[15px] font-medium text-white shadow-lg shadow-pine/25 transition-shadow hover:shadow-xl hover:shadow-pine/30'
            >
              {ctaLabel}
            </MotionLink>
          </motion.div>
        </motion.div>

        {/* Floating cards — hidden on mobile */}
        <div className='pointer-events-none absolute inset-0 hidden lg:block'>
          <FloatingCard
            className='absolute left-[5%] top-[5%] w-52'
            entranceDelay={0.3}
          >
            <div className='p-4'>
              <div className='mb-2.5 flex items-center gap-2.5'>
                <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600'>
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                  >
                    <path d='M15.4795 15.4971C15.9765 15.4971 16.3799 15.9004 16.3799 16.3975C16.3799 16.8945 15.9765 17.2978 15.4795 17.2979H8.52051C8.02345 17.2979 7.62012 16.8945 7.62012 16.3975C7.62012 15.9004 8.02345 15.4971 8.52051 15.4971H15.4795Z' />
                    <path d='M12.3359 11.0996C12.8329 11.0997 13.2354 11.503 13.2354 12C13.2354 12.497 12.8329 12.9003 12.3359 12.9004H8.52051C8.02345 12.9004 7.62012 12.4971 7.62012 12C7.62012 11.5029 8.02345 11.0996 8.52051 11.0996H12.3359Z' />
                    <path
                      fillRule='evenodd'
                      clipRule='evenodd'
                      d='M13.1719 2.09961C13.9408 2.09969 14.6789 2.40555 15.2227 2.94922L19.0508 6.77734C19.5946 7.32113 19.9003 8.05911 19.9004 8.82812V18C19.9004 20.1539 18.1539 21.9004 16 21.9004H8C5.84626 21.9002 4.09961 20.1538 4.09961 18V6C4.09961 3.84621 5.84626 2.09981 8 2.09961H13.1719ZM8 3.90039C6.84037 3.90059 5.90039 4.84032 5.90039 6V18C5.90039 19.1597 6.84037 20.0994 8 20.0996H16C17.1598 20.0996 18.0996 19.1598 18.0996 18V9.90039H15C13.3985 9.90019 12.0996 8.6015 12.0996 7V3.90039H8ZM13.9004 7C13.9004 7.60739 14.3927 8.09941 15 8.09961H17.8213C17.8068 8.08333 17.7928 8.06626 17.7773 8.05078L13.9492 4.22266C13.9335 4.20696 13.9169 4.19237 13.9004 4.17773V7Z'
                    />
                  </svg>
                </div>
                <div>
                  <div className='text-sm font-semibold'>Netflix receipt</div>
                  <div className='text-xs text-ink/40'>Forwarded just now</div>
                </div>
              </div>
              <div className='flex justify-between border-b border-dashed border-ink/10 py-1 text-xs'>
                <span className='text-ink/40'>Plan</span>
                <span className='font-medium'>Standard</span>
              </div>
              <div className='flex justify-between border-b border-dashed border-ink/10 py-1 text-xs'>
                <span className='text-ink/40'>Cycle</span>
                <span className='font-medium'>Monthly</span>
              </div>
              <div className='flex justify-between border-b border-dashed border-ink/10 py-1 text-xs'>
                <span className='text-ink/40'>Price</span>
                <span className='font-medium'>$15.49</span>
              </div>
              <div className='mt-2 flex justify-between border-t border-ink/10 pt-2 text-xs font-semibold'>
                <span>Detected</span>
                <span className='text-emerald-500'>Auto-logged</span>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard
            className='absolute right-[8%] top-[8%] w-48'
            entranceDelay={0.4}
            floatDelay='-2s'
          >
            <div className='p-4'>
              <div className='mb-2.5 flex items-center gap-2'>
                <span className='h-2 w-2 animate-pulse rounded-full bg-amber-400' />
                <span className='text-sm font-semibold'>Upcoming renewals</span>
              </div>
              <div className='mb-1.5 flex items-center gap-2 rounded-lg bg-ink/[0.03] p-2'>
                <span className='flex h-7 w-7 items-center justify-center rounded-md bg-red-500 text-[11px] font-bold text-white'>
                  S
                </span>
                <div className='flex-1'>
                  <div className='text-xs font-medium'>Spotify</div>
                  <div className='text-[11px] text-ink/40'>
                    Renews in 2 days
                  </div>
                </div>
                <span className='text-xs font-semibold'>$10.99</span>
              </div>
              <div className='flex items-center gap-2 rounded-lg bg-ink/[0.03] p-2'>
                <span className='flex h-7 w-7 items-center justify-center rounded-md bg-blue-500 text-[11px] font-bold text-white'>
                  N
                </span>
                <div className='flex-1'>
                  <div className='text-xs font-medium'>Notion</div>
                  <div className='text-[11px] text-ink/40'>
                    Renews in 5 days
                  </div>
                </div>
                <span className='text-xs font-semibold'>$8.00</span>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard
            className='absolute bottom-[15%] left-[3%] w-56'
            entranceDelay={0.5}
            floatDelay='-4s'
          >
            <div className='p-4'>
              <div className='mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink/50'>
                Your subscriptions
              </div>
              {subscriptionRows.map((sub) => (
                <div
                  key={sub.name}
                  className='flex items-center gap-2.5 border-b border-ink/5 py-2 last:border-0'
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-md ${sub.color} text-[11px] font-bold text-white`}
                  >
                    {sub.initial}
                  </span>
                  <div className='flex-1'>
                    <div className='text-xs font-medium'>{sub.name}</div>
                    <div className='text-[11px] text-ink/40'>{sub.cycle}</div>
                  </div>
                  <span className='text-xs font-semibold'>{sub.price}</span>
                </div>
              ))}
            </div>
          </FloatingCard>

          <FloatingCard
            className='absolute bottom-[20%] right-[5%] w-44'
            entranceDelay={0.35}
            floatDelay='-1s'
          >
            <div className='p-4'>
              <div className='mb-3 text-xs font-semibold'>Monthly spend</div>
              {spendBars.map((bar) => (
                <div key={bar.label} className='mb-2 flex items-center gap-2'>
                  <span className='w-8 text-[11px] text-ink/40'>
                    {bar.label}
                  </span>
                  <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-ink/5'>
                    <div
                      className='h-full rounded-full bg-pine'
                      style={{ width: bar.width }}
                    />
                  </div>
                  <span className='w-7 text-right text-[11px] font-medium'>
                    {bar.value}
                  </span>
                </div>
              ))}
            </div>
          </FloatingCard>
        </div>
      </section>

      {/* Features */}
      <section id='features'>
        <div className='font-display mx-auto max-w-6xl py-24'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className='mb-14 text-center'
          >
            <h2 className='text-3xl font-semibold tracking-tight md:text-4xl'>
              Three things Bleed does for you
            </h2>
            <p className='mt-3 text-lg text-ink/60'>
              Stop guessing where your money goes every month.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer(0.12)}
            initial='hidden'
            whileInView='show'
            viewport={{ once: true, amount: 0.2 }}
            className='grid gap-6 md:grid-cols-3'
          >
            <motion.div
              variants={fadeUp()}
              whileHover={{ y: -4 }}
              className='group rounded-2xl border border-ink/10 bg-white p-8 transition-colors hover:border-transparent hover:shadow-xl'
            >
              <div className='mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-pine/10 text-pine'>
                <svg
                  width='22'
                  height='22'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                >
                  <path d='M16.5364 10.1636C16.8879 10.5151 16.8879 11.0849 16.5364 11.4364C16.1849 11.7879 15.6151 11.7879 15.2636 11.4364L12.9 9.07281V17.1C12.9 17.597 12.4971 18 12 18C11.503 18 11.1 17.597 11.1 17.1V9.07281L8.73641 11.4364C8.38494 11.7879 7.81509 11.7879 7.46362 11.4364C7.11214 11.0849 7.11214 10.5151 7.46362 10.1636L11.3636 6.2636C11.7151 5.91211 12.2849 5.91211 12.6364 6.2636L16.5364 10.1636Z' />
                </svg>
              </div>
              <h3 className='text-lg font-semibold'>
                Forward, don&apos;t type
              </h3>
              <p className='mt-2 text-sm leading-relaxed text-ink/60'>
                Send a receipt to your inbox address — Bleed reads it and logs
                the subscription name, price, currency, and billing cycle
                automatically.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp()}
              whileHover={{ y: -4 }}
              className='group rounded-2xl border border-ink/10 bg-white p-8 transition-colors hover:border-transparent hover:shadow-xl'
            >
              <div className='mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500'>
                <svg
                  width='22'
                  height='22'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                >
                  <path d='M4 3.08496C4.55224 3.08496 4.99993 3.53273 5 4.08496V18.0361H19.9941L20.0967 18.041C20.6008 18.0923 20.9941 18.5185 20.9941 19.0361C20.9941 19.5538 20.6008 19.9799 20.0967 20.0312L19.9941 20.0361H5C3.89546 20.0361 3.00005 19.1407 3 18.0361V4.08496C3.00007 3.53273 3.44776 3.08496 4 3.08496ZM18.2627 6.5166C18.6316 6.10561 19.2638 6.07157 19.6748 6.44043C20.0858 6.80932 20.1198 7.44153 19.751 7.85254L15.8682 12.1787C15.1552 12.9731 13.9437 13.0678 13.1162 12.3936L10.9121 10.5967L7.45117 14.6602C7.09308 15.0805 6.46145 15.1315 6.04102 14.7734C5.6206 14.4153 5.56969 13.7837 5.92773 13.3633L9.38965 9.2998C10.0949 8.47222 11.3318 8.36 12.1748 9.04688L14.3799 10.8428L18.2627 6.5166Z' />
                </svg>
              </div>
              <h3 className='text-lg font-semibold'>See the real total</h3>
              <p className='mt-2 text-sm leading-relaxed text-ink/60'>
                Every subscription, sorted by cost, in your actual currency.
                Know exactly how much leaks out of your account each month.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp()}
              whileHover={{ y: -4 }}
              className='group rounded-2xl border border-ink/10 bg-white p-8 transition-colors hover:border-transparent hover:shadow-xl'
            >
              <div className='mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500'>
                <svg
                  width='22'
                  height='22'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                >
                  <path d='M21.06 17.32C21.28 17.59 21.325 17.961 21.175 18.275C21.1003 18.4291 20.9836 18.559 20.8384 18.6497C20.6931 18.7405 20.5253 18.7884 20.354 18.788H15.822C15.6401 19.6667 15.1608 20.4558 14.465 21.0223C13.7692 21.5888 12.8993 21.8982 12.002 21.8982C11.1047 21.8982 10.2348 21.5888 9.53899 21.0223C8.84316 20.4558 8.3639 19.6667 8.182 18.787H3.784C3.63174 18.8138 3.47539 18.8001 3.33 18.748C3.15387 18.6867 3.00114 18.5721 2.89294 18.4202C2.78473 18.2683 2.7264 18.0865 2.726 17.9V17.888C2.7264 17.7648 2.75208 17.6431 2.80145 17.5302C2.85082 17.4174 2.92282 17.3159 3.013 17.232L3.259 16.934L3.26 16.932C4.163 15.828 4.683 14.372 4.683 12.852V9.674C4.723 7.645 5.457 5.729 6.76 4.287C8.071 2.826 9.841 2 11.732 2H12.27C16.27 2 19.33 5.643 19.33 9.861V13.044C19.377 14.498 19.886 15.875 20.743 16.935L20.745 16.937L21.06 17.32ZM8.12 5.483L8.117 5.486C7.124 6.584 6.537 8.077 6.502 9.7V12.85C6.502 14.317 6.12 15.75 5.414 16.987H18.594C17.9177 15.7851 17.5462 14.4357 17.512 13.057V9.86C17.512 6.403 15.046 3.799 12.27 3.799H11.732C10.396 3.799 9.109 4.378 8.12 5.483ZM13.949 18.787H10.055C10.2118 19.1749 10.4809 19.5072 10.8278 19.7412C11.1747 19.9751 11.5836 20.1001 12.002 20.1001C12.4204 20.1001 12.8293 19.9751 13.1762 19.7412C13.5231 19.5072 13.7922 19.1749 13.949 18.787Z' />
                </svg>
              </div>
              <h3 className='text-lg font-semibold'>Decide before it renews</h3>
              <p className='mt-2 text-sm leading-relaxed text-ink/60'>
                Email and push reminders a few days before you&apos;re charged
                again. Cancel what you don&apos;t need, keep what you love.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className='py-24 relative -rotate-1 overflow-hidden'>
        <div className='p-1 bg-pine/90 animate-marquee flex w-max items-center gap-12 whitespace-nowrap text-sm font-bold text-white'>
          {[...Array(2)].map((_, i) => (
            <React.Fragment key={i}>
              <span>NETFLIX</span>
              <span>SPOTIFY</span>
              <span>NOTION</span>
              <span>FIGMA</span>
              <span>ADOBE</span>
              <span>AMAZON PRIME</span>
              <span>APPLE ONE</span>
              <span>GOOGLE ONE</span>
              <span>DROPBOX</span>
              <span>SLACK</span>
              <span>GITHUB</span>
              <span>VERCEL</span>
            </React.Fragment>
          ))}
        </div>
      </div>
      {/* How it works */}
      <section id='how'>
        <div className='font-display mx-auto max-w-6xl py-24'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className='mb-14 text-center'
          >
            <h2 className='text-3xl font-semibold tracking-tight md:text-4xl'>
              How it works
            </h2>
            <p className='mt-3 text-lg text-ink/60'>
              From receipt to dashboard in seconds.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer(0.18)}
            initial='hidden'
            whileInView='show'
            viewport={{ once: true, amount: 0.2 }}
            className='flex flex-col items-center gap-8 md:flex-row md:justify-center'
          >
            {howItWorksSteps.map((step, i, arr) => (
              <motion.div
                key={step.num}
                variants={fadeUp()}
                className='relative max-w-xs text-center'
              >
                <div className='mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-ink/10 bg-ink/[0.03] text-xl font-semibold'>
                  {step.num}
                </div>
                <h3 className='text-lg font-semibold'>{step.title}</h3>
                <p className='mt-2 text-sm leading-relaxed text-ink/60'>
                  {step.desc}
                </p>
                {i < arr.length - 1 && (
                  <div className='absolute left-full top-7 hidden h-px w-12 bg-ink/10 md:block' />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className='border-t border-ink/10'>
        <div className='font-display mx-auto max-w-6xl py-24'>
          <motion.div
            variants={scaleIn}
            initial='hidden'
            whileInView='show'
            viewport={{ once: true, amount: 0.3 }}
            className='relative overflow-hidden rounded-3xl bg-pine/90 px-8 py-20 text-center text-white'
          >
            <div
              className='pointer-events-none absolute -left-1/2 -top-1/2 h-[200%] w-[200%]'
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.06) 0%, transparent 50%)',
              }}
            />
            <h2 className='relative text-3xl font-semibold tracking-tight md:text-4xl'>
              Stop bleeding money on forgotten subscriptions
            </h2>
            <p className='relative mx-auto mt-4 max-w-md text-white/70'>
              Forward your first receipt and see your real monthly spend in
              under a minute.
            </p>
            <MotionLink
              href={ctaHref}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className='font-mono relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[15px] font-medium text-ink transition-shadow hover:shadow-xl'
            >
              {isAuthenticated ? 'Open dashboard' : 'Get started for free'}
            </MotionLink>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6 }}
        className='border-t border-ink/10'
      >
        <div className='py-16'>
          <div className='flex flex-col gap-12 md:flex-row md:justify-between'>
            <div className='max-w-xs'>
              <Link
                href='/'
                className='flex items-center gap-2.5 text-xl font-semibold'
              >
                <Image
                  src={Logo}
                  alt='Bleed logo'
                  width={100}
                  priority={true}
                />
              </Link>
              <p className='mt-3 text-sm leading-relaxed text-ink/50'>
                Forward a subscription receipt and Bleed logs it automatically.
                See your real monthly spend, and get reminded before anything
                renews.
              </p>
            </div>
          </div>

          <div className='mt-12 flex items-center justify-center pt-6'>
            <p className='text-xs text-ink/40'>
              {new Date().getFullYear()} Bleed. All rights reserved.
            </p>
          </div>
        </div>
      </motion.footer>
    </main>
  );
}
