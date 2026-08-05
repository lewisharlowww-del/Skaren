-- Merk's spoken verdict cache.
--
-- Merk now "talks" about each scanned product in his own voice (see
-- lib/openai.ts generateMerkVerdict). His verdict is language-specific, so we
-- store one object per language keyed by "no"/"en" under a single product row:
--
--   { "en": { "expression": "...", "headline": "...", "text": "...", "source": "ai" },
--     "no": { ... } }
--
-- Cached for everyone (reads are free), regenerated only for premium scans when
-- the requested language isn't cached yet. Safe to run more than once.

alter table public.product_cache
  add column if not exists ai_merk_verdict jsonb not null default '{}'::jsonb;
