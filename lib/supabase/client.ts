import { createBrowserClient } from '@supabase/ssr';

// For use in Client Components — reads/writes the session via browser cookies.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
