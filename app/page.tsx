import { createClient } from '@/lib/supabase/server';
import LandingPage from './features/marketing/components/LandingPage';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LandingPage isAuthenticated={!!user} />;
}
