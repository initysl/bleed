import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  apiError,
  apiOk,
  readJson,
  serverError,
  unauthorized,
  validationError,
} from '@/lib/api/response';
import { accountLimiter, checkRateLimit } from '@/lib/rate-limit';

const deleteAccountSchema = z.object({
  confirmEmail: z.string().min(1),
});

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorized();

  const rateLimitResponse = await checkRateLimit(accountLimiter, user.id);
  if (rateLimitResponse) return rateLimitResponse;

  // Require the user's own email as an explicit confirmation string, server-side —
  // not just a client-side "are you sure" dialog, which could be bypassed by a
  // stray or scripted request. This is the actual gate against accidental deletion.
  const body = await readJson(req);
  const parsed = deleteAccountSchema.safeParse(body);

  if (!parsed.success) return validationError(parsed.error);

  // Both sides must be non-empty strings before comparing.
  //
  // The previous check was `body.confirmEmail !== user.email`. A malformed body
  // made the left side undefined, and for an identity with no email address
  // (phone or OAuth-only) the right side is undefined too — so the comparison
  // was false and the account was deleted with no confirmation at all. Requiring
  // a real string on both sides closes that, and an account with no email
  // address now fails closed rather than open.
  if (!user.email) {
    return apiError(
      'This account has no email address to confirm against. Contact support to delete it.',
      400,
    );
  }

  if (parsed.data.confirmEmail.trim() !== user.email) {
    return apiError('Email confirmation did not match.', 400);
  }

  // Deleting the auth user cascades to profiles, subscriptions, and
  // push_subscriptions automatically via the ON DELETE CASCADE foreign keys
  // already set up in the schema — no manual cleanup needed here.
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (error) return serverError('account deletion', error);

  return apiOk();
}
