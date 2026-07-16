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

function getDisplayName(email?: string): string {
  if (!email) return "Skaren user";
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

// ── Sub-components ────────────────────────────────────────────────────────────

function ProfileCard({
  name,
  email,
  isPremium,
  checkingPremium,
  streakDays,
  scanCount,
  joinedDate,
  lang,
}: {
  name: string;
  email: string;
  isPremium: boolean;
  checkingPremium: boolean;
  streakDays: number;
  scanCount: number;
  joinedDate: string;
  lang: Language;
}) {
  const gamificationBadge = getGamificationBadge(scanCount, lang);

  return (
    <section
      className="relative mb-5 overflow-hidden rounded-2xl border px-5 py-5 text-[#f5f0e8]"
      style={{
        background:
          "radial-gradient(circle at 50% 34%, #52734b 0%, #3d6037 28%, #2d4a26 62%, #243d20 100%)",
        borderColor: "#52734b",
        boxShadow: "0 18px 42px rgba(45, 74, 38, 0.14)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "rgba(255,255,255,0.34)" }}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c7d5c4]">
          {t("account_membership_label", lang)}
        </p>
        {checkingPremium ? (
          <span className="h-6 w-20 animate-pulse rounded-full bg-white/10" />
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold"
            style={{
              color: isPremium ? "#f2dfaa" : "#dce8d9",
              borderColor: isPremium
                ? "rgba(242,223,170,0.42)"
                : "rgba(220,232,217,0.28)",
              background: isPremium
                ? "rgba(112,96,48,0.26)"
                : "rgba(255,255,255,0.08)",
            }}
          >
            {isPremium ? <Crown className="h-3 w-3" /> : null}
            {isPremium ? t("account_pro_member", lang) : t("account_free_member", lang)}
          </span>
        )}
      </div>

      <div className="mt-7">
        <div className="min-w-0">
          <p
            className="truncate text-[24px] font-bold leading-tight text-white"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            {name}
          </p>
          <p className="mt-1 truncate text-[12px] text-[#c7d5c4]">{email}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 border-t border-white/15 pt-4">
        <div className="border-r border-white/15 pr-3">
          <ScanBarcode className="mb-2 h-4 w-4 text-[#a9c1a5]" />
          <p className="text-[17px] font-bold leading-none text-white">{scanCount}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#a9c1a5]">
            {lang === "no" ? "visninger" : "views"}
          </p>
        </div>
        <div className="border-r border-white/15 px-3">
          <Flame className="mb-2 h-4 w-4 text-[#d8c78f]" />
          <p className="text-[17px] font-bold leading-none text-white">{streakDays}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#a9c1a5]">
            {t("account_streak_label", lang)}
          </p>
        </div>
        <div className="pl-3">
          <Leaf className="mb-2 h-4 w-4 text-[#a9c1a5]" />
          <p className="truncate text-[12px] font-bold leading-none text-white">
            {gamificationBadge}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#a9c1a5]">
            {t("account_level_label", lang)}
          </p>
        </div>
      </div>

      {joinedDate ? (
        <p className="mt-4 text-[11px] text-[#91aa8e]">
          {t("account_member_since", lang)} {joinedDate}
        </p>
      ) : null}
    </section>
  );
}

function ProCard({ isPremium, lang }: { isPremium: boolean; lang: Language }) {
  if (isPremium) return null;

  return (
    <Link
      href="/pricing"
      className="mb-6 flex items-center gap-3 rounded-2xl border px-5 py-4 transition active:scale-[0.99]"
      style={{
        background: "#fffdf8",
        borderColor: "#d8c68e",
        boxShadow: "0 10px 28px rgba(112,96,48,0.08)",
      }}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f0e8d0]">
        <Crown className="h-5 w-5 text-[#706030]" />
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-bold text-[#4f4528]">{t('account_upgrade', lang)}</p>
        <p className="mt-0.5 text-[11px] text-[#8c7a49]">{t('account_upgrade_sub', lang)}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#a18d58]" />
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[11px] font-bold uppercase mb-2 px-1" style={{ color: "var(--sk-text-muted)", letterSpacing: "0.07em", fontFamily: "Manrope, sans-serif" }}>
      {label}
    </p>
  );
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
        <p className="text-[14px] font-bold" style={{ color: danger ? "var(--sk-status-danger)" : "var(--sk-text-primary)" }}>
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
              <Trash2 className="h-5 w-5" style={{ color: "var(--sk-status-danger)" }} />
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
          <h2 className="mt-3 text-[20px] font-black" style={{ fontFamily: "Satoshi, sans-serif", color: "var(--sk-status-danger)" }}>
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
              className="w-full rounded-2xl py-3.5 text-[14px] font-black text-white transition-opacity active:opacity-80 disabled:opacity-50"
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

  if (loading) return <SkarenLoader message="Loading account" />

  const locale = lang === 'no' ? 'nb' : 'en';
  const joinedDate = user?.created_at
    ? new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(
        new Date(user.created_at)
      )
    : "";

  const displayName = getDisplayName(user?.email);

  return (
    <div className="min-h-screen bg-[var(--sk-brand-mist)]">
      <main
        className="mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden bg-[var(--sk-brand-mist)] pb-32 pt-safe sm:max-w-lg"
      >
        {/* Page title */}
        <div className="px-4 pb-5 pt-1">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#786c5c]">
            Profile & preferences
          </p>
          <h1
            className="text-[30px] font-bold leading-none text-[#243f24]"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            {t('account_title', lang)}
          </h1>
        </div>

        <div className="px-4">
          {/* ── Profile card ── */}
          <ProfileCard
            name={displayName}
            email={user?.email ?? ""}
            isPremium={isPremium}
            checkingPremium={checkingPremium}
            streakDays={streakDays}
            scanCount={scanCount}
            joinedDate={joinedDate}
            lang={lang}
          />

          {/* ── Pro upgrade / membership card ── */}
          {!checkingPremium && (
            <ProCard isPremium={isPremium} lang={lang} />
          )}

          {/* ── Preferences ── */}
          <SectionLabel label={t('account_preferences', lang)} />
          <div className="mb-4 overflow-hidden rounded-2xl" style={{ background: "var(--sk-surface-white)", border: "1px solid var(--sk-border-default)" }}>
            {/* Language inline picker */}
            <div>
              <button
                type="button"
                onClick={() => setLangOpen((o) => !o)}
                className="flex w-full items-center gap-3.5 px-5 py-4 text-left active:bg-[#faf7f2] transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--sk-grade-b-bg)" }}>
                  <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold" style={{ color: "var(--sk-text-primary)" }}>{t('account_language', lang)}</p>
                  <p className="mt-0.5 text-[11px]" style={{ color: "var(--sk-text-muted)" }}>{lang === 'no' ? t('language_norwegian', lang) : t('language_english', lang)}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform" style={{ color: "var(--sk-text-faint)", transform: langOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
              </button>
              {langOpen && (
                <div className="px-5 pb-4 flex gap-3" style={{ borderTop: "0.5px solid var(--sk-border-muted)" }}>
                  {([
                    { value: 'no' as const, flag: '🇳🇴', label: t('language_norwegian', lang) },
                    { value: 'en' as const, flag: '🇬🇧', label: t('language_english', lang) },
                  ]).map((option) => {
                    const active = lang === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => { setLang(option.value); setLangOpen(false); }}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all"
                        style={{
                          background: active ? "var(--sk-brand-forest)" : "var(--sk-grade-a-bg)",
                          color: active ? "#ffffff" : "var(--sk-text-primary)",
                          border: active ? "none" : "1px solid var(--sk-border-default)",
                          marginTop: 12,
                        }}
                      >
                        <span className="text-[15px] leading-none">{option.flag}</span>
                        {option.label}
                        {active && <Check size={13} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <Divider />
            {/* Appearance accordion */}
            <div>
              <button
                type="button"
                onClick={() => setAppearanceOpen((o) => !o)}
                className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--sk-grade-d-bg)" }}>
                  <Moon className="h-4 w-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold" style={{ color: "var(--sk-text-primary)" }}>{t('account_appearance', lang)}</p>
                  <p className="mt-0.5 text-[12px] truncate" style={{ color: "var(--sk-text-muted)" }}>
                    {themePref === "light" ? t('account_theme_light', lang) : t('account_theme_dark', lang)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform" style={{ color: "var(--sk-text-faint)", transform: appearanceOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
              </button>
              {appearanceOpen && (
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
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all"
                        style={{
                          background: active ? "var(--sk-brand-forest)" : "var(--sk-grade-a-bg)",
                          color: active ? "#ffffff" : "var(--sk-text-primary)",
                          border: active ? "none" : "1px solid var(--sk-border-default)",
                          marginTop: 12,
                        }}
                      >
                        {opt.icon}
                        {opt.label}
                        {active && <Check size={13} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <Divider />
            {/* Badges accordion */}
            {(() => {
              const badges = computeBadges({ scans: scanSummaries, streakDays, joinedAt: user?.created_at, lang });
              const earned = earnedCount(badges);
              return (
                <div>
                  <button
                    type="button"
                    onClick={() => setBadgesOpen((o) => !o)}
                    className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--sk-grade-a-bg)" }}>
                      <span style={{ fontSize: 16, lineHeight: 1 }}>🏅</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold" style={{ color: "var(--sk-text-primary)" }}>{t("account_badges", lang)}</p>
                      <p className="mt-0.5 text-[11px]" style={{ color: "var(--sk-text-muted)" }}>{earned} {t("account_badges_of", lang)} {badges.length} {t("account_badges_earned_suffix", lang)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform" style={{ color: "var(--sk-text-faint)", transform: badgesOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
                  </button>
                  {badgesOpen && (
                    <div className="px-4 pb-5" style={{ borderTop: "0.5px solid var(--sk-border-muted)" }}>
                      <div className="pt-4">
                        <BadgesSection badges={badges} lang={lang} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* ── Data & Privacy ── */}
          <SectionLabel label={t('account_data_privacy', lang)} />
          <div className="mb-4 overflow-hidden rounded-2xl" style={{ background: "var(--sk-surface-white)", border: "1px solid var(--sk-border-default)" }}>

            {/* Export */}
            <div>
              <button type="button" onClick={() => setExportOpen((o) => !o)} className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--sk-grade-a-bg)" }}>
                  <Download className="h-4 w-4 text-[#2d4a26] dark:text-[#6abf58]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold" style={{ color: "var(--sk-text-primary)" }}>{t('account_export', lang)}</p>
                  <p className="mt-0.5 text-[11px]" style={{ color: "var(--sk-text-muted)" }}>{t('account_export_sub', lang)}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform" style={{ color: "var(--sk-text-faint)", transform: exportOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
              </button>
              {exportOpen && (
                <div className="px-5 pb-4 space-y-2" style={{ borderTop: "0.5px solid var(--sk-border-muted)" }}>
                  <p className="text-[13px] pt-3 leading-relaxed" style={{ color: "var(--sk-text-secondary)" }}>
                    Download a CSV file containing your full scan history — product names, barcodes, grades, and dates.
                  </p>
                  {exportError && (
                    <p className="text-[12px] mt-2" style={{ color: "var(--sk-status-danger)" }}>{exportError}</p>
                  )}
                  <button
                    disabled={exportLoading}
                    className="mt-1 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white transition-opacity active:opacity-75 disabled:opacity-50"
                    style={{ background: "var(--sk-brand-forest)" }}
                    onClick={() => void exportData()}
                  >
                    {exportLoading ? t('account_export_preparing', lang) : t('account_export_csv', lang)}
                  </button>
                </div>
              )}
            </div>

            <Divider />

            {/* Privacy Policy */}
            <Link href="/privacy" className="flex w-full items-center gap-3.5 px-5 py-4 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--sk-grade-a-bg)" }}>
                <Lock className="h-4 w-4" style={{ color: "var(--sk-text-green)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold" style={{ color: "var(--sk-text-primary)" }}>{lang === 'no' ? 'Personvernerklæring' : 'Privacy Policy'}</p>
                <p className="mt-0.5 text-[11px]" style={{ color: "var(--sk-text-muted)" }}>{lang === 'no' ? 'Hvordan vi samler inn og bruker dataene dine' : 'How we collect and use your data'}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--sk-text-faint)" }} />
            </Link>

            <Divider />

            {/* Terms of Use */}
            <Link href="/terms" className="flex w-full items-center gap-3.5 px-5 py-4 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--sk-grade-a-bg)" }}>
                <FileText className="h-4 w-4" style={{ color: "var(--sk-text-green)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold" style={{ color: "var(--sk-text-primary)" }}>{lang === 'no' ? 'Brukervilkår' : 'Terms of Use'}</p>
                <p className="mt-0.5 text-[11px]" style={{ color: "var(--sk-text-muted)" }}>{lang === 'no' ? 'Regler for bruk av Skaren' : 'Rules for using Skaren'}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--sk-text-faint)" }} />
            </Link>

            <Divider />

            {/* Nutrition disclaimer */}
            <Link href="/disclaimer" className="flex w-full items-center gap-3.5 px-5 py-4 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--sk-grade-d-bg)" }}>
                <TriangleAlert className="h-4 w-4 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold" style={{ color: "var(--sk-text-primary)" }}>{lang === 'no' ? 'Ansvarsfraskrivelse' : 'Nutrition Disclaimer'}</p>
                <p className="mt-0.5 text-[11px]" style={{ color: "var(--sk-text-muted)" }}>{lang === 'no' ? 'Ikke medisinsk råd — les før bruk' : 'Not medical advice — read before use'}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--sk-text-faint)" }} />
            </Link>

            <Divider />

            {/* Contact & support */}
            <div>
              <button type="button" onClick={() => setContactOpen((o) => !o)} className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--sk-grade-a-bg)" }}>
                  <Mail className="h-4 w-4" style={{ color: "var(--sk-text-green)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold" style={{ color: "var(--sk-text-primary)" }}>{lang === 'no' ? 'Kontakt og støtte' : 'Contact & support'}</p>
                  <p className="mt-0.5 text-[11px]" style={{ color: "var(--sk-text-muted)" }}>hello@skaren.app</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform" style={{ color: "var(--sk-text-faint)", transform: contactOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
              </button>
              {contactOpen && (
                <div className="px-5 pb-4 space-y-2" style={{ borderTop: "0.5px solid var(--sk-border-muted)" }}>
                  <p className="text-[13px] pt-3" style={{ color: "var(--sk-text-secondary)" }}>Questions, bug reports, or data requests — we reply within 48 hours.</p>
                  <a
                    href="mailto:hello@skaren.app"
                    className="mt-1 flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white transition-opacity active:opacity-75"
                    style={{ background: "var(--sk-brand-forest)" }}
                  >
                    <Mail className="h-4 w-4" />
                    hello@skaren.app
                  </a>
                </div>
              )}
            </div>

          </div>

          {/* ── Account actions ── */}
          <SectionLabel label={t('account_title', lang)} />
          <div className="overflow-hidden rounded-2xl" style={{ background: "var(--sk-surface-white)", border: "1px solid var(--sk-border-default)" }}>
            <SettingsRow
              icon={<LogOut className="h-4 w-4 text-[#786c5c] dark:text-[#8a8070]" />}
              iconBg="#f0ebe0"
              iconBgDark="var(--sk-dark-surface)"
              label={t('account_sign_out', lang)}
              subtitle={user?.email ?? ""}
              onClick={() => void signOut()}
            />
            <Divider />
            <SettingsRow
              icon={<Trash2 className="h-4 w-4 text-[#aa1818] dark:text-[#e07070]" />}
              iconBg="#fcebeb"
              iconBgDark="var(--sk-grade-e-bg)"
              label={t('account_delete', lang)}
              subtitle={t('account_delete_sub', lang)}
              danger
              onClick={() => setShowDeleteDialog(true)}
            />
          </div>

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
