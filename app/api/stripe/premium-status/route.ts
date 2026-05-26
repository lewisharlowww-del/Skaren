import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupporterBadgeFromRecord, getSupporterRecordForUser, supporterStatusIsActive } from "@/lib/supporters";

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
  const user = await getRequestUser(request);

  if (!user) {
    return NextResponse.json({ premium: false, error: "not_authenticated" }, { status: 401 });
  }

  const record = await getSupporterRecordForUser(user.id);
  const premium = supporterStatusIsActive(record?.supporter_status);

  return NextResponse.json({
    premium,
    amountNok: Number(record?.amount_nok ?? 0),
    badge: getSupporterBadgeFromRecord(record),
    supporterStatus: record?.supporter_status ?? "inactive",
    currentPeriodEnd: record?.current_period_end ?? null
  });
}
