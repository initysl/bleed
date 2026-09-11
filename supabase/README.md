# Database

## Resolved: the schema is now in version control

Migrations `001` and `002` were never committed, so every `user_id` column, the
`profiles` table, the signup trigger and every RLS policy existed only in the
live database — nothing in the repo could be reviewed against what was actually
running. `000_baseline.sql` is now a real `pg_dump` of production and closes
that gap. Apply **that** file to recreate the database, not `schema.sql`, which
predates the ownership model entirely.

Running `VERIFY.sql` against production showed the live database was in good
shape: RLS enabled on all five tables, each with an `auth.uid()` policy. The API
layer's "RLS handles it" comments were accurate — they simply had no evidence in
the repo. Two genuine holes turned up, both fixed in `005`:

1. **`profiles` had a SELECT policy but no UPDATE policy.** With RLS on, the
   owning user's UPDATE matched no policy and silently affected zero rows.
   PostgREST returns no error for a zero-row update, so
   `PATCH /api/profile/notifications` answered `ok:true` while changing nothing.
   The email-notification toggle in Settings had never worked — and because the
   reminder cron gates on `email_notifications_enabled`, anyone who switched
   email reminders off kept receiving them.

2. **`push_subscriptions.user_id` was nullable.** A null owner satisfies no
   `auth.uid() = user_id` policy, so such a row belongs to nobody: invisible to
   the user it was meant for, while still being fanned out to by the
   service-role cron.

A third fix in `006`: `endpoint` was globally `UNIQUE`, so one user's upsert
could reassign another user's device row and hijack their notifications. It is
now `UNIQUE (user_id, endpoint)`.

## Files

| File | Purpose |
| --- | --- |
| `000_baseline.sql` | **Authoritative.** `pg_dump` of production. Apply this to recreate the database |
| `schema.sql` | Superseded. Original tables, predating the ownership model — kept for history |
| `003_currency_and_review.sql` | Currency column + `needs_review` (the only table whose RLS was ever committed) |
| `004_billing_anchor.sql` | Billing anchor columns for drift-free renewal advancement |
| `VERIFY.sql` | **Read-only.** Run first — reports what the live database actually has |
| `005_rls_baseline.sql` | **Applied.** Adds the missing `profiles` UPDATE policy; makes `push_subscriptions.user_id` NOT NULL |
| `006_push_subscription_owner.sql` | **Applied.** Moves endpoint uniqueness from global to `(user_id, endpoint)` |
| `007_inbound_idempotency.sql` | **Applied.** Adds `subscriptions.source_email_id` + partial unique index |

## Procedure for future migrations

1. **Inspect before changing anything.** Run `VERIFY.sql` and read the output.
   This is what caught the missing UPDATE policy, and what stopped an earlier
   draft of `005` from overwriting the working `handle_new_user` trigger with a
   different inbound-address format.

   ```bash
   set -a && . ./.env.local && set +a
   psql "$DATABASE_URL" -X -f supabase/VERIFY.sql
   ```

2. **Apply one migration per transaction**, so a failure rolls back whole:

   ```bash
   psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 --single-transaction \
     -f supabase/00N_whatever.sql
   ```

3. **Regenerate the baseline afterwards** so the repo keeps describing reality:

   ```bash
   pg_dump "$DATABASE_URL" --schema-only --schema=public \
     --no-owner --no-privileges --no-comments -f supabase/000_baseline.sql
   ```

   (Re-add the header comment at the top of that file.)

**Never `create or replace` the signup trigger from a migration.** The live
`handle_new_user` generates inbound addresses as `'u-' || 10 hex chars`, and
silently changing that format would give new users addresses inconsistent with
every existing one. Its definition is recorded in `000_baseline.sql`.

## Verifying that RLS actually works

Schema inspection tells you the policies exist; it doesn't tell you they're
correct. Test with two real accounts:

```sql
-- As user A, in the SQL editor with the anon role impersonated:
select count(*) from subscriptions;      -- expect only A's rows
select count(*) from push_subscriptions; -- expect only A's rows
select count(*) from reminder_log;       -- expect 0 (RLS on, no policy)
```

And through the API: sign in as user A and request a subscription id belonging
to user B. Expect a 404, not a 200.
