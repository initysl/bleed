import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// One named limiter per endpoint, each with its own budget. Sliding window is
// used rather than fixed window because fixed windows let someone send double
// their limit right at the boundary between two windows (e.g. 5 requests at
// 0:59, then 5 more at 1:01) — sliding window smooths that out.
export const testNotificationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '10 m'),
  prefix: 'ratelimit:test-notification',
});

export const testEmailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '10 m'),
  prefix: 'ratelimit:test-email',
});

// Generous but bounded — a real user manually adding or forwarding subscriptions
// will never come close to this; it exists purely to block scripted spam.
export const createSubscriptionLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  prefix: 'ratelimit:create-subscription',
});

// Returns a ready-to-send 429 response if the limit was hit, or null if the
// caller should proceed. Identified by user ID rather than IP, since every
// route this protects already requires an authenticated session.
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string,
): Promise<NextResponse | null> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (success) return null;

  return NextResponse.json(
    {
      ok: false,
      message: 'Too many requests. Try again in a few minutes.',
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    },
  );
}
