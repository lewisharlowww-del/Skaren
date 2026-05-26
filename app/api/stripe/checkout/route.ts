import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type StripeCheckoutResponse = {
  url?: string;
  error?: {
    message?: string;
  };
};

function getOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;

  return new URL(request.url).origin;
}

async function getCheckoutUser(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!supabaseUrl || !supabaseAnonKey || !token) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return null;

  return data.user;
}

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      {
        error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY to .env.local."
      },
      { status: 500 }
    );
  }

  const user = await getCheckoutUser(request);

  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "Log in before supporting Skaren so we can attach the badge to your account." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { amountNok?: number };
  const amountNok = Math.round(Number(body.amountNok ?? 150));

  if (!Number.isFinite(amountNok) || amountNok < 50 || amountNok > 5000) {
    return NextResponse.json({ error: "Choose a support amount between 50 and 5000 kr." }, { status: 400 });
  }

  const origin = getOrigin(request);
  const params = new URLSearchParams({
    mode: "payment",
    "line_items[0][price_data][currency]": "nok",
    "line_items[0][price_data][product_data][name]": "Support Skaren",
    "line_items[0][price_data][product_data][description]": "One-time contribution to help keep Skaren independent and improving.",
    "line_items[0][price_data][unit_amount]": String(amountNok * 100),
    "line_items[0][quantity]": "1",
    success_url: `${origin}/pricing?checkout=success&amount=${amountNok}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    allow_promotion_codes: "true",
    billing_address_collection: "auto",
    "metadata[app]": "skaren",
    "metadata[type]": "support",
    "metadata[amount_nok]": String(amountNok),
    "metadata[user_id]": user.id,
    "metadata[user_email]": user.email,
    client_reference_id: user.id,
    customer_email: user.email
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  const data = (await response.json()) as StripeCheckoutResponse;

  if (!response.ok || !data.url) {
    return NextResponse.json(
      { error: data.error?.message ?? "Could not start Stripe Checkout." },
      { status: response.status || 500 }
    );
  }

  return NextResponse.json({ url: data.url });
}
