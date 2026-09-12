# Deployment

Bleed is deployed on **Railway**.

This matters for one thing in particular: Railway has no equivalent of Vercel's
`vercel.json` crons. The repository used to contain a `vercel.json` declaring an
hourly schedule for `/api/cron/reminders`, which on Railway was inert — nothing
ever invoked it, so no reminder ever fired and the entire `reminder_at` model
was dead in production. That file has been removed so it stops implying a
schedule that doesn't exist.

## Required: the reminder cron

`GET /api/cron/reminders` must be invoked **hourly**. It does two things:
dispatches reminders whose `reminder_at` has passed, and advances subscriptions
whose `renewal_date` has passed to their next cycle. Nothing else calls it.

It authenticates with a bearer token, so it is safe to expose publicly:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  "$NEXT_PUBLIC_SITE_URL/api/cron/reminders"
```

Set this up as either:

1. **A Railway cron service** — add a second service in the same project, set
   its schedule to `0 * * * *`, and make its start command the `curl` above.
   It needs `CRON_SECRET` and `NEXT_PUBLIC_SITE_URL` in its environment.
2. **An external scheduler** (cron-job.org, GitHub Actions on a schedule, etc.)
   hitting the same URL with the same header.

Verify it works before trusting it:

```bash
# Expect {"ok":true,"sent":N,"advanced":N}
curl -i -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/reminders

# Expect 401
curl -i https://<domain>/api/cron/reminders
```

## Environment variables

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Used by the cron, inbound-email, account deletion, and push fan-out |
| `DATABASE_URL` | Direct Postgres connection. Not used by the app at runtime — only for running migrations and regenerating `supabase/000_baseline.sql` |
| `NEXT_PUBLIC_SITE_URL` | Public origin, e.g. `https://bleed.up.railway.app`. **Required** — every server-side redirect is built from it rather than from `request.url`, because Railway's proxy can make the request's host reflect internal container networking |
| `CRON_SECRET` | Bearer token for `/api/cron/reminders`. The route fails closed if this is unset |
| `GROQ_API_KEY` / `GROQ_MODEL` | Extraction model. `GROQ_MODEL` defaults to `openai/gpt-oss-20b` |
| `RESEND_API_KEY` | Outbound and inbound email |
| `RESEND_FROM_ADDRESS` | Sender for reminders |
| `RESEND_INBOUND_WEBHOOK_SECRET` | Svix signing secret for `/api/inbound-email` |
| `NEXT_PUBLIC_INBOUND_DOMAIN` | Domain shown after a user's inbound address |
| `VAPID_SUBJECT` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web push |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |

`NEXT_PUBLIC_INBOUND_ADDRESS` and `REMINDER_TO_EMAIL` appear in `.env.local` but
are not referenced anywhere in the code — they are leftovers and can be removed.

## Database

Schema and policies live in `supabase/`. `000_baseline.sql` is a `pg_dump` of
production and is the authoritative definition — apply it, not `schema.sql`.
See `supabase/README.md` for the migration procedure.
