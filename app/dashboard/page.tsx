import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/app/features/subscriptions/components/EmptyState';
import { Dashboard } from '@/app/features/subscriptions/components/Dashboard';
import type { Subscription } from '@/app/features/subscriptions/types';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // These three queries are independent, so they run concurrently. Awaited one
  // after another, the page's time-to-first-byte was the SUM of three Supabase
  // round-trips — and with no loading.tsx, the user stared at the previous page
  // for all of it.
  const [
    { data: profile },
    { data: subscriptions, count },
    { data: needsReview },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('inbound_address')
      .eq('id', user.id)
      .single(),
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .order('monthly_equivalent', { ascending: false }),
    supabase
      .from('needs_review')
      .select('id, subject, raw_email_snippet, reason, created_at')
      .eq('resolved', false)
      .order('created_at', { ascending: false }),
  ]);

  const inboxAddress = profile
    ? `${profile.inbound_address}@${process.env.NEXT_PUBLIC_INBOUND_DOMAIN}`
    : '';

  const hasSubscriptions = (count ?? 0) > 0;
  const hasReviewItems = (needsReview?.length ?? 0) > 0;

  if (!hasSubscriptions && !hasReviewItems) {
    return <EmptyState inboxAddress={inboxAddress} />;
  }

  return (
    <Dashboard
      initialSubscriptions={(subscriptions ?? []) as Subscription[]}
      initialNeedsReview={needsReview ?? []}
      inboxAddress={inboxAddress}
    />
  );
}
