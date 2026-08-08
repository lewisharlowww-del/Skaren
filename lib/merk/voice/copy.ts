/**
 * Merk voice engine · the four slots
 *
 * Merk writes exactly four things, each with a hard length limit because the
 * design has a hard space limit. Anything longer is a bug, not a long answer.
 *
 *   headline      ≤ 42   The one thing worth knowing
 *   verdict       ≤ 140  Two clauses: the risk, then the redeeming fact
 *   additiveNote  ≤ 120  Why this combination, in plain words (nullable)
 *   wouldMerkBuy  ≤ 320  One paragraph, conditional, never a yes/no
 */

export type MerkCopy = {
  headline: string;
  verdict: string;
  additiveNote: string | null;
  wouldMerkBuy: string;
};

export const SLOT_LIMITS = {
  headline: 42,
  verdict: 140,
  additiveNote: 120,
  wouldMerkBuy: 320,
} as const;

export type MerkCopySource = "cache" | "model" | "template";

export type MerkCopyResult = {
  copy: MerkCopy;
  source: MerkCopySource;
  /** Present when a validation retry or fallback happened, for logging. */
  failure?: string;
};
