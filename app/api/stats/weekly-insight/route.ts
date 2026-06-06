import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { generateWeeklyStatsInsight } from "@/lib/openai";

type InsightStats = {
  totalScans: number;
  avgHealthGrade: string;
  trendVsLast: number;
  gradeBreakdown: Record<string, number>;
  additivesTotal: number;
  additivesToAvoid: number;
  additivesModerate: number;
  mostScanned: Array<{
    name: string;
    count: number;
    healthGrade: string;
  }>;
};

function fallbackInsight(stats: InsightStats) {
  const strongestGrade = Object.entries(stats.gradeBreakdown).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  if (!stats.totalScans) {
    return "Your next scan will start a clearer picture of your weekly choices.";
  }

  return `${stats.totalScans} scans leaned most toward grade ${strongestGrade}; compare one similar product before your next shop.`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    week?: string;
    stats?: InsightStats;
  };
  const week = body.week?.trim();
  const stats = body.stats;

  if (!week || !stats) {
    return NextResponse.json(
      { error: "Week and stats are required." },
      { status: 400 }
    );
  }

  const fallback = fallbackInsight(stats);
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ text: fallback });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  const { data: userData } = await supabase.auth.getUser(token);
  const user = userData.user;

  if (!user) {
    return NextResponse.json({ text: fallback }, { status: 401 });
  }

  const cached = await supabase
    .from("insights")
    .select("text")
    .eq("user_id", user.id)
    .eq("week", week)
    .maybeSingle();

  if (cached.data?.text) {
    return NextResponse.json({ text: cached.data.text, cached: true });
  }

  const generated = (await generateWeeklyStatsInsight(stats)) || fallback;

  await supabase.from("insights").insert({
    user_id: user.id,
    week,
    text: generated
  });

  return NextResponse.json({ text: generated, cached: false });
}
