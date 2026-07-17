import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

const subscriptionUpdate = z
  .object({
    name: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    billing_cycle: z.enum(['monthly', 'yearly']).optional(),
    renewal_date: z.string().date().optional(),
    reminder_at: z.string().min(1).optional(),
    notify_email: z.boolean().optional(),
    notify_push: z.boolean().optional(),
    category: z.string().nullable().optional(),
    last_used_at: z.string().date().nullable().optional(),
  })
  .refine(
    (data) =>
      data.notify_email === undefined && data.notify_push === undefined
        ? true
        : data.notify_email !== false || data.notify_push !== false,
    { message: 'At least one reminder channel must stay enabled' },
  );

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = subscriptionUpdate.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // If channel flags are being updated, fetch the current row first so the
  // "at least one channel" rule can be checked against the merged result,
  // not just the fields present in this particular request.
  if (
    (parsed.data.notify_email === false &&
      parsed.data.notify_push === undefined) ||
    (parsed.data.notify_push === false &&
      parsed.data.notify_email === undefined)
  ) {
    const { data: current } = await supabaseAdmin
      .from('subscriptions')
      .select('notify_email, notify_push')
      .eq('id', id)
      .single();

    if (current) {
      const nextEmail = parsed.data.notify_email ?? current.notify_email;
      const nextPush = parsed.data.notify_push ?? current.notify_push;
      if (!nextEmail && !nextPush) {
        return NextResponse.json(
          {
            ok: false,
            error: 'At least one reminder channel must stay enabled',
          },
          { status: 400 },
        );
      }
    }
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
