import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run the proxy on all routes except:
     * - API routes that handle their own authentication
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
    '/((?!api/inbound-email|api/cron|_next/static|_next/image|.*\\..*$).*)',
  ],
};
