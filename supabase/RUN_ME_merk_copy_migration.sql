-- ============================================================================
-- Merk voice v1 — run this whole file in the Supabase SQL editor.
--   https://supabase.com/dashboard/project/dkmoonxazfbuajvjsvwo/sql/new
-- Select all, paste, Run. Safe to run more than once.
-- ============================================================================

-- 1 · MIGRATION — add the four-slot copy column.
alter table public.product_cache
  add column if not exists ai_merk_copy jsonb not null default '{}'::jsonb;

-- 2 · VERIFY the column exists (expect: ai_merk_copy | jsonb | '{}'::jsonb | NO)
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'product_cache'
  and column_name = 'ai_merk_copy';

-- 3 · FUNCTIONAL round-trip — write a v2-shaped entry, read it, clean up.
insert into public.product_cache (barcode, ai_merk_copy, ai_cached_at)
values (
  '__merk_test__',
  '{"en":{"copy":{"headline":"Test headline","verdict":"Test verdict.","additiveNote":null,"wouldMerkBuy":"Test paragraph."},"briefHash":"merk:v2:en:testhash","v":2}}'::jsonb,
  now()
)
on conflict (barcode) do update
  set ai_merk_copy = excluded.ai_merk_copy,
      ai_cached_at = excluded.ai_cached_at;

-- Expect one row: Test headline | merk:v2:en:testhash | 2
select
  ai_merk_copy -> 'en' -> 'copy' ->> 'headline' as headline,
  ai_merk_copy -> 'en' ->> 'briefHash'          as brief_hash,
  (ai_merk_copy -> 'en' ->> 'v')::int           as voice_version
from public.product_cache
where barcode = '__merk_test__';

-- Cleanup the test row.
delete from public.product_cache where barcode = '__merk_test__';
