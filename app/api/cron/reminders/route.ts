import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendRenewalReminderEmail } from '@/lib/resend';
import { sendRenewalPushNotification } from '@/lib/webpush';

const REMINDER_LEAD_DAYS = 3;
const USER_EMAIL = process.env.REMINDER_TO_EMAIL!; // single-user v1

export async function GET(req: NextRequest) {
  // Vercel Cron calls this with a secret header — reject anything else
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + REMINDER_LEAD_DAYS);
  const targetDateStr = targetDate.toISOString().slice(0, 10);

  const { data: dueSubscriptions, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('renewal_date', targetDateStr);

  if (error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  if (!dueSubscriptions?.length)
    return NextResponse.json({ ok: true, sent: 0 });

  let sent = 0;
  for (const sub of dueSubscriptions) {
    // Skip if we've already sent a reminder for this exact renewal date
    const { data: alreadySent } = await supabaseAdmin
      .from('reminder_log')
      .select('id')
      .eq('subscription_id', sub.id)
      .eq('renewal_date', sub.renewal_date)
      .maybeSingle();

    if (alreadySent) continue;

    await Promise.all([
      sendRenewalReminderEmail(USER_EMAIL, sub),
      sendRenewalPushNotification(sub),
    ]);

    await supabaseAdmin
      .from('reminder_log')
      .insert({ subscription_id: sub.id, renewal_date: sub.renewal_date });

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
