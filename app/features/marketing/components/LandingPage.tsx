'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { EASE_OUT_EXPO, press, riseIn, staggerContainer } from '@/lib/motion';

interface LandingPageProps {
  isAuthenticated: boolean;
}

interface Step {
  readonly index: string;
  readonly title: string;
  readonly body: string;
}

const STEPS: readonly Step[] = [
  {
    index: '01',
    title: 'Forward a receipt',
    body: 'Any subscription confirmation or invoice, from any vendor, to your private Bleed address. Or set a mail filter and never think about it again.',
  },
  {
    index: '02',
    title: 'Bleed reads it',
    body: "Amount, currency, monthly or yearly, next renewal date. Anything it can't read confidently goes to a review queue with the email attached — never silently dropped.",
  },
  {
    index: '03',
    title: 'You get warned',
    body: 'Three days before each charge, by email and on your phone, at 9am in your own timezone. Then you decide: keep it, or go and cancel it.',
  },
];

const FAQ = [
  {
    q: 'Do I have to forward every receipt by hand?',
    a: 'Only the first one. After that, set a rule in Gmail or Outlook that auto-forwards anything from your subscription vendors, and the ledger maintains itself.',
  },
  {
    q: 'What if it reads a receipt wrongly?',
    a: "Anything it isn't confident about goes to a review queue with the original email attached, so you can see what it saw and correct it in one step. Nothing is dropped silently.",
  },
  {
    q: 'Does it cancel subscriptions for me?',
    a: "No. Bleed tells you what's about to charge you and what you've stopped using; cancelling stays between you and the vendor.",
  },
  {
    q: 'Which currencies are supported?',
    a: 'Naira, cedi, shilling and rand alongside dollars, pounds, euros, Canadian and Australian dollars, and yen. Each subscription keeps the currency it actually bills in.',
  },
  {
    q: 'Can I use it without notifications?',
    a: 'Yes. Email reminders are on by default and push is opt-in; you can switch either off per subscription, as long as one channel stays on.',
  },
] as const;

/** Section wrapper. Reveals once, on scroll, and never again. */
function Reveal({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      variants={riseIn}
      initial='hidden'
      whileInView='show'
      viewport={{ once: true, margin: '-80px' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default function LandingPage({ isAuthenticated }: LandingPageProps) {
  const ctaHref = isAuthenticated ? '/dashboard' : '/login';
  const ctaLabel = isAuthenticated ? 'OPEN DASHBOARD' : 'START TRACKING';

  return (
    <div className='min-h-screen bg-paper'>
      {/* ===== Header ===== */}
      <header className='sticky top-0 z-30 flex h-[72px] items-center justify-between gap-6 border-b border-line bg-paper/92 px-5 backdrop-blur-xl sm:px-10'>
        <span className='font-display text-[19px] font-bold tracking-[0.14em]'>
          BLEED
        </span>

        <nav className='flex items-center gap-1'>
          <a
            href='#how'
            className='hidden rounded-sm px-3 py-2.5 font-mono text-[11px] tracking-[0.1em] text-ink/65 transition-colors hover:bg-line-soft hover:text-ink sm:block'
          >
            HOW IT WORKS
          </a>
          <a
            href='#faq'
            className='hidden rounded-sm px-3 py-2.5 font-mono text-[11px] tracking-[0.1em] text-ink/65 transition-colors hover:bg-line-soft hover:text-ink sm:block'
          >
            FAQ
          </a>

          {/* A sign-in link, which the page previously had at no breakpoint —
              returning users had to scroll into the hero to find a way in. */}
          {!isAuthenticated && (
            <Link
              href='/login'
              className='rounded-sm px-3 py-2.5 font-mono text-[11px] tracking-[0.1em] text-ink transition-colors hover:bg-line-soft'
            >
              SIGN&nbsp;IN
            </Link>
          )}

          <Link
            href={ctaHref}
            className='ml-1.5 rounded-sm bg-pine px-4 py-3 font-mono text-[11px] tracking-[0.1em] text-paper transition-colors hover:bg-pine-hover'
          >
            {ctaLabel}
          </Link>
        </nav>
      </header>

      {/* ===== Hero =====
          The headline animates TRANSFORM ONLY, never opacity. It is the LCP
          element, and an opacity-0 initial state is server-rendered as
          `style="opacity:0"` — so the text cannot paint until the JS bundle
          hydrates, which left the old page blank below the fold whenever
          scripting was slow or blocked. */}
      <section className='mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-14 px-5 py-16 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-24'>
        <div>
          <span className='font-mono text-label tracking-[0.18em] text-ink/50'>
            SUBSCRIPTION METER
          </span>

          <motion.h1
            initial={{ y: 14 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            className='mt-5 mb-0 font-display text-[44px] leading-[1.05] font-bold tracking-[-0.03em] text-balance sm:text-[60px]'
          >
            Stop paying for things you forgot you bought.
          </motion.h1>

          <motion.p
            initial={{ y: 12 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: EASE_OUT_EXPO }}
            className='mt-6 max-w-[52ch] text-[17px] leading-relaxed text-ink/70 text-pretty'
          >
            Forward one receipt. Bleed reads the amount, the billing cycle and
            the renewal date out of the email, logs it, and warns you three days
            before the money leaves &mdash; in your currency, at 9am your time.
          </motion.p>

          <div className='mt-9 flex flex-wrap items-center gap-3'>
            <motion.div {...press}>
              <Link
                href={ctaHref}
                className='inline-block rounded-sm bg-pine px-7 py-4 font-mono text-[12px] tracking-[0.12em] text-paper transition-colors hover:bg-pine-hover'
              >
                {ctaLabel}
              </Link>
            </motion.div>
            <a
              href='#how'
              className='rounded-sm border border-line bg-surface px-6 py-4 font-mono text-[12px] tracking-[0.12em] text-ink transition-colors hover:bg-line-soft'
            >
              SEE HOW IT WORKS
            </a>
          </div>

          <p className='mt-4 font-mono text-[11px] text-ink/50'>
            No card. No bank connection. No browser extension.
          </p>
        </div>

        {/* A real screen rather than a stock illustration. */}
        <motion.div
          variants={staggerContainer}
          initial='hidden'
          animate='show'
          className='overflow-hidden rounded-sm border border-line-strong bg-surface'
        >
          <div className='flex items-center justify-between border-b border-line px-4 py-3 font-mono text-label tracking-[0.14em] text-ink/50'>
            <span>MONTHLY BLEED</span>
            <span>NGN</span>
          </div>

          <div className='p-6'>
            <div className='flex items-baseline gap-[3px]'>
              <span className='font-mono text-[20px] text-ink/40 tnum'>
                &#8358;
              </span>
              <span className='font-display text-[48px] leading-none font-bold tracking-[-0.02em] tnum'>
                11,400
              </span>
              <span className='font-display text-[24px] text-ink/35 tnum'>
                .00
              </span>
            </div>

            <div className='my-5 flex h-1.5 gap-0.5'>
              {[
                { w: 79, c: 'var(--color-pine)' },
                { w: 22, c: 'var(--color-pine-60)' },
                { w: 13, c: 'var(--color-pine-35)' },
              ].map((seg, i) => (
                <motion.div
                  key={seg.c}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: 0.76,
                    delay: 0.25 + i * 0.09,
                    ease: EASE_OUT_EXPO,
                  }}
                  className='origin-left rounded-xs'
                  style={{ flexGrow: seg.w, background: seg.c }}
                />
              ))}
            </div>

            {[
              { name: 'Claude Pro', when: '2 DAYS', urgent: true },
              { name: 'Netflix', when: '5 DAYS', urgent: false },
              { name: 'Spotify Premium', when: 'UNUSED 74D', urgent: true },
            ].map((row) => (
              <div
                key={row.name}
                className='flex items-center gap-3 border-t border-line-soft py-2.5'
              >
                <span
                  className='h-5 w-[3px] rounded-xs'
                  style={{
                    background: row.urgent
                      ? 'var(--color-rust)'
                      : 'var(--color-pine)',
                  }}
                />
                <span className='flex-grow text-[13px]'>{row.name}</span>
                <span
                  className={`rounded-xs px-[7px] py-[3px] font-mono text-tag ${
                    row.urgent
                      ? 'bg-rust-tint text-rust'
                      : 'bg-line-soft text-ink/55'
                  }`}
                >
                  {row.when}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== How it works ===== */}
      <Reveal id='how' className='mx-auto max-w-[1240px] px-5 pb-20 sm:px-10'>
        <span className='font-mono text-label tracking-[0.18em] text-ink/50'>
          HOW IT WORKS
        </span>
        <h2 className='mt-4 max-w-[20ch] font-display text-[32px] font-bold tracking-[-0.02em] text-balance sm:text-[38px]'>
          Three steps, and only one of them is yours.
        </h2>

        <div className='mt-11 grid grid-cols-1 gap-5 md:grid-cols-3'>
          {STEPS.map((step) => (
            <motion.div
              key={step.index}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
              className='rounded-sm border border-line bg-surface p-7 transition-colors hover:border-line-strong'
            >
              <span className='font-mono text-[12px] text-pine tnum'>
                {step.index}
              </span>
              <h3 className='mt-3.5 font-display text-[19px] font-bold'>
                {step.title}
              </h3>
              <p className='mt-2.5 text-[14px] leading-relaxed text-ink/68'>
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </Reveal>

      {/* ===== Multi-currency ===== */}
      <Reveal className='mx-auto max-w-[1240px] px-5 pb-20 sm:px-10'>
        <div className='grid grid-cols-1 items-center gap-14 border-t border-line pt-18 lg:grid-cols-2'>
          <div>
            <span className='font-mono text-label tracking-[0.18em] text-ink/50'>
              MULTI-CURRENCY
            </span>
            <h2 className='mt-4 max-w-[22ch] font-display text-[30px] font-bold tracking-[-0.02em] text-balance sm:text-[34px]'>
              Your tools bill in dollars. You don&apos;t earn in dollars.
            </h2>
            <p className='mt-5 max-w-[50ch] text-[16px] leading-relaxed text-ink/70 text-pretty'>
              Bleed keeps every subscription in the currency it actually
              charges. Naira, cedi, shilling and rand alongside dollars, pounds
              and euros &mdash; not converted away and forgotten.
            </p>
          </div>

          <div className='rounded-sm border border-line bg-surface p-6'>
            {[
              { code: 'USD', count: '4 subscriptions', total: '$114.99' },
              { code: 'NGN', count: '3 subscriptions', total: '₦11,400' },
            ].map((row) => (
              <div
                key={row.code}
                className='flex items-center justify-between border-b border-line-soft py-3.5 last:border-b-0'
              >
                <span className='font-mono text-[12px] tracking-[0.06em]'>
                  {row.code}
                </span>
                <span className='ml-4 flex-grow text-[13px] text-ink/60'>
                  {row.count}
                </span>
                <span className='font-mono text-[16px] tnum'>{row.total}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ===== Trust =====
          Only claims that are true of the system as built. A retention and
          model-access statement belongs here too, but it has to come from the
          actual data policy rather than be drafted — see the design canvas,
          where that gap is marked. */}
      <Reveal className='mx-auto max-w-[1240px] px-5 pb-20 sm:px-10'>
        <div className='border-t border-line pt-18'>
          <span className='font-mono text-label tracking-[0.18em] text-ink/50'>
            YOUR EMAIL
          </span>
          <h2 className='mt-4 max-w-[24ch] font-display text-[30px] font-bold tracking-[-0.02em] text-balance sm:text-[34px]'>
            You&apos;re forwarding us your receipts. Here&apos;s what happens to
            them.
          </h2>

          <div className='mt-10 grid grid-cols-1 gap-5 md:grid-cols-2'>
            {[
              {
                title: 'NO BANK ACCESS',
                body: 'Bleed never connects to your bank or card. It reads emails you choose to forward, and nothing else.',
              },
              {
                title: 'ONE ADDRESS, YOURS',
                body: 'Your inbound address is randomly generated and tied to your account — not derived from your email, so it cannot be guessed from it.',
              },
            ].map((item) => (
              <div key={item.title} className='border-l-2 border-pine py-1 pl-5'>
                <h3 className='m-0 font-mono text-[11px] tracking-[0.12em]'>
                  {item.title}
                </h3>
                <p className='mt-2.5 text-[14px] leading-relaxed text-ink/68'>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ===== FAQ — native details/summary, so it works with no script ===== */}
      <Reveal id='faq' className='mx-auto max-w-[1240px] px-5 pb-20 sm:px-10'>
        <div className='grid grid-cols-1 gap-14 border-t border-line pt-18 lg:grid-cols-[280px_minmax(0,1fr)]'>
          <div>
            <span className='font-mono text-label tracking-[0.18em] text-ink/50'>
              FAQ
            </span>
            <h2 className='mt-4 font-display text-[30px] font-bold tracking-[-0.02em]'>
              Questions.
            </h2>
          </div>

          <div>
            {FAQ.map((entry, i) => (
              <details
                key={entry.q}
                open={i === 0}
                className='group border-b border-line'
              >
                <summary className='flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-[16px] [&::-webkit-details-marker]:hidden'>
                  {entry.q}
                  <span
                    aria-hidden='true'
                    className='relative h-3 w-3 shrink-0'
                  >
                    <span className='absolute top-[5px] left-0 h-0.5 w-3 bg-pine' />
                    <span className='absolute top-0 left-[5px] h-3 w-0.5 bg-pine transition-transform duration-200 ease-[var(--ease-out-expo)] group-open:rotate-90 group-open:opacity-0' />
                  </span>
                </summary>
                <p className='mt-0 mb-5 max-w-[78ch] text-[15px] leading-relaxed text-ink/70'>
                  {entry.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ===== Closing CTA ===== */}
      <section className='bg-ink text-paper'>
        <Reveal className='mx-auto max-w-[1240px] px-5 py-20 text-center sm:px-10'>
          <h2 className='m-0 font-display text-[34px] font-bold tracking-[-0.02em] text-balance sm:text-[42px]'>
            Find out what you&apos;re actually paying.
          </h2>
          <p className='mx-auto mt-4 max-w-[48ch] text-[16px] leading-relaxed text-paper/62'>
            One forwarded receipt is the whole setup. Most people are surprised
            by the second one.
          </p>
          <motion.div {...press} className='mt-8 inline-block'>
            <Link
              href={ctaHref}
              className='inline-block rounded-sm bg-pine px-8 py-4 font-mono text-[12px] tracking-[0.12em] text-paper transition-colors hover:bg-pine-hover'
            >
              {ctaLabel}
            </Link>
          </motion.div>
        </Reveal>
      </section>

      {/* ===== Footer ===== */}
      <footer className='border-t border-line'>
        <div className='mx-auto flex max-w-[1240px] flex-wrap items-start justify-between gap-12 px-5 py-12 sm:px-10'>
          <div>
            <span className='font-display text-[17px] font-bold tracking-[0.14em]'>
              BLEED
            </span>
            <p className='mt-3 font-mono text-[11px] text-ink/45'>
              &copy; {new Date().getFullYear()} &middot; Built by Yusuf Lawal
            </p>
          </div>

          <div className='flex flex-wrap gap-14'>
            <div className='flex flex-col gap-2.5'>
              <span className='font-mono text-label tracking-[0.14em] text-ink/40'>
                PRODUCT
              </span>
              <a
                href='#how'
                className='font-mono text-[12px] text-ink/70 hover:text-pine'
              >
                How it works
              </a>
              <a
                href='#faq'
                className='font-mono text-[12px] text-ink/70 hover:text-pine'
              >
                FAQ
              </a>
            </div>

            <div className='flex flex-col gap-2.5'>
              <span className='font-mono text-label tracking-[0.14em] text-ink/40'>
                ACCOUNT
              </span>
              <Link
                href='/login'
                className='font-mono text-[12px] text-ink/70 hover:text-pine'
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
