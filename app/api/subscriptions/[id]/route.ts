import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subscriptionUpdateSchema } from '@/app/features/subscriptions/schema';
import {
  apiError,
  apiOk,
  notFound,
  readJson,
  serverError,
  unauthorized,
  validationError,
} from '@/lib/api/response';
import { checkRateLimit, mutateSubscriptionLimiter } from '@/lib/rate-limit';

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  if (!user) return unauthorized();

  const rateLimitResponse = await checkRateLimit(
    mutateSubscriptionLimiter,
    user.id,
  );
  if (rateLimitResponse) return rateLimitResponse;

  const body = await readJson(req);
  if (body === null) return apiError('Expected a JSON body.', 400);

  const parsed = subscriptionUpdateSchema.safeParse(body);

  if (!parsed.success) return validationError(parsed.error);

  // If channel flags are being partially updated, check the merged result
  // against the row as it currently stands — but RLS already guarantees this
  // client can only see/touch its own row, so no separate ownership check needed.
  if (
    (parsed.data.notify_email === false &&
      parsed.data.notify_push === undefined) ||
    (parsed.data.notify_push === false &&
      parsed.data.notify_email === undefined)
  ) {
    const { data: current } = await supabase
      .from('subscriptions')
      .select('notify_email, notify_push')
      .eq('id', id)
      .single();

    if (current) {
      const nextEmail = parsed.data.notify_email ?? current.notify_email;
      const nextPush = parsed.data.notify_push ?? current.notify_push;
      if (!nextEmail && !nextPush) {
        return apiError('At least one reminder channel must stay enabled.', 400);
      }
    }
  }

  // .select() after .update() only takes the columns argument in this overload —
  // pass no second { count } option, and instead check whether any row came back.
  // If the user is manually setting a new renewal_date, that redefines the
  // cycle's origin — reset the anchor and cycle counter to match, so future
  // auto-advances compute forward from THIS date, not the old one.
  const updatePayload: typeof parsed.data & {
    billing_anchor_date?: string;
    cycles_elapsed?: number;
  } = { ...parsed.data };

  if (parsed.data.renewal_date) {
    updatePayload.billing_anchor_date = parsed.data.renewal_date;
    updatePayload.cycles_elapsed = 0;
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update(updatePayload)
    .eq('id', id)
    .select('id');

  if (error) return serverError('updating subscription', error);

  // RLS silently matches 0 rows if this id belongs to someone else, rather than erroring —
  // surface that as a 404 so the client isn't told "ok" for something that didn't happen.
  if (!data || data.length === 0) return notFound('Subscription not found.');

  return apiOk();
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  if (!user) return unauthorized();

  const rateLimitResponse = await checkRateLimit(
    mutateSubscriptionLimiter,
    user.id,
  );
  if (rateLimitResponse) return rateLimitResponse;

  const { data, error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) return serverError('deleting subscription', error);

  if (!data || data.length === 0) return notFound('Subscription not found.');

  return apiOk();
}
