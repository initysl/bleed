import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendRenewalReminderEmail } from '@/lib/email/resend';
import { sendRenewalPushNotification } from '@/lib/notifications/webpush';
import {
  advanceToNextRenewal,
  formatDateOnly,
  parseDateOnly,
} from '@/lib/utils/dates';
import { isAuthorizedCronRequest } from '@/lib/api/cron-auth';
import { apiError, serverError } from '@/lib/api/response';
import type { Subscription } from '@/app/features/subscriptions/types';

// PostgREST caps a response at 1000 rows by default. Both queries below used to
// take whatever that cap returned and call it "all of them", so past ~1000 due
// reminders the surplus was silently never sent and never advanced. Page
// explicitly instead.
const PAGE_SIZE = 500;

async function fetchAllPages<T>(
  build: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
): Promise<T[]> {
  const all: T[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await build(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return all;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return apiError('Not authorized.', 401);
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const today = nowIso.slice(0, 10);

  // ---- Phase 1: dispatch any reminders whose time has come ----
  let dueSubscriptions: Subscription[];
  try {
    dueSubscriptions = await fetchAllPages<Subscription>((from, to) =>
      supabaseAdmin
        .from('subscriptions')
        .select('*')
        .lte('reminder_at', nowIso)
        .order('id', { ascending: true })
        .range(from, to),
    );
  } catch (err) {
    return serverError('cron: loading due subscriptions', err);
  }

  // Which of these have already been sent? One query for the whole batch
  // rather than one per subscription inside the loop.
  const alreadySent = new Set<string>();
  if (dueSubscriptions.length > 0) {
    const { data: logRows, error: logError } = await supabaseAdmin
      .from('reminder_log')
      .select('subscription_id, reminder_at')
      .in(
        'subscription_id',
        dueSubscriptions.map((s) => s.id),
      );

    if (logError) return serverError('cron: loading reminder log', logError);

    for (const row of logRows ?? []) {
      alreadySent.add(`${row.subscription_id}@${row.reminder_at}`);
    }
  }

  const pending = dueSubscriptions.filter(
    (sub) => !alreadySent.has(`${sub.id}@${sub.reminder_at}`),
  );

  // Same again for the profile lookup, which used to run once per subscription
  // inside the dispatch loop.
  const profilesById = new Map<
    string,
    { email: string | null; email_notifications_enabled: boolean }
  >();
  const emailUserIds = [
    ...new Set(pending.filter((s) => s.notify_email).map((s) => s.user_id)),
  ];

  if (emailUserIds.length > 0) {
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, email_notifications_enabled')
      .in('id', emailUserIds);

    if (profileError) return serverError('cron: loading profiles', profileError);

    for (const p of profiles ?? []) {
      profilesById.set(p.id, {
        email: p.email,
        email_notifications_enabled: p.email_notifications_enabled,
      });
    }
  }

  let sent = 0;
  let failed = 0;

  for (const sub of pending) {
    // Claim the reminder BEFORE dispatching it.
    //
    // The log insert used to happen after Promise.all(dispatches). A crash, a
    // timeout, or a Railway restart in that window left the reminder unlogged
    // but already delivered, so the next hourly run sent it again — and the
    // one after that. The unique (subscription_id, reminder_at) constraint
    // makes this insert the atomic claim: whoever wins it owns the dispatch,
    // and a concurrent or retried run skips it.
    //
    // This trades at-least-once for at-most-once. For a renewal reminder that
    // is the right trade: a missed nudge is a minor annoyance, whereas
    // repeatedly emailing someone the same warning is what makes people mute
    // an app or unsubscribe entirely.
    const { error: claimError } = await supabaseAdmin
      .from('reminder_log')
      .insert({ subscription_id: sub.id, reminder_at: sub.reminder_at });

    if (claimError) {
      // Almost certainly the unique constraint: another run claimed it first.
      console.warn(
        `[cron] skipping subscription ${sub.id} — could not claim reminder:`,
        claimError.message,
      );
      continue;
    }

    const dispatches: Promise<unknown>[] = [];

    if (sub.notify_email) {
      const profile = profilesById.get(sub.user_id);

      // Two gates, both must pass: the per-subscription toggle (sub.notify_email,
      // checked above) AND the account-wide email preference set in Settings.
      if (profile?.email && profile.email_notifications_enabled) {
        dispatches.push(
          sendRenewalReminderEmail(profile.email, sub).catch((err) => {
            console.error(
              `[cron] email dispatch failed for subscription ${sub.id}:`,
              err,
            );
            failed++;
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
          failed++;
        }),
      );
    }

    await Promise.all(dispatches);
    sent++;
  }

  // ---- Phase 2: advance any subscription whose renewal date has passed ----
  // Deliberately separate from phase 1 — reminder_at is always set before
  // renewal_date, so by the time a renewal_date has passed, that cycle's
  // reminder has already necessarily fired earlier in a previous run.
  // Advancing here computes the NEXT reminder_at, so future reminders keep
  // firing every cycle without the user re-entering anything.
  //
  // Strictly less-than today, not lte: a subscription renewing TODAY has not
  // renewed yet as far as the user is concerned, and advancing it on the first
  // run of the day made the dashboard skip straight past "renews today" to
  // next month's date.
  let passedRenewals: Subscription[];
  try {
    passedRenewals = await fetchAllPages<Subscription>((from, to) =>
      supabaseAdmin
        .from('subscriptions')
        .select('*')
        .lt('renewal_date', today)
        .order('id', { ascending: true })
        .range(from, to),
    );
  } catch (err) {
    return serverError('cron: loading passed renewals', err);
  }

  let advanced = 0;
  for (const sub of passedRenewals) {
    // parseDateOnly for the two `date` columns, plain Date for reminder_at,
    // which is a timestamptz and therefore a real instant. Mixing those up is
    // what shifts a renewal by a day outside UTC.
    const result = advanceToNextRenewal({
      billingAnchorDate: parseDateOnly(sub.billing_anchor_date),
      billingCycle: sub.billing_cycle,
      cyclesElapsed: sub.cycles_elapsed,
      currentRenewalDate: parseDateOnly(sub.renewal_date),
      currentReminderAt: new Date(sub.reminder_at),
      now,
    });

    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        renewal_date: formatDateOnly(result.renewalDate),
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

  return NextResponse.json({ ok: true, sent, failed, advanced });
}
