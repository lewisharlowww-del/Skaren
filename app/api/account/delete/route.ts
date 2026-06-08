import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const uid = userData.user.id;

    // Delete all user data in parallel
    await Promise.all([
      supabaseAdmin.from("scans").delete().eq("user_id", uid),
      supabaseAdmin.from("scan_history").delete().eq("user_id", uid),
      supabaseAdmin.from("push_subscriptions").delete().eq("user_id", uid),
      supabaseAdmin.from("insights").delete().eq("user_id", uid),
      supabaseAdmin.from("shopping_list").delete().eq("user_id", uid),
    ]);

    // Delete auth user last (invalidates the token)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (deleteError) {
      console.error("[account/delete] auth delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete auth user" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[account/delete]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
