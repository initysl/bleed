import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase';
import type { Subscription } from '@/types/subscription';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendRenewalPushNotification(subscription: Subscription) {
  const { data: devices } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*');

  if (!devices?.length) return;

  const payload = JSON.stringify({
    title: `${subscription.name} renews soon`,
    body: `$${subscription.price} on ${subscription.renewal_date} — cancel or keep?`,
  });

  await Promise.allSettled(
    devices.map((device) =>
      webpush.sendNotification(
        {
          endpoint: device.endpoint,
          keys: { p256dh: device.p256dh, auth: device.auth },
        },
        payload,
      ),
    ),
  );
}
