# Merk redesign — build status

_Written 4 August 2026. Covers the work against `design_handoff_skaren_merk`
(README, `IMPLEMENTATION.md`, `PROJECT-NOTES.md`, the Three Visions canvas and
the four production modules)._

**Headline:** every screen and component in the bundle now exists in the app.
The scoring model is wired but switched off. Nothing has been pushed — the
commits are local, and the deploy is waiting on you.

---

## Update — 8 August 2026 · Merk voice engine v1 (`lib/merk/voice`)

The four-slot voice engine from the Skaren engineering briefing v1 is built,
tested, and **wired into the live scan flow**:

- **Engine** (`lib/merk/voice/`): `buildProductBrief` (judged, ranked brief) →
  `generateMerkCopy` (one structured call, validated, retry, template fallback).
  System prompt + 3 few-shot as brand assets. Validator enforces banned terms,
  tone, per-slot length, no-hallucinated-number, and category-on-comparison.
- **Verified**: `npm run merk:voice` runs 10 gated suites (validator, HTTP
  call-site, real-producers firewall, no-stats, degenerate inputs, cache
  invalidation, integration, 50-brief en+nb). Against the **live OpenAI API**,
  model acceptance is 50/50 in both languages after two fixes it surfaced
  (per-slot length limits in the prompt; validator no longer misreads E-numbers).
- **Wired**: `app/api/scan/route.ts` builds the brief and, for premium users,
  generates the copy; `lib/productCache.ts` caches it per language keyed by the
  brief hash + voice version (a rescore invalidates it); `ProductPageLayout`
  renders headline + verdict in the verdict card, `additiveNote` under the
  additives section, and `wouldMerkBuy` in the "What would Merk buy?" note. All
  with graceful fallback to the old single-line verdict, then the static map.
- **`next build` passes.** `tsc` and `eslint` clean.
- **One user action left**: run `supabase/product_cache_merk_copy.sql` to add the
  `ai_merk_copy` column. Until then the copy still generates and displays; it
  just regenerates each scan instead of persisting (the cache write degrades
  gracefully when the column is missing).

---

## 1 · Where the code is

Six commits sit on `main`, unpushed, ahead of `origin/main` by 18 total:

| Commit | What landed |
|---|---|
| `0c036a2` | Navigation, D1 dark palette, `lib/merk` modules, health resolver behind a flag |
| `89ce199` | Scan tab |
| `19ea39e` | **Your own** "Merk gir svar" verdict screen — see §5 |
| `31806e7` | Additives, score card, why-sheet, NOVA, allergens, alternatives |
| `730ff0f` | No-data screen; History, List, Stats |
| `e4ebdfd` | Account card, sticky Merk header, additives header hint |

Net change: **32 files, ~3 800 insertions, ~860 deletions.**

To ship:

```bash
cd ~/Documents/Codex/2026-05-18/EcoScan
npm run build          # I could not complete this — see §4
git push origin main   # this is what triggers Vercel
```

The sandbox I work in has no GitHub credentials, so the push has to come from
your machine.

---

## 2 · What was built, step by step

### Step 1–2 · Fonts and tokens — _done (earlier sessions + this one)_

`:root` already matched `skaren-tokens.css`. What was missing was dark mode, so
`html.dark` was replaced wholesale with the bundle's values: page `#14120C`,
card `#1C1811`, recessed `#241F17`, accents lifted rather than saturated
(`#8FC79E`, `#E39070`, `#D6B366`), hairlines warm (`#2E2A20`). The old
`#1a1714`/`#242018`/`#2e2a24` hexes hard-coded through both stylesheets,
`layout.tsx` and the appearance picker were repointed to match, so nothing is
reading a stale value.

### Step 3 · Score card and Nutri-Score — _done, flag off_

**`components/ScoreCard.tsx`** — score at 40px in its band colour, `SCORE` label
in mono beneath, and a **44px "why?" pill**. The shelf-median track sits beside
it: 9px rail, a 2px tick at the median, a 15px dot with a white ring for this
product. Below, two tiles — Nutri-Score and Eco — each with an oversized ghost
letter, a 26px solid letter chip, the verdict word **in ink**, and a five-step
A–E dot scale. The Health tile is gone; it duplicated the score directly above
it.

**Scoring pipeline** — `lib/merk/healthGrade.ts`, `categoryScore.ts`,
`findAlternative.ts` and `buildCategoryStats.ts` are in `lib/merk/`. They did
**not** compile as shipped and needed real fixes:

- `healthGrade` imported `categoryScore`/`CategoryScoreResult`; the module
  actually exports `scoreInCategory`/`ScoreResult`
- `calculateHealthScore` returns a plain number, not `{ score }`
- `NutritionData` uses `sugars`, not `sugar`
- `scoreSearchRelevance` takes a product object, not a name string
- the Kassalapp detail payload has no `novaGroup` or `additives`, so candidates
  are now graded with E-numbers parsed out of the ingredient text

`lib/openfoodfacts.ts` pins the API `fields` (including `nutriscore_score`) and
calls `resolveHealthGrade()`, persisting `healthSource`, `healthModel`,
`healthBasis` and `healthConfident` on `ProductResult`.

**It is behind `NEXT_PUBLIC_SKAREN_HEALTH_RESOLVER=1` and off by default**, per
the bundle's own migration warning. Until it is on, every product records
`healthModel: "absolute-0.9"`, so history can never be silently rewritten.

### Step 4 · Additives — _done_

Rebuilt as ratio-first. A summary card carries the count at 34px, a segmented
bar with one segment per additive (clay for watch-list, sage for harmless), and
"N worth watching / N harmless" — both in **regular weight**, because the
proportion is the headline and nobody should be shouting.

Watch tiles: 4px clay left edge, E-number in mono, three-dot caution meter, the
**function in plain words** as the bold line ("Preservative"), chemical name
quiet beneath, `WORTH WATCHING` in mono caps. Safe tiles: lighter ground, 3px
sage edge, a soft green `SAFE` pill, function underneath, no meter and no
chemical name. Tapping either expands it to full width with the explanation.
The function word comes from the `category` field already in your E-number
database, translated for Norwegian.

On a clean product the whole section collapses to one card: `0` in green, one
full-width sage bar, and no tiles at all.

### Step 5 · Nutrition — _done (earlier session)_

Already merged: label grams left, share-of-day right, numbers in ink, bars
carrying the signal, footnote stating the 2000 kcal basis.

### Step 6 · Navigation — _done_

Paper bar on `--sk-brand-mist-card` with a hairline top border. **Scan is
permanently raised** — `margin-top: -26px`, 72px wide, `16px 16px 0 0`, always
dark, never changing state. The other four carry a soft pill behind icon and
label. The five icons are in `components/NavIcons.tsx` with the canvas path data
copied verbatim — 24×24 grid, 1.7px stroke, round caps, no fills. Lucide is out
of the nav, and the old liquid-pill/hop/glow CSS it depended on was deleted.

### Step 7 · History, List, Stats, Account — _done_

**History** — an overall card with the average score at 40px and a seven-day
chart, weakest day in clay and best in green. Group headings carry a per-day
summary ("2 scans · avg 82"). Rows now show the **numeric score right-aligned in
its band colour** instead of two grade letters; additive callouts were removed,
as they belong on the result page.

**List** — scanned items show their score, unscanned ones read "not scanned" in
faint grey, which is what turns the list into a scan to-do.

**Stats** — two donuts (additive-free %, worth-watching %) and a card ranking
the specific watch-list E-numbers the user meets most, with a bar and a tally
per row. The footnote says out loud that harmless additives are not counted.

**Account** — the membership card drops its radial green gradient for flat ink
with a warm hairline and carries Merk rather than a bare crown. Delete account
moved from red to clay; red is now only the confirm step.

### Step 8 · Accessibility — _done (earlier session), verified here_

Every new control clears 44px: the "why?" pill, the additive tiles, both scan
fallbacks, the nav tabs. Colour never rides alone — the A–E dot scale carries
fill count, the additive ratio bar carries proportion, the caution meter carries
a dot count, the median slider carries position, and every state has an explicit
word.

### The undesigned three — _done_

**No-data screen** (`components/NoDataScreen.tsx`) — Merk unsure, the honest
headline "I don't know this one yet", then a diagnostic list showing what *did*
work: barcode read ✓, check digit valid ✓, product record missing. Then the
contribution route and a search escape hatch. It refuses to guess a score, and
says why.

**Why-sheet** (`components/ScoreMethodSheet.tsx`) — a bottom sheet, itemised
deductions with reasons and signed values, the engine named via `healthBasis`,
the model version printed, and a report-an-error route.

**Three-second read** — the capture overlay is now three beats in result-page
order, with the final beat resolving only when the product actually lands. No
count is revealed early. Loading is his barcode, never a spinner.

### More Merk — _done_

Sticky header carries his verdict face plus the score. His barcode is the
loading state on both the scan overlay and the alternatives fetch. He waits at
the bottom edge of the camera screen. "What would Merk buy?" is three sentences
with no numbers in them. At most two Merks are ever on screen at once.

### Alternatives — _done_

`components/Alternatives.tsx` plus `app/api/alternatives/route.ts`. Opt-in
outlined CTA with the "never sponsored" sub-line. One cached shelf search feeds
both the swap list and the median. Trade-offs are printed, never hidden. On a
clean product the CTA becomes "Add to your list / Nothing here needs replacing".

---

## 3 · Where I deliberately departed from the bundle

Three, all in the same direction — refusing to display something the app cannot
back up:

1. **The why-sheet starts at 50, not 100.** Your model baselines at 50 with both
   bonuses and penalties; the mock's "starting score 100" was illustrative. I
   added `explainHealthScore()` to `lib/healthscore.ts` so every row in that
   sheet is a rule that actually ran. A trust screen showing invented arithmetic
   would be the least trustworthy thing in the app.

2. **The shelf median only renders once the API returns it.** No placeholder,
   no invented "51".

3. **Nav labels are 10px/500, not the canvas's 9.5px.** Your own type rules in
   `globals.css` set an 11px floor; 9.5px broke it outright. Say the word and
   I'll take it literal.

Two smaller ones: the raised Scan tab uses `#2E2A20` in dark mode rather than
`--sk-text-primary` (which inverts to cream and would have made the tab light),
and I left the camera flash toggle out rather than render a control that does
nothing.

---

## 4 · What is left

### Blocked on you — cannot be done from here

| # | Item | What it needs |
|---|---|---|
| 1 | **Push and deploy** | `git push origin main` from your machine. No GitHub credentials in my sandbox. |
| 2 | **`categoryStats.json`** | `KASSALAPP_TOKEN` + the real category ids in the `BUCKETS` array of `lib/merk/buildCategoryStats.ts`, then `npx tsx lib/merk/buildCategoryStats.ts`. Until this exists the resolver goes Nutri-Score → absolute, skipping the category tier entirely. |
| 3 | **The 100-product diff** | Before `NEXT_PUBLIC_SKAREN_HEALTH_RESOLVER=1` goes on. The bundle is explicit: a user who saw 22 yesterday must not see 64 today. |
| 4 | **Nutri-Score coverage check** | Run ~500 real Norwegian barcodes and count how many return a usable `nutriscore_grade`. Under ~60 % and the fallback is the main path, which changes where the work should go. |

### Not verified

| # | Item | Why |
|---|---|---|
| 5 | **`next build`** | Exceeds the sandbox's process lifetime — webpack doesn't finish before the shell is killed. `tsc --noEmit` and `next lint` are both clean, and I unit-checked the EAN validator, the Nutri-Score mapping and the band thresholds. But run the build before pushing. |
| 6 | **Dark mode in a browser** | Still never rendered. The token values are right; the bundle budgets a day to walk every screen, and the greens will likely need nudging in place. |
| 7 | **Every new screen visually** | I have no browser here. The no-data screen, the why-sheet, the donuts and the week chart have been type-checked and linted but not looked at. |

### Known gaps in what I built

| # | Item | Note |
|---|---|---|
| 8 | **Merk's eyes don't track the barcode** | The scanner doesn't expose detection coordinates. Needs a change in `BarcodeScanner` first. |
| 9 | **Camera flash toggle** | Omitted rather than faked. |
| 10 | **Pull-to-refresh fold** | His folded corner straightening as you pull is not built. |
| 11 | **Section stagger on result load** | The 40ms top-down stagger is not implemented. |
| 12 | **Per-serving nutrition toggle** | Still per-100g only; needs portion data, which the catalogue doesn't supply. |
| 13 | **Margin notes** | The small pointing Merk with a speech bubble for genuinely surprising findings — not built. |
| 14 | **Merk as SVG export** | Still the React component. Fine for the app; matters if marketing needs him standalone. |

### Product questions the bundle raises and nobody has answered

- Per-100g daily percentages overstate reality for cheese, oil and spices.
- The catalogue is a single point of failure — what does the app do when it's down?
- Eco is one tile. Fine if health is the pivot, but make it a deliberate decision.
- **Don't build any cross-category ranking** — a global "best products" list —
  until scoring is category-relative. That's where the current flaw becomes
  visible.
- Open Food Facts is ODbL: attribution is required and there are share-alike
  obligations on derived databases.

---

## 5 · One thing to look at before you push

Commit `19ea39e`, "Redesign D2 'Merk gir svar'", is **your** in-progress work,
not mine — the verdict-led result screen with `BarcodeMeter`. It got committed
when I staged `components/` while recovering from a git lock error. It is a
different result-screen direction from D1 "The Shelf", which is what the bundle
locks and what everything else here is built to.

The two currently coexist: the D2 verdict card and folded-corner treatment sit
above the D1 score card. That may be exactly what you want, or it may be one
direction too many on a single screen. Worth deciding before this goes out.
