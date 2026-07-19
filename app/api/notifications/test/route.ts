import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPushToUser } from '@/lib/notifications/webpush';

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 },
    );
  }

  const result = await sendPushToUser(user.id, {
    title: 'Test notification',
    body: 'If you see this, push notifications are working.',
  });

  if (result.attempted === 0) {
    return NextResponse.json({
      ok: false,
      reason: 'no_devices',
      message:
        'No device is registered for push yet. Click Enable below first, and make sure your browser actually shows a permission prompt.',
    });
  }

  if (result.succeeded === 0) {
    return NextResponse.json({
      ok: false,
      reason: 'delivery_failed',
      message: `Found ${result.attempted} registered device(s), but delivery failed for all of them. Check your server logs for the specific error — a common cause is VAPID keys that don't match what was used when the device subscribed.`,
    });
  }

  return NextResponse.json({
    ok: true,
    message: `Sent to ${result.succeeded} of ${result.attempted} device(s).`,
  });
}
