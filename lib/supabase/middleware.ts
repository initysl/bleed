import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Reachable in EITHER auth state, never redirected in either direction.
// Matched with startsWith, so each entry covers its own sub-paths.
//
// /auth/* holds the OTP-verification and signout handlers. They authenticate
// themselves and must be reachable while logged out — that is precisely who
// clicks a confirmation or password-reset link. Leaving them out of this list
// meant every such link bounced to /login and verifyOtp never ran.
//
// /reset-password is here rather than in AUTH_ONLY_ROUTES because by the time
// a user reaches it, verifyOtp has already established a recovery session.
// Treating it as an auth-only page bounced that user to /dashboard, so the
// reset form never rendered.
const PUBLIC_ROUTES = ['/auth', '/reset-password'];

// Reachable only while logged OUT. An authenticated visitor is sent to the app.
const AUTH_ONLY_ROUTES = ['/login', '/signup', '/forgot-password'];

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
  const isAlwaysPublic = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const isPublicRoute = isMarketingRoot || isAuthOnlyRoute || isAlwaysPublic;

  // Unauthenticated users may only access public routes — everything else
  // (including /dashboard, /settings) requires a session.
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Authenticated users don't need to see the login/signup/forgot pages —
  // send them straight into the app. The marketing root ("/") is exempt:
  // an authenticated user can still visit it intentionally (to view the
  // page, demo it, etc.) rather than being bounced to /dashboard every time.
  // PUBLIC_ROUTES are exempt too, since a user mid-password-reset holds a
  // recovery session and still needs to reach /reset-password.
  if (user && isAuthOnlyRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}
