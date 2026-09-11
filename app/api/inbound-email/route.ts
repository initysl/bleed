import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { Resend } from 'resend';
import { extractSubscriptions } from '@/lib/email/groq';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit, inboundEmailLimiter } from '@/lib/rate-limit';
import { formatDateOnly, parseDateOnly } from '@/lib/utils/dates';

const resend = new Resend(process.env.RESEND_API_KEY);

function verifyWebhookSignature(rawBody: string, headers: Headers) {
  const webhook = new Webhook(process.env.RESEND_INBOUND_WEBHOOK_SECRET!);
  const svixHeaders = {
    'svix-id': headers.get('svix-id') ?? '',
    'svix-timestamp': headers.get('svix-timestamp') ?? '',
    'svix-signature': headers.get('svix-signature') ?? '',
  };
  return webhook.verify(rawBody, svixHeaders);
}

function nextGuessedRenewalDate(cycle: 'monthly' | 'yearly') {
  const d = new Date();
  if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return formatDateOnly(d);
}

function defaultReminderAt(renewalDateStr: string) {
  const d = parseDateOnly(renewalDateStr);
  d.setDate(d.getDate() - 3);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

// The model can return any date the email appears to state, including one in
// the past (a receipt for a charge that already happened) or an implausible one
// it hallucinated. A past renewal_date yields a reminder_at in the past, which
// the very next cron run fires immediately — the user gets a "renews in a few
// days" warning for something that already renewed.
const MAX_RENEWAL_YEARS_AHEAD = 2;

function isPlausibleRenewalDate(dateStr: string, now = new Date()): boolean {
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;

  const todayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const latest = new Date(todayUtc);
  latest.setUTCFullYear(latest.getUTCFullYear() + MAX_RENEWAL_YEARS_AHEAD);

  return parsed >= todayUtc && parsed <= latest;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let payload: {
    type: string;
    data: { email_id: string; subject: string; to: string[] };
  };
  try {
    payload = verifyWebhookSignature(rawBody, req.headers) as typeof payload;
  } catch {
    return NextResponse.json(
      { ok: false, reason: 'invalid signature' },
      { status: 401 },
    );
  }

  if (payload.type !== 'email.received') {
    return NextResponse.json({ ignored: true });
  }

  const { email_id, subject, to } = payload.data;
  const localPart = (to?.[0] ?? '').split('@')[0];

  if (!localPart) {
    return NextResponse.json(
      { ok: false, reason: 'no recipient address' },
      { status: 200 },
    );
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('inbound_address', localPart)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { ok: false, reason: 'unknown recipient' },
      { status: 200 },
    );
  }

  // Keyed by recipient, not by sender: the sender is trivially forged, and the
  // resource being protected (this user's rows, and the Groq spend incurred on
  // their behalf) belongs to the recipient.
  //
  // Returns 200 rather than 429 on purpose. A non-2xx makes Svix retry with
  // backoff, which would replay the same flood later instead of dropping it.
  const rateLimited = await checkRateLimit(inboundEmailLimiter, profile.id);
  if (rateLimited) {
    console.warn(`[inbound-email] rate limited recipient ${localPart}`);
    return NextResponse.json(
      { ok: false, reason: 'rate limited' },
      { status: 200 },
    );
  }

  // Idempotency. Svix retries any delivery it doesn't get a 2xx for, including
  // one that timed out AFTER this handler had already inserted rows, so without
  // this check a slow run duplicates every subscription it found. `email_id` is
  // Resend's own identifier for the message and is stable across retries.
  const { data: alreadyProcessed } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('source_email_id', email_id)
    .limit(1)
    .maybeSingle();

  if (alreadyProcessed) {
    return NextResponse.json({ ok: true, duplicate: true, added: 0 });
  }

  const { data: email, error: fetchError } =
    await resend.emails.receiving.get(email_id);

  if (fetchError || !email) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'could not fetch email body',
        error: fetchError?.message,
      },
      { status: 200 },
    );
  }

  const emailBody = email.text ?? email.html ?? '';
  const combined = `Subject: ${subject}\n\n${emailBody}`;

  // Always an array now — one item per distinct subscription found, so a
  // single email describing several charges no longer silently loses all
  // but one of them.
  const items = await extractSubscriptions(combined);

  let added = 0;
  let flaggedForReview = 0;

  // Anything that can't become a subscription becomes a review item instead.
  // Previously a failed insert was logged to the console and skipped, so the
  // subscription vanished with no trace the user could see.
  const flagForReview = async (reason: string) => {
    await supabaseAdmin.from('needs_review').insert({
      user_id: profile.id,
      subject,
      raw_email_snippet: emailBody.slice(0, 500),
      reason,
    });
    flaggedForReview++;
  };

  for (const item of items) {
    if ('error' in item) {
      await flagForReview(item.error);
      continue;
    }

    // Only trust a model-supplied date if it's actually plausible; otherwise
    // fall back to the guess, which is always in the future by construction.
    const renewalDate =
      item.renewal_date && isPlausibleRenewalDate(item.renewal_date)
        ? item.renewal_date
        : nextGuessedRenewalDate(item.billing_cycle);

    const { error } = await supabaseAdmin.from('subscriptions').insert({
      user_id: profile.id,
      name: item.name,
      price: item.price,
      currency: item.currency,
      billing_cycle: item.billing_cycle,
      renewal_date: renewalDate,
      billing_anchor_date: renewalDate,
      cycles_elapsed: 0,
      reminder_at: defaultReminderAt(renewalDate),
      source: 'email',
      source_email_id: email_id,
      raw_email_snippet: emailBody.slice(0, 500),
    });

    if (error) {
      console.error(`[inbound-email] insert failed for "${item.name}":`, error);
      await flagForReview(
        `Found "${item.name}" but couldn't save it automatically.`,
      );
      continue;
    }

    added++;
  }

  return NextResponse.json({ ok: true, added, flaggedForReview });
}
