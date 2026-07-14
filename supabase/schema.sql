-- Bleed: subscription tracker schema

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null,
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  monthly_equivalent numeric(10, 2) generated always as (
    case when billing_cycle = 'yearly' then price / 12 else price end
  ) stored,
  renewal_date date not null,
  category text,
  last_used_at date,
  source text not null default 'manual' check (source in ('manual', 'email')),
  raw_email_snippet text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_renewal_date on subscriptions (renewal_date);

-- Stores browser push subscriptions (one per device the user has granted permission on)
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Tracks which reminders have already been sent, so the daily cron doesn't double-send
create table if not exists reminder_log (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions (id) on delete cascade,
  renewal_date date not null,
  sent_at timestamptz not null default now(),
  unique (subscription_id, renewal_date)
);

-- Keep updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_subscriptions_updated_at on subscriptions;
create trigger trg_subscriptions_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();