"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  Crown,
  Download,
  FileText,
  Flame,
  Globe,
  Leaf,
  Lock,
  LogOut,
  Mail,
  Moon,
  ScanBarcode,
  ShieldCheck,
  Sun,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { BadgesSection } from "@/components/BadgesSection";
import { Merk } from "@/components/Merk";
import { BottomNav } from "@/components/BottomNav";
import { SkarenLoader } from "@/components/SkarenLoader";
import { computeBadges, earnedCount, type ScanSummary } from "@/lib/badges";
import { t, type Language } from "@/lib/i18n";
import { useLang } from "@/lib/language-context";
import { useTheme } from "@/lib/theme-context";
import { getCachedPremiumStatus, getUserPremiumStatus } from "@/lib/premium";
import { getCache, setCache } from "@/lib/clientCache";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { signOutEverywhere } from "@/lib/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

type AccountUser = {
  id: string;
  email?: string;
  created_at?: string;
};

// Cached account snapshot so returning to the tab renders instantly (no
// full-screen loader) while fresh data loads quietly in the background.
type AccountSnapshot = {
  user: AccountUser;
  isPremium: boolean;
  streakDays: number;
  scanCount: number;
  scanSummaries: ScanSummary[];
};
const ACCOUNT_CACHE_KEY = "account-snapshot";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDisplayName(email: string | undefined, lang: Language): string {
  if (!email) return t('account_user_fallback', lang);
  const local = email.split("@")[0];
  return local
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function computeStreak(dates: (string | undefined | null)[]): number {
  const daySet = new Set(
    dates
      .filter(Boolean)
      .map((d) => new Date(d!).toDateString())
  );
  let streak = 0;
  const cursor = new Date();
  while (daySet.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function getGamificationBadge(scanCount: number, lang: Language): string {
  const no = lang === "no";
  if (scanCount >= 100) return no ? "Mester"     : "Champion";
  if (scanCount >= 25)  return no ? "Pioner"     : "Pioneer";
  if (scanCount >= 5)   return no ? "Utforsker"  : "Explorer";
  if (scanCount >= 1)   return no ? "Nysgjerrig" : "Curious";
  return no ? "Ny skanner" : "New scanner";
}

// Numeric level for the account stat card, e.g. "Lv 4".
function getLevel(scanCount: number): number {
  if (scanCount >= 100) return 5;
  if (scanCount >= 25) return 4;
  if (scanCount >= 10) return 3;
  if (scanCount >= 5) return 2;
  if (scanCount >= 1) return 1;
  return 0;
}

// ── Sub-components ────────────────────────────────────────────────────────────

// Initials for the avatar circle, e.g. "Ingrid Nilsen" -> "IN".
function getInitials(name: string) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// One plain stat card in the three-up row under the membership card.
function StatCard({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div
      className="rounded-2xl px-3.5 py-3.5"
      style={{ background: "var(--sk-surface-card)", border: "0.5px solid var(--sk-border-default)" }}
    >
      <p
        className="truncate"
        style={{
          fontFamily: "var(--sk-font-ui)",
          fontVariantNumeric: "tabular-nums",
          fontSize: 22,
          fontWeight: 600,
          lineHeight: 1,
          color: accent ? "var(--sk-brand-forest)" : "var(--sk-text-primary)",
        }}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[11px]" style={{ color: "var(--sk-text-muted)" }}>{label}</p>
    </div>
  );
}

// Membership card — a dark ink Merk-owned card with the folded corner. Pro
// shows the plan + ACTIVE chip; free shows an upgrade prompt.
function MembershipCard({ isPremium, checkingPremium, lang }: { isPremium: boolean; checkingPremium: boolean; lang: Language }) {
  const inner = (
    <div
      className="relative flex items-center gap-3.5 overflow-hidden"
      style={{ background: "var(--sk-verdict-bg)", borderRadius: 18, padding: "16px 18px" }}
    >
      {/* Folded top-right corner — his silhouette signature. Uses the verdict
          fold token so it stays a darker notch in BOTH themes (the old
          --sk-brand-mist made it a light triangle on dark). */}
      <span
        aria-hidden
        style={{ position: "absolute", top: 0, right: 0, width: 30, height: 30, background: "var(--sk-verdict-fold)", clipPath: "polygon(100% 0, 100% 100%, 0 0)", opacity: 0.85 }}
      />
      {/* Merk as the plan mark. */}
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
        style={{ background: "rgba(246,243,236,0.08)" }}
      >
        <Merk expression={isPremium ? "confident" : "happy"} size={30} limbs={false} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p style={{ fontFamily: "var(--sk-font-brand)", fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--sk-verdict-text)" }}>
            {isPremium ? t('account_pro_label', lang) : t('account_free_member', lang)}
          </p>
          {checkingPremium ? (
            <span className="h-4 w-14 animate-pulse rounded-full" style={{ background: "rgba(246,243,236,0.12)" }} />
          ) : isPremium ? (
            <span
              style={{ fontFamily: "var(--sk-font-data)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", background: "var(--sk-brand-forest)", color: "#F6F3EC", borderRadius: 999, padding: "3px 8px" }}
            >
              {t('account_pro_member', lang)}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-[12.5px]" style={{ color: "var(--sk-verdict-body)" }}>
          {isPremium ? t('account_pro_sub', lang) : t('account_upgrade_sub', lang)}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--sk-verdict-body)" }} />
    </div>
  );

  if (isPremium) return inner;
  return (
    <Link href="/pricing" className="block transition active:scale-[0.99]">
      {inner}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{ fontFamily: "var(--sk-font-data)", fontSize: 10, fontWeight: 400, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--sk-text-muted)", marginBottom: 8, paddingLeft: 4 }}>
      {label}
    </p>
  );
}

// A clean settings row — no coloured icon. Label left, optional value or
// subtitle, chevron right. Matches the redesign menu exactly.
function Row({
  label,
  value,
  subtitle,
  danger,
  chevronRotated,
  href,
  onClick,
}: {
  label: string;
  value?: string;
  subtitle?: string;
  danger?: boolean;
  chevronRotated?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold" style={{ color: danger ? "var(--sk-status-warning)" : "var(--sk-text-primary)" }}>
          {label}
        </p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[12px]" style={{ color: "var(--sk-text-muted)" }}>{subtitle}</p>
        ) : null}
      </div>
      {value ? (
        <span className="shrink-0 text-[13px]" style={{ color: "var(--sk-text-muted)" }}>{value}</span>
      ) : null}
      <ChevronRight
        className="h-4 w-4 shrink-0 transition-transform"
        style={{ color: "var(--sk-text-faint)", transform: chevronRotated ? "rotate(90deg)" : "rotate(0deg)" }}
      />
    </>
  );
  const cls = "flex w-full items-center gap-3 px-5 py-4 text-left";
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

function Divider() {
  return <div className="mx-5 h-px" style={{ background: "var(--sk-border-muted)" }} />;
}

interface SettingsRowProps {
  icon: React.ReactNode;
  iconBg: string;
  iconBgDark?: string;
  label: string;
  subtitle: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}

function SettingsRow({ icon, iconBg, iconBgDark, label, subtitle, href, onClick, danger }: SettingsRowProps) {
  const { resolved } = useTheme();
  const resolvedIconBg = resolved === "dark" && iconBgDark ? iconBgDark : iconBg;
  const inner = (
    <>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: resolvedIconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold" style={{ color: danger ? "var(--sk-status-warning)" : "var(--sk-text-primary)" }}>
          {label}
        </p>
        <p className="mt-0.5 text-[11px] truncate" style={{ color: "var(--sk-text-muted)" }}>{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--sk-text-faint)" }} />
    </>
  );

  const cls = "flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors";

  if (href) {
    const isExternal = href.startsWith("mailto:") || href.startsWith("http");
    if (isExternal) {
      return (
        <a href={href} className={cls}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function DeleteDialog({
  open,
  onClose,
  onConfirm,
  loading,
  email,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  email: string;
  lang: Language;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 88px)" }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && onClose()} />
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl" style={{ background: "var(--sk-surface-white)", border: "1px solid var(--sk-border-default)" }}>

        {/* Red header strip */}
        <div className="px-6 pt-6 pb-5" style={{ background: "var(--sk-grade-e-bg)", borderBottom: "1px solid var(--sk-grade-e-border)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "var(--sk-grade-e-border)" }}>
              <Trash2 className="h-5 w-5" style={{ color: "var(--sk-status-warning)" }} />
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-40"
              style={{ background: "var(--sk-grade-e-border)", color: "var(--sk-text-muted)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-3 text-[20px] font-semibold" style={{ fontFamily: "var(--font-familjen), sans-serif", color: "var(--sk-status-danger)" }}>
            {t('account_delete_title', lang)}
          </h2>
          <p className="mt-1 text-[13px]" style={{ color: "var(--sk-text-secondary)" }}>
            {lang === 'no' ? 'Innlogget som' : 'Signed in as'} <span className="font-semibold" style={{ color: "var(--sk-text-primary)" }}>{email}</span>
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--sk-text-secondary)" }}>
            {t('account_delete_body', lang)} <span className="font-semibold" style={{ color: "var(--sk-text-primary)" }}>{email}</span> {t('account_delete_body2', lang)}
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="w-full rounded-2xl py-3.5 text-[14px] font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-50"
              style={{ background: "#aa1818" }}
            >
              {loading ? t('account_deleting', lang) : t('account_delete_confirm', lang)}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="w-full rounded-2xl py-3.5 text-[14px] font-semibold transition-colors disabled:opacity-40"
              style={{ border: "1px solid var(--sk-border-default)", background: "transparent", color: "var(--sk-text-primary)" }}
            >
              {t('cancel', lang)}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const { preference: themePref, setPreference: setThemePref } = useTheme();
  const [langOpen, setLangOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  // Seed from the last known snapshot so revisiting the tab is instant.
  const accountSnapshot = getCache<AccountSnapshot>(ACCOUNT_CACHE_KEY);
  const [user, setUser] = useState<AccountUser | null>(accountSnapshot?.user ?? null);
  const [loading, setLoading] = useState(accountSnapshot === undefined);
  const [isPremium, setIsPremium] = useState(accountSnapshot?.isPremium ?? getCachedPremiumStatus());
  const [checkingPremium, setCheckingPremium] = useState(false);
  const [streakDays, setStreakDays] = useState(accountSnapshot?.streakDays ?? 0);
  const [scanCount, setScanCount] = useState(accountSnapshot?.scanCount ?? 0);
  const [scanSummaries, setScanSummaries] = useState<ScanSummary[]>(accountSnapshot?.scanSummaries ?? []);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Stable ref to router — prevents the effect from re-running when router
  // identity changes (which was causing double loadUser calls).
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; });

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const { data } = (await supabase?.auth.getSession()) ?? {
          data: { session: null },
        };
        const sessionUser = data.session?.user ?? null;

        if (!active) return;

        if (!sessionUser) {
          routerRef.current.replace("/login?next=%2Faccount");
          return;
        }

        const nextUser: AccountUser = {
          id: sessionUser.id,
          email: sessionUser.email ?? undefined,
          created_at: sessionUser.created_at,
        };
        setUser(nextUser);

        // Load scan data for gamification + badges
        let nextScanCount = 0;
        let nextStreakDays = 0;
        let nextScanSummaries: ScanSummary[] = [];
        if (isSupabaseConfigured && supabase) {
          const { data: scansData } = await supabase
            .from("scans")
            .select("created_at, health_grade, additives_to_avoid, additives_moderate")
            .eq("user_id", sessionUser.id)
            .order("created_at", { ascending: false });

          if (active && scansData) {
            nextScanCount = scansData.length;
            nextStreakDays = computeStreak(scansData.map((s) => s.created_at));
            nextScanSummaries = scansData as ScanSummary[];
            setScanCount(nextScanCount);
            setStreakDays(nextStreakDays);
            setScanSummaries(nextScanSummaries);
          }
        }

        // Check premium status via Supabase profiles
        setCheckingPremium(true);
        const premium = isSupabaseConfigured && supabase
          ? await getUserPremiumStatus(supabase)
          : false;
        if (active) {
          setIsPremium(premium);
          setCheckingPremium(false);
          // Persist the assembled snapshot so the next tab visit is instant.
          setCache<AccountSnapshot>(ACCOUNT_CACHE_KEY, {
            user: nextUser,
            isPremium: premium,
            streakDays: nextStreakDays,
            scanCount: nextScanCount,
            scanSummaries: nextScanSummaries,
          });
        }
      } catch {
        // fail gracefully — show what we have
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function signOut() {
    await signOutEverywhere();
    router.push("/");
  }

  async function exportData() {
    setExportLoading(true);
    setExportError(null);
    try {
      const { data: sessionData } = await supabase!.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { setExportError(t('account_export_not_logged_in', lang)); return; }

      const res = await fetch("/api/account/export", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setExportError(t('account_export_failed', lang)); return; }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skaren-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  }

  async function deleteAccount() {
    setDeleteLoading(true);
    try {
      const { data: sessionData } = await supabase!.auth.getSession();
      const token = sessionData.session?.access_token;
      if (token) {
        await fetch("/api/account/delete", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      await signOutEverywhere();
      router.push("/");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) return <SkarenLoader message={t('account_loading', lang)} />

  const locale = lang === 'no' ? 'nb' : 'en';
  const joinedDate = user?.created_at
    ? new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(
        new Date(user.created_at)
      )
    : "";

  const displayName = getDisplayName(user?.email, lang);

  return (
    <div className="min-h-screen bg-[var(--sk-brand-mist)]">
      <main
        className="mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden bg-[var(--sk-brand-mist)] pb-32 pt-safe sm:max-w-lg"
      >
        {/* ── Profile header — avatar + name + member since ── */}
        <div className="px-4 pt-2">
          <div className="flex items-center gap-3.5">
            <div
              className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-full"
              style={{ background: "var(--sk-verdict-bg)", color: "var(--sk-verdict-text)", fontFamily: "var(--sk-font-brand)", fontSize: 21, fontWeight: 700, letterSpacing: "0.01em" }}
            >
              {getInitials(displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate"
                style={{ fontFamily: "var(--sk-font-ui)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--sk-text-primary)", lineHeight: 1.1 }}
              >
                {displayName}
              </p>
              <p className="mt-0.5 truncate text-[12px]" style={{ color: "var(--sk-text-muted)" }}>
                {[user?.email, joinedDate ? `${t('account_member_since', lang)} ${joinedDate}` : null].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 px-4">
          {/* ── Membership card — Merk-owned, folded corner ── */}
          <MembershipCard isPremium={isPremium} checkingPremium={checkingPremium} lang={lang} />

          {/* ── Stats row — three plain cards ── */}
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <StatCard value={String(streakDays)} label={t('account_streak_label', lang)} />
            <StatCard value={String(scanCount)} label={lang === 'no' ? 'skanninger' : 'scans'} />
            <StatCard value={`Lv ${getLevel(scanCount)}`} label={getGamificationBadge(scanCount, lang).toLowerCase()} accent />
          </div>

          {/* ── Badges — its own card with overlapping avatars ── */}
          {(() => {
            const badges = computeBadges({ scans: scanSummaries, streakDays, joinedAt: user?.created_at, lang });
            const earned = earnedCount(badges);
            return (
              <>
                <button
                  type="button"
                  onClick={() => setBadgesOpen((o) => !o)}
                  className="mt-3 flex w-full items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left"
                  style={{ background: "var(--sk-surface-white)", border: "1px solid var(--sk-border-default)" }}
                >
                  {/* Overlapping badge avatars. */}
                  <div className="flex shrink-0 items-center">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="grid h-8 w-8 place-items-center rounded-full"
                        style={{
                          background: [ "var(--sk-brand-forest)", "#8A6A46", "var(--sk-text-primary)" ][i],
                          color: "var(--sk-text-on-dark)",
                          border: "2px solid var(--sk-surface-white)",
                          marginLeft: i === 0 ? 0 : -10,
                          fontSize: 13,
                        }}
                      >
                        {[ "\u2605", "\u25C6", "\u2759\u2759" ][i]}
                      </span>
                    ))}
                    {badges.length > 3 ? (
                      <span
                        className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold"
                        style={{ background: "var(--sk-brand-mist-dark)", color: "var(--sk-text-secondary)", border: "2px solid var(--sk-surface-white)", marginLeft: -10 }}
                      >
                        +{badges.length - 3}
                      </span>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold" style={{ color: "var(--sk-text-primary)" }}>{t("account_badges", lang)}</p>
                    <p className="mt-0.5 text-[12px]" style={{ color: "var(--sk-text-muted)" }}>
                      {earned} {t("account_badges_of", lang)} {badges.length} {t("account_badges_earned_suffix", lang)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 transition-transform" style={{ color: "var(--sk-text-faint)", transform: badgesOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
                </button>
                {badgesOpen ? (
                  <div className="mt-2 rounded-2xl px-4 pb-5 pt-4" style={{ background: "var(--sk-surface-white)", border: "1px solid var(--sk-border-default)" }}>
                    <BadgesSection badges={badges} lang={lang} />
                  </div>
                ) : null}
              </>
            );
          })()}

          {/* ── Preferences ── */}
          <div className="mt-6">
            <SectionLabel label={t('account_preferences', lang)} />
          </div>
          <div className="overflow-hidden rounded-2xl" style={{ background: "var(--sk-surface-white)", border: "1px solid var(--sk-border-default)" }}>
            <Row
              label={t('account_language', lang)}
              value={lang === 'no' ? t('language_norwegian', lang) : t('language_english', lang)}
              chevronRotated={langOpen}
              onClick={() => setLangOpen((o) => !o)}
            />
            {langOpen ? (
              <div className="px-5 pb-4 flex gap-3" style={{ borderTop: "0.5px solid var(--sk-border-muted)" }}>
                {([
                  { value: 'no' as const, flag: '\uD83C\uDDF3\uD83C\uDDF4', label: t('language_norwegian', lang) },
                  { value: 'en' as const, flag: '\uD83C\uDDEC\uD83C\uDDE7', label: t('language_english', lang) },
                ]).map((option) => {
                  const active = lang === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => { setLang(option.value); setLangOpen(false); }}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold"
                      style={{ background: active ? "var(--sk-brand-forest)" : "var(--sk-grade-a-bg)", color: active ? "#ffffff" : "var(--sk-text-primary)", border: active ? "none" : "1px solid var(--sk-border-default)", marginTop: 12 }}
                    >
                      <span className="text-[15px] leading-none">{option.flag}</span>
                      {option.label}
                      {active && <Check size={13} />}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <Divider />
            <Row
              label={t('account_appearance', lang)}
              value={themePref === "light" ? t('account_theme_light', lang) : t('account_theme_dark', lang)}
              chevronRotated={appearanceOpen}
              onClick={() => setAppearanceOpen((o) => !o)}
            />
            {appearanceOpen ? (
              <div className="px-5 pb-4 flex gap-3" style={{ borderTop: "0.5px solid var(--sk-border-muted)" }}>
                {([
                  { value: "light" as const, label: t('account_theme_light', lang), icon: <Sun size={15} /> },
                  { value: "dark" as const, label: t('account_theme_dark', lang), icon: <Moon size={15} /> },
                ]).map((opt) => {
                  const active = themePref === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setThemePref(opt.value)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold"
                      style={{ background: active ? "var(--sk-brand-forest)" : "var(--sk-grade-a-bg)", color: active ? "#ffffff" : "var(--sk-text-primary)", border: active ? "none" : "1px solid var(--sk-border-default)", marginTop: 12 }}
                    >
                      {opt.icon}
                      {opt.label}
                      {active && <Check size={13} />}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* ── Data & privacy ── */}
          <div className="mt-6">
            <SectionLabel label={t('account_data_privacy', lang)} />
          </div>
          <div className="overflow-hidden rounded-2xl" style={{ background: "var(--sk-surface-white)", border: "1px solid var(--sk-border-default)" }}>
            <Row
              label={t('account_export', lang)}
              subtitle={t('account_export_sub', lang)}
              chevronRotated={exportOpen}
              onClick={() => setExportOpen((o) => !o)}
            />
            {exportOpen ? (
              <div className="px-5 pb-4 space-y-2" style={{ borderTop: "0.5px solid var(--sk-border-muted)" }}>
                {exportError ? <p className="text-[12px] pt-3" style={{ color: "var(--sk-status-danger)" }}>{exportError}</p> : null}
                <button
                  disabled={exportLoading}
                  className="mt-3 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white transition-opacity active:opacity-75 disabled:opacity-50"
                  style={{ background: "var(--sk-brand-forest)" }}
                  onClick={() => void exportData()}
                >
                  {exportLoading ? t('account_export_preparing', lang) : t('account_export_csv', lang)}
                </button>
              </div>
            ) : null}
            <Divider />
            <Row
              label={lang === 'no' ? 'Personvernerkl\u00e6ring' : 'Privacy policy'}
              subtitle={lang === 'no' ? 'Hvordan vi h\u00e5ndterer dataene dine' : 'How we handle your data'}
              href="/privacy"
            />
            <Divider />
            <Row
              label={t('account_delete', lang)}
              subtitle={t('account_delete_sub', lang)}
              danger
              onClick={() => setShowDeleteDialog(true)}
            />
          </div>

          {/* ── Sign out — outlined full-width button ── */}
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-6 w-full rounded-2xl py-4 text-[15px] font-semibold transition active:scale-[0.99]"
            style={{ background: "var(--sk-surface-white)", border: "1px solid var(--sk-border-default)", color: "var(--sk-text-primary)" }}
          >
            {t('account_sign_out', lang)}
          </button>

        </div>
      </main>

      {/* Delete confirmation dialog */}
      <DeleteDialog
        open={showDeleteDialog}
        onClose={() => { if (!deleteLoading) setShowDeleteDialog(false); }}
        onConfirm={() => void deleteAccount()}
        loading={deleteLoading}
        email={user?.email ?? ""}
        lang={lang}
      />
      <BottomNav />
    </div>
  );
}
