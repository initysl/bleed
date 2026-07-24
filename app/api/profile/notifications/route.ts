import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    .from('profiles')
    .select('email_notifications_enabled')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data });
}

export async function PATCH(req: NextRequest) {
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

  const body = await req.json();

  if (typeof body.email_notifications_enabled !== 'boolean') {
    return NextResponse.json(
      { ok: false, error: 'invalid payload' },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from('profiles')
    .update({ email_notifications_enabled: body.email_notifications_enabled })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
