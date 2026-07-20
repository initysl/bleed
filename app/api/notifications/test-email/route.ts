import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendTestEmail } from '@/lib/email/resend';

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
