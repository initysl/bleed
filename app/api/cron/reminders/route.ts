import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendRenewalReminderEmail } from '@/lib/resend';
import { sendRenewalPushNotification } from '@/lib/webpush';

const USER_EMAIL = process.env.REMINDER_TO_EMAIL!; // single-user v1

export async function GET(req: NextRequest) {
  // Vercel Cron calls this with a secret header — reject anything else
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();

  // Anything whose user-chosen reminder time has passed and hasn't been sent yet.
  // No lead-time math here — reminder_at is exactly when the user asked to be reminded.
  const { data: dueSubscriptions, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .lte('reminder_at', now);

  if (error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  if (!dueSubscriptions?.length)
    return NextResponse.json({ ok: true, sent: 0 });

  let sent = 0;
  for (const sub of dueSubscriptions) {
    const { data: alreadySent } = await supabaseAdmin
      .from('reminder_log')
      .select('id')
      .eq('subscription_id', sub.id)
      .eq('reminder_at', sub.reminder_at)
      .maybeSingle();

    if (alreadySent) continue;

    // Exactly two channels. Only fire the ones the user actually enabled for this subscription.
    const dispatches: Promise<unknown>[] = [];
    if (sub.notify_email)
      dispatches.push(sendRenewalReminderEmail(USER_EMAIL, sub));
    if (sub.notify_push) dispatches.push(sendRenewalPushNotification(sub));

    await Promise.all(dispatches);

    await supabaseAdmin
      .from('reminder_log')
      .insert({ subscription_id: sub.id, reminder_at: sub.reminder_at });

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
