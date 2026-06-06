"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, BarChart3, CalendarDays, Flame, Leaf, ScanBarcode, ShieldCheck, Trophy } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BadgeCard } from "@/components/BadgeCard";
import { EmptyState } from "@/components/EmptyState";
import { OnboardingSlides } from "@/components/OnboardingSlides";
import { StatCard } from "@/components/StatCard";
import { useScans } from "@/hooks/useScans";
import { useStreak } from "@/hooks/useStreak";
import { useUser } from "@/hooks/useUser";
import { getEcoGrade, gradeLetterToScore, hasEcoData } from "@/lib/ecoscore";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { GradeLetter, ProductResult, ScanRecord } from "@/lib/types";

const badges = [
  { name: "First Scan", test: (scans: ScanRecord[]) => scans.length >= 1 },
  { name: "5 Products Scanned", test: (scans: ScanRecord[]) => scans.length >= 5 },
  { name: "Smart Shopper", test: (scans: ScanRecord[]) => scans.some((scan) => scan.ecoscan_score >= 75) },
  { name: "Careful Checker", test: (scans: ScanRecord[]) => scans.some((scan) => scan.ecoscan_score < 55) }
];

function scoreToGrade(score: number) {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score >= 20) return "D";
  return "E";
}

function getScanKey(scan: ScanRecord) {
  return scan.id ?? `${scan.barcode}-${scan.created_at ?? ""}`;
}

function getScanGrade(scan: ScanRecord, overrides: Record<string, GradeLetter>) {
  return overrides[getScanKey(scan)] ?? scan.health_grade ?? scan.environmental_grade ?? scoreToGrade(scan.ecoscan_score);
}

function getScanGradeScore(scan: ScanRecord, overrides: Record<string, GradeLetter>) {
  return gradeLetterToScore(getScanGrade(scan, overrides));
}

function gradeTone(score: number) {
  if (score >= 80) return { text: "text-forest", ring: "var(--sk-brand-forest)", bg: "from-emerald-50 to-white", label: "Health Grade A", detail: "Excellent monthly health profile." };
  if (score >= 60) return { text: "text-leaf-700", ring: "var(--sk-brand-leaf)", bg: "from-leaf-50 to-white", label: "Health Grade B", detail: "Good monthly health profile." };
  if (score >= 40) return { text: "text-amber-700", ring: "var(--sk-grade-d-text)", bg: "from-amber-50 to-white", label: "Health Grade C", detail: "Average monthly health profile." };
  if (score >= 20) return { text: "text-orange-700", ring: "var(--sk-grade-d-text)", bg: "from-orange-50 to-white", label: "Health Grade D", detail: "Lower monthly health profile." };
  return { text: "text-rose-700", ring: "var(--sk-grade-e-text)", bg: "from-rose-50 to-white", label: "Health Grade E", detail: "Very low monthly health profile." };
}

function formatDate(value?: string) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading, isConfigured } = useUser();
  const { scans, loading: scansLoading } = useScans(user);
  const streak = useStreak(scans);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [gradeOverrides, setGradeOverrides] = useState<Record<string, GradeLetter>>({});
  const refreshedScansRef = useRef(new Set<string>());

  useEffect(() => {
    if (!userLoading && (!isConfigured || !user)) {
      router.push("/login?next=%2Fdashboard");
    }

    if (user && user.user_metadata?.onboarding_completed !== true) {
      setShowOnboarding(true);
    }
  }, [isConfigured, router, user, userLoading]);

  useEffect(() => {
    if (scansLoading || scans.length === 0) return;

    let cancelled = false;

    async function refreshLegacyGrades() {
      const legacyScans = scans
        .filter((scan) => !scan.health_grade && !refreshedScansRef.current.has(getScanKey(scan)))
        .slice(0, 8);

      for (const scan of legacyScans) {
        const scanKey = getScanKey(scan);
        refreshedScansRef.current.add(scanKey);

        try {
          const cachedProduct = typeof window !== "undefined" ? window.sessionStorage.getItem(`skaren:${scan.barcode}`) : null;
          let product = cachedProduct ? (JSON.parse(cachedProduct) as ProductResult) : null;

          if (!product) {
            const response = await fetch("/api/scan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ barcode: scan.barcode })
            });
            const data = (await response.json()) as { product?: ProductResult };
            product = data.product ?? null;
          }

          if (!product || cancelled) continue;

          const environmentalGrade = hasEcoData(product) ? product.ecoGradeLetter ?? getEcoGrade(product) : null;
          const healthGrade = product.healthGrade;

          if (!healthGrade || cancelled) continue;

          setGradeOverrides((current) => ({ ...current, [scanKey]: healthGrade }));

          if (isSupabaseConfigured && supabase && scan.id) {
            await supabase
              .from("scans")
              .update({
                skaren_grade: null,
                health_grade: healthGrade,
                environmental_grade: environmentalGrade,
                ecoscan_score: gradeLetterToScore(healthGrade)
              })
              .eq("id", scan.id);
          }
        } catch (error) {
          console.warn("[Dashboard] Could not refresh saved health grade:", error);
        }
      }
    }

    void refreshLegacyGrades();

    return () => {
      cancelled = true;
    };
  }, [scans, scansLoading]);

  const monthlyScans = useMemo(() => {
    const now = new Date();
    return scans.filter((scan) => {
      const date = new Date(scan.created_at ?? "");
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  }, [scans]);

  const monthlyAverage = monthlyScans.length
    ? Math.round(monthlyScans.reduce((total, scan) => total + getScanGradeScore(scan, gradeOverrides), 0) / monthlyScans.length)
    : 0;
  const best = scans.length ? [...scans].sort((a, b) => getScanGradeScore(b, gradeOverrides) - getScanGradeScore(a, gradeOverrides))[0] : null;
  const worst = scans.length ? [...scans].sort((a, b) => getScanGradeScore(a, gradeOverrides) - getScanGradeScore(b, gradeOverrides))[0] : null;
  const loading = userLoading || scansLoading;
  const monthGrade = monthlyScans.length ? scoreToGrade(monthlyAverage) : "–";
  const tone = gradeTone(monthlyAverage);
  const monthProgress = Math.min(100, monthlyAverage);
  const earnedBadges = badges.filter((badge) => badge.test(scans)).length;

  return (
    <>
      <AppHeader />
      <OnboardingSlides open={showOnboarding} onComplete={() => setShowOnboarding(false)} />
      <main className="page-fade-up mx-auto w-full max-w-[430px] overflow-x-hidden px-4 pb-44 pt-4 sm:max-w-6xl sm:py-8">
        <div className="flex w-full min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="type-section-label text-forest">Your Skaren overview</p>
            <h1 className="type-display-lg mt-1 text-ink sm:mt-2">Stats</h1>
            <p className="type-body-lg mt-2 max-w-xl text-soil-600">
              See your scan rhythm, saved product history, and the grades you are choosing most often.
            </p>
          </div>
          <button
            onClick={() => router.push("/scan")}
            className="focus-ring tap-feedback type-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-white shadow-soft"
          >
            <ScanBarcode className="h-5 w-5" />
            New scan
          </button>
        </div>

        {loading ? (
          <div className="mt-5 grid w-full gap-4 sm:mt-8">
            <div className="skeleton-shimmer h-64 rounded-[2rem] bg-white/70" />
            <div className="skeleton-shimmer h-40 rounded-[2rem] bg-white/70" />
          </div>
        ) : scans.length === 0 ? (
          <div className="mt-5 sm:mt-8">
            <EmptyState />
          </div>
        ) : (
          <>
            <section className="mt-5 grid w-full min-w-0 gap-4 sm:mt-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className={`relative min-w-0 overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br ${tone.bg} p-5 shadow-glass backdrop-blur-xl sm:rounded-[2.25rem] sm:p-8`}>
                <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/65 blur-3xl" />
                <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-leaf-100/70 blur-3xl" />
                <div className="relative z-10 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
                  <div className="grid place-items-center">
                    <div
                      className="grid h-36 w-36 place-items-center rounded-full bg-white shadow-soft"
                      style={{
                        background: `conic-gradient(${tone.ring} ${monthProgress * 3.6}deg, var(--sk-brand-mist-dark) 0deg)`
                      }}
                    >
                      <div className="grid h-28 w-28 place-items-center rounded-full bg-white">
                        <span className={`type-grade text-6xl ${tone.text}`}>{monthGrade}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="type-section-label inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-forest shadow-sm">
                      <CalendarDays className="h-4 w-4" />
                      Monthly Health Grade
                    </div>
                    <h2 className="type-heading-1 mt-4 text-ink">{tone.label}</h2>
                    <p className="type-body-lg mt-3 text-soil-600">
                      {monthlyScans.length
                        ? `${tone.detail} Based on ${monthlyScans.length} saved product${monthlyScans.length === 1 ? "" : "s"} this month.`
                        : "Scan this month to build your Health Grade trend."}
                    </p>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-2xl bg-white/75 p-3 shadow-sm">
                        <p className="type-section-label text-soil-500">Scans</p>
                        <p className="type-heading-2 mt-1 text-ink">{monthlyScans.length}</p>
                      </div>
                      <div className="rounded-2xl bg-white/75 p-3 shadow-sm">
                        <p className="type-section-label text-soil-500">Best grade</p>
                        <p className="type-heading-2 mt-1 text-ink">{best ? getScanGrade(best, gradeOverrides) : "–"}</p>
                      </div>
                      <div className="rounded-2xl bg-white/75 p-3 shadow-sm">
                        <p className="type-section-label text-soil-500">Badges</p>
                        <p className="type-heading-2 mt-1 text-ink">{earnedBadges}/{badges.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid w-full min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <StatCard label="Products scanned" value={String(scans.length)} icon={ScanBarcode} detail="All-time saved product reports" tone="dark" />
                <StatCard label="Current streak" value={`${streak || 0} day${streak === 1 ? "" : "s"}`} icon={Flame} detail={streak ? "Nice rhythm. Keep scanning." : "Scan today to start a streak."} tone={streak ? "green" : "neutral"} />
              </div>
            </section>

            <section className="mt-4 grid w-full min-w-0 gap-4 sm:grid-cols-2">
              <StatCard label="Best Health Grade" value={best ? `Grade ${getScanGrade(best, gradeOverrides)}` : "–"} icon={Trophy} detail={best?.product_name ?? "No best product yet"} tone="green" />
              <StatCard label="Lowest Health Grade" value={worst ? `Grade ${getScanGrade(worst, gradeOverrides)}` : "–"} icon={Leaf} detail={worst?.product_name ?? "No lower-grade product yet"} tone={worst && getScanGradeScore(worst, gradeOverrides) < 40 ? "red" : "amber"} />
            </section>

            <section className="mt-4 grid w-full min-w-0 gap-4 sm:mt-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="min-w-0 overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-glass backdrop-blur-xl">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="type-section-label text-forest">Milestones</p>
                    <h2 className="type-heading-2 mt-1 text-ink">Badges</h2>
                  </div>
                  <span className="type-body-sm rounded-full bg-leaf-50 px-3 py-1 font-bold text-forest">{earnedBadges}/{badges.length}</span>
                </div>
                <div className="mt-4 grid min-w-0 gap-3">
                  {badges.map((badge) => {
                    const earned = badge.test(scans);
                    return (
                      <BadgeCard key={badge.name} name={badge.name} earned={earned} icon={Award} />
                    );
                  })}
                </div>
              </div>

              <div className="min-w-0 overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-glass backdrop-blur-xl">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="type-section-label text-forest">Latest products</p>
                    <h2 className="type-heading-2 mt-1 text-ink">Recent scans</h2>
                  </div>
                  <BarChart3 className="h-5 w-5 text-forest" />
                </div>
                <div className="mt-4 space-y-3">
                  {scans.slice(0, 6).map((scan) => {
                    const grade = getScanGrade(scan, gradeOverrides);
                    const score = gradeLetterToScore(grade);
                    const recentTone = gradeTone(score);

                    return (
                      <div key={`${scan.barcode}-${scan.created_at}`} className="flex min-w-0 items-center gap-3 rounded-[1.35rem] border border-black/5 bg-white p-3 shadow-sm">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-leaf-50">
                          {scan.product_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={scan.product_image} alt={`${scan.product_name} packaging`} className="h-full w-full object-contain p-1" loading="lazy" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="type-heading-3 truncate text-soil-900">{scan.product_name}</p>
                          <p className="type-body-sm truncate text-soil-600">{scan.brand || scan.barcode}</p>
                          <p className="type-caption mt-1 text-soil-500">{formatDate(scan.created_at)}</p>
                        </div>
                        <span className={`type-grade grid h-11 w-11 shrink-0 place-items-center rounded-full border-[4px] text-lg ${recentTone.text}`} style={{ borderColor: recentTone.ring }}>
                          {grade}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
