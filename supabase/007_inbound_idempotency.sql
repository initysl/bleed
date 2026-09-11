-- Migration: make inbound email ingestion idempotent.
--
-- Svix retries any webhook delivery that doesn't return 2xx — including one
-- that timed out AFTER the handler had already inserted rows. Without a record
-- of which message produced which subscription, every slow run duplicated
-- whatever it found, and the user saw the same subscription two or three times
-- with no way to tell which was real.
--
-- `source_email_id` is Resend's own identifier for the received message and is
-- stable across retries, so it is the natural idempotency key.

alter table subscriptions
  add column if not exists source_email_id text;

-- Partial index: only rows that actually came from an email carry this value,
-- and every manually-added row leaves it null. A plain unique constraint would
-- be fine (Postgres allows many nulls in a unique index) but a partial index is
-- smaller and states the intent.
create unique index if not exists idx_subscriptions_source_email_id
  on subscriptions (source_email_id)
  where source_email_id is not null;

-- Note the deliberate limitation: this de-duplicates RETRIES of one message,
-- not a user forwarding the same receipt twice from their mail client. Those
-- are genuinely different messages with different ids, and telling an intended
-- re-forward apart from an accidental one needs a content-level heuristic
-- (same user, same name, same price, within a window) that belongs in the
-- application rather than in a constraint.
