import { supabaseAdmin } from '@/lib/supabase';

import { Dashboard } from '@/components/Dashboard';
import { EmptyState } from '@/components/Emptystate';

export default async function DashboardPage() {
  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .order('monthly_equivalent', { ascending: false });

  if (!subscriptions?.length) {
    return <EmptyState />;
  }

  return <Dashboard subscriptions={subscriptions} />;
}
