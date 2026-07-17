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

  // Middleware already redirects unauthenticated requests, but a server component
  // should never assume that ran — check again here as a second, independent guard.
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

  // RLS scopes this to the current user automatically — no manual user_id filter needed.
  const { data: subscriptions, count } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact' })
    .order('monthly_equivalent', { ascending: false });

  const hasSubscriptions = (count ?? 0) > 0;

  if (!hasSubscriptions) {
    return <EmptyState inboxAddress={inboxAddress} />;
  }

  return (
    <Dashboard
      subscriptions={(subscriptions ?? []) as Subscription[]}
      inboxAddress={inboxAddress}
    />
  );
}
