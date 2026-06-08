"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { gradeLetterToScore } from "@/lib/ecoscore";
import type { Language } from "@/lib/i18n";
import { readLocalProduct } from "@/lib/localProducts";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { GradeLetter, StatsScanRecord } from "@/lib/types";

export type StatsRange = "week" | "month" | "all";

export type StatsData = {
  totalScans: number;
  avgHealthGrade: string;
  scanTrendVsLast: number | null;
  previousAvgHealthGrade: string | null;
  healthGradeTrend: "up" | "down" | "same" | "none";
  gradeBreakdown: Record<GradeLetter, number>;
  additivesTotal: number;
  additivesToAvoid: number;
  additivesModerate: number;
  mostScanned: Array<{
    name: string;
    count: number;
    healthGrade: string;
  }>;
  weeklyInsight: string;
};

const emptyStats: StatsData = {
  totalScans: 0,
  avgHealthGrade: "–",
  scanTrendVsLast: null,
  previousAvgHealthGrade: null,
  healthGradeTrend: "none",
  gradeBreakdown: { A: 0, B: 0, C: 0, D: 0, E: 0 },
  additivesTotal: 0,
  additivesToAvoid: 0,
  additivesModerate: 0,
  mostScanned: [],
  weeklyInsight: ""
};

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getPeriod(range: StatsRange, now = new Date()) {
  if (range === "all") {
    return { currentStart: null, previousStart: null, previousEnd: null };
  }

  const currentStart =
    range === "week" ? startOfWeek(now) : startOfMonth(now);
  const previousEnd = new Date(currentStart);
  const previousStart = new Date(currentStart);

  if (range === "week") {
    previousStart.setDate(previousStart.getDate() - 7);
  } else {
    previousStart.setMonth(previousStart.getMonth() - 1);
  }

  return { currentStart, previousStart, previousEnd };
}

function resolveGrade(scan: StatsScanRecord): GradeLetter {
  if (scan.health_grade) return scan.health_grade;
  if (scan.environmental_grade) return scan.environmental_grade;
  if (scan.ecoscan_score >= 80) return "A";
  if (scan.ecoscan_score >= 60) return "B";
  if (scan.ecoscan_score >= 40) return "C";
  if (scan.ecoscan_score >= 20) return "D";
  return "E";
}

function scoreToDisplayGrade(score: number) {
  if (score >= 95) return "A";
  if (score >= 85) return "A-";
  if (score >= 75) return "B+";
  if (score >= 65) return "B";
  if (score >= 55) return "C+";
  if (score >= 45) return "C";
  if (score >= 35) return "D+";
  if (score >= 25) return "D";
  return "E";
}

function isoWeekKey(date = new Date()) {
  const monday = startOfWeek(date);
  return monday.toISOString().slice(0, 10);
}

function cleanInsight(text: string) {
  return text
    .replace(/^(weekly (?:insight|summary)|ukeoppsummering|ukens innsikt)\s*:\s*/i, "")
    .trim();
}

function insightMatchesScanCount(text: string, totalScans: number) {
  const numberWords: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    én: 1,
    ett: 1,
    to: 2,
    tre: 3,
    fire: 4,
    fem: 5,
    seks: 6,
    sju: 7,
    åtte: 8,
    ni: 9,
    ti: 10
  };
  const match = text.match(
    /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|én|ett|to|tre|fire|fem|seks|sju|åtte|ni|ti)\s+(?:scans?|skanning(?:er)?)\b/i
  );

  if (!match) return true;
  const statedCount = /^\d+$/.test(match[1])
    ? Number(match[1])
    : numberWords[match[1].toLowerCase()];

  return statedCount === totalScans;
}

function fallbackInsight(
  stats: Omit<StatsData, "weeklyInsight">,
  language: Language
) {
  if (stats.totalScans === 0) {
    return language === "no"
      ? "Neste skanning gir et tydeligere bilde av ukens valg."
      : "Your next scan will start a clearer picture of your weekly choices.";
  }

  const strong = stats.gradeBreakdown.A + stats.gradeBreakdown.B;
  const weaker = stats.gradeBreakdown.D + stats.gradeBreakdown.E;

  if (language === "no") {
    return `${stats.totalScans} skanninger ga snitt ${stats.avgHealthGrade}, med ${strong} sterke og ${weaker} svakere valg; sammenlign ett alternativ neste gang.`;
  }

  return `${stats.totalScans} scans averaged ${stats.avgHealthGrade}, with ${strong} strong and ${weaker} weaker choices; compare one alternative next time.`;
}

export function useStats(range: StatsRange, language: Language = "en") {
  const { user, loading: userLoading } = useUser();
  const [scans, setScans] = useState<StatsScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyInsight, setWeeklyInsight] = useState("");

  useEffect(() => {
    if (userLoading) return;
    let active = true;

    async function loadScans() {
      if (!isSupabaseConfigured || !supabase || !user) {
        if (active) setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const historyResult = await supabase
          .from("scan_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!active) return;

        if (!historyResult.error && historyResult.data) {
          setScans(historyResult.data);
          setLoading(false);
          return;
        }

        const scansResult = await supabase
          .from("scans")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (active) {
          setScans((scansResult.data ?? []) as StatsScanRecord[]);
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    }

    void loadScans();
    return () => {
      active = false;
    };
  }, [user, userLoading]);

  const statsWithoutInsight = useMemo(() => {
    const period = getPeriod(range);
    const inCurrentRange = (scan: StatsScanRecord) => {
      if (!period.currentStart) return true;
      return new Date(scan.created_at ?? 0) >= period.currentStart;
    };
    const inPreviousRange = (scan: StatsScanRecord) => {
      if (!period.previousStart || !period.previousEnd) return false;
      const date = new Date(scan.created_at ?? 0);
      return date >= period.previousStart && date < period.previousEnd;
    };

    const current = scans.filter(inCurrentRange);
    const previous = scans.filter(inPreviousRange);
    const gradeBreakdown: Record<GradeLetter, number> = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0
    };

    let gradeScoreTotal = 0;
    let additivesTotal = 0;
    let additivesToAvoid = 0;
    let additivesModerate = 0;
    const productCounts = new Map<
      string,
      {
        name: string;
        count: number;
        healthGrade: GradeLetter;
        lastScannedAt: number;
      }
    >();

    current.forEach((scan) => {
      const grade = resolveGrade(scan);
      gradeBreakdown[grade] += 1;
      gradeScoreTotal += gradeLetterToScore(grade);

      // If additive counts weren't saved (pre-migration scans), fall back to
      // the locally cached product data to derive them on the fly.
      let scanAdditivesToAvoid = scan.additives_to_avoid ?? null;
      let scanAdditivesModerate = scan.additives_moderate ?? null;
      let scanAdditivesTotal = scan.additives_total ?? null;

      if (scanAdditivesToAvoid === null || scanAdditivesModerate === null) {
        const cached = readLocalProduct(scan.barcode);
        if (cached?.additives?.length) {
          scanAdditivesToAvoid = cached.additives.filter((a) => a.risk === "avoid").length;
          scanAdditivesModerate = cached.additives.filter((a) => a.risk === "moderate").length;
          scanAdditivesTotal = cached.additives.length;
        } else {
          scanAdditivesToAvoid = 0;
          scanAdditivesModerate = 0;
          scanAdditivesTotal = 0;
        }
      }

      additivesTotal += scanAdditivesTotal ?? (scanAdditivesToAvoid + scanAdditivesModerate);
      additivesToAvoid += scanAdditivesToAvoid;
      additivesModerate += scanAdditivesModerate;

      const key = scan.barcode || scan.product_name.toLowerCase();
      const existing = productCounts.get(key);
      productCounts.set(key, {
        name: scan.product_name,
        count: (existing?.count ?? 0) + 1,
        healthGrade: existing?.healthGrade ?? grade,
        lastScannedAt: Math.max(
          existing?.lastScannedAt ?? 0,
          new Date(scan.created_at ?? 0).getTime()
        )
      });
    });

    const previousGradeScoreTotal = previous.reduce(
      (total, scan) => total + gradeLetterToScore(resolveGrade(scan)),
      0
    );
    const currentAverageScore = current.length
      ? gradeScoreTotal / current.length
      : null;
    const previousAverageScore = previous.length
      ? previousGradeScoreTotal / previous.length
      : null;
    const scanTrendVsLast =
      range === "all" || previous.length === 0
        ? null
        : Math.round(
            ((current.length - previous.length) / previous.length) * 100
          );
    const healthGradeTrend: StatsData["healthGradeTrend"] =
      currentAverageScore === null || previousAverageScore === null
        ? "none"
        : currentAverageScore > previousAverageScore
          ? "up"
          : currentAverageScore < previousAverageScore
            ? "down"
            : "same";

    return {
      totalScans: current.length,
      avgHealthGrade: currentAverageScore !== null
        ? scoreToDisplayGrade(currentAverageScore)
        : "–",
      scanTrendVsLast,
      previousAvgHealthGrade:
        previousAverageScore !== null
          ? scoreToDisplayGrade(previousAverageScore)
          : null,
      healthGradeTrend,
      gradeBreakdown,
      additivesTotal,
      additivesToAvoid,
      additivesModerate,
      mostScanned: Array.from(productCounts.values())
        .sort(
          (a, b) =>
            b.count - a.count ||
            b.lastScannedAt - a.lastScannedAt ||
            a.name.localeCompare(b.name)
        )
        .map(({ name, count, healthGrade }) => ({
          name,
          count,
          healthGrade
        }))
        .slice(0, 3)
    };
  }, [range, scans]);

  useEffect(() => {
    if (loading || userLoading || !user || range !== "week") return;
    let active = true;
    const week = isoWeekKey();
    const cacheKey = `skaren:weekly-insight:${user.id}:${week}:${language}`;
    const cached = window.localStorage.getItem(cacheKey);

    if (cached) {
      const cleaned = cleanInsight(cached);
      setWeeklyInsight(
        insightMatchesScanCount(cleaned, statsWithoutInsight.totalScans)
          ? cleaned
          : fallbackInsight(statsWithoutInsight, language)
      );
      return;
    }

    async function loadInsight() {
      const fallback = fallbackInsight(statsWithoutInsight, language);

      try {
        const { data } = await supabase!.auth.getSession();
        const response = await fetch("/api/stats/weekly-insight", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(data.session?.access_token
              ? { Authorization: `Bearer ${data.session.access_token}` }
              : {})
          },
          body: JSON.stringify({
            week,
            language,
            stats: statsWithoutInsight
          })
        });
        const result = (await response.json()) as { text?: string };
        const generated = cleanInsight(result.text?.trim() || fallback);
        const text = insightMatchesScanCount(
          generated,
          statsWithoutInsight.totalScans
        )
          ? generated
          : fallback;

        if (active) {
          window.localStorage.setItem(cacheKey, text);
          setWeeklyInsight(text);
        }
      } catch {
        if (active) {
          window.localStorage.setItem(cacheKey, fallback);
          setWeeklyInsight(fallback);
        }
      }
    }

    void loadInsight();
    return () => {
      active = false;
    };
  }, [language, loading, range, statsWithoutInsight, user, userLoading]);

  const insight =
    range === "week"
      ? weeklyInsight || fallbackInsight(statsWithoutInsight, language)
      : fallbackInsight(statsWithoutInsight, language);

  return {
    ...statsWithoutInsight,
    weeklyInsight: insight,
    loading: loading || userLoading
  };
}
