# Bleed

**Stop paying for subscriptions you forgot about.**

Bleed is a subscription tracker that removes the one thing that makes every other tracker fail: manual entry. Forward a receipt, or type a plain-English note — Bleed reads it, logs the price, currency, and renewal date automatically, and reminds you before anything renews so cancelling is a choice, not an accident.

---

## How it works

1. **Sign up** → get a private, auto-generated inbox address (`u-xxxxxxxxxx@yourdomain.com`)
2. **Forward a receipt** (or type something like *"signed up for Spotify, $11.99/month"*)
3. **Bleed reads it** — an LLM extraction layer pulls out the name, price, currency, billing cycle, and renewal date, validated at runtime before anything touches the database
4. **See your real total** — grouped by currency, never silently blended into one misleading number
5. **Get nudged before it renews** — email and/or push, on a schedule you control, recurring automatically every cycle with zero re-entry

Anything the model can't confidently parse lands in a review queue instead of vanishing.

## Features

- **Zero-entry logging** — forward an email or type plain text; manual add is a fallback, not the primary flow
- **Multi-subscription extraction** — one email describing several charges gets split into separate, correctly-priced entries, not merged or dropped
- **Multi-currency, never blended** — totals are shown per-currency, not averaged into a false single number
- **Drift-free renewals** — billing cycles are computed from a fixed anchor date, not chained off the previous cycle, so month-end dates (e.g. Jan 31) never silently drift
- **Dual-channel reminders** — email and push, independently toggleable per subscription and account-wide
- **Full account lifecycle** — sign-up, password reset, email change, account deletion, all with proper confirmation flows
- **Multi-tenant by design** — every row is isolated at the database level via Postgres Row-Level Security, not just application logic

