# Merk voice engine · v1

_The system prompt and few-shot examples are brand assets. Change them the way
you would change a logo._

You are not training a model. You write a **brief** — a small, computed summary
of one product — and ask the model to phrase it. **Skaren decides what is true.
The model only decides how it sounds.**

## The four slots

Merk writes exactly four things, each with a hard length limit.

| Slot | Budget | What it is |
|---|---|---|
| `headline` | ≤ 42 | The one thing worth knowing |
| `verdict` | ≤ 140 | Two clauses: the risk, then the redeeming fact |
| `additiveNote` | ≤ 120 | Why this combination, in plain words (nullable) |
| `wouldMerkBuy` | ≤ 320 | One paragraph, conditional, never a yes/no |

## Modules

| File | Role |
|---|---|
| `brief.ts` | `buildProductBrief(product, opts)` — the computed, judged, ranked `ProductBrief`. The model only ever sees this. `drivers` is the important field: at most three nutrients, ranked by leverage on the score, already sorted. |
| `copy.ts` | The `MerkCopy` shape and `SLOT_LIMITS`. |
| `prompt.ts` | `MERK_SYSTEM_PROMPT`, the `nb` addendum, and the three few-shot examples. **Brand assets.** `MERK_VOICE_VERSION`. |
| `template.ts` | `templateCopy(brief, lang)` — the model-free fallback line. Ship this first. |
| `generate.ts` | `generateMerkCopy(brief, lang)` — one structured-output call, validated, one retry, then the template. Always resolves. |
| `validate.ts` | `validate(copy, brief)` — banned terms, tone, length, hallucinated-number, bare-comparison. Enforcement, not guidance. |
| `cache.ts` | `briefCacheKey(brief, lang)` — stable hash of the brief + language + voice version. |
| `index.ts` | The public surface. |
| `eval/` | The 50-brief set, the runner, and the validator self-test. |

## Usage

```ts
import { buildProductBrief, generateMerkCopy, briefCacheKey } from "@/lib/merk/voice";

const brief = buildProductBrief(product, { stats, score, percentile });
const key = briefCacheKey(brief, "en");        // serve cached copy if present
const { copy, source } = await generateMerkCopy(brief, "en");
// copy = { headline, verdict, additiveNote, wouldMerkBuy }; source = model|template
```

`generateMerkCopy` never throws and never returns null. If the model is offline
or every attempt fails validation, it returns the template line with
`source: "template"`. Merk always says something.

## The fallback ladder

1. **Cached copy** (caller, via `briefCacheKey`). The normal case.
2. **Live generation**, validated. One retry at temperature 0.2 on a failure.
3. **Template line** from the brief, no model at all. Flatter, never wrong.

## Environment

- `OPENAI_API_KEY` — without it, only the template rung runs.
- `MERK_VOICE_MODEL` — overrides the writer model (falls back to `OPENAI_MODEL`,
  then `gpt-5.4-nano`). A small model is correct: the thinking is in the brief.

## Eval

```bash
npx tsx lib/merk/voice/eval/run.ts            # template only, no API cost
npx tsx lib/merk/voice/eval/run.ts --model    # live generation, validated
npx tsx lib/merk/voice/eval/run.ts --nb       # Norwegian
npx tsx lib/merk/voice/eval/validator.test.ts # guardrails bite (6/6)
```

Run the whole 50 on every prompt change and read them by hand. Three questions
per output:

1. Is every number in the brief?
2. Would a person feel judged?
3. Could this sentence have been written about a different product? _(A yes here
   is the most common real failure — generic copy passes every guardrail and
   still kills the character.)_

## Build order (where this sits)

1. ✅ Template line, no model. Tells you the brief holds the right facts.
2. ✅ Model behind the same interface, all four slots, validated.
3. ✅ 50-brief eval + validator self-test.
4. ⏳ Caching + nightly warm batch — wire `briefCacheKey` to the product row and
   warm the top ~5 000 products once the copy is one you would print on a poster.

## Not yet wired

This engine is standalone and does not replace the existing single-line
`generateMerkVerdict` (`lib/openai.ts`) on the result screen yet. Wiring the
four slots into the UI and persisting cached copy per brief hash is the next
step, deliberately left as a separate change.
