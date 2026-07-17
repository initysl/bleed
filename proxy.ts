import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip static assets and the routes that authenticate themselves differently:
    // the inbound email webhook (Svix signature) and the cron route (bearer secret).
    '/((?!_next/static|_next/image|favicon.ico|api/inbound-email|api/cron).*)',
  ],
};
