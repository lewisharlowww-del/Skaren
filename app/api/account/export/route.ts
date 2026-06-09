import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey);
}

export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration unavailable" }, { status: 503 });
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = userData.user.id;

    const { data: scans, error } = await supabaseAdmin
      .from("scans")
      .select("barcode,product_name,brand,health_grade,skaren_grade,ecoscan_score,additives_total,additives_to_avoid,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

    // Build CSV
    const headers = [
      "Date",
      "Product name",
      "Brand",
      "Barcode",
      "Health grade",
      "Skaren grade",
      "Score",
      "Additives total",
      "Additives to avoid",
    ];

    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const rows = (scans ?? []).map((s) => [
      escape(s.created_at ? new Date(s.created_at).toISOString().slice(0, 10) : ""),
      escape(s.product_name),
      escape(s.brand),
      escape(s.barcode),
      escape(s.health_grade),
      escape(s.skaren_grade),
      escape(s.ecoscan_score),
      escape(s.additives_total),
      escape(s.additives_to_avoid),
    ].join(","));

    const csv = [headers.join(","), ...rows].join("\n");
    const filename = `skaren-export-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[account/export]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
