/**
 * Merk voice engine · the generator and the fallback ladder
 *
 * One call per product, all four slots at once, structured output on. Four
 * calls would cost four times as much and let the slots contradict each other.
 * A small model is correct here: the reasoning already happened in the brief;
 * the model is a writer, not an analyst.
 *
 * The fallback ladder (section 8): Merk must never be silent, never apologise
 * for being slow.
 *   1. Cached copy (handled by the caller via the brief hash).
 *   2. Live generation, validated. One retry at a lower temperature on failure.
 *   3. Template line assembled from the brief with no model at all.
 */

import type { ProductBrief } from "@/lib/merk/voice/brief";
import type { MerkCopy, MerkCopyResult } from "@/lib/merk/voice/copy";
import { SLOT_LIMITS } from "@/lib/merk/voice/copy";
import { templateCopy } from "@/lib/merk/voice/template";
import { validate } from "@/lib/merk/voice/validate";
import { partitionBrief } from "@/lib/merk/voice/partition";
import {
  MERK_SYSTEM_PROMPT,
  MERK_SYSTEM_PROMPT_NB_ADDENDUM,
  MERK_FEW_SHOT,
} from "@/lib/merk/voice/prompt";

export type Lang = "en" | "nb";

type ResponsesInputItem = { role: "system" | "user" | "assistant"; content: string };

const MERK_COPY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "verdict", "additiveNote", "wouldMerkBuy"],
  properties: {
    headline: { type: "string" },
    verdict: { type: "string" },
    additiveNote: { type: ["string", "null"] },
    wouldMerkBuy: { type: "string" },
  },
} as const;

function buildInput(brief: ProductBrief, language: Lang): ResponsesInputItem[] {
  const system =
    MERK_SYSTEM_PROMPT + (language === "nb" ? MERK_SYSTEM_PROMPT_NB_ADDENDUM : "");

  const fewShot: ResponsesInputItem[] = MERK_FEW_SHOT.flatMap((ex) => [
    { role: "user" as const, content: JSON.stringify({ language, brief: ex.brief }) },
    { role: "assistant" as const, content: ex.copy },
  ]);

  // The separation contract (§13): still ONE call, but the brief is partitioned
  // so each slot sees only its own facts. The verdict slice carries the shelf
  // comparison; the buy-note slice carries portion and occasion. Absences go to
  // neither — they are rendered by the UI, never spoken by Merk. A fact absent
  // from a slice cannot be restated, so the overlap is impossible, not merely
  // discouraged.
  const { verdict, buyNote } = partitionBrief(brief);
  const user: ResponsesInputItem = {
    role: "user",
    content: JSON.stringify({
      language,
      // headline + verdict + additiveNote are written from verdictFacts;
      // wouldMerkBuy is written from buyNoteFacts. Each fact belongs to exactly
      // one slot — a fact used in one answer must not appear in another.
      verdictFacts: verdict,
      buyNoteFacts: buyNote,
      rule: "Each fact belongs to exactly one slot. Write headline, verdict and additiveNote from verdictFacts only. Write wouldMerkBuy from buyNoteFacts only. A fact used in one answer must not appear in another.",
      // Strict structured output rejects maxLength, so the budgets ride in the
      // message and are ENFORCED by the validator.
      limits: SLOT_LIMITS,
    }),
  };

  return [{ role: "system", content: system }, ...fewShot, user];
}

type ResponsesOutput = {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
};

async function callMerkModel(
  input: ResponsesInputItem[],
  temperature: number
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  // A small model is correct: the thinking is done in the brief.
  const model = process.env.MERK_VOICE_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5.4-nano";

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature,
        max_output_tokens: 400,
        input,
        text: {
          format: {
            type: "json_schema",
            name: "merk_copy",
            strict: true,
            schema: MERK_COPY_SCHEMA,
          },
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[Merk voice] ${res.status} ${res.statusText}`, detail);
      return null;
    }

    const data = (await res.json()) as ResponsesOutput;
    return (
      data.output_text?.trim() ??
      data.output
        ?.flatMap((i) => i.content ?? [])
        .map((c) => c.text ?? "")
        .join("")
        .trim() ??
      null
    );
  } catch (error) {
    console.error("[Merk voice] request failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export function parseCopy(raw: string | null): MerkCopy | null {
  if (!raw) return null;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const p = JSON.parse(match[0]) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const headline = str(p.headline);
    const verdict = str(p.verdict);
    const wouldMerkBuy = str(p.wouldMerkBuy);
    if (!headline || !verdict || !wouldMerkBuy) return null;
    const additiveNote =
      p.additiveNote == null || p.additiveNote === "" ? null : str(p.additiveNote);
    return { headline, verdict, additiveNote, wouldMerkBuy };
  } catch {
    return null;
  }
}

/**
 * Generate Merk's four-slot copy for one brief, walking the fallback ladder.
 * Always resolves — never throws, never returns null. The template line is the
 * floor, so Merk always says something.
 */
export async function generateMerkCopy(
  brief: ProductBrief,
  language: Lang = "en"
): Promise<MerkCopyResult> {
  const input = buildInput(brief, language);

  // Rung 2a — live generation at the design temperature (0.4).
  const first = parseCopy(await callMerkModel(input, 0.4));
  if (first) {
    const v = validate(first, brief);
    if (v.ok) return { copy: v.copy, source: "model" };

    // Retry once at a lower temperature (0.2).
    const second = parseCopy(await callMerkModel(input, 0.2));
    if (second) {
      const v2 = validate(second, brief);
      if (v2.ok) return { copy: v2.copy, source: "model" };
      // Both attempts failed validation — fall through, log the reason.
      console.warn(`[Merk voice] fell back to template: ${v2.reason}`, {
        product: brief.name,
        detail: v2.detail,
      });
      return { copy: templateCopy(brief, language), source: "template", failure: v2.reason };
    }
    console.warn(`[Merk voice] fell back to template after retry parse-fail: ${v.reason}`);
    return { copy: templateCopy(brief, language), source: "template", failure: v.reason };
  }

  // Rung 3 — no model output at all.
  return { copy: templateCopy(brief, language), source: "template", failure: "no-output" };
}
