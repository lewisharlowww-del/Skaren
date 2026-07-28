# Skaren / EcoScan — Full App Audit

Stack: Next.js 14, React 18, TypeScript, Tailwind, Supabase, RevenueCat,
Capacitor (iOS + Android), Kassalapp + Open Food Facts + OpenAI.
~98 TS/TSX files, 27 routes, 6 API routes.

Severity: 🔴 critical  🟠 high  🟡 medium  🟢 low/polish

---

## 🔴 CRITICAL — money & security

### C1. `/api/scan` has no auth and no rate limit — anyone can burn your OpenAI + Kassalapp budget
- The endpoint calls OpenAI (`generateAiSummary`, ~700 tokens) on every miss and
  hits Kassalapp + OFF, but requires NO token and has NO rate limit.
- A script can POST random barcodes in a loop and run up your OpenAI/Kassalapp
  bill, or just degrade the service. This is the single biggest risk.
- Fix: add IP + user rate limiting (Upstash Redis or a simple in-memory/edge
  limiter), require a Supabase token for the AI portion, and cache aggressively
  (you already cache AI by barcode — good; make sure the cache is checked BEFORE
  any paid call, which it is, but the Kassalapp/OFF fetches still run every time).

### C2. No free-scan limit is enforced anywhere (server OR client)
- I found `isPremium` gating on the *search* feature, but scanning itself has no
  daily/free cap. Free users can scan unlimited products.
- Two problems: (a) no incentive to upgrade → hurts INSTALL→PAID conversion,
  (b) every free scan can cost you an OpenAI call.
- Fix: enforce e.g. 3-5 free scans/day server-side (count in Supabase by user or
  device id), return a 402/403 with an upgrade prompt. This directly lifts revenue.

### C3. `/api/kassalapp-image` is unauthenticated and unbounded
- Open proxy to Kassalapp keyed only on a barcode. Free to abuse as a scraping
  proxy against your API key/quota. Add auth + rate limit, or cache + restrict.

### C4. No security headers (CSP, HSTS, X-Frame-Options, etc.)
- `next.config` sets none. Add a baseline: `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, and a `Content-Security-Policy`. Cheap, big hardening win.

### C5. Confirm Supabase RLS on every user table
- Only `push_subscriptions.sql` shows a policy. `scans`, `scan_history`,
  `insights`, `shopping_list`, `profiles` must ALL have Row Level Security
  enabled with per-user policies. The scan route uses the service-role key
  (bypasses RLS) which is fine server-side, but the browser client reads these
  tables directly — without RLS, any logged-in user could read others' data.
  ACTION: verify in Supabase dashboard that RLS is ON for all these tables.

---

## 🟠 HIGH — correctness & robustness

### H1. Zero automated tests for your own code
- The only tests found are inside `node_modules`/iOS vendor SDKs. Your grading
  logic (`healthscore.ts`, `ecoscore.ts`, `enumbers.ts`) is the CORE of the app
  and is untested. A wrong grade erodes trust and is your product's whole value.
- Fix: add unit tests for health/eco grade calculation and E-number parsing with
  a handful of known Norwegian products as fixtures. Vitest is a 30-min setup.

### H2. `profiles.is_premium` can drift from RevenueCat
- Premium is written to `profiles` fire-and-forget from the client. If that write
  fails, a paying user is treated as free by server features (search). Consider a
  RevenueCat webhook → Supabase as the source of truth instead of client writes.

### H3. Silent DB schema fallback in scan save masks real errors
- `saveScanToHistory` catches an insert error and retries with fewer columns,
  logging only a warning. If your schema is missing columns in production you'll
  silently lose additive data. Make the schema explicit + migrate, don't guess.

### H4. `console.error`/`warn` leak internals; `error: String(error)` returned to client
- `/api/scan` returns `message: String(error)` on 500 — can leak internal detail.
  Return a generic message; log the detail server-side only.

---

## 🟡 MEDIUM — architecture & maintainability

### M1. Oversized "god" components
- `shopping-list/page.tsx` 1109 lines, `kassalapp.ts` 912, `account/page.tsx` 847,
  `ProductPageLayout.tsx` 826. These are hard to test and change safely.
- Fix: extract data-fetching hooks and presentational subcomponents. Especially
  split shopping-list into list/hooks/row components.

### M2. Duplicated table names / two history systems
- Both `scans` AND `scan_history` are deleted per user — suggests two overlapping
  history models. Consolidate to one to avoid drift and double writes.

### M3. Grading + i18n logic lives in `components/` and `lib/` interchangeably
- e.g. `components/additives.ts`, `components/healthscore`? vs `lib/`. Keep pure
  logic in `lib/`, React in `components/`. Improves testability and clarity.

### M4. No shared API auth helper
- Each route re-implements `getUser(token)` + service-role client. Extract a
  `requireUser(request)` helper to centralize auth and reduce copy-paste bugs.

---

## 🟡 PERFORMANCE

### P1. Images mostly raw `<img>`, not `next/image`
- Only 3 files use `next/image`; product images come from many remote hosts.
  Raw imgs = no resizing/lazy/AVIF. Route product images through `next/image`
  (remotePatterns are already configured) to cut mobile data + speed up LCP.

### P2. Scan flow does sequential awaits
- In `/api/scan`, Kassalapp then OFF are awaited one after another. Run them with
  `Promise.all` to shave latency off every scan (the user is staring at a spinner).

### P3. AI call is on the critical path
- The scan response waits for OpenAI before returning. Consider returning product
  + grades immediately and streaming/deferring the AI insights (fetch them from
  `/product/[barcode]` after paint). Faster perceived scan.

---

## 🟢 UX / GROWTH (ties to your install goal)

### U1. Add a referral / share loop
- You have `stats/weekly-insight`. Add a shareable "my weekly health score" image
  (OG image route already exists — `opengraph-image.tsx`). Users sharing = free
  installs. Highest-leverage growth feature you can build.

### U2. Paywall timing
- With no free-scan limit, users never hit a natural upgrade moment. A "you've
  used 3/3 free scans today" paywall at the moment of intent converts far better
  than a passive pricing page. (Pairs with C2.)

### U3. Accessibility pass
- Verify tap targets ≥44px, color contrast on the grade colors, and that the
  scanner screen has proper labels for VoiceOver. Helps App Store review + reach.

### U4. Offline resilience
- You have `offline/` + a service worker. Make sure a failed scan while offline
  shows a clear "you're offline" state, not a generic error.

---

## SUGGESTED ORDER (biggest ROI first)

1. C2 + U2  — free-scan limit + intent paywall   (revenue + cost control)
2. C1 + C3  — rate limit the AI/proxy endpoints    (stop bill blow-ups)
3. C5       — verify RLS on all tables             (data-leak prevention)
4. C4       — security headers                     (1 hour, big hardening)
5. H1       — tests for grading logic              (protect core trust)
6. U1       — shareable weekly-score card          (free installs)
7. P2 + P3  — parallel + deferred scan             (snappier UX)
8. M1/M2    — refactor god components + unify history

Items 1-4 are a day of work and address real money/security exposure.
I can implement any of these now — say which and I'll do it with tests and commit.
