import { Resend } from 'resend';
import type { Subscription } from '@/types/subscription';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendRenewalReminderEmail(
  to: string,
  subscription: Subscription,
) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_ADDRESS!,
    to,
    subject: `${subscription.name} renews in a few days — $${subscription.price}`,
    html: `
      <p><strong>${subscription.name}</strong> renews on ${subscription.renewal_date}.</p>
      <p>You'll be charged <strong>$${subscription.price}</strong> (${subscription.billing_cycle}).</p>
      <p>Decide now: cancel it, or let it renew.</p>
    `,
  });
}
