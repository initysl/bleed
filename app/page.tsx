import { supabaseAdmin } from '@/lib/supabase';

import { Dashboard } from '@/components/Dashboard';
import type { Subscription } from '@/types/subscription';
import { EmptyState } from '@/components/Emptystate';

export default async function DashboardPage() {
  const { data: subscriptions, count } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact' })
    .order('monthly_equivalent', { ascending: false });

  const hasSubscriptions = (count ?? 0) > 0;

  if (!hasSubscriptions) {
    return <EmptyState />;
  }

  return <Dashboard subscriptions={(subscriptions ?? []) as Subscription[]} />;
}
