import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const subscriptionInput = z
  .object({
    name: z.string().min(1),
    price: z.number().positive(),
    currency: z.string().length(3),
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

// GET — list the current user's subscriptions. Added specifically so TanStack Query
// has something to refetch from after a mutation invalidates its cache; the initial
// page load still gets its data server-side in app/page.tsx for a fast first paint.
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

  // RLS scopes this to the current user automatically.
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('monthly_equivalent', { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
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
  const parsed = subscriptionInput.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // No need to pass user_id explicitly — the column default (auth.uid()) fills it
  // in from this request's session, and the RLS "with check" clause enforces it.
  const { error } = await supabase.from('subscriptions').insert({
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
