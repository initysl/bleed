import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { createClient } from '@/lib/supabase/server';
import { DeleteAccountButton } from '@/app/features/auth/components/DeleteAccountButton';
import { UpdateAccountButton } from '@/app/features/auth/components/UpdateAccountButton';
import { NotificationSettings } from '@/app/features/notifications/components/NotificationSettings';
import { InboxAddress } from '../features/inbox/components/InboxAddress';

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

  return (
    <main className='mx-auto w-full max-w-6xl px-6 py-16'>
      {/* Header */}
      <div className='mb-12 flex items-center justify-between'>
        <div>
          <h1 className='font-display text-4xl text-ink'>Settings</h1>
          <p className='font-mini mt-2 text-sm text-ink/55'>
            Manage your Bleed account and preferences.
          </p>
        </div>

        <Link
          href='/'
          className='group flex items-center gap-2 text-sm text-ink/50 transition hover:text-ink'
        >
          <FiArrowLeft
            className='transition-transform group-hover:-translate-x-1'
            size={18}
          />
        </Link>
      </div>

      <div className='grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]'>
        {/* Left column */}
        <aside className='hidden lg:flex lg:flex-col lg:gap-6 lg:sticky lg:top-10 lg:self-start'>
          <nav className='space-y-3 text-sm'>
            <p className='font-medium text-ink'>Account</p>
            <p className='text-ink/45'>Inbox</p>
            <p className='text-ink/45'>Notifications</p>
            <p className='text-rust'>Danger Zone</p>
          </nav>
        </aside>

        {/* Right column */}
        <div className='space-y-10'>
          {/* Account */}
          <section className='rounded-2xl border border-sage/60 bg-white/70 p-6 shadow-sm backdrop-blur'>
            <h2 className='font-display text-xl text-ink'>Account</h2>

            <p className='font-mini mt-1 text-sm text-ink/55'>
              Your login credentials.
            </p>

            <div className='mt-6 rounded-xl border border-sage bg-paper p-4'>
              <p className='text-xs uppercase tracking-wide text-ink/45'>
                Email
              </p>

              <p className='mt-1 text-base text-ink'>{user.email}</p>
            </div>

            <div className='mt-5'>
              <UpdateAccountButton currentEmail={user.email ?? ''} />
            </div>
          </section>

          {/* Inbox */}
          <section className='rounded-2xl border border-sage/60 bg-white/70 p-6 shadow-sm backdrop-blur'>
            <h2 className='font-display text-xl text-ink'>Inbox Address</h2>

            <p className='font-mini mt-1 text-sm text-ink/55'>
              Forward subscription receipts here.
            </p>

            <div className='mt-2'>
              <InboxAddress address={inboxAddress} />
            </div>
          </section>

          {/* Notifications */}
          <section className='rounded-2xl border border-sage/60 bg-white/70 p-6 shadow-sm backdrop-blur'>
            <h2 className='font-display text-xl text-ink'>Notifications</h2>

            <p className='font-mini mt-1 text-sm text-ink/55'>
              Configure reminder emails.
            </p>

            <div className='mt-6'>
              <NotificationSettings />
            </div>
          </section>

          {/* Danger */}
          <section className='rounded-2xl border border-red-300 bg-red-50/60 p-6 shadow-sm backdrop-blur'>
            <h2 className='font-display text-xl text-rust'>Danger Zone</h2>

            <p className='font-mini mt-1 text-sm text-rust/70'>
              These actions are permanent.
            </p>

            <div className='mt-6'>
              <DeleteAccountButton email={user.email ?? ''} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
