# Skaren — Security Review (Strix-style manual pass)

Date: 2026-07-09
Scope: Next.js backend API routes + auth + secret handling
Method: Strix requires Docker (not installed on this machine), so this is a
manual review in the same categories Strix automates: authz/access control,
SSRF, injection, secret exposure, cost/abuse, info leakage.

Legend: 🔴 High · 🟠 Medium · 🟡 Low · 🟢 Good

================================================================
🔴 HIGH — VAPID private key committed to git
================================================================
File: .env.example (line 12), committed in commit bc202c2
    VAPID_PRIVATE_KEY=6ggfAvmY1kXVBdyLEHUzRuRxTUx0spIYcXoCutxjDnE
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=BJNJboN...

The .env.example ships a REAL private key, and it is byte-for-byte identical
to the key in your live .env.local. Anyone with repo access (or if the repo is
ever public) can send web-push notifications that appear to come from Skaren
(phishing: "Your account was flagged, tap here").

FIX:
1. Rotate the VAPID keypair now:
   node -e "console.log(require('web-push').generateVAPIDKeys())"
2. Put the new private key ONLY in .env.local + Vercel env vars.
3. In .env.example, replace with a placeholder:
   VAPID_PRIVATE_KEY=your-vapid-private-key
4. Scrub git history (the old key stays in history until then):
   use `git filter-repo` or BFG, or accept rotation as the mitigation.
Note: CRON_SECRET in .env.example is already a placeholder — good.

================================================================
🟠 MEDIUM — Unauthenticated OpenAI cost abuse (/api/scan)
================================================================
File: app/api/scan/route.ts
The route accepts requests with NO auth token (token is optional; it's only
used to attribute history). Every call can trigger generateAiSummary() =
an OpenAI call. There is NO rate limiting anywhere in the app (confirmed:
no upstash/ratelimit/throttle in app or lib).

Impact: an attacker scripts POST /api/scan with random barcodes and burns
your OpenAI budget (financial DoS). AI results are cached per-barcode, which
softens repeat calls, but novel/невalid barcodes still hit the model.

FIX:
- Add rate limiting (Upstash Ratelimit is the standard for Vercel/Next):
  limit by IP and, when present, by user id. e.g. 30 scans/min/IP.
- Consider requiring auth for the AI-summary path (still allow anon product
  lookup, but gate the LLM call behind a signed-in user).

================================================================
🟠 MEDIUM — Same class: /api/stats/weekly-insight & /api/kassalapp-image
================================================================
- weekly-insight: falls back to non-auth path but still calls the LLM
  (generateWeeklyStatsInsight) only for authed users — OK-ish, but no rate
  limit, and body.stats is fully attacker-controlled (prompt injection into
  your OpenAI prompt). Sanitize/bound the stats fields before templating.
- kassalapp-image: fully unauthenticated, no rate limit. Low value but free
  proxy to Kassalapp. Add a basic IP rate limit.

================================================================
🟡 LOW — Internal error string leaked to client (/api/scan)
================================================================
app/api/scan/route.ts:189
    return NextResponse.json({ error: "scan_failed", message: String(error) }, {status:500})
Leaks raw exception text (stack fragments, internal detail) to the client.
FIX: log server-side, return a generic message:
    { error: "scan_failed" }  (drop String(error) from the response)

================================================================
🟡 LOW — No-op middleware / defense-in-depth
================================================================
middleware.ts is intentionally empty (auth is client-side + each route checks
its own bearer token). That's a valid pattern here, BUT it means every new
route MUST remember to verify the token. Two of your routes (scan,
kassalapp-image) don't. Consider a small shared `requireUser(request)` helper
so auth isn't copy-pasted (and occasionally forgotten).

================================================================
🟢 GOOD — What's already solid
================================================================
- /api/account/delete + /export: verify bearer token via supabaseAdmin.auth
  .getUser(token) and scope every query to the authenticated uid. No IDOR. ✅
- /api/push/subscribe: all actions scoped to user_id + endpoint. ✅
- /api/push/send: gated behind CRON_SECRET (constant Bearer compare). ✅
- /api/products/search: requires auth AND is_premium (Pro gating enforced
  server-side, not just client). ✅
- CSV export escapes quotes/commas/newlines — no CSV injection of the
  breaking kind (though see note below). ✅
- No SQL injection surface: everything goes through Supabase query builder
  (parameterized), no raw SQL string concatenation. ✅
- No raw fetch(userInput) → Kassalapp calls use a fixed base URL
  (https://kassal.app/api/v1/...), so no SSRF via the image/scan proxy. ✅
- .env.local is gitignored. ✅

================================================================
🟡 OPTIONAL — CSV formula injection (spreadsheet-side)
================================================================
export/route.ts escapes CSV structurally, but a product_name like
`=HYPERLINK(...)` would still execute if the user opens the CSV in Excel.
Low risk (data is the user's own scans), but to be safe prefix fields that
start with = + - @ with a single quote.

================================================================
RECOMMENDED ORDER
================================================================
1. Rotate + remove the VAPID private key (🔴, do today).
2. Add Upstash rate limiting to /api/scan (+ image + weekly-insight) (🟠).
3. Drop String(error) from the scan 500 response (🟡, 1 line).
4. Extract a requireUser() helper; apply to scan's AI path (🟡).
5. (Optional) CSV formula-injection guard + prompt-injection bounds.

To run the real Strix agent later: install Docker Desktop, then
  export STRIX_LLM="openai/gpt-5.4"; export LLM_API_KEY=...
  strix --target ./ --scan-mode standard
against a LOCAL/staging instance (never prod first).
