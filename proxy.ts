import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip: static assets, common public files (sw.js, manifest, icons, etc.),
    // and the two routes that authenticate themselves differently (the inbound
    // email webhook via Svix signature, the cron route via a bearer secret).
    // A service worker script MUST be served with a plain 200 — if middleware
    // redirects this request (e.g. to /login), the browser refuses to install
    // it at all, which is exactly what was happening before sw.js was excluded.
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|icons/|api/inbound-email|api/cron).*)',
  ],
};
