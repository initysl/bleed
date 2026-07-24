import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendTestEmail } from '@/lib/email/resend';
import { checkRateLimit, testEmailLimiter } from '@/lib/rate-limit';

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 },
    );
  }

  const rateLimitResponse = await checkRateLimit(testEmailLimiter, user.id);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await sendTestEmail(user.email);
    return NextResponse.json({ ok: true, message: `Sent to ${user.email}.` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({
      ok: false,
      message: `Delivery failed: ${message}`,
    });
  }
}
