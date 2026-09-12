import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { siteOrigin } from '@/lib/utils/site-url';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Deliberately NOT built from request.url — see siteOrigin() in
  // lib/utils/site-url.ts for the Railway reverse-proxy reason. The helper also
  // supplies a fallback, so an unset NEXT_PUBLIC_SITE_URL no longer produces
  // the string "undefined/login" and a thrown TypeError.
  return NextResponse.redirect(
    new URL('/login', siteOrigin(request.nextUrl.origin)),
  );
}
