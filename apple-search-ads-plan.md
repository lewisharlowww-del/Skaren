# Skaren — Apple Search Ads Plan (Norway)

**Product:** Apple Search Ads **Advanced** (keyword-level control)
**Budget:** ~$5–10/day (~50–100 NOK/day). Start at **$7/day** total.
**Goal:** Installs (volume, at a sensible cost).
**Geo:** Norway only. **Languages:** Norwegian + English searches.
**Model:** Cost-Per-Tap (you pay per tap, not per install).

> You cannot pre-set everything from one screen. ASA Advanced structures work as
> **Campaign → Ad Group → Keywords**. Below is the exact structure to recreate.
> Bids are starting points in USD; adjust after the first week using the routine
> at the bottom. Apple shows suggested bids when you add keywords — if a
> suggestion is far from mine, trust Apple's range and start near its low end.

---

## Account structure (4 campaigns)

Split budget so the reliable campaigns get most of it and Discovery mines new terms.

| Campaign | Purpose | Daily budget | Match types |
|---|---|---|---|
| 1. Brand | Catch people already searching "skaren" | $1 | Exact |
| 2. Category (Generic) | Core intent: food scanner, additives | $3.5 | Exact |
| 3. Competitor | People searching rival apps | $1.5 | Exact |
| 4. Discovery | Find new keywords cheaply | $1 | Broad + Search Match |

Total ≈ **$7/day**. Once you see which campaign converts cheapest, shift budget toward it (typically Category or Brand).

---

## Campaign 1 — Brand  (budget $1/day)

Cheapest installs you'll ever get. Defends your name from competitors bidding on it.

**Ad Group: Brand — Exact**  · starting bid **$0.30–0.50**
```
skaren
skaren app
skaren scanner
skaren mat
```

Negative keywords: none needed (it's your own name).

---

## Campaign 2 — Category / Generic  (budget $3.5/day) ← your main engine

This is where most spend and installs come from. Norwegian terms first (highest intent for your market), English second.

**Ad Group: NO — Core Exact**  · starting bid **$0.60–0.90**
```
matscanner
matvarescanner
strekkode scanner
skann mat
tilsetningsstoffer
e-nummer
e nummer
matvaresjekk
sunn mat app
ernæring app
kosthold app
matvare skanner
sjekk mat
```

**Ad Group: NO — Additive intent Exact**  · starting bid **$0.50–0.80**
```
e-stoffer
tilsetningsstoffer liste
er e-nummer farlig
usunn mat
ultraprosessert mat
```

**Ad Group: EN — Core Exact**  · starting bid **$0.40–0.70**
```
food scanner
barcode food scanner
food additives
e number scanner
healthy food app
nutrition scanner
ingredient scanner
```

**Negative keywords (add at campaign level):**
```
recipe
recipes
oppskrift
diet plan
slankekur
game
free money
barcode generator
qr code
```

---

## Campaign 3 — Competitor  (budget $1.5/day)

Bid on rival app names so their searchers see you. Legal on ASA (you can target competitor *keywords*; you just can't use their name in your ad text — ASA auto-generates ads from your listing anyway).

**Ad Group: Competitors — Exact**  · starting bid **$0.40–0.70**
```
yuka
yuka app
frifor
frifor app
matvaresjekk app
mat sjekk
open food facts
ernær
```

> Watch these closely. Competitor terms can be pricey and lower-converting.
> If cost-per-install runs high after a week, pause the worst offenders.

---

## Campaign 4 — Discovery  (budget $1/day)

Let Apple find keywords you haven't thought of. This *feeds* your other campaigns.

**Ad Group: Discovery — Broad**  · starting bid **$0.30–0.50**
- Add your Category keywords again but set match type to **Broad**.
- Turn **Search Match = ON** (Apple auto-matches your listing to relevant searches).

**Add ALL your other campaigns' exact keywords here as negatives** so Discovery
only surfaces *new* terms:
```
(paste every exact keyword from campaigns 1–3 as negative exact)
```

Every week: pull the **Search Terms report**, find winning terms, and move them
as new **Exact** keywords into Campaign 2. This is the growth loop.

---

## Global settings (apply to every campaign)

- **Countries/Regions:** Norway only
- **Ad Scheduling:** all day (start simple)
- **Audience → Customer type:** "All users" first. Later test "New users" only
  to avoid paying for people who already have the app.
- **Devices:** iPhone (and iPad if your app supports it well)
- **Search Match:** OFF for campaigns 1–3, ON only for Discovery

---

## Week-by-week optimization routine

**Day 0 (launch):** Set everything above. Spend will start slow — normal.

**Every 2–3 days, check each keyword's:**
- **Tap-Through Rate (TTR):** low TTR (<3%) = your listing/screenshots aren't
  compelling for that term, or the term is off-intent.
- **Conversion Rate (CR):** taps → installs. <30% CR on a keyword = weak match.
- **Cost-Per-Acquisition (CPA / avg CPA):** your north star. This is $ per install.

**Rules of thumb:**
- Keyword getting installs cheaply (low CPA) → **raise bid 15–20%** to get more volume.
- Keyword spending with **0 installs after ~15–20 taps** → **cut bid 30%** or pause.
- Keyword with high taps, low CR → check the search term is actually relevant;
  add negatives to block bad variants.
- Pull the **Search Terms report weekly** → promote winners to Exact in Campaign 2,
  add junk terms as negatives everywhere.

**After 2 weeks:** you'll know your real CPA. Shift the daily budget toward the
campaign with the lowest CPA (usually Brand + Category).

---

## What "good" looks like in Norway (rough benchmarks)

- **TTR:** 3–7% is healthy for exact-match.
- **CR (tap→install):** 40–60% for on-target keywords.
- **CPA:** Brand often $0.30–1.00; Category $1–3; Competitor $2–5.
- If Category CPA sits under ~$2–3 and those users convert to Pro, scale up.

---

## Things to set up BEFORE you spend (they lift results a lot)

1. **Custom Product Page / Creative Sets:** ASA can show different screenshots
   per keyword theme. At minimum, make sure your default screenshots lead with
   the strongest benefit (we discussed the hero screenshot).
2. **Localized listing:** your Norwegian App Store text should be live (the
   optimized title/subtitle/keywords from app-store-listing.md). ASA quality and
   relevance draw from your listing.
3. **In-app rating prompt:** already added — more ratings = higher store
   conversion = cheaper installs.
4. **Apple Search Ads Attribution / analytics:** connect so you can see which
   keywords drive not just installs but *Pro conversions* later.

---

## TL;DR to launch today
1. Create 4 campaigns above, Norway only, $7/day total.
2. Paste the keyword lists into each ad group with the starting bids.
3. Add the negative keywords.
4. Turn Search Match ON only for Discovery.
5. Check every 2–3 days; promote winners, cut zeros; pull Search Terms weekly.
