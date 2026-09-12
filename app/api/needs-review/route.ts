import { createClient } from '@/lib/supabase/server';
import { apiOk, serverError, unauthorized } from '@/lib/api/response';

// GET — list the current user's unresolved needs-review items.
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorized();

  const { data, error } = await supabase
    .from('needs_review')
    .select('id, subject, raw_email_snippet, reason, created_at')
    .eq('resolved', false)
    .order('created_at', { ascending: false });

  if (error) return serverError('listing needs-review items', error);

  return apiOk(data);
}
