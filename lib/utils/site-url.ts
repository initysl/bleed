// Railway's reverse proxy can make the `request.url` a server-side route sees
// reflect internal container networking (e.g. http://localhost:8080) rather
// than the public domain, because the Host header the app receives isn't
// necessarily the one the browser sent. Any redirect built from `request.url`
// can therefore send a real user to an address that doesn't exist outside the
// container. Every server-side redirect must be built from an explicitly
// configured public origin instead.
//
// `fallbackOrigin` (pass `request.nextUrl.origin`) is used only when
// NEXT_PUBLIC_SITE_URL is unset, so a missing env var degrades to the old
// behaviour rather than throwing a 500 mid-auth-flow.
export function siteOrigin(fallbackOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    // Tolerate a trailing slash in the env var so `${origin}/login` never
    // produces a double slash.
    return configured.replace(/\/+$/, '');
  }

  if (fallbackOrigin) return fallbackOrigin;

  throw new Error(
    'NEXT_PUBLIC_SITE_URL is not set and no fallback origin was provided',
  );
}

// Guards against an open redirect. A `next` parameter arrives from a link in an
// email, and Supabase's redirect allow-list is commonly configured with a `/**`
// wildcard, so an attacker can get an arbitrary value in here and have it
// delivered by a genuine, correctly-signed password-reset message.
//
// Only same-origin absolute paths are allowed. Both `https://evil.com` and the
// protocol-relative `//evil.com` must be rejected: `new URL(value, base)`
// discards the base for either one, so a bare startsWith('/') check is not
// enough on its own.
export function safeRedirectPath(
  next: string | null,
  fallback = '/dashboard',
): string {
  if (!next) return fallback;
  if (!next.startsWith('/')) return fallback;
  if (next.startsWith('//')) return fallback;
  // Backslashes are normalised to forward slashes by some user agents, which
  // turns "/\evil.com" into a protocol-relative URL after the check above.
  if (next.startsWith('/\\')) return fallback;
  return next;
}
