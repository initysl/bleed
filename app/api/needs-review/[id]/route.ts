import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  // .select() after .delete() only takes the columns argument in this overload —
  // no second { count } option. Check data.length instead, same fix as the
  // subscriptions/[id] route.
  const { data, error } = await supabase
    .from('needs_review')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'not found' },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
