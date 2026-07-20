import { Resend } from 'resend';
import type { Subscription } from '@/app/features/subscriptions/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendRenewalReminderEmail(
  to: string,
  subscription: Subscription,
) {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_ADDRESS!,
    to,
    subject: `${subscription.name} renews in a few days — $${subscription.price}`,
    html: `
      <p><strong>${subscription.name}</strong> renews on ${subscription.renewal_date}.</p>
      <p>You'll be charged <strong>$${subscription.price}</strong> (${subscription.billing_cycle}).</p>
      <p>Decide now: cancel it, or let it renew.</p>
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
    from: process.env.RESEND_FROM_ADDRESS!,
    to,
    subject: 'Bleed test email',
    html: "<p>If you're reading this, outbound email is working.</p>",
  });

  if (error) {
    console.error(`[email] test send failed to ${to}:`, error);
    throw new Error(error.message);
  }

  return data;
}
