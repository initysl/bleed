import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Pages an unauthenticated visitor can reach. Matched with startsWith, so
// each entry protects its own sub-paths too (e.g. /reset-password?token=...).
const AUTH_ONLY_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Use getUser(), not getSession() — this validates the access token with
  // Supabase Auth instead of trusting the session cookie alone.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // "/" is the public marketing page — must be an EXACT match, not startsWith,
  // since every path starts with "/" and that would make everything "public".
  const isMarketingRoot = pathname === '/';
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const isPublicRoute = isMarketingRoot || isAuthOnlyRoute;

  // Unauthenticated users may only access public routes — everything else
  // (including /dashboard, /settings) requires a session.
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Authenticated users don't need to see auth pages (login/signup/etc) —
  // send them straight into the app. The marketing root ("/") is exempt:
  // an authenticated user can still visit it intentionally (to view the
  // page, demo it, etc.) rather than being bounced to /dashboard every time.
  if (user && isAuthOnlyRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}
