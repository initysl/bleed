import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Dashboard } from '@/components/Dashboard';
import type { Subscription } from '@/types/subscription';
import { EmptyState } from '@/components/Emptystate';

export default async function DashboardPage() {
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

  const { data: subscriptions, count } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact' })
    .order('monthly_equivalent', { ascending: false });

  const { data: needsReview } = await supabase
    .from('needs_review')
    .select('id, subject, raw_email_snippet, reason, created_at')
    .eq('resolved', false)
    .order('created_at', { ascending: false });

  const hasSubscriptions = (count ?? 0) > 0;
  const hasReviewItems = (needsReview?.length ?? 0) > 0;

  // A pending review item still deserves visibility even with zero real
  // subscriptions yet — otherwise a failed parse would be invisible forever.
  if (!hasSubscriptions && !hasReviewItems) {
    return <EmptyState inboxAddress={inboxAddress} />;
  }

  return (
    <Dashboard
      subscriptions={(subscriptions ?? []) as Subscription[]}
      inboxAddress={inboxAddress}
      needsReview={needsReview ?? []}
    />
  );
}
