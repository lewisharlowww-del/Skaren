import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import {
  getSupporterStatusFromAmount,
  type SupporterStatus,
  updateSupporterRecordByStripeIds,
  upsertSupporterRecord
} from "@/lib/supporters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: StripeCheckoutSession | StripeSubscription | StripeInvoice;
  };
};

type StripeCheckoutSession = {
  id: string;
  mode?: string | null;
  status?: string | null;
  payment_status?: string | null;
  amount_total?: number | null;
  customer?: string | null;
  customer_email?: string | null;
  client_reference_id?: string | null;
  subscription?: string | null;
  metadata?: Record<string, string | undefined> | null;
  customer_details?: {
    email?: string | null;
  } | null;
};

type StripeSubscription = {
  id: string;
  customer?: string | null;
  status?: string | null;
  current_period_end?: number | null;
  metadata?: Record<string, string | undefined> | null;
};

type StripeInvoice = {
  id: string;
  customer?: string | null;
  subscription?: string | null;
  status?: string | null;
};

function parseStripeSignature(signatureHeader: string) {
  return signatureHeader.split(",").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key === "t") acc.timestamp = value;
      if (key === "v1") acc.signatures.push(value);
      return acc;
    },
    { timestamp: "", signatures: [] as string[] }
  );
}

function verifyStripeSignature(rawBody: string, signatureHeader: string | null, webhookSecret: string) {
  if (!signatureHeader) return false;

  const { timestamp, signatures } = parseStripeSignature(signatureHeader);
  if (!timestamp || signatures.length === 0) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = createHmac("sha256", webhookSecret).update(signedPayload, "utf8").digest("hex");
  const expected = Buffer.from(expectedSignature, "hex");

  return signatures.some((signature) => {
    const received = Buffer.from(signature, "hex");
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}

function centsToNok(amount?: number | null) {
  if (!amount || !Number.isFinite(amount)) return 0;
  return Math.round(amount / 100);
}

function unixToIso(timestamp?: number | null) {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString();
}

function subscriptionStatusToSupporterStatus(status?: string | null): SupporterStatus {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "canceled" || status === "incomplete_expired") return "canceled";
  return "inactive";
}

async function handleCheckoutCompleted(session: StripeCheckoutSession) {
  const userId = session.client_reference_id ?? session.metadata?.user_id;
  const isSkarenSupport = session.metadata?.app === "skaren" && session.metadata?.type === "support";
  const isPaid = session.status === "complete" && session.payment_status === "paid";

  if (!isSkarenSupport || !isPaid) return;

  if (!userId) {
    console.error("[Stripe webhook] Paid support checkout is missing user_id metadata:", {
      sessionId: session.id,
      customerEmail: session.customer_email ?? session.customer_details?.email ?? session.metadata?.user_email ?? null
    });
    throw new Error("Paid support checkout is missing user_id metadata.");
  }

  const amountNok = Number(session.metadata?.amount_nok ?? centsToNok(session.amount_total));
  const resolvedAmount = Number.isFinite(amountNok) ? amountNok : 0;

  const saved = await upsertSupporterRecord({
    user_id: userId,
    stripe_customer_id: session.customer ?? null,
    subscription_id: session.subscription ?? null,
    supporter_status: getSupporterStatusFromAmount(resolvedAmount),
    current_period_end: null,
    amount_nok: resolvedAmount,
    customer_email: session.customer_email ?? session.customer_details?.email ?? session.metadata?.user_email ?? null,
    checkout_session_id: session.id
  });

  if (!saved) {
    console.error("[Stripe webhook] Could not save checkout supporter status:", {
      sessionId: session.id,
      userId,
      amountNok: resolvedAmount,
      hasCustomer: Boolean(session.customer)
    });
    throw new Error("Could not save checkout supporter status.");
  }
}

async function handleSubscription(subscription: StripeSubscription, deleted = false) {
  const status = deleted ? "canceled" : subscriptionStatusToSupporterStatus(subscription.status);
  const userId = subscription.metadata?.user_id;

  if (userId) {
    const saved = await upsertSupporterRecord({
      user_id: userId,
      stripe_customer_id: subscription.customer ?? null,
      subscription_id: subscription.id,
      supporter_status: status,
      current_period_end: unixToIso(subscription.current_period_end)
    });
    if (!saved) throw new Error("Could not save subscription supporter status.");
    return;
  }

  await updateSupporterRecordByStripeIds({
    stripeCustomerId: subscription.customer,
    subscriptionId: subscription.id,
    supporterStatus: status,
    currentPeriodEnd: unixToIso(subscription.current_period_end)
  });
}

async function handleInvoice(invoice: StripeInvoice, paid: boolean) {
  await updateSupporterRecordByStripeIds({
    stripeCustomerId: invoice.customer,
    subscriptionId: invoice.subscription,
    supporterStatus: paid ? "active" : "past_due"
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret is not configured." }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  let event: StripeWebhookEvent;

  try {
    event = JSON.parse(rawBody) as StripeWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook JSON." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as StripeCheckoutSession);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscription(event.data.object as StripeSubscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscription(event.data.object as StripeSubscription, true);
        break;
      case "invoice.payment_succeeded":
        await handleInvoice(event.data.object as StripeInvoice, true);
        break;
      case "invoice.payment_failed":
        await handleInvoice(event.data.object as StripeInvoice, false);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe webhook] Failed to process event:", event.type, error);
    return NextResponse.json({ error: "Webhook processing failed.", eventType: event.type }, { status: 500 });
  }
}
