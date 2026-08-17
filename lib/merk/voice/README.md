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
| `partition.ts` | `partitionBrief(brief)` — the §13 separation contract. Splits the brief into a verdict slice (shelf comparison) and a buy-note slice (portion + occasion); absences go to a `coverage` list. `coverageLine(gaps, lang)` renders the grey line under the score. |
| `generate.ts` | `generateMerkCopy(brief, lang)` — one structured-output call carrying the two partitioned slices, validated, one retry, then the template. Always resolves. |
| `validate.ts` | `validate(copy, brief)` — banned terms, tone, length, hallucinated-number, bare-comparison, one-number-per-verdict, §13 absence-talk and cross-slot overlap. Enforcement, not guidance. |
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
npm run merk:voice                            # the whole suite, gated, one command
```

Runs, in sequence and failing non-zero on any error:

| Suite | What it proves |
|---|---|
| `eval/validator.test.ts` | Each guardrail bites (banned term, tone, length, hallucinated number, bare comparison); clean copy passes. 6/6. |
| `eval/model-reply.test.ts` | The parse+validate branches `generateMerkCopy` runs on a real reply: prose-wrapped JSON parses, missing slots reject, hallucinated numbers / banned terms / over-budget copy are caught (the retry+fallback triggers). 9/9. |
| `eval/http.test.ts` | The real HTTP call site with `fetch` stubbed and a dummy key: request shape (endpoint, auth, model, temperature 0.4→0.2 on retry, 400-token cap, strict `merk_copy` schema, system + 3 few-shot pairs + brief) and every control-flow outcome (accept, retry-recover, double-fail→template, HTTP 500→template, network throw→template, malformed→template). 25/25. |
| `eval/producers.test.ts` | The brief built from the app's real producers (`analyzeAdditives`), not fixtures. Proves the brief-as-firewall: a real additive description containing a banned term ("cancer risk" on E250) never reaches the brief the model sees. 15/15. |
| `eval/no-stats.test.ts` | The degraded path real scans hit today (no `categoryStats.json` yet): `buildProductBrief(product)` with no stats. Drivers empty, `categoryN` 0, no invented shelf comparison; copy describes processing + additives instead. 13/13. |
| `eval/degenerate.test.ts` | Dirty catalogue rows: negative grams, NaN, Infinity, unreadable nutrients on a populated shelf, empty product, 300-char name. Never throws, never emits copy its own validator rejects, never falsely claims "Only N products". 28/28. |
| `eval/cache.test.ts` | The cache key invalidates correctly: identical facts share a key, property order is irrelevant, and every changed fact (rescore, new median, reformulation, additive, nova, allergen, name, bucket) yields a fresh key. Language partitions the cache. 27/27. |
| `eval/integration.test.ts` | The real entry point `buildProductBrief(product, { stats })` on a realistic `ProductResult`, then `generateMerkCopy` end to end (fallback ladder when no key). 31/31. |
| `eval/run.ts` (`--nb`) | The 50-brief set through the validator gate, both languages. 50/50 each. |

Individually:

```bash
npx tsx lib/merk/voice/eval/run.ts            # template only, no API cost
npx tsx lib/merk/voice/eval/run.ts --model    # live generation, validated
npx tsx lib/merk/voice/eval/run.ts --nb       # Norwegian
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

## Verification status

Every code path reachable without a live network call is covered by the gated
suite above, including the HTTP call site (via a stubbed `fetch`) and its full
retry-then-fallback control flow. The only unverified path is the raw TLS
request to OpenAI itself: set `OPENAI_API_KEY` and run
`npx tsx lib/merk/voice/eval/run.ts --model` to exercise it against the real API.
