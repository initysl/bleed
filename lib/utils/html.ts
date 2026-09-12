// Escapes a value for interpolation into an HTML email body.
//
// This matters more here than it would in the app itself. A subscription's
// `name` originates from whatever arrived at a user's inbound address — an
// address any stranger can mail — and is only loosely constrained by the
// extraction schema. Interpolated raw, a crafted receipt yielding a name like
//   <a href="https://phish.example">Update your billing</a>
// produces a convincing phishing message sent from Bleed's own verified
// domain, so it passes SPF and DKIM. React escapes the web UI for free; email
// templates are hand-built strings and get no such protection.
export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
