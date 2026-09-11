import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subscriptionCreateSchema } from '@/app/features/subscriptions/schema';
import { checkRateLimit, createSubscriptionLimiter } from '@/lib/rate-limit';
import {
  apiError,
  apiOk,
  readJson,
  serverError,
  unauthorized,
  validationError,
} from '@/lib/api/response';

// GET — list the current user's subscriptions. Added specifically so TanStack Query
// has something to refetch from after a mutation invalidates its cache; the initial
// page load still gets its data server-side in app/page.tsx for a fast first paint.
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorized();

  // RLS scopes this to the current user automatically.
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('monthly_equivalent', { ascending: false });

  if (error) return serverError('listing subscriptions', error);

  return apiOk(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorized();

  const rateLimitResponse = await checkRateLimit(
    createSubscriptionLimiter,
    user.id,
  );
  if (rateLimitResponse) return rateLimitResponse;

  const body = await readJson(req);
  if (body === null) return apiError('Expected a JSON body.', 400);

  const parsed = subscriptionCreateSchema.safeParse(body);

  if (!parsed.success) return validationError(parsed.error);

  // No need to pass user_id explicitly — the column default (auth.uid()) fills it
  // in from this request's session, and the RLS "with check" clause enforces it.
  // billing_anchor_date is fixed to the renewal_date set right now — this is the
  // origin point every future cycle gets computed from (see advanceToNextRenewal
  // in lib/utils/dates.ts), never recomputed from a previous cycle's date.
  const { error } = await supabase.from('subscriptions').insert({
    ...parsed.data,
    billing_anchor_date: parsed.data.renewal_date,
    cycles_elapsed: 0,
    source: 'manual',
  });

  if (error) return serverError('creating subscription', error);

  return apiOk();
}
