/**
 * Skaren Score v2 · additive load (spec §5)
 *
 * v1 charged 15 points for every watch-additive, which priced potassium sorbate
 * the same as sodium nitrite. v2 gives the watch list a WEIGHT (a tier) and a
 * JOB (its technical function), so the score reflects evidence, and two
 * additives doing the same job add a small redundancy penalty.
 *
 *   tier 1  strong reason to limit intake         −10
 *   tier 2  worth watching / contested            −4
 *   tier 3  harmless in food quantities            0
 *   redundancy: two+ additives with the same job  −3 per group
 *
 * Tier is EDITORIAL, derived from Skaren's own risk rating (avoid → 1,
 * moderate → 2, safe → 3) with a small override table for the well-evidenced
 * cases the spec calls out (nitrite is tier 1, sorbate is not). Job is derived
 * from the additive's description, the same coarse buckets the voice engine
 * reports, so the number and Merk's "two do the same job" line always agree.
 */

import { lookupENumber } from "@/lib/enumbers";
import { ADDITIVES, normalizeAdditiveCode, type AdditiveRisk } from "@/lib/additives";

export type AdditiveTier = 1 | 2 | 3;
export type AdditiveJob =
  | "preservative"
  | "colour"
  | "sweetener"
  | "texture"
  | "flavour"
  | "acidity"
  | "other";

/** Editorial tier overrides, each with a one-line source note. Anything not
 *  listed falls back to the risk → tier map. Kept small on purpose. */
const TIER_OVERRIDE: Record<string, { tier: AdditiveTier; note: string }> = {
  e250: { tier: 1, note: "Sodium nitrite — nitrosamine formation in cured meat (IARC 2A)." },
  e251: { tier: 1, note: "Sodium nitrate — same nitrite pathway once reduced." },
  e102: { tier: 1, note: "Tartrazine — Southampton study, hyperactivity signal in children." },
  e110: { tier: 1, note: "Sunset yellow — Southampton six." },
  e124: { tier: 1, note: "Ponceau 4R — Southampton six." },
  e129: { tier: 1, note: "Allura red — Southampton six." },
  e621: { tier: 2, note: "MSG — contested; reported sensitivity, no robust harm at food levels." },
  e951: { tier: 2, note: "Aspartame — IARC 2B 2023; within ADI at food levels." },
};

/** Risk → default tier. Skaren's own rating is the base signal. */
function tierFromRisk(risk: AdditiveRisk): AdditiveTier {
  if (risk === "avoid") return 1;
  if (risk === "moderate") return 2;
  return 3;
}

/** Resolve the risk for one E-code (full DB, then legacy map, then "moderate"
 *  for an unknown code — an ingredient we cannot identify earns an honest flag,
 *  not a silent pass). Mirrors watchlist.riskOfCode so they never diverge. */
function riskOfCode(code: string): AdditiveRisk {
  const normalized = normalizeAdditiveCode(code) ?? code.toLowerCase();
  const eInfo = lookupENumber(normalized);
  if (eInfo?.safety === "safe" || eInfo?.safety === "moderate" || eInfo?.safety === "avoid") {
    return eInfo.safety;
  }
  const legacy = ADDITIVES[normalized];
  if (legacy) return legacy.risk;
  return "moderate";
}

/** The coarse technical job of an additive, from its description + name. The
 *  same mapping the Merk voice engine uses, so "two do the same job" agrees. */
export function jobOfCode(code: string): AdditiveJob {
  const normalized = normalizeAdditiveCode(code) ?? code.toLowerCase();
  const eInfo = lookupENumber(normalized);
  const legacy = ADDITIVES[normalized];
  const text = `${eInfo?.description ?? ""} ${eInfo?.name ?? ""} ${legacy?.description ?? ""} ${legacy?.name ?? ""}`.toLowerCase();
  if (/preserv|antioxidant|mould|mold|shelf|nitrite|nitrate|benzoate|sorb/.test(text)) return "preservative";
  if (/colour|color|dye|pigment|tartrazine|carmine|cochineal/.test(text)) return "colour";
  if (/sweeten|sweetener|sugar alcohol|aspartame|sucralose|acesulfame|sorbitol|xylitol/.test(text)) return "sweetener";
  if (/emulsif|stabil|thicken|texture|gell?ing|raising|starch|phosphate|carrageenan|lecithin/.test(text)) return "texture";
  if (/flavour|flavor|enhancer|msg|glutamate|guanylate|inosinate/.test(text)) return "flavour";
  if (/acid|regulator|\bph\b|citric|lactic/.test(text)) return "acidity";
  return "other";
}

/** Tier for one E-code: editorial override first, else risk-derived. */
export function tierOfCode(code: string): AdditiveTier {
  const normalized = normalizeAdditiveCode(code) ?? code.toLowerCase();
  const override = TIER_OVERRIDE[normalized];
  if (override) return override.tier;
  return tierFromRisk(riskOfCode(code));
}

export type ScoredAdditive = { code: string; tier: AdditiveTier; job: AdditiveJob };

/** Resolve a list of additive codes to their tier + job for the score. */
export function resolveAdditives(codes: string[]): ScoredAdditive[] {
  return codes
    .map((c) => normalizeAdditiveCode(c) ?? c.toLowerCase())
    .map((code) => ({ code, tier: tierOfCode(code), job: jobOfCode(code) }));
}

const TIER_POINTS: Record<AdditiveTier, number> = { 1: 10, 2: 4, 3: 0 };
const REDUNDANCY_POINTS = 3;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export type AdditiveLoad = {
  /** The signed load, −28..0. */
  total: number;
  /** How many tier-1 and tier-2 additives drove it (for the breakdown row). */
  tier1: number;
  tier2: number;
  /** Groups of two+ additives doing the same job (the redundancy penalty). */
  redundantJobs: AdditiveJob[];
};

/**
 * The additive layer, −28..0. Sum the per-tier points, then a small redundancy
 * penalty for each job done by two or more watch-listed additives. Tier-3
 * (harmless) additives cost nothing and never count toward redundancy — two
 * harmless emulsifiers are not a recipe smell.
 */
export function additiveLoad(additives: ScoredAdditive[]): AdditiveLoad {
  let load = 0;
  let tier1 = 0;
  let tier2 = 0;
  for (const a of additives) {
    load -= TIER_POINTS[a.tier];
    if (a.tier === 1) tier1++;
    if (a.tier === 2) tier2++;
  }

  // Redundancy: group the watch-listed (tier < 3) additives by job.
  const byJob = new Map<AdditiveJob, number>();
  for (const a of additives) {
    if (a.tier >= 3) continue;
    byJob.set(a.job, (byJob.get(a.job) ?? 0) + 1);
  }
  const redundantJobs: AdditiveJob[] = [];
  for (const [job, count] of Array.from(byJob.entries())) {
    if (count > 1) redundantJobs.push(job);
  }
  load -= REDUNDANCY_POINTS * redundantJobs.length;

  return { total: clamp(load, -28, 0), tier1, tier2, redundantJobs };
}
