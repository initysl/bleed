import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

// One response shape for every API route:
//   success -> { ok: true,  data?: ... }
//   failure -> { ok: false, error: string, details?: unknown }
//
// `error` is ALWAYS a plain human-readable string. Routes previously returned
// whatever shape was convenient — a raw Postgres error.message, a zod
// treeifyError object, a bare string — so the fetch client had to guess, and
// guessed wrong (it looked for `error.formErrors`, which zod v4 does not emit).
// Anything a caller might want to inspect further goes in `details`, never in
// `error`.

export function apiOk<T>(data?: T) {
  return NextResponse.json(data === undefined ? { ok: true } : { ok: true, data });
}

export function apiError(
  error: string,
  status: number,
  details?: unknown,
) {
  return NextResponse.json(
    details === undefined ? { ok: false, error } : { ok: false, error, details },
    { status },
  );
}

export function unauthorized() {
  return apiError('Not signed in.', 401);
}

export function notFound(what = 'Not found.') {
  return apiError(what, 404);
}

// Never let a database error reach the client. Postgres messages leak column
// names, constraint names and RLS policy details, and none of it is actionable
// for a user. Log the real thing, return something generic.
export function serverError(context: string, cause: unknown) {
  console.error(`[api] ${context}:`, cause);
  return apiError('Something went wrong. Please try again.', 500);
}

// Surfaces the first zod issue as the message, so a form can display it
// directly, while keeping the full issue list in `details`.
export function validationError(error: ZodError) {
  const first = error.issues[0];
  const message = first
    ? first.path.length > 0
      ? `${first.path.join('.')}: ${first.message}`
      : first.message
    : 'Invalid request.';

  return apiError(message, 400, error.issues);
}

// `await req.json()` throws on an empty or non-JSON body, which surfaced as an
// unhandled 500 with a stack trace in the logs. Returns null instead so callers
// can answer with a 400.
export async function readJson(req: Request): Promise<unknown | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
