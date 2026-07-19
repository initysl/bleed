import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function DELETE(req: NextRequest) {
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

  // Require the user's own email as an explicit confirmation string, server-side —
  // not just a client-side "are you sure" dialog, which could be bypassed by a
  // stray or scripted request. This is the actual gate against accidental deletion.
  const body = await req.json().catch(() => ({}));
  if (body.confirmEmail !== user.email) {
    return NextResponse.json(
      { ok: false, error: 'email confirmation did not match' },
      { status: 400 },
    );
  }

  // Deleting the auth user cascades to profiles, subscriptions, and
  // push_subscriptions automatically via the ON DELETE CASCADE foreign keys
  // already set up in the schema — no manual cleanup needed here.
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
