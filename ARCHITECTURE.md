# Skaren - Architecture Overview

Skaren (folder named EcoScan) is a mobile-first product-scanning app for Norwegian groceries.

## Stack
- **Frontend/Backend:** Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS
- **Mobile shell:** Capacitor 8 wraps the web app into native iOS + Android apps (`appId: no.skaren.app`, loads from `https://skaren.app`)
- **Auth/DB:** Supabase (auth + Postgres, client-side sessions in localStorage)
- **Payments:** RevenueCat in-app purchases (App Store / Google Play billing)
- **AI:** OpenAI for product summaries/alternatives

## How it works (data flow)
A user scans a barcode, then the app combines data from 3 external sources to produce Health + Eco grades:
1. **Kassalapp** - Norwegian product names, brands, official images, prices
2. **Open Food Facts** - eco/nutrition/packaging/ingredients
3. **OpenAI** - AI summary + greener alternatives (cached in Supabase `product_cache`)

## Layer breakdown

- `app/` - Pages (scan, dashboard, history, stats, product/[barcode], account, pricing) plus `app/api/` route handlers (scan, push, account export/delete, products search)
- `lib/` - Core domain logic: `ecoscore.ts`, `healthscore.ts`, `additives.ts`/`enumbers.ts` (E-number safety), `kassalapp.ts`, `openfoodfacts.ts`, `openai.ts`, `productCache.ts`, plus `supabase.ts`, `revenuecat.ts`, `premium.ts`, i18n
- `components/` - UI: BarcodeScanner (html5-qrcode), score badges, paywall/checkout, PWA shell, splash
- `hooks/` - Client state for scans, stats, streaks, shopping list, user
- `supabase/` - SQL schema (scans, push_subscriptions)

## Notable details
- **PWA + native:** Service worker (`/sw.js`), web-push notifications, offline page
- **Grading engine:** Custom "Skaren grade" derived from nutrition (Nokkelhull label), additives risk levels (avoid/moderate), and eco scores
- **`middleware.ts`** only redirects `/` to `/scan` at the edge (auth is client-side, with a comment about a React #419 Suspense bug they worked around)
- **i18n:** Norwegian + English (`locales/`, `lib/i18n.ts`)
