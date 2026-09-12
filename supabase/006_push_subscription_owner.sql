-- Migration: scope push endpoint uniqueness to the owning user.
--
-- schema.sql declared `endpoint text not null unique` — globally unique across
-- every user. Combined with the subscribe route's `onConflict: 'endpoint'`,
-- that meant a request carrying someone else's endpoint would attempt to
-- rewrite that row's user_id, reassigning the victim's device to the attacker
-- and redirecting their renewal notifications.
--
-- Uniqueness belongs on (user_id, endpoint): the same device re-subscribing
-- still updates its own row, but one user can never claim another's.
--
-- Run AFTER 005_rls_baseline.sql, which is what adds user_id to this table.

-- Drop the global unique constraint wherever it lives. The name isn't known in
-- advance (Postgres generates it, and it may be a constraint or a bare index),
-- so find it by shape: a unique constraint on exactly the `endpoint` column.
do $$
declare
  con record;
begin
  for con in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'push_subscriptions'
      and c.contype = 'u'
      -- attname is `name`, not `text`, and there is no name[] = text[] operator
      -- — cast each element so the comparison resolves.
      and (
        select array_agg(a.attname::text order by a.attname)
        from unnest(c.conkey) as k(attnum)
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
      ) = array['endpoint']::text[]
  loop
    execute format(
      'alter table push_subscriptions drop constraint %I', con.conname
    );
    raise notice 'dropped global unique constraint % on push_subscriptions(endpoint)', con.conname;
  end loop;
end $$;

-- Before adding the new constraint, collapse any duplicate (user_id, endpoint)
-- pairs that the old schema could not have produced but a partial migration
-- might. Keep the most recently created row for each pair.
delete from push_subscriptions p
using push_subscriptions q
where p.user_id = q.user_id
  and p.endpoint = q.endpoint
  and p.created_at < q.created_at;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'push_subscriptions_user_id_endpoint_key'
  ) then
    alter table push_subscriptions
      add constraint push_subscriptions_user_id_endpoint_key
      unique (user_id, endpoint);
  end if;
end $$;
