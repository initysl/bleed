import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// For use in Server Components, Server Actions, and Route Handlers.
// This client is session-aware (via cookies) and respects RLS —
// it is NOT the same as the admin client in lib/supabase.ts.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component with no response to attach cookies to —
            // safe to ignore since middleware refreshes the session on every request.
          }
        },
      },
    },
  );
}
