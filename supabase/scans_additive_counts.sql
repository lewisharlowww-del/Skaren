alter table public.scans
  add column if not exists additives_total integer,
  add column if not exists additives_to_avoid integer,
  add column if not exists additives_moderate integer,
  add column if not exists additives_details jsonb;
