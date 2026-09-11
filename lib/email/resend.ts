import { Resend } from 'resend';
import type { Subscription } from '@/app/features/subscriptions/types';
import { escapeHtml } from '@/lib/utils/html';
import { formatMoney } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendRenewalReminderEmail(
  to: string,
  subscription: Subscription,
) {
  // Every interpolated value is escaped: `name` in particular is attacker-
  // controllable via the inbound address, and this message is sent from a
  // domain the recipient trusts. See lib/utils/html.ts.
  const name = escapeHtml(subscription.name);
  const amount = escapeHtml(
    formatMoney(subscription.price, subscription.currency),
  );
  const renewsOn = escapeHtml(formatDate(subscription.renewal_date));
  const cycle = escapeHtml(subscription.billing_cycle);

  const { data, error } = await resend.emails.send({
    from: `Bleed <${process.env.RESEND_FROM_ADDRESS}>`,
    to,
    // The subject is plain text, so it takes the unescaped values — but it
    // still uses formatMoney rather than a hardcoded "$", which reported an
    // NGN subscription as "$15000".
    subject: `${subscription.name} renews in a few days — ${formatMoney(
      subscription.price,
      subscription.currency,
    )}`,
    html: `
      <p><strong>${name}</strong> renews on ${renewsOn}.</p>
      <p>You'll be charged <strong>${amount}</strong> (${cycle}).</p>
      <p>Decide now: cancel it, or let it renew.</p>
      <p style="color:#888; font-size:12px; margin-top:24px;">
        This is an automated message — replies to this address aren't monitored.
      </p>
    `,
  });

  // resend.emails.send() does NOT throw on API-level failures (unverified domain,
  // the sandbox "can only send to your own address" restriction, etc.) — it just
  // returns { error } and resolves normally. Not checking this was why reminder
  // emails could silently never arrive with zero visibility anywhere.
  if (error) {
    console.error(`[email] send failed to ${to}:`, error);
    throw new Error(error.message);
  }

  return data;
}

export async function sendTestEmail(to: string) {
  const { data, error } = await resend.emails.send({
    from: `Bleed <${process.env.RESEND_FROM_ADDRESS}>`,
    to,
    subject: 'Bleed test email',
    html: `
      <p>If you're reading this, outbound email is working.</p>
      <p style="color:#888; font-size:12px; margin-top:24px;">
        This is an automated message — replies to this address aren't monitored.
      </p>
    `,
  });

  if (error) {
    console.error(`[email] test send failed to ${to}:`, error);
    throw new Error(error.message);
  }

  return data;
}
