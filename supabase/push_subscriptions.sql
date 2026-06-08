-- Push notification subscriptions
-- Run this migration in the Supabase SQL editor

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  streak_enabled  boolean not null default true,
  weekly_enabled  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, endpoint)
);

-- RLS: users can only see/modify their own subscriptions
alter table push_subscriptions enable row level security;

create policy "Users manage own subscriptions"
  on push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service-role can read all subscriptions (needed for cron sends)
create policy "Service role reads all"
  on push_subscriptions
  for select
  using (auth.role() = 'service_role');
