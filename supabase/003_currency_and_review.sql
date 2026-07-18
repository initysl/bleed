-- Migration: currency support + needs-review queue

alter table subscriptions
  add column if not exists currency text not null default 'USD';

alter table subscriptions
  add constraint currency_is_iso_format check (currency ~ '^[A-Z]{3}$');

-- Emails Groq couldn't confidently extract a subscription from land here instead
-- of silently vanishing — the user gets a chance to review and fix them manually.
create table if not exists needs_review (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text,
  raw_email_snippet text,
  reason text,
  created_at timestamptz not null default now(),
  resolved boolean not null default false
);

create index if not exists idx_needs_review_user_id on needs_review (user_id);

alter table needs_review enable row level security;

drop policy if exists "Users manage their own needs_review items" on needs_review;
create policy "Users manage their own needs_review items"
  on needs_review for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);