"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { ScanRecord } from "@/lib/types";

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

function gradeTone(score: number) {
  if (score >= 80) return { text: "text-forest", ring: "#1A5C3A", bg: "from-emerald-50 to-white", label: "Excellent month" };
  if (score >= 60) return { text: "text-leaf-700", ring: "#4CAF7D", bg: "from-leaf-50 to-white", label: "Good month" };
  if (score >= 40) return { text: "text-amber-700", ring: "#F4A261", bg: "from-amber-50 to-white", label: "Mixed month" };
  if (score >= 20) return { text: "text-orange-700", ring: "#E76F51", bg: "from-orange-50 to-white", label: "Needs attention" };
  return { text: "text-rose-700", ring: "#E63946", bg: "from-rose-50 to-white", label: "Low grade month" };
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

  useEffect(() => {
    if (!userLoading && (!isConfigured || !user)) {
      router.push("/login?next=%2Fdashboard");
    }

    if (user && user.user_metadata?.onboarding_completed !== true) {
      setShowOnboarding(true);
    }
  }, [isConfigured, router, user, userLoading]);

  const monthlyScans = useMemo(() => {
    const now = new Date();
    return scans.filter((scan) => {
      const date = new Date(scan.created_at ?? "");
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  }, [scans]);

  const monthlyAverage = monthlyScans.length
    ? Math.round(monthlyScans.reduce((total, scan) => total + scan.ecoscan_score, 0) / monthlyScans.length)
    : 0;
  const best = scans.length ? [...scans].sort((a, b) => b.ecoscan_score - a.ecoscan_score)[0] : null;
  const worst = scans.length ? [...scans].sort((a, b) => a.ecoscan_score - b.ecoscan_score)[0] : null;
  const loading = userLoading || scansLoading;
  const monthGrade = monthlyScans.length ? scoreToGrade(monthlyAverage) : "–";
  const tone = gradeTone(monthlyAverage);
  const monthProgress = Math.min(100, monthlyAverage);
  const earnedBadges = badges.filter((badge) => badge.test(scans)).length;

  return (
    <>
      <AppHeader />
      <OnboardingSlides open={showOnboarding} onComplete={() => setShowOnboarding(false)} />
      <main className="mx-auto max-w-6xl px-4 pb-44 pt-6 sm:py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-forest">Your Skaren overview</p>
            <h1 className="font-display mt-2 text-4xl font-black tracking-[-0.05em] text-ink">Stats</h1>
            <p className="mt-2 max-w-xl text-base font-semibold leading-7 text-soil-600">
              See your scan rhythm, saved product history, and the grades you are choosing most often.
            </p>
          </div>
          <button
            onClick={() => router.push("/scan")}
            className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-black text-white shadow-soft"
          >
            <ScanBarcode className="h-5 w-5" />
            New scan
          </button>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4">
            <div className="skeleton-shimmer h-64 rounded-[2rem] bg-white/70" />
            <div className="skeleton-shimmer h-40 rounded-[2rem] bg-white/70" />
          </div>
        ) : scans.length === 0 ? (
          <div className="mt-8">
            <EmptyState />
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className={`relative overflow-hidden rounded-[2.25rem] border border-white/70 bg-gradient-to-br ${tone.bg} p-6 shadow-glass backdrop-blur-xl sm:p-8`}>
                <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/65 blur-3xl" />
                <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-leaf-100/70 blur-3xl" />
                <div className="relative z-10 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
                  <div className="grid place-items-center">
                    <div
                      className="grid h-36 w-36 place-items-center rounded-full bg-white shadow-soft"
                      style={{
                        background: `conic-gradient(${tone.ring} ${monthProgress * 3.6}deg, #EEF3EC 0deg)`
                      }}
                    >
                      <div className="grid h-28 w-28 place-items-center rounded-full bg-white">
                        <span className={`font-display text-6xl font-black ${tone.text}`}>{monthGrade}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-forest shadow-sm">
                      <CalendarDays className="h-4 w-4" />
                      This month
                    </div>
                    <h2 className="font-display mt-4 text-4xl font-black tracking-[-0.05em] text-ink">{tone.label}</h2>
                    <p className="mt-3 text-base font-semibold leading-7 text-soil-600">
                      Your saved scans average {monthlyAverage || 0}/100 across {monthlyScans.length} product{monthlyScans.length === 1 ? "" : "s"} this month.
                    </p>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-2xl bg-white/75 p-3 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-soil-500">Scans</p>
                        <p className="mt-1 text-2xl font-black text-ink">{monthlyScans.length}</p>
                      </div>
                      <div className="rounded-2xl bg-white/75 p-3 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-soil-500">Best</p>
                        <p className="mt-1 text-2xl font-black text-ink">{best ? scoreToGrade(best.ecoscan_score) : "–"}</p>
                      </div>
                      <div className="rounded-2xl bg-white/75 p-3 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-soil-500">Badges</p>
                        <p className="mt-1 text-2xl font-black text-ink">{earnedBadges}/{badges.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <StatCard label="Products scanned" value={String(scans.length)} icon={ScanBarcode} detail="All-time saved product reports" tone="dark" />
                <StatCard label="Current streak" value={`${streak || 0} day${streak === 1 ? "" : "s"}`} icon={Flame} detail={streak ? "Nice rhythm. Keep scanning." : "Scan today to start a streak."} tone={streak ? "green" : "neutral"} />
              </div>
            </section>

            <section className="mt-4 grid gap-4 sm:grid-cols-2">
              <StatCard label="Best saved product" value={best ? `Grade ${scoreToGrade(best.ecoscan_score)}` : "–"} icon={Trophy} detail={best?.product_name ?? "No best product yet"} tone="green" />
              <StatCard label="Lowest saved product" value={worst ? `Grade ${scoreToGrade(worst.ecoscan_score)}` : "–"} icon={Leaf} detail={worst?.product_name ?? "No lower-grade product yet"} tone={worst && worst.ecoscan_score < 40 ? "red" : "amber"} />
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-glass backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-forest">Milestones</p>
                    <h2 className="font-display mt-1 text-2xl font-black tracking-[-0.04em] text-ink">Badges</h2>
                  </div>
                  <span className="rounded-full bg-leaf-50 px-3 py-1 text-sm font-black text-forest">{earnedBadges}/{badges.length}</span>
                </div>
                <div className="mt-4 grid gap-3">
                  {badges.map((badge) => {
                    const earned = badge.test(scans);
                    return (
                      <BadgeCard key={badge.name} name={badge.name} earned={earned} icon={Award} />
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-glass backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-forest">Latest products</p>
                    <h2 className="font-display mt-1 text-2xl font-black tracking-[-0.04em] text-ink">Recent scans</h2>
                  </div>
                  <BarChart3 className="h-5 w-5 text-forest" />
                </div>
                <div className="mt-4 space-y-3">
                  {scans.slice(0, 6).map((scan) => (
                    <div key={`${scan.barcode}-${scan.created_at}`} className="flex items-center gap-3 rounded-[1.35rem] border border-black/5 bg-white p-3 shadow-sm">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-leaf-50">
                        {scan.product_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={scan.product_image} alt={`${scan.product_name} packaging`} className="h-full w-full object-contain p-1" loading="lazy" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black text-soil-900">{scan.product_name}</p>
                        <p className="truncate text-sm font-semibold text-soil-600">{scan.brand || scan.barcode}</p>
                        <p className="mt-1 text-xs font-bold text-soil-500">{formatDate(scan.created_at)}</p>
                      </div>
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-[4px] text-lg font-black ${gradeTone(scan.ecoscan_score).text}`} style={{ borderColor: gradeTone(scan.ecoscan_score).ring }}>
                        {scoreToGrade(scan.ecoscan_score)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
