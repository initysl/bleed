-- Migration: close the two gaps found by running supabase/VERIFY.sql against
-- the live database, and put the ownership model under version control.
--
-- WHAT VERIFY.sql ACTUALLY FOUND
-- The live database was in much better shape than the committed SQL suggested.
-- RLS is enabled on all five public tables, every table has an auth.uid()
-- policy, profiles exists with all its columns, subscriptions.user_id is NOT
-- NULL defaulting to auth.uid() with an ON DELETE CASCADE foreign key, and the
-- signup trigger exists. The route comments claiming "RLS scopes this
-- automatically" were therefore true — they just had no evidence in the repo.
--
-- Two things were genuinely wrong, and this migration fixes exactly those:
--
--   1. profiles had a SELECT policy but NO UPDATE policy. With RLS on, the
--      owning user's UPDATE matched no policy and silently affected zero rows.
--      PostgREST reports no error for a zero-row update, so
--      PATCH /api/profile/notifications returned ok:true while changing
--      nothing. The email-notification toggle in Settings had never worked,
--      and because app/api/cron/reminders gates on
--      profiles.email_notifications_enabled, a user who switched email
--      reminders off kept receiving them.
--
--   2. push_subscriptions.user_id was NULLABLE. A null owner satisfies no
--      auth.uid() = user_id policy, so such a row belongs to nobody and is
--      invisible to the user it was meant for, while still being fanned out to
--      by the service-role cron.
--
-- Everything else below is an idempotent restatement of what already exists,
-- so the repo finally describes the real schema. Applying this to a fresh
-- database reproduces production; applying it to production is close to a
-- no-op apart from the two fixes above.
--
-- DELIBERATELY NOT INCLUDED: handle_new_user() and its on_auth_user_created
-- trigger. Both already exist and work. The live definition is recorded at the
-- bottom of this file for reference — do not "create or replace" it from here,
-- because an earlier draft of this migration would have silently changed the
-- inbound-address format for every new signup.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  -- The local part of a user's forwarding address. inbound-email looks a user
  -- up by this value alone, so it must be unique.
  inbound_address text not null unique,
  email_notifications_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- THE FIX. Named to match the existing SELECT policy's convention. Without a
-- corresponding UPDATE policy, every profile write was silently discarded.
drop policy if exists "Users update their own profile" on profiles;
create policy "Users update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Note: the SELECT policy is deliberately NOT recreated here. The live one is
-- named "Users view their own profile" and is correct; adding a second,
-- differently-named SELECT policy would leave two permissive policies OR'd
-- together for no benefit.
--
-- There is intentionally no INSERT policy: profile rows are created by the
-- signup trigger, which is SECURITY DEFINER, not by the client.

-- ---------------------------------------------------------------------------
-- subscriptions  (already correct; restated so the repo is reproducible)
-- ---------------------------------------------------------------------------
alter table subscriptions add column if not exists user_id uuid;

-- The POST handler relies on this default rather than passing user_id from the
-- client (app/api/subscriptions/route.ts), so the column fills itself in from
-- the request's session.
alter table subscriptions alter column user_id set default auth.uid();

do $$
begin
  if exists (select 1 from subscriptions where user_id is null) then
    raise exception
      'subscriptions has % row(s) with a null user_id — assign ownership before enforcing NOT NULL',
      (select count(*) from subscriptions where user_id is null);
  end if;
end $$;

alter table subscriptions alter column user_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'subscriptions_user_id_fkey'
  ) then
    alter table subscriptions
      add constraint subscriptions_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
end $$;

create index if not exists idx_subscriptions_user_id on subscriptions (user_id);

alter table subscriptions enable row level security;

-- ---------------------------------------------------------------------------
-- push_subscriptions
-- ---------------------------------------------------------------------------
alter table push_subscriptions add column if not exists user_id uuid;

do $$
begin
  if exists (select 1 from push_subscriptions where user_id is null) then
    raise exception
      'push_subscriptions has % row(s) with a null user_id — assign ownership before enforcing NOT NULL',
      (select count(*) from push_subscriptions where user_id is null);
  end if;
end $$;

-- THE SECOND FIX: this column was nullable.
alter table push_subscriptions alter column user_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'push_subscriptions_user_id_fkey'
  ) then
    alter table push_subscriptions
      add constraint push_subscriptions_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
end $$;

create index if not exists idx_push_subscriptions_user_id
  on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

-- ---------------------------------------------------------------------------
-- reminder_log  (already correct)
-- ---------------------------------------------------------------------------
-- Written only by the cron via the service-role key, which bypasses RLS. The
-- live SELECT policy reaches the owner through subscription_id, which is better
-- than denying all access, so it is left exactly as it is.
alter table reminder_log enable row level security;

-- ---------------------------------------------------------------------------
-- Reference only — the live signup trigger, NOT executed by this migration.
-- ---------------------------------------------------------------------------
--   create or replace function public.handle_new_user()
--     returns trigger language plpgsql security definer
--     set search_path to 'public'
--   as $function$
--   declare
--     slug text;
--   begin
--     slug := 'u-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
--     insert into public.profiles (id, email, inbound_address)
--     values (new.id, new.email, slug);
--     return new;
--   end;
--   $function$;
--
--   create trigger on_auth_user_created
--     after insert on auth.users
--     for each row execute function handle_new_user();
