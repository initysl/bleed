import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

const subscriptionInput = z
  .object({
    name: z.string().min(1),
    price: z.number().positive(),
    billing_cycle: z.enum(['monthly', 'yearly']),
    renewal_date: z.iso.date(), // "YYYY-MM-DD"
    reminder_at: z.string().min(1), // ISO datetime
    notify_email: z.boolean(),
    notify_push: z.boolean(),
    category: z.string().nullable().optional(),
  })
  .refine((data) => data.notify_email || data.notify_push, {
    message: 'At least one reminder channel must be enabled',
  });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = subscriptionInput.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin.from('subscriptions').insert({
    ...parsed.data,
    source: 'manual',
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
