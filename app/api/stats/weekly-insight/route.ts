import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { generateWeeklyStatsInsight } from "@/lib/openai";

type InsightStats = {
  totalScans: number;
  avgHealthGrade: string;
  scanTrendVsLast: number | null;
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

function fallbackInsight(stats: InsightStats, language: "no" | "en") {
  if (!stats.totalScans) {
    return language === "no"
      ? "Neste skanning gir et tydeligere bilde av ukens valg."
      : "Your next scan will start a clearer picture of your weekly choices.";
  }

  const strong = (stats.gradeBreakdown.A ?? 0) + (stats.gradeBreakdown.B ?? 0);
  const weaker = (stats.gradeBreakdown.D ?? 0) + (stats.gradeBreakdown.E ?? 0);

  if (stats.additivesToAvoid > 0) {
    return language === "no"
      ? "Et produkt inneholdt et tilsetningsstoff som bør unngås; sammenlign ingredienslisten neste gang."
      : "One product contained an additive to avoid; compare its ingredient list with an alternative next time.";
  }

  if (stats.additivesModerate > 0) {
    return language === "no"
      ? "Moderate tilsetningsstoffer dukket opp denne perioden; se etter et enklere alternativ neste gang."
      : "Moderate additives appeared this period; look for one simpler alternative next time.";
  }

  return language === "no"
    ? weaker > strong
      ? "Flere svakere valg preget perioden; sammenlign ett alternativ før neste kjøp."
      : "De fleste valgene var balanserte; fortsett å sammenligne produkter med tydelig ingrediensliste."
    : weaker > strong
      ? "Weaker choices shaped this period; compare one alternative before your next purchase."
      : "Most choices were balanced; keep comparing products with a clear ingredient list.";
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    week?: string;
    language?: "no" | "en";
    stats?: InsightStats;
  };
  const week = body.week?.trim();
  const language = body.language === "no" ? "no" : "en";
  const stats = body.stats;

  if (!week || !stats) {
    return NextResponse.json(
      { error: "Week and stats are required." },
      { status: 400 }
    );
  }

  const fallback = fallbackInsight(stats, language);
  const cacheWeek = `${week}:${language}`;
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
    .eq("week", cacheWeek)
    .maybeSingle();

  if (cached.data?.text) {
    return NextResponse.json({ text: cached.data.text, cached: true });
  }

  const generated =
    (await generateWeeklyStatsInsight(stats, language)) || fallback;

  await supabase.from("insights").insert({
    user_id: user.id,
    week: cacheWeek,
    text: generated
  });

  return NextResponse.json({ text: generated, cached: false });
}
