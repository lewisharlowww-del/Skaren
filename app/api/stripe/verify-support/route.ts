import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupporterStatusFromAmount, upsertSupporterRecord } from "@/lib/supporters";

type StripeCheckoutSessionResponse = {
  id?: string;
  status?: string | null;
  payment_status?: string | null;
  customer_email?: string | null;
  customer_details?: {
    email?: string | null;
  } | null;
  metadata?: {
    app?: string;
    type?: string;
    amount_nok?: string;
    user_id?: string;
    user_email?: string;
  } | null;
  amount_total?: number | null;
  customer?: string | null;
  client_reference_id?: string | null;
  subscription?: string | null;
  error?: {
    message?: string;
  };
};

function isPaidSkarenSupportSession(session: StripeCheckoutSessionResponse) {
  return (
    session.status === "complete" &&
    session.payment_status === "paid" &&
    session.metadata?.app === "skaren" &&
    session.metadata?.type === "support"
  );
}

async function getRequestUser(request: Request) {
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
    return NextResponse.json({ verified: false, error: "stripe_not_configured" }, { status: 200 });
  }

  const body = (await request.json().catch(() => ({}))) as { sessionId?: string };
  const sessionId = body.sessionId?.trim();

  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ verified: false, error: "missing_session" }, { status: 400 });
  }

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`
    },
    cache: "no-store"
  });

  const session = (await response.json()) as StripeCheckoutSessionResponse;

  if (!response.ok) {
    console.error("[Stripe] Support verification failed:", session.error?.message ?? session);
    return NextResponse.json({ verified: false, error: "stripe_lookup_failed" }, { status: 200 });
  }

  const amountNok = Number(session.metadata?.amount_nok ?? 0);
  const resolvedAmount = Number.isFinite(amountNok) ? amountNok : Math.round(Number(session.amount_total ?? 0) / 100);
  const user = await getRequestUser(request);
  const sessionUserId = session.client_reference_id ?? session.metadata?.user_id;

  if (user?.id && sessionUserId === user.id && isPaidSkarenSupportSession(session)) {
    await upsertSupporterRecord({
      user_id: user.id,
      stripe_customer_id: session.customer ?? null,
      subscription_id: session.subscription ?? null,
      supporter_status: getSupporterStatusFromAmount(resolvedAmount),
      current_period_end: null,
      amount_nok: resolvedAmount,
      customer_email: session.customer_email ?? session.customer_details?.email ?? user.email ?? null,
      checkout_session_id: session.id ?? sessionId
    });
  }

  return NextResponse.json({
    verified: isPaidSkarenSupportSession(session),
    amountNok: Number.isFinite(resolvedAmount) ? resolvedAmount : 0,
    email: session.customer_email ?? session.customer_details?.email ?? null,
    sessionId: session.id ?? sessionId
  });
}
