import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiUser,
  FiInbox,
  FiBell,
  FiAlertTriangle,
} from 'react-icons/fi';
import { createClient } from '@/lib/supabase/server';
import { DeleteAccountButton } from '@/app/features/auth/components/DeleteAccountButton';
import { UpdateAccountButton } from '@/app/features/auth/components/UpdateAccountButton';
import { NotificationSettings } from '@/app/features/notifications/components/NotificationSettings';
import { InboxAddress } from '../features/inbox/components/InboxAddress';
import { AnimatedIn } from '../components/ui/AnimatedIn';
import { AnimatedSection } from '../components/ui/AnimatedSection';

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('inbound_address')
    .eq('id', user.id)
    .single();

  const inboxAddress = profile
    ? `${profile.inbound_address}@${process.env.NEXT_PUBLIC_INBOUND_DOMAIN}`
    : '';

  const navItems = [
    { label: 'Account', href: '#account', icon: FiUser },
    { label: 'Inbox Address', href: '#inbox', icon: FiInbox },
    { label: 'Notifications', href: '#notifications', icon: FiBell },
    {
      label: 'Danger Zone',
      href: '#danger',
      icon: FiAlertTriangle,
      danger: true,
    },
  ];

  return (
    <AnimatedIn>
      <main className='mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 sm:py-8 scroll-smooth'>
        {/* Header Navigation */}
        <div className='mb-6 flex items-center justify-between sm:mb-8'>
          <div>
            <h1 className='font-display text-xl font-bold text-ink sm:text-3xl'>
              Settings
            </h1>
            <p className='mt-0.5 font-mono text-[11px] text-ink/50 sm:text-xs'>
              Manage your Bleed account, inbox routing, and preferences.
            </p>
          </div>

          <Link
            href='/dashboard'
            className='group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sage/60 bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition-all hover:border-sage hover:bg-sage/10'
          >
            <FiArrowLeft
              className='transition-transform duration-200 group-hover:-translate-x-0.5'
              size={14}
            />
            <span className='hidden sm:inline'>Dashboard</span>
          </Link>
        </div>

        {/* Sticky Mobile Bookmark Navigation Bar */}
        <div className='sticky top-2 z-20 -mx-4 mb-6 bg-paper/80 px-4 py-2 backdrop-blur-md sm:mx-0 sm:px-0 lg:hidden'>
          <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-none'>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs font-medium shadow-xs transition-all active:scale-95 ${
                  item.danger
                    ? 'border-red-200 bg-red-50/80 text-red-600 active:bg-red-100'
                    : 'border-sage/60 bg-white text-ink/70 hover:border-sage hover:text-ink active:bg-sage/20'
                }`}
              >
                <item.icon size={13} />
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className='grid gap-6 sm:gap-8 lg:grid-cols-[220px_minmax(0,1fr)]'>
          {/* Sticky Desktop Navigation */}
          <aside className='hidden lg:sticky lg:top-8 lg:flex lg:flex-col lg:gap-1 lg:self-start'>
            <span className='mb-2 px-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink/40'>
              Navigation
            </span>
            <nav className='flex flex-col gap-1 text-sm font-medium'>
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 font-mono text-xs transition-all ${
                    item.danger
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-ink/60 hover:bg-sage/20 hover:text-ink'
                  }`}
                >
                  <item.icon size={15} />
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </aside>

          {/* Settings Cards Column */}
          <div className='min-w-0 space-y-6 sm:space-y-8'>
            {/* 1. Account Section */}
            <AnimatedSection
              id='account'
              className='scroll-mt-20 sm:scroll-mt-10 rounded-2xl border border-sage/60 bg-white p-5 sm:p-6 shadow-xs transition-all hover:shadow-md'
            >
              <div className='border-b border-sage/30 pb-3 sm:pb-4'>
                <h2 className='font-display text-base font-bold text-ink sm:text-lg'>
                  Account Details
                </h2>
                <p className='mt-0.5 font-mono text-[11px] text-ink/50 sm:text-xs'>
                  Your current login credentials and email settings.
                </p>
              </div>

              <div className='mt-4 space-y-4 sm:mt-5'>
                <div className='rounded-xl border border-sage/50 bg-paper/60 p-3.5 sm:p-4'>
                  <span className='block font-mono text-[10px] font-semibold uppercase tracking-wider text-ink/40'>
                    Primary Email
                  </span>
                  <p className='mt-1 truncate font-mono text-xs font-medium text-ink sm:text-sm'>
                    {user.email}
                  </p>
                </div>

                <div className='pt-1'>
                  <UpdateAccountButton currentEmail={user.email ?? ''} />
                </div>
              </div>
            </AnimatedSection>

            {/* 2. Inbox Address Section */}
            <AnimatedSection
              id='inbox'
              className='scroll-mt-20 sm:scroll-mt-10 rounded-2xl border border-sage/60 bg-white p-5 sm:p-6 shadow-xs transition-all hover:shadow-md'
            >
              <div className='border-b border-sage/30 pb-3 sm:pb-4'>
                <h2 className='font-display text-base font-bold text-ink sm:text-lg'>
                  Inbound Receipt Address
                </h2>
                <p className='mt-0.5 font-mono text-[11px] text-ink/50 sm:text-xs'>
                  Forward subscription receipts or invoices to auto-log charges.
                </p>
              </div>

              <div className='mt-4 sm:mt-5'>
                <InboxAddress address={inboxAddress} />
              </div>
            </AnimatedSection>

            {/* 3. Notifications Section */}
            <AnimatedSection
              id='notifications'
              className='scroll-mt-20 sm:scroll-mt-10 rounded-2xl border border-sage/60 bg-white p-5 sm:p-6 shadow-xs transition-all hover:shadow-md'
            >
              <div className='border-b border-sage/30 pb-3 sm:pb-4'>
                <h2 className='font-display text-base font-bold text-ink sm:text-lg'>
                  Notification Preferences
                </h2>
                <p className='mt-0.5 font-mono text-[11px] text-ink/50 sm:text-xs'>
                  Choose when and how Bleed alerts you before upcoming renewals.
                </p>
              </div>

              <div className='mt-4 sm:mt-5'>
                <NotificationSettings />
              </div>
            </AnimatedSection>

            {/* 4. Danger Zone Section */}
            <AnimatedSection
              id='danger'
              className='scroll-mt-20 sm:scroll-mt-10 rounded-2xl border border-red-200 bg-red-50/40 p-5 sm:p-6 shadow-xs'
            >
              <div className='border-b border-red-200/60 pb-3 sm:pb-4'>
                <div className='flex items-center gap-2'>
                  <FiAlertTriangle className='text-red-600' size={18} />
                  <h2 className='font-display text-base font-bold text-red-700 sm:text-lg'>
                    Danger Zone
                  </h2>
                </div>
                <p className='mt-0.5 font-mono text-[11px] text-red-600/70 sm:text-xs'>
                  Irreversible actions regarding your account and subscription
                  history.
                </p>
              </div>

              <div className='mt-4 sm:mt-5'>
                <DeleteAccountButton email={user.email ?? ''} />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </main>
    </AnimatedIn>
  );
}
