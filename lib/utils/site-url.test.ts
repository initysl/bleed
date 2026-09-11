import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from './site-url';

const ORIGIN = 'https://bleed.example';

// What actually matters is not what safeRedirectPath returns, but where the
// browser ends up once that value is resolved against the site origin — so
// every assertion goes through `new URL(...)` exactly as the route does.
const resolve = (next: string | null) =>
  new URL(safeRedirectPath(next), ORIGIN).href;

describe('safeRedirectPath', () => {
  it('keeps legitimate same-origin paths', () => {
    expect(resolve('/dashboard')).toBe(`${ORIGIN}/dashboard`);
    expect(resolve('/reset-password')).toBe(`${ORIGIN}/reset-password`);
    expect(resolve('/settings?tab=notifications')).toBe(
      `${ORIGIN}/settings?tab=notifications`,
    );
  });

  it('falls back when absent or empty', () => {
    expect(resolve(null)).toBe(`${ORIGIN}/dashboard`);
    expect(resolve('')).toBe(`${ORIGIN}/dashboard`);
  });

  it.each([
    ['absolute https', 'https://evil.example'],
    ['absolute http', 'http://evil.example'],
    ['protocol-relative', '//evil.example'],
    ['backslash-relative', '/\\evil.example'],
    ['javascript scheme', 'javascript:alert(1)'],
    ['data scheme', 'data:text/html,<script>alert(1)</script>'],
  ])('refuses to leave the origin: %s', (_label, hostile) => {
    const href = resolve(hostile);
    expect(href.startsWith(`${ORIGIN}/`)).toBe(true);
    expect(href).not.toContain('evil.example');
  });

  it('demonstrates what the unguarded version did', () => {
    // Kept as a regression witness: this is the behaviour the guard replaced.
    // Both of these silently discard the base URL.
    expect(new URL('https://evil.example', ORIGIN).href).toBe(
      'https://evil.example/',
    );
    expect(new URL('//evil.example', ORIGIN).href).toBe('https://evil.example/');
  });
});
