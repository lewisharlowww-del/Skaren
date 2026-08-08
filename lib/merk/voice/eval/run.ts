/**
 * Merk voice engine · eval runner (section 10)
 *
 * Run the whole 50-brief set and read all 50 by hand. Two modes:
 *
 *   npx tsx lib/merk/voice/eval/run.ts            # template only, no API cost
 *   npx tsx lib/merk/voice/eval/run.ts --model    # live generation, validated
 *   npx tsx lib/merk/voice/eval/run.ts --nb       # Norwegian
 *
 * For every output it prints the four slots and runs the mechanical guardrails
 * (validator) so you can spend your reading attention on the one check a
 * machine cannot do: "Could this sentence have been written about a different
 * product?" A yes there is the most common real failure.
 */

import { EVAL_CASES } from "@/lib/merk/voice/eval/cases";
import { templateCopy } from "@/lib/merk/voice/template";
import { validate } from "@/lib/merk/voice/validate";
import { generateMerkCopy } from "@/lib/merk/voice/generate";
import { SLOT_LIMITS, type MerkCopy } from "@/lib/merk/voice/copy";

const args = process.argv.slice(2);
const useModel = args.includes("--model");
const lang: "en" | "nb" = args.includes("--nb") ? "nb" : "en";

function len(copy: MerkCopy) {
  return (Object.keys(SLOT_LIMITS) as Array<keyof typeof SLOT_LIMITS>)
    .map((k) => {
      const v = (copy as Record<string, string | null>)[k] ?? "";
      const over = v.length > SLOT_LIMITS[k];
      return `${k} ${v.length}/${SLOT_LIMITS[k]}${over ? " OVER" : ""}`;
    })
    .join("  ");
}

async function main() {
  let pass = 0;
  let fail = 0;

  for (const c of EVAL_CASES) {
    const { copy, source, failure } = useModel
      ? await generateMerkCopy(c.brief, lang)
      : { copy: templateCopy(c.brief, lang), source: "template" as const, failure: undefined };

    const v = validate(copy, c.brief);
    if (v.ok) pass++;
    else fail++;

    console.log("\n" + "─".repeat(72));
    console.log(`${c.id}  [${c.shape}]  source=${source}${failure ? ` failure=${failure}` : ""}`);
    console.log(`  ${c.brief.name} · ${c.brief.category} · score ${c.brief.score} · n=${c.brief.categoryN}`);
    console.log(`  headline     ${copy.headline}`);
    console.log(`  verdict      ${copy.verdict}`);
    console.log(`  additiveNote ${copy.additiveNote ?? "—"}`);
    console.log(`  wouldMerkBuy ${copy.wouldMerkBuy}`);
    console.log(`  lengths      ${len(copy)}`);
    console.log(`  validator    ${v.ok ? "OK" : `FAIL ${v.reason}${v.detail ? " (" + v.detail + ")" : ""}`}`);
  }

  console.log("\n" + "═".repeat(72));
  console.log(`Validator: ${pass} pass, ${fail} fail, of ${EVAL_CASES.length}.`);
  console.log("Now read all 50 by hand. Three questions per output:");
  console.log("  1. Is every number in the brief?");
  console.log("  2. Would a person feel judged?");
  console.log("  3. Could this sentence have been written about a different product?");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
