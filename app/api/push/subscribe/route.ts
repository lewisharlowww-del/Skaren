import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey);
}

type SubscribeBody = {
  action: "subscribe" | "unsubscribe" | "update" | "get";
  endpoint: string;
  p256dh?: string;
  auth?: string;
  streak_enabled?: boolean;
  weekly_enabled?: boolean;
};

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration unavailable" }, { status: 503 });
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as SubscribeBody;
    const { action, endpoint, p256dh, auth, streak_enabled, weekly_enabled } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    if (action === "get") {
      const { data } = await supabaseAdmin
        .from("push_subscriptions")
        .select("streak_enabled, weekly_enabled")
        .eq("user_id", userData.user.id)
        .eq("endpoint", endpoint)
        .single();
      return NextResponse.json(data ?? {});
    }

    if (action === "unsubscribe") {
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userData.user.id)
        .eq("endpoint", endpoint);
      return NextResponse.json({ ok: true });
    }

    if (action === "update") {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (streak_enabled !== undefined) updates.streak_enabled = streak_enabled;
      if (weekly_enabled !== undefined) updates.weekly_enabled = weekly_enabled;

      await supabaseAdmin
        .from("push_subscriptions")
        .update(updates)
        .eq("user_id", userData.user.id)
        .eq("endpoint", endpoint);
      return NextResponse.json({ ok: true });
    }

    // action === "subscribe"
    if (!p256dh || !auth) {
      return NextResponse.json({ error: "Missing keys" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userData.user.id,
          endpoint,
          p256dh,
          auth,
          streak_enabled: streak_enabled ?? true,
          weekly_enabled: weekly_enabled ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" }
      );

    if (error) {
      console.error("[push/subscribe] DB error:", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/subscribe] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
