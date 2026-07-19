import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Subscription } from '@/app/features/subscriptions/types';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

interface PushPayload {
  title: string;
  body: string;
}

export interface PushSendResult {
  attempted: number;
  succeeded: number;
  failed: number;
}

// Shared delivery logic — used both by the real reminder cron and by the
// settings-page "send test notification" button, so both paths get the same
// logging and dead-subscription pruning instead of duplicating this.
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<PushSendResult> {
  const { data: devices } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (!devices?.length) {
    console.warn(
      `[push] no registered devices for user ${userId} — nothing sent`,
    );
    return { attempted: 0, succeeded: 0, failed: 0 };
  }

  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    devices.map((device) =>
      webpush.sendNotification(
        {
          endpoint: device.endpoint,
          keys: { p256dh: device.p256dh, auth: device.auth },
        },
        body,
      ),
    ),
  );

  let succeeded = 0;
  let failed = 0;

  await Promise.all(
    results.map(async (result, i) => {
      if (result.status === 'fulfilled') {
        succeeded++;
        return;
      }

      failed++;
      const device = devices[i];
      const statusCode = (result.reason as { statusCode?: number })?.statusCode;

      console.error(
        `[push] delivery failed for device ${device.id} (user ${userId}):`,
        result.reason,
      );

      if (statusCode === 404 || statusCode === 410) {
        await supabaseAdmin
          .from('push_subscriptions')
          .delete()
          .eq('id', device.id);
        console.warn(`[push] pruned expired subscription ${device.id}`);
      }
    }),
  );

  return { attempted: devices.length, succeeded, failed };
}

export async function sendRenewalPushNotification(subscription: Subscription) {
  await sendPushToUser(subscription.user_id, {
    title: `${subscription.name} renews soon`,
    body: `$${subscription.price} on ${subscription.renewal_date} — cancel or keep?`,
  });
}
