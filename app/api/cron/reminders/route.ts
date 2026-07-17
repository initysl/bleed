import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendRenewalReminderEmail } from '@/lib/resend';
import { sendRenewalPushNotification } from '@/lib/webpush';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();

  // Across all users — the admin client bypasses RLS here, which is intentional:
  // this is a trusted background job, not a request on behalf of one user.
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

    const dispatches: Promise<unknown>[] = [];

    if (sub.notify_email) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', sub.user_id)
        .single();

      if (profile?.email) {
        dispatches.push(sendRenewalReminderEmail(profile.email, sub));
      }
    }

    if (sub.notify_push) {
      dispatches.push(sendRenewalPushNotification(sub));
    }

    await Promise.all(dispatches);

    await supabaseAdmin
      .from('reminder_log')
      .insert({ subscription_id: sub.id, reminder_at: sub.reminder_at });

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
