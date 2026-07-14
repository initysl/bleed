import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { extractSubscription } from '@/lib/groq';
import { supabaseAdmin } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend sends a POST with { type: "email.received", data: { email_id, subject, from, ... } }
// Note: the webhook payload only contains metadata — the actual body has to be
// fetched separately via the Receiving API using the email_id.
export async function POST(req: NextRequest) {
  const payload = await req.json();

  if (payload.type !== 'email.received') {
    return NextResponse.json({ ignored: true });
  }

  const { email_id, subject } = payload.data;

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
    // Couldn't confidently parse — surface this somewhere visible later (e.g. a "needs review" inbox)
    return NextResponse.json(
      { ok: false, reason: extracted.error },
      { status: 200 },
    );
  }

  const { error } = await supabaseAdmin.from('subscriptions').insert({
    name: extracted.name,
    price: extracted.price,
    billing_cycle: extracted.billing_cycle,
    renewal_date:
      extracted.renewal_date ?? nextGuessedRenewalDate(extracted.billing_cycle),
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

// Fallback if the email doesn't mention a renewal date: assume the cycle starts today
function nextGuessedRenewalDate(cycle: 'monthly' | 'yearly') {
  const d = new Date();
  if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}
