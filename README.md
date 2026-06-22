# Skaren MVP

Skaren is a mobile-first Next.js MVP that lets users enter a product barcode, fetch Norwegian product data from Kassalapp, combine it with eco data from Open Food Facts, show Health and Eco grades, and optionally sign up to save scan history and review progress in a dashboard.

## Tech Stack

- Next.js 14 and React
- TypeScript
- Tailwind CSS
- Supabase auth and database
- Kassalapp barcode lookup for Norwegian product names, brands, official images, and prices
- Open Food Facts barcode lookup for eco, nutrition, packaging, origin, and ingredient signals
- OpenAI for AI product summaries and alternatives
- Mobile camera barcode scanning with `html5-qrcode`
- RevenueCat for in-app subscriptions (iOS/Android)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project.

3. Copy the environment example:

```bash
cp .env.example .env.local
```

4. Add your Supabase values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-5.4-nano
KASSALAPP_API_KEY=your-kassalapp-key
```

5. Create the `scans` table in Supabase SQL editor:

```sql
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  barcode text not null,
  product_name text not null,
  brand text,
  eco_score_grade text not null,
  ecoscan_score integer not null,
  product_image text,
  created_at timestamptz not null default now()
);

alter table public.scans enable row level security;

create policy "Users can read their own scans"
on public.scans for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own scans"
on public.scans for insert
to authenticated
with check (auth.uid() = user_id);
```

7. Create the product AI cache table in Supabase SQL editor:

```sql
create table if not exists public.product_cache (
  barcode text primary key,
  ai_summary jsonb,
  ai_alternatives jsonb,
  ai_cached_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_cache
add column if not exists ai_summary jsonb,
add column if not exists ai_alternatives jsonb,
add column if not exists ai_cached_at timestamptz;

alter table public.product_cache enable row level security;

create policy "Anyone can read product cache"
on public.product_cache for select
to anon, authenticated
using (true);

create policy "Anyone can write product cache"
on public.product_cache for insert
to anon, authenticated
with check (true);

create policy "Anyone can update product cache"
on public.product_cache for update
to anon, authenticated
using (true)
with check (true);
```

8. Run the app:

```bash
npm run dev
```

Then open `http://localhost:3000`.

Guest scanning works without Supabase auth. Supabase is only required for saved history, badges, and dashboard stats.

Camera scanning works best on a real iPhone or Android browser over `https` or `localhost`. If camera permission is blocked or unavailable, the manual barcode field remains available.

## Open Food Facts API

Skaren uses this public endpoint:

```text
https://world.openfoodfacts.org/api/v2/product/{barcode}
```

Example barcode to try:

```text
3017620422003
```

## Kassalapp Product Data

Kassalapp is the primary product source for Norway. Add your API key to `.env.local`:

```bash
KASSALAPP_API_KEY=your-kassalapp-key
```

Skaren calls:

```text
https://kassal.app/api/v1/products/ean/{barcode}
```

Kassalapp provides product name, brand, official product image, EAN, and Norwegian store prices. Open Food Facts is still used for eco data only. Skaren never displays Open Food Facts user-uploaded photos.

## Product Images

Skaren only displays verified Kassalapp product images. If Kassalapp does not provide an image, Skaren shows a clean placeholder with a large category emoji and product name on a green gradient.

## Product Grade Logic

Skaren shows separate Health and Eco grades instead of one combined score.

- Health uses available nutrition data, Nutri-Score, and the Norwegian Nøkkelhull label.
- Eco uses official Open Food Facts Eco-Score data when available.
- Missing Eco data is shown as unavailable instead of lowering another grade.

## Important Files

- `app/page.tsx` - landing page
- `app/auth/page.tsx` - Supabase email login and signup
- `app/dashboard/page.tsx` - monthly stats, streak, badges, and history
- `app/scan/page.tsx` - manual barcode input and Open Food Facts lookup
- `app/product/[barcode]/page.tsx` - product result, grades, nutrition, allergens, and ingredients
- `app/pricing/page.tsx` - Skaren Pro subscription page (RevenueCat in-app purchases)
- `lib/kassalapp.ts` - Norwegian product lookup, official image handling, and store prices
- `lib/openfoodfacts.ts` - Open Food Facts eco data mapping
- `lib/ecoscore.ts` - Eco grade and nutrition grade mapping
- `lib/supabase.ts` - Supabase browser client

## Subscriptions

Skaren Pro is sold through RevenueCat in-app purchases on iOS and Android (App Store / Google Play billing). There is no external payment processor.
