import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeRedirectPath, siteOrigin } from '@/lib/utils/site-url';

// Handles the confirmation link sent to a user's email after signup, and the
// recovery link sent by the forgot-password flow.
//
// NOTE: this route must stay reachable by logged-OUT visitors — they are
// exactly who arrives here. See PUBLIC_ROUTES in lib/supabase/middleware.ts.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  // Never build the redirect from `request.url` — see siteOrigin() for why that
  // is unsafe on Railway.
  const origin = siteOrigin(request.nextUrl.origin);
  const next = safeRedirectPath(searchParams.get('next'));

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(
    new URL('/login?error=confirmation_failed', origin),
  );
}
