import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { Resend } from 'resend';
import { extractSubscription } from '@/lib/email/groq';
import { supabaseAdmin } from '@/lib/supabase/admin';

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend signs webhook deliveries via Svix. Verifying this is what stops anyone
// who finds this URL from POSTing fabricated data straight into the database.
function verifyWebhookSignature(rawBody: string, headers: Headers) {
  const webhook = new Webhook(process.env.RESEND_INBOUND_WEBHOOK_SECRET!);

  const svixHeaders = {
    'svix-id': headers.get('svix-id') ?? '',
    'svix-timestamp': headers.get('svix-timestamp') ?? '',
    'svix-signature': headers.get('svix-signature') ?? '',
  };

  return webhook.verify(rawBody, svixHeaders);
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

  // Which user does this belong to? Match the local-part of the "to" address
  // (everything before @) against that user's stored inbound_address slug.
  const toAddress = to?.[0] ?? '';
  const localPart = toAddress.split('@')[0];

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
    // No user owns this address — could be a typo'd forward, or someone probing the endpoint.
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

  const extracted = await extractSubscription(combined);

  if ('error' in extracted) {
    // Couldn't confidently parse — surface this to the user instead of losing the email.
    await supabaseAdmin.from('needs_review').insert({
      user_id: profile.id,
      subject,
      raw_email_snippet: emailBody.slice(0, 500),
      reason: extracted.error,
    });
    return NextResponse.json(
      { ok: false, reason: extracted.error },
      { status: 200 },
    );
  }

  const renewalDate =
    extracted.renewal_date ?? nextGuessedRenewalDate(extracted.billing_cycle);

  // Explicit user_id here since this is the admin client — no session to default from.
  const { error } = await supabaseAdmin.from('subscriptions').insert({
    user_id: profile.id,
    name: extracted.name,
    price: extracted.price,
    currency: extracted.currency || 'USD',
    billing_cycle: extracted.billing_cycle,
    renewal_date: renewalDate,
    reminder_at: defaultReminderAt(renewalDate),
    source: 'email',
    raw_email_snippet: emailBody.slice(0, 500),
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
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
