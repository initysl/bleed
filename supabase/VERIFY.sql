-- Read-only. Run this against the live database FIRST, before applying
-- 005_rls_baseline.sql, and paste the output into a commit message or an issue.
--
-- Why this exists: migrations 001 and 002 are not in this repository. Every
-- user_id column, the entire profiles table, and every RLS policy the API layer
-- depends on were created directly against the live database and have never
-- been reviewed in version control. Several route handlers state in comments
-- that "RLS already guarantees this client can only see its own row" — these
-- queries are how you confirm that claim is actually true.
--
-- Nothing here writes. Safe to run any time.

-- 1. Which tables have RLS turned on?
--    Expect: t for subscriptions, push_subscriptions, profiles, needs_review,
--    reminder_log. An 'f' on any of them means the anon key can read every
--    user's rows.
select
  c.relname                as table_name,
  c.relrowsecurity         as rls_enabled,
  c.relforcerowsecurity    as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;

-- 2. What do the policies actually say?
--    Expect a using/with-check expression mentioning auth.uid() on every table.
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual        as using_expression,
  with_check  as with_check_expression
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3. Does every table that needs an owner column have one, and is it NOT NULL?
--    A nullable user_id is a hole: a row with user_id IS NULL satisfies no
--    auth.uid() = user_id policy, but also belongs to nobody and may be
--    unreachable rather than protected.
select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and column_name in ('user_id', 'id', 'inbound_address', 'email',
                      'email_notifications_enabled')
  and table_name in ('subscriptions', 'push_subscriptions', 'profiles',
                     'needs_review', 'reminder_log')
order by table_name, column_name;

-- 4. Full column list for profiles, which appears in no committed SQL file.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by ordinal_position;

-- 5. Constraints on push_subscriptions.
--    `endpoint` being globally UNIQUE (rather than unique per user) is what
--    allows one user's upsert to attempt to reassign another user's device row.
select
  con.conname  as constraint_name,
  pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('push_subscriptions', 'subscriptions', 'profiles')
order by c.relname, con.conname;

-- 6. Orphan check: rows owned by nobody. Expect 0 everywhere.
select 'subscriptions' as table_name, count(*) as null_owner_rows
  from subscriptions where user_id is null
union all
select 'push_subscriptions', count(*)
  from push_subscriptions where user_id is null
union all
select 'needs_review', count(*)
  from needs_review where user_id is null;

-- 7. What creates a profile row for a new user? If this returns nothing, then
--    profiles are created by something outside the database and a user can end
--    up with no inbound address at all.
select
  t.tgname        as trigger_name,
  c.relname       as on_table,
  p.proname       as function_name
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_proc p on p.oid = t.tgfoid
where not t.tgisinternal
  and (c.relname = 'users' or c.relname = 'profiles')
order by c.relname, t.tgname;
