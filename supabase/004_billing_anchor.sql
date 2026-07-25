-- Migration: track a fixed billing anchor so renewal dates can auto-advance
-- without drifting (see lib/utils/dates.ts for why chaining "add 1 month" off
-- the previous renewal_date is unsafe for month-end dates).

alter table subscriptions
  add column if not exists billing_anchor_date date,
  add column if not exists cycles_elapsed integer not null default 0;

-- Backfill existing rows: treat their current renewal_date as the anchor,
-- with zero cycles elapsed so far.
update subscriptions
set billing_anchor_date = renewal_date
where billing_anchor_date is null;

alter table subscriptions
  alter column billing_anchor_date set not null;