import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  apiOk,
  readJson,
  serverError,
  unauthorized,
  validationError,
} from '@/lib/api/response';
import {
  pushSubscriptionSchema,
  pushUnsubscribeSchema,
} from '@/lib/notifications/push-subscription-schema';
import { checkRateLimit, pushSubscribeLimiter } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorized();

  const rateLimitResponse = await checkRateLimit(
    pushSubscribeLimiter,
    user.id,
  );
  if (rateLimitResponse) return rateLimitResponse;

  const body = await readJson(req);
  const parsed = pushSubscriptionSchema.safeParse(body);

  if (!parsed.success) return validationError(parsed.error);

  const { endpoint, keys } = parsed.data;

  // Conflict target is (user_id, endpoint), not endpoint alone.
  //
  // While `endpoint` was globally unique and the upsert conflicted on it, a
  // request carrying another user's endpoint would try to rewrite that row's
  // user_id — handing the attacker the victim's notifications. Scoping the
  // conflict to the pair means a re-subscribe still updates this user's own
  // row, and a foreign endpoint can only ever create a row owned by the
  // caller, which RLS permits and which sends the attacker nothing.
  //
  // Requires the matching constraint in supabase/006_push_subscription_owner.sql.
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_id: user.id,
    },
    { onConflict: 'user_id,endpoint' },
  );

  if (error) return serverError('push subscribe', error);

  return apiOk();
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorized();

  const body = await readJson(req);
  const parsed = pushUnsubscribeSchema.safeParse(body);

  if (!parsed.success) return validationError(parsed.error);

  // Scoped by both endpoint AND user_id — RLS already prevents touching another
  // user's row, but the explicit user_id check makes that guarantee visible
  // here too, not just implicit in the database policy.
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', parsed.data.endpoint)
    .eq('user_id', user.id);

  if (error) return serverError('push unsubscribe', error);

  return apiOk();
}
