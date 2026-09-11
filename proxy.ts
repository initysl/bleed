import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run the proxy on all routes except:
     * - ALL API routes. Every route under /api authenticates itself with
     *   getUser() and returns a 401 JSON body. Letting the proxy run there
     *   instead 307'd expired sessions to /login, and the fetch client then
     *   saw res.ok === true on the login page's HTML and returned undefined —
     *   so session expiry surfaced as a silently blank dashboard rather than
     *   a redirect. Route Handlers can write cookies directly, so excluding
     *   them here does not cost session refresh.
     * - Next.js internals
     * - All static assets (anything with a file extension)
     *
     * Examples skipped:
     * - /favicon.ico
     * - /robots.txt
     * - /sitemap.xml
     * - /manifest.json
     * - /sw.js
     * - /logo.svg
     * - /bleedlogo.svg
     * - /og-image.png
     * - /test.jpg
     * - /fonts/inter.woff2
     * - /icons/icon-192.png
     */
    '/((?!api(?:/|$)|_next/static|_next/image|.*\\..*$).*)',
  ],
};
