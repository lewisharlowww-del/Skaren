/**
 * Merk voice engine · public surface
 *
 * The whole engine in one import. See the Skaren engineering briefing v1.
 *
 *   const brief = buildProductBrief(product, { stats, score, percentile });
 *   const { copy, source } = await generateMerkCopy(brief, "en");
 *
 * The model decides how it sounds; the brief decides what is true.
 */

export type {
  ProductBrief,
  BriefDriver,
  BriefNutrient,
  BriefWatchAdditive,
  BuildBriefOptions,
} from "@/lib/merk/voice/brief";
export { buildProductBrief, numbersInBrief } from "@/lib/merk/voice/brief";

export type { MerkCopy, MerkCopyResult, MerkCopySource } from "@/lib/merk/voice/copy";
export { SLOT_LIMITS } from "@/lib/merk/voice/copy";

export { templateCopy } from "@/lib/merk/voice/template";
export { validate, numbersIn } from "@/lib/merk/voice/validate";
export type { Validation } from "@/lib/merk/voice/validate";

export { generateMerkCopy } from "@/lib/merk/voice/generate";
export type { Lang } from "@/lib/merk/voice/generate";

export { briefCacheKey } from "@/lib/merk/voice/cache";

export {
  MERK_SYSTEM_PROMPT,
  MERK_SYSTEM_PROMPT_NB_ADDENDUM,
  MERK_FEW_SHOT,
  MERK_VOICE_VERSION,
} from "@/lib/merk/voice/prompt";
