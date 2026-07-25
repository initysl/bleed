import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Deliberately NOT built from req.url — on some hosts (Railway included),
  // the request object a server-side route sees can reflect internal
  // container networking (e.g. localhost:8080) rather than the public domain,
  // since the reverse proxy doesn't always forward a Host header your app
  // trusts. An explicit site URL sidesteps that entirely.
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/login`);
}
