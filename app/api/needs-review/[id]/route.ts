import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  apiOk,
  notFound,
  serverError,
  unauthorized,
  validationError,
} from '@/lib/api/response';

// The id goes straight into a filter. PostgREST rejects a malformed uuid with a
// 400 and a parser error, which the route then relayed to the client verbatim —
// validating here keeps that detail server-side and returns something readable.
const paramsSchema = z.object({ id: z.string().uuid() });

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) return validationError(parsedParams.error);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorized();

  // .select() after .delete() only takes the columns argument in this overload —
  // no second { count } option. Check data.length instead, same fix as the
  // subscriptions/[id] route.
  const { data, error } = await supabase
    .from('needs_review')
    .delete()
    .eq('id', parsedParams.data.id)
    .select('id');

  if (error) return serverError('dismissing needs-review item', error);

  if (!data || data.length === 0) return notFound('Review item not found.');

  return apiOk();
}
