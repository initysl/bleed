import type { NextConfig } from 'next';

// Supabase's SSR cookie defaults are { sameSite: 'lax', httpOnly: false }, and
// the app doesn't override them. httpOnly: false means any script that runs on
// the page can read the session token, so a CSP is not a nicety here — it's the
// only thing standing between an injected script and full account takeover.
const securityHeaders = [
  // Clickjacking. frame-ancestors in the CSP below is the modern control, but
  // X-Frame-Options still covers older agents that ignore it.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop the browser from second-guessing a declared Content-Type, which is how
  // an uploaded or proxied file gets executed as script.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Send the full URL only to ourselves. A user's dashboard URL should not
  // travel to third parties in a Referer header.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Nothing in this app uses any of these.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  // Two years, subdomains included. Only sent over HTTPS by definition.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

// 'unsafe-inline' for styles is required by Tailwind's runtime-injected styles
// and by framer-motion, which sets inline style attributes on every animated
// element. 'unsafe-inline' for scripts is required by Next's inline bootstrap
// and flight payloads; removing it needs per-request nonces, which in turn
// needs every page to be dynamically rendered. That trade isn't worth making
// yet, so this policy is a meaningful reduction in attack surface rather than
// a complete one — it still blocks loading script from any foreign origin,
// which is what most injection attempts actually need.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  // Supabase (auth + postgrest + realtime) and the push services the service
  // worker talks to.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  // Nothing in the app posts a form cross-origin.
  "form-action 'self'",
  "object-src 'none'",
]
  .join('; ')
  .concat(';');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Every route, including API responses and static assets.
        source: '/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        ],
      },
    ];
  },
};

export default nextConfig;
