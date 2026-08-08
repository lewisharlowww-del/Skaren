/**
 * Skaren Score · additive watch list
 *
 * Which E-numbers count toward the score's additive penalty. Not every additive
 * matters: citric acid and lecithin are in almost everything and mean nothing.
 * A watch-listed additive is one Skaren's own database rates as "moderate" or
 * "avoid" — the same set the result screen already flags as "worth watching".
 *
 * This is the single source of truth the score and the "how this scored" sheet
 * both read, so the number and its explanation can never disagree.
 */

import { lookupENumber } from "@/lib/enumbers";
import { ADDITIVES, normalizeAdditiveCode, type AdditiveRisk } from "@/lib/additives";

export type WatchAdditive = { code: string; risk: AdditiveRisk };

// Resolve a risk for one E-code, preferring the full enumbers DB then the
// legacy map. Unknown codes are treated as "moderate": an ingredient we cannot
// identify is worth a small, honest flag rather than a silent pass.
export function riskOfCode(code: string): AdditiveRisk {
  const normalized = normalizeAdditiveCode(code) ?? code.toLowerCase();
  const eInfo = lookupENumber(normalized);
  if (eInfo?.safety === "safe" || eInfo?.safety === "moderate" || eInfo?.safety === "avoid") {
    return eInfo.safety;
  }
  const legacy = ADDITIVES[normalized];
  if (legacy) return legacy.risk;
  return "moderate";
}

/** True when this additive counts toward the penalty (moderate or avoid). */
export function isWatchlisted(a: { code?: string; risk?: AdditiveRisk } | string): boolean {
  const risk = typeof a === "string" ? riskOfCode(a) : a.risk ?? riskOfCode(a.code ?? "");
  return risk === "moderate" || risk === "avoid";
}

/** Count of watch-listed additives among a product's additive codes/analyses. */
export function countWatchlisted(
  additives: Array<{ code?: string; risk?: AdditiveRisk } | string>
): number {
  return additives.filter(isWatchlisted).length;
}
