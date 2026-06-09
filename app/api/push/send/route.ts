import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushNotification } from "@/lib/webpush";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey);
}

// Vercel Cron or manual trigger — secured by CRON_SECRET
function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

type SendBody = {
  type: "streak" | "weekly";
};

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SendBody;
  const { type } = body;

  if (type === "streak") {
    return handleStreakReminder();
  }
  if (type === "weekly") {
    return handleWeeklySummary();
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

// GET handler for Vercel cron (cron jobs use GET)
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  if (type === "streak") return handleStreakReminder();
  if (type === "weekly") return handleWeeklySummary();

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

async function handleStreakReminder() {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server configuration unavailable" }, { status: 503 });
  }

  // Find users with streak-enabled subscriptions who haven't scanned today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Get all streak-enabled subscriptions
  const { data: subscriptions, error: subError } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*")
    .eq("streak_enabled", true);

  if (subError || !subscriptions?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  const toDelete: string[] = [];

  for (const sub of subscriptions) {
    // Check if user scanned today
    const { data: todayScans } = await supabaseAdmin
      .from("scans")
      .select("id")
      .eq("user_id", sub.user_id)
      .gte("created_at", todayStart.toISOString())
      .limit(1);

    if (todayScans && todayScans.length > 0) continue; // Already scanned today

    // Check if user has a streak (scanned yesterday)
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    const { data: yesterdayScans } = await supabaseAdmin
      .from("scans")
      .select("id")
      .eq("user_id", sub.user_id)
      .gte("created_at", yesterday.toISOString())
      .lt("created_at", todayStart.toISOString())
      .limit(1);

    const hasStreak = yesterdayScans && yesterdayScans.length > 0;

    const result = await sendPushNotification(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      hasStreak
        ? {
            title: "🔥 Don't break your streak!",
            body: "You haven't scanned anything today. Keep your streak alive.",
            url: "/scan",
          }
        : {
            title: "🌿 Time to scan",
            body: "Scan a product today to start building your health streak.",
            url: "/scan",
          }
    );

    if (result.gone) {
      toDelete.push(sub.endpoint);
    } else if (result.ok) {
      sent++;
    }
  }

  // Clean up expired subscriptions
  if (toDelete.length > 0) {
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .in("endpoint", toDelete);
  }

  return NextResponse.json({ sent });
}

async function handleWeeklySummary() {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server configuration unavailable" }, { status: 503 });
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const { data: subscriptions, error: subError } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*")
    .eq("weekly_enabled", true);

  if (subError || !subscriptions?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const GRADE_SCORE: Record<string, number> = { A: 95, B: 75, C: 55, D: 35, E: 15 };

  let sent = 0;
  const toDelete: string[] = [];

  for (const sub of subscriptions) {
    const { data: scans } = await supabaseAdmin
      .from("scans")
      .select("health_grade, ecoscan_score")
      .eq("user_id", sub.user_id)
      .gte("created_at", weekStart.toISOString());

    if (!scans || scans.length === 0) continue;

    const grades = scans.map((s) => {
      if (s.health_grade) return s.health_grade as string;
      if (s.ecoscan_score >= 80) return "A";
      if (s.ecoscan_score >= 60) return "B";
      if (s.ecoscan_score >= 40) return "C";
      if (s.ecoscan_score >= 20) return "D";
      return "E";
    });

    const avgScore =
      grades.reduce((sum, g) => sum + (GRADE_SCORE[g] ?? 50), 0) / grades.length;
    const avgGrade =
      avgScore >= 85 ? "A" : avgScore >= 70 ? "B" : avgScore >= 50 ? "C" : avgScore >= 30 ? "D" : "E";

    const avoidCount = scans.filter((s) => {
      const g = s.health_grade || "E";
      return g === "D" || g === "E";
    }).length;

    let body = `${scans.length} scans this week — average grade ${avgGrade}.`;
    if (avoidCount > 0) {
      body += ` ${avoidCount} product${avoidCount > 1 ? "s" : ""} worth reconsidering.`;
    }

    const result = await sendPushNotification(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      {
        title: "📊 Your weekly food summary",
        body,
        url: "/stats",
      }
    );

    if (result.gone) {
      toDelete.push(sub.endpoint);
    } else if (result.ok) {
      sent++;
    }
  }

  if (toDelete.length > 0) {
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .in("endpoint", toDelete);
  }

  return NextResponse.json({ sent });
}
