create table if not exists public.supporters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  subscription_id text,
  supporter_status text not null default 'inactive',
  current_period_end timestamptz,
  amount_nok integer,
  customer_email text,
  checkout_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists supporters_stripe_customer_id_idx
on public.supporters (stripe_customer_id)
where stripe_customer_id is not null;

create unique index if not exists supporters_subscription_id_idx
on public.supporters (subscription_id)
where subscription_id is not null;

alter table public.supporters enable row level security;

create policy "Users can read their own supporter status"
on public.supporters for select
to authenticated
using (auth.uid() = user_id);

-- Writes are performed by the Stripe webhook with the Supabase service role key.
-- Do not add anon insert/update policies for this table.
