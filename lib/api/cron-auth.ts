import { timingSafeEqual } from 'node:crypto';

// Compares two strings without leaking their contents through timing.
// timingSafeEqual throws unless both buffers are the same length, and the
// length check itself must not short-circuit, so both sides are hashed to a
// fixed width first... except we don't need a hash here: comparing lengths
// first is acceptable because the secret's LENGTH is not the secret. What
// matters is that a correct prefix doesn't take measurably longer than an
// incorrect one, which is what timingSafeEqual provides.
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Authenticates the reminder cron.
//
// The previous check was `auth !== \`Bearer ${process.env.CRON_SECRET}\``. When
// CRON_SECRET is unset that template produces the literal string
// "Bearer undefined" — a guessable value that unlocks an endpoint running on
// the service-role key, which reads every user's subscriptions and sends mail
// and push on their behalf. Missing configuration must deny, not weaken.
export function isAuthorizedCronRequest(req: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error(
      '[cron] CRON_SECRET is not set — refusing all requests. See DEPLOYMENT.md.',
    );
    return false;
  }

  const header = req.headers.get('authorization');
  if (!header) return false;

  return safeEqual(header, `Bearer ${secret}`);
}
