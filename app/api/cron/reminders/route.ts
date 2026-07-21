import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendRenewalReminderEmail } from '@/lib/email/resend';
import { sendRenewalPushNotification } from '@/lib/notifications/webpush';
import { advanceToNextRenewal } from '@/lib/utils/dates';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const today = nowIso.slice(0, 10);

  // ---- Phase 1: dispatch any reminders whose time has come ----
  const { data: dueSubscriptions, error: dueError } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .lte('reminder_at', nowIso);

  if (dueError) {
    return NextResponse.json(
      { ok: false, error: dueError.message },
      { status: 500 },
    );
  }

  let sent = 0;
  for (const sub of dueSubscriptions ?? []) {
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
        dispatches.push(
          sendRenewalReminderEmail(profile.email, sub).catch((err) => {
            console.error(
              `[cron] email dispatch failed for subscription ${sub.id}:`,
              err,
            );
          }),
        );
      }
    }

    if (sub.notify_push) {
      dispatches.push(
        sendRenewalPushNotification(sub).catch((err) => {
          console.error(
            `[cron] push dispatch failed for subscription ${sub.id}:`,
            err,
          );
        }),
      );
    }

    await Promise.all(dispatches);

    await supabaseAdmin
      .from('reminder_log')
      .insert({ subscription_id: sub.id, reminder_at: sub.reminder_at });

    sent++;
  }

  // ---- Phase 2: advance any subscription whose renewal date has passed ----
  // Deliberately separate from phase 1 — reminder_at is always set before
  // renewal_date, so by the time a renewal_date has passed, that cycle's
  // reminder has already necessarily fired earlier in a previous run.
  // Advancing here computes the NEXT reminder_at, so future reminders keep
  // firing every cycle without the user re-entering anything.
  const { data: passedRenewals, error: passedError } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .lte('renewal_date', today);

  if (passedError) {
    return NextResponse.json(
      { ok: false, sent, error: passedError.message },
      { status: 500 },
    );
  }

  let advanced = 0;
  for (const sub of passedRenewals ?? []) {
    const result = advanceToNextRenewal({
      billingAnchorDate: new Date(sub.billing_anchor_date),
      billingCycle: sub.billing_cycle,
      cyclesElapsed: sub.cycles_elapsed,
      currentRenewalDate: new Date(sub.renewal_date),
      currentReminderAt: new Date(sub.reminder_at),
      now,
    });

    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        renewal_date: result.renewalDate.toISOString().slice(0, 10),
        reminder_at: result.reminderAt.toISOString(),
        cycles_elapsed: result.cyclesElapsed,
      })
      .eq('id', sub.id);

    if (updateError) {
      console.error(
        `[cron] failed to advance renewal for subscription ${sub.id}:`,
        updateError,
      );
      continue;
    }

    advanced++;
  }

  return NextResponse.json({ ok: true, sent, advanced });
}
