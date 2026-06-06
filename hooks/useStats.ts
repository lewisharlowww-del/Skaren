"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { gradeLetterToScore } from "@/lib/ecoscore";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { GradeLetter, ScanRecord, StatsScanRecord } from "@/lib/types";

export type StatsRange = "week" | "month" | "all";

export type StatsData = {
  totalScans: number;
  avgHealthGrade: string;
  trendVsLast: number;
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
  trendVsLast: 0,
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

function fallbackInsight(stats: Omit<StatsData, "weeklyInsight">) {
  if (stats.totalScans === 0) {
    return "Your next scan will start a clearer picture of your weekly choices.";
  }

  const strongestGrade = (Object.entries(stats.gradeBreakdown) as Array<
    [GradeLetter, number]
  >).sort((a, b) => b[1] - a[1])[0]?.[0];

  return `${stats.totalScans} scans leaned most toward grade ${strongestGrade}; compare one similar product before your next shop.`;
}

export function useStats(range: StatsRange) {
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
      { name: string; count: number; healthGrade: GradeLetter }
    >();

    current.forEach((scan) => {
      const grade = resolveGrade(scan);
      gradeBreakdown[grade] += 1;
      gradeScoreTotal += gradeLetterToScore(grade);
      additivesTotal += scan.additives_total ?? 0;
      additivesToAvoid += scan.additives_to_avoid ?? 0;
      additivesModerate += scan.additives_moderate ?? 0;

      const key = scan.barcode || scan.product_name.toLowerCase();
      const existing = productCounts.get(key);
      productCounts.set(key, {
        name: scan.product_name,
        count: (existing?.count ?? 0) + 1,
        healthGrade: existing?.healthGrade ?? grade
      });
    });

    const trendVsLast =
      range === "all" || previous.length === 0
        ? 0
        : Math.round(
            ((current.length - previous.length) / previous.length) * 100
          );

    return {
      totalScans: current.length,
      avgHealthGrade: current.length
        ? scoreToDisplayGrade(gradeScoreTotal / current.length)
        : "–",
      trendVsLast,
      gradeBreakdown,
      additivesTotal,
      additivesToAvoid,
      additivesModerate,
      mostScanned: Array.from(productCounts.values())
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 3)
    };
  }, [range, scans]);

  useEffect(() => {
    if (loading || userLoading || !user || range !== "week") return;
    let active = true;
    const week = isoWeekKey();
    const cacheKey = `skaren:weekly-insight:${user.id}:${week}`;
    const cached = window.localStorage.getItem(cacheKey);

    if (cached) {
      setWeeklyInsight(cached);
      return;
    }

    async function loadInsight() {
      const fallback = fallbackInsight(statsWithoutInsight);

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
            stats: statsWithoutInsight
          })
        });
        const result = (await response.json()) as { text?: string };
        const text = result.text?.trim() || fallback;

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
  }, [loading, range, statsWithoutInsight, user, userLoading]);

  const insight =
    range === "week"
      ? weeklyInsight || fallbackInsight(statsWithoutInsight)
      : fallbackInsight(statsWithoutInsight);

  return {
    ...statsWithoutInsight,
    weeklyInsight: insight,
    loading: loading || userLoading
  };
}
