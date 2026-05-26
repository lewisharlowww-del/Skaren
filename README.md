# Skaren MVP

Skaren is a mobile-first Next.js MVP that lets users enter a product barcode, fetch Norwegian product data from Kassalapp, combine it with eco data from Open Food Facts, estimate a Skaren score, and optionally sign up to save scan history and review progress in a dashboard.

## Tech Stack

- Next.js 14 and React
- TypeScript
- Tailwind CSS
- Supabase auth and database
- Kassalapp barcode lookup for Norwegian product names, brands, official images, and prices
- Open Food Facts barcode lookup for eco, nutrition, packaging, origin, and ingredient signals
- OpenAI for AI product summaries and alternatives
- Mobile camera barcode scanning with `html5-qrcode`
- Stripe placeholder structure for future payments

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
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret
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

8. Create the supporter status table in Supabase SQL editor:

```sql
create table if not exists public.supporters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  subscription_id text,
  supporter_status text not null default 'inactive',
  current_period_end timestamptz,
  amount_nok integer,
  customer_email text,
  checkout_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists supporters_stripe_customer_id_idx
on public.supporters (stripe_customer_id)
where stripe_customer_id is not null;

create unique index if not exists supporters_subscription_id_idx
on public.supporters (subscription_id)
where subscription_id is not null;

alter table public.supporters enable row level security;

create policy "Users can read their own supporter status"
on public.supporters for select
to authenticated
using (auth.uid() = user_id);
```

The same SQL is also saved in `supabase/supporters.sql`.

9. Configure Stripe webhooks:

- Add a webhook endpoint in Stripe pointing to `https://your-domain.com/api/stripe/webhook`.
- Listen for `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, and `invoice.payment_failed`.
- Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` server-only.

10. Run the app:

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

## Skaren Score Logic

Skaren score is an easy-to-understand estimate based on available product data. It is not claimed to be scientifically perfect.

- Eco-Score A = 90
- Eco-Score B = 75
- Eco-Score C = 55
- Eco-Score D = 35
- Eco-Score E = 15
- Unknown = 50 with a limited data warning

## Important Files

- `app/page.tsx` - landing page
- `app/auth/page.tsx` - Supabase email login and signup
- `app/dashboard/page.tsx` - monthly stats, streak, badges, and history
- `app/scan/page.tsx` - manual barcode input and Open Food Facts lookup
- `app/product/[barcode]/page.tsx` - product result, grades, nutrition, allergens, and ingredients
- `app/pricing/page.tsx` - Stripe-powered Support Skaren page
- `lib/kassalapp.ts` - Norwegian product lookup, official image handling, and store prices
- `lib/openfoodfacts.ts` - Open Food Facts eco data mapping
- `lib/ecoscore.ts` - score mapping and suggestion logic
- `lib/supabase.ts` - Supabase browser client

## Stripe Support Payments

Skaren supports one-time NOK support payments through Stripe Checkout. Keep secret Stripe keys on the server and do not expose them through `NEXT_PUBLIC` variables.
