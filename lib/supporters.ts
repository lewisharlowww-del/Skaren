import { createClient } from "@supabase/supabase-js";
import { getSupporterBadge } from "@/lib/premium";

export type SupporterStatus = "supporter" | "founding_supporter" | "skaren_founder" | "active" | "past_due" | "canceled" | "inactive";

export type SupporterRecord = {
  user_id: string;
  stripe_customer_id?: string | null;
  subscription_id?: string | null;
  supporter_status: SupporterStatus;
  current_period_end?: string | null;
  amount_nok?: number | null;
  customer_email?: string | null;
  checkout_session_id?: string | null;
};

export function getSupporterStatusFromAmount(amountNok: number): SupporterStatus {
  if (amountNok >= 1000) return "skaren_founder";
  if (amountNok >= 200) return "founding_supporter";
  if (amountNok > 0) return "supporter";
  return "inactive";
}

export function supporterStatusIsActive(status?: string | null) {
  return status === "supporter" || status === "founding_supporter" || status === "skaren_founder" || status === "active";
}

export function getSupporterBadgeFromRecord(record?: { supporter_status?: string | null; amount_nok?: number | null } | null) {
  if (!record) return "Supporter";
  if (record.supporter_status === "skaren_founder") return "Skaren Founder";
  if (record.supporter_status === "founding_supporter") return "Founding Supporter";
  if (record.amount_nok) return getSupporterBadge(record.amount_nok);
  return "Supporter";
}

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function upsertSupporterRecord(record: SupporterRecord) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    console.warn("[Supporters] Supabase admin is not configured.");
    return null;
  }

  const { data, error } = await supabase
    .from("supporters")
    .upsert(
      {
        ...record,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[Supporters] Could not upsert supporter record:", error);
    return null;
  }

  return data;
}

export async function updateSupporterRecordByStripeIds({
  stripeCustomerId,
  subscriptionId,
  supporterStatus,
  currentPeriodEnd
}: {
  stripeCustomerId?: string | null;
  subscriptionId?: string | null;
  supporterStatus: SupporterStatus;
  currentPeriodEnd?: string | null;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    console.warn("[Supporters] Supabase admin is not configured.");
    return null;
  }

  let query = supabase.from("supporters").select("user_id").limit(1);

  if (subscriptionId) {
    query = query.eq("subscription_id", subscriptionId);
  } else if (stripeCustomerId) {
    query = query.eq("stripe_customer_id", stripeCustomerId);
  } else {
    return null;
  }

  const { data: existing, error: lookupError } = await query.maybeSingle();

  if (lookupError || !existing?.user_id) {
    if (lookupError) console.error("[Supporters] Could not find supporter record:", lookupError);
    return null;
  }

  const { data, error } = await supabase
    .from("supporters")
    .update({
      stripe_customer_id: stripeCustomerId ?? undefined,
      subscription_id: subscriptionId ?? undefined,
      supporter_status: supporterStatus,
      current_period_end: currentPeriodEnd ?? null,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", existing.user_id)
    .select()
    .single();

  if (error) {
    console.error("[Supporters] Could not update supporter record:", error);
    return null;
  }

  return data;
}

export async function getSupporterRecordForUser(userId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) return null;

  const { data, error } = await supabase.from("supporters").select("*").eq("user_id", userId).maybeSingle();

  if (error) {
    console.error("[Supporters] Could not read supporter record:", error);
    return null;
  }

  return data;
}
