import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { Resend } from 'resend';
import { extractSubscriptions } from '@/lib/email/groq';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
  return d.toISOString().slice(0, 10);
}

function defaultReminderAt(renewalDateStr: string) {
  const d = new Date(renewalDateStr);
  d.setDate(d.getDate() - 3);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
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

  for (const item of items) {
    if ('error' in item) {
      await supabaseAdmin.from('needs_review').insert({
        user_id: profile.id,
        subject,
        raw_email_snippet: emailBody.slice(0, 500),
        reason: item.error,
      });
      flaggedForReview++;
      continue;
    }

    const renewalDate =
      item.renewal_date ?? nextGuessedRenewalDate(item.billing_cycle);

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
      raw_email_snippet: emailBody.slice(0, 500),
    });

    if (error) {
      console.error(`[inbound-email] insert failed for "${item.name}":`, error);
      continue;
    }

    added++;
  }

  return NextResponse.json({ ok: true, added, flaggedForReview });
}
