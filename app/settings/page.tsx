import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { createClient } from '@/lib/supabase/server';
import { DeleteAccountButton } from '@/app/features/auth/components/DeleteAccountButton';
import { UpdateAccountButton } from '@/app/features/auth/components/UpdateAccountButton';

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
    <main className='mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 px-6 py-16'>
      <div className='flex items-center justify-between'>
        <h1 className='font-(family-name:--font-display) text-2xl font-medium text-ink'>
          Settings
        </h1>
        <Link
          href='/'
          className='flex items-center gap-1 text-sm text-ink/50 hover:text-ink/70'
        >
          <FiArrowLeft className='h-3.5 w-3.5' />
          Back to dashboard
        </Link>
      </div>

      <section className='flex flex-col gap-2'>
        <p className='text-xs font-medium uppercase tracking-wide text-ink/50'>
          Account
        </p>
        <div className='rounded-lg border border-sage bg-white/60 px-4 py-3'>
          <p className='text-sm text-ink'>{user.email}</p>
        </div>
        <UpdateAccountButton currentEmail={user.email ?? ''} />
      </section>

      <section className='flex flex-col gap-2'>
        <p className='text-xs font-medium uppercase tracking-wide text-ink/50'>
          Your inbox address
        </p>
        <div className='rounded-lg border border-sage bg-white/60 px-4 py-3'>
          <p className='font-mono text-sm text-ink'>{inboxAddress}</p>
        </div>
      </section>

      <section className='flex flex-col gap-2'>
        <p className='text-xs font-medium uppercase tracking-wide text-rust'>
          Danger zone
        </p>
        <DeleteAccountButton email={user.email ?? ''} />
      </section>
    </main>
  );
}
