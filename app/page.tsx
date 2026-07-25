import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

// Public, unauthenticated marketing page — this is what social media
// crawlers, search engines, and first-time visitors actually see. Deliberately
// does NOT redirect based on auth state (middleware already sends logged-in
// users straight to /dashboard) — this component only needs to know whether
// to say "Sign in" or "Open dashboard" in the CTA.
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-20 text-center'>
      <div className='flex flex-col items-center gap-4'>
        <h1 className='font-display text-5xl font-medium text-ink'>Bleed</h1>
        <p className='max-w-md text-lg text-ink/60'>
          Forward a subscription receipt and Bleed logs it automatically — no
          manual entry. See your real monthly spend, and get reminded before
          anything renews.
        </p>
      </div>

      <Link
        href={user ? '/dashboard' : '/login'}
        className='rounded-md bg-pine px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-pine/90'
      >
        {user ? 'Open dashboard' : 'Get started'}
      </Link>

      <div className='mt-12 grid w-full max-w-2xl grid-cols-1 gap-6 text-left sm:grid-cols-3'>
        <div className='flex flex-col gap-1'>
          <p className='text-sm font-medium text-ink'>Forward, don't type</p>
          <p className='text-sm text-ink/60'>
            Send a receipt to your inbox address — Bleed reads it and logs it.
          </p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-sm font-medium text-ink'>See the real total</p>
          <p className='text-sm text-ink/60'>
            Every subscription, sorted by cost, in your actual currency.
          </p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-sm font-medium text-ink'>
            Decide before it renews
          </p>
          <p className='text-sm text-ink/60'>
            Email and push reminders a few days before you're charged again.
          </p>
        </div>
      </div>
    </main>
  );
}
