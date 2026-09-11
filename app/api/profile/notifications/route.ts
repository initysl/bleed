import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  apiOk,
  readJson,
  serverError,
  unauthorized,
  validationError,
} from '@/lib/api/response';

const notificationPrefsSchema = z.object({
  email_notifications_enabled: z.boolean(),
});

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorized();

  const { data, error } = await supabase
    .from('profiles')
    .select('email_notifications_enabled')
    .eq('id', user.id)
    .single();

  if (error) return serverError('reading notification preferences', error);

  return apiOk(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorized();

  const body = await readJson(req);
  const parsed = notificationPrefsSchema.safeParse(body);

  if (!parsed.success) return validationError(parsed.error);

  const { error } = await supabase
    .from('profiles')
    .update({
      email_notifications_enabled: parsed.data.email_notifications_enabled,
    })
    .eq('id', user.id);

  if (error) return serverError('updating notification preferences', error);

  return apiOk();
}
