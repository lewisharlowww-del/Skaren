alter table public.scans
  add column if not exists skaren_grade text,
  add column if not exists health_grade text,
  add column if not exists environmental_grade text;
