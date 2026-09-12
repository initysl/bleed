import { z } from 'zod';

// Hosts that are actually push services. `endpoint` is an arbitrary URL supplied
// by the client that the server later POSTs to via web-push — without an
// allowlist that is a blind SSRF primitive pointed at anything the container can
// reach, including cloud metadata endpoints and internal services.
//
// Matched against the URL's hostname: an entry is either an exact host or a
// suffix beginning with "." that matches that domain and its subdomains.
const ALLOWED_PUSH_HOSTS = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  '.push.services.mozilla.com',
  '.notify.windows.com',
  '.push.apple.com',
] as const;

function isAllowedPushEndpoint(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  // No http://, no file://, no gopher:// — and https also rules out redirect
  // games against plaintext internal services.
  if (url.protocol !== 'https:') return false;

  const host = url.hostname.toLowerCase();

  return ALLOWED_PUSH_HOSTS.some((allowed) =>
    allowed.startsWith('.')
      ? host.endsWith(allowed) || host === allowed.slice(1)
      : host === allowed,
  );
}

// The browser's PushSubscription.toJSON() shape. Previously this body was read
// as `await req.json()` and dereferenced as `sub.keys.p256dh` with no checks at
// all, so any body lacking `keys` threw a TypeError and returned an unhandled
// 500.
export const pushSubscriptionSchema = z.object({
  endpoint: z
    .string()
    .url()
    .max(1000)
    .refine(isAllowedPushEndpoint, {
      message: 'endpoint is not a recognised push service URL',
    }),
  keys: z.object({
    p256dh: z.string().min(1).max(255),
    auth: z.string().min(1).max(255),
  }),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
