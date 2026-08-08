-- Merk voice engine v1 — four-slot copy cache.
--
-- The v1 engine (lib/merk/voice) produces four slots per product — headline,
-- verdict, additiveNote, wouldMerkBuy — computed from a judged ProductBrief and
-- validated server-side. Like the single-line verdict, the copy is
-- language-specific, so we store one entry per language keyed by "no"/"en".
--
-- Each entry also carries the brief hash it was written from and the voice
-- version, so a rescore/reformulation (new hash) or a prompt change (new
-- version) invalidates it without waiting out the 7-day TTL:
--
--   { "en": { "copy": { "headline": "...", "verdict": "...",
--                        "additiveNote": "..."|null, "wouldMerkBuy": "..." },
--             "briefHash": "merk:v2:en:...", "v": 2 },
--     "no": { ... } }
--
-- Cached for everyone (reads are free), regenerated only for premium scans when
-- the requested language is missing or its brief hash no longer matches.
-- Safe to run more than once.

alter table public.product_cache
  add column if not exists ai_merk_copy jsonb not null default '{}'::jsonb;
