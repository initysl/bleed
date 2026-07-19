import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET — list the current user's unresolved needs-review items.
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from('needs_review')
    .select('id, subject, raw_email_snippet, reason, created_at')
    .eq('resolved', false)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data });
}
