"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  Crown,
  Download,
  Flame,
  Globe,
  Leaf,
  LogOut,
  Moon,
  ScanBarcode,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { t, type Language } from "@/lib/i18n";
import { useLang } from "@/lib/language-context";
import { getUserPremiumStatus } from "@/lib/premium";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

type AccountUser = {
  id: string;
  email?: string;
  created_at?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(email?: string): string {
  if (!email) return "?";
  const local = email.split("@")[0];
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

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

function getGamificationBadge(scanCount: number): string {
  if (scanCount >= 100) return "Eco Champion";
  if (scanCount >= 25) return "Eco Pioneer";
  if (scanCount >= 5) return "Eco Explorer";
  if (scanCount >= 1) return "Eco Curious";
  return "New Scanner";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProfileCard({
  initials,
  name,
  email,
  isPremium,
  checkingPremium,
  streakDays,
  scanCount,
  joinedDate,
  lang,
}: {
  initials: string;
  name: string;
  email: string;
  isPremium: boolean;
  checkingPremium: boolean;
  streakDays: number;
  scanCount: number;
  joinedDate: string;
  lang: Language;
}) {
  const gamificationBadge = getGamificationBadge(scanCount);

  return (
    <section
      className="relative mb-5 overflow-hidden rounded-2xl border px-5 py-5 text-[#f5f0e8]"
      style={{
        background: "#243f24",
        borderColor: "#496649",
        boxShadow: "0 18px 42px rgba(45, 74, 38, 0.14)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "rgba(255,255,255,0.34)" }}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c7d5c4]">
          Skaren membership
        </p>
        {checkingPremium ? (
          <span className="h-6 w-20 animate-pulse rounded-full bg-white/10" />
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
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
            {isPremium ? t("account_pro_member", lang) : "Member"}
          </span>
        )}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div
          className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border"
          style={{
            backgroundColor: "#f5f0e8",
            borderColor: "rgba(255,255,255,0.48)",
          }}
        >
          <span className="text-[18px] font-black text-[#2d4a26]">{initials}</span>
        </div>
        <div className="min-w-0">
          <p
            className="truncate text-[22px] font-bold leading-tight text-white"
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
          <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[#a9c1a5]">
            {t("account_scans", lang)}
          </p>
        </div>
        <div className="border-r border-white/15 px-3">
          <Flame className="mb-2 h-4 w-4 text-[#d8c78f]" />
          <p className="text-[17px] font-bold leading-none text-white">{streakDays}</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[#a9c1a5]">
            Day streak
          </p>
        </div>
        <div className="pl-3">
          <Leaf className="mb-2 h-4 w-4 text-[#a9c1a5]" />
          <p className="truncate text-[12px] font-bold leading-none text-white">
            {gamificationBadge.replace("Eco ", "")}
          </p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[#a9c1a5]">
            Level
          </p>
        </div>
      </div>

      {joinedDate ? (
        <p className="mt-4 text-[10px] text-[#91aa8e]">
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
    <p className="text-[11px] font-bold uppercase mb-2 px-1" style={{ color: "#9a8e7e", letterSpacing: "0.07em", fontFamily: "Manrope, sans-serif" }}>
      {label}
    </p>
  );
}

function Divider() {
  return <div className="mx-5 h-px bg-[#f0ebe0]" />;
}

interface SettingsRowProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  subtitle: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}

function SettingsRow({ icon, iconBg, label, subtitle, href, onClick, danger }: SettingsRowProps) {
  const inner = (
    <>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-bold ${danger ? "text-[#aa1818]" : "text-[#2d3028]"}`}>
          {label}
        </p>
        <p className="mt-0.5 text-[11px] text-[#9a8e7e] truncate">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "#b0a090" }} />
    </>
  );

  const cls =
    "flex w-full items-center gap-3.5 px-5 py-4 text-left active:bg-[#faf7f2] transition-colors";

  if (href) {
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
  email,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  email: string;
  lang: Language;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-6 sm:pb-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="relative w-full max-w-sm rounded-3xl border border-[#e0d8cc] bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#f0ebe0] text-[#9a8e7e] active:bg-[#e0d8cc]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fcebeb] mb-4">
          <TriangleAlert className="h-6 w-6 text-[#aa1818]" />
        </div>

        <h2
          className="text-[20px] font-black text-[#2d3028] mb-1"
          style={{ fontFamily: "Satoshi, sans-serif" }}
        >
          {t('account_delete_title', lang)}
        </h2>
        <p className="text-[13px] text-[#9a8e7e] mb-1">
          {t('account_delete_body', lang)} <span className="font-semibold text-[#2d3028]">{email}</span> {t('account_delete_body2', lang)}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-2xl bg-[#aa1818] px-5 py-3.5 text-[14px] font-black text-white active:opacity-80 transition-opacity"
          >
            {t('account_delete_confirm', lang)}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-[#e0d8cc] bg-white px-5 py-3.5 text-[14px] font-bold text-[#2d3028] active:bg-[#f7f2ea] transition-colors"
          >
            {t('cancel', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const [langOpen, setLangOpen] = useState(false);
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [checkingPremium, setCheckingPremium] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

        if (!active) return;

        if (!data.user) {
          router.push("/login?next=%2Faccount");
          return;
        }

        setUser({
          id: data.user.id,
          email: data.user.email ?? undefined,
          created_at: data.user.created_at,
        });
        setIsPremium(false);

        // Load scan count + streak for gamification chips
        if (isSupabaseConfigured && supabase) {
          const { data: scansData } = await supabase
            .from("scans")
            .select("created_at")
            .eq("user_id", data.user.id)
            .order("created_at", { ascending: false });

          if (active && scansData) {
            setScanCount(scansData.length);
            setStreakDays(computeStreak(scansData.map((s) => s.created_at)));
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
  }, [router]);

  async function signOut() {
    await supabase?.auth.signOut();
    document.cookie = "sb-skaren-auth-token=; path=/; max-age=0; SameSite=Lax";
    router.push("/");
  }

  async function deleteAccount() {
    // TODO: call /api/account/delete to fully purge user data server-side
    await supabase?.auth.signOut();
    document.cookie = "sb-skaren-auth-token=; path=/; max-age=0; SameSite=Lax";
    router.push("/");
  }

  const locale = lang === 'no' ? 'nb' : 'en';
  const joinedDate = user?.created_at
    ? new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(
        new Date(user.created_at)
      )
    : "";

  const initials = getInitials(user?.email);
  const displayName = getDisplayName(user?.email);

  return (
    <>
      <main
        className="mx-auto w-full max-w-[430px] overflow-x-hidden pb-32 pt-4 sm:max-w-lg sm:pt-8"
        style={{ background: "#f5f0e8", minHeight: "100dvh" }}
      >
        {/* Page title */}
        <div className="px-4 pb-5 pt-1">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9a8e7e]">
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
          {loading ? (
            <div className="mb-3 h-36 animate-pulse rounded-2xl bg-white border border-[#e0d8cc]" />
          ) : (
            <ProfileCard
              initials={initials}
              name={displayName}
              email={user?.email ?? ""}
              isPremium={isPremium}
              checkingPremium={checkingPremium}
              streakDays={streakDays}
              scanCount={scanCount}
              joinedDate={joinedDate}
              lang={lang}
            />
          )}

          {/* ── Pro upgrade / membership card ── */}
          {!loading && !checkingPremium && (
            <ProCard isPremium={isPremium} lang={lang} />
          )}

          {/* ── Preferences ── */}
          <SectionLabel label={t('account_preferences', lang)} />
          <div className="mb-4 overflow-hidden rounded-2xl border border-[#e0d8cc] bg-white">
            <SettingsRow
              icon={<Bell className="h-4 w-4 text-[#2d4a26]" />}
              iconBg="#eaf3de"
              label={t('account_notifications', lang)}
              subtitle={t('account_notifications_sub', lang)}
              href="/account/notifications"
            />
            <Divider />
            {/* Language inline picker */}
            <div>
              <button
                type="button"
                onClick={() => setLangOpen((o) => !o)}
                className="flex w-full items-center gap-3.5 px-5 py-4 text-left active:bg-[#faf7f2] transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "#e6f1fb" }}>
                  <Globe className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[#2d3028]">{t('account_language', lang)}</p>
                  <p className="mt-0.5 text-[11px] text-[#9a8e7e]">{lang === 'no' ? t('language_norwegian', lang) : t('language_english', lang)}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform" style={{ color: "#b0a090", transform: langOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
              </button>
              {langOpen && (
                <div style={{ borderTop: "0.5px solid #f0ebe0" }}>
                  {([
                    { value: 'no' as const, flag: '🇳🇴', label: t('language_norwegian', lang) },
                    { value: 'en' as const, flag: '🇬🇧', label: t('language_english', lang) },
                  ]).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => { setLang(option.value); setLangOpen(false); }}
                      className="flex w-full items-center gap-3 px-5 py-3 active:bg-[#faf7f2] transition-colors"
                    >
                      <span className="text-[20px]">{option.flag}</span>
                      <span className="flex-1 text-[14px] font-semibold text-[#2d3028]">{option.label}</span>
                      {lang === option.value && (
                        <span className="h-5 w-5 rounded-full flex items-center justify-center" style={{ background: "#2d4a26" }}>
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L4 7L9 1" stroke="#dceedd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Divider />
            <SettingsRow
              icon={<Moon className="h-4 w-4 text-orange-500" />}
              iconBg="#faeeda"
              label={t('account_appearance', lang)}
              subtitle={t('account_appearance_sub', lang)}
              href="/account/appearance"
            />
          </div>

          {/* ── Data & Privacy ── */}
          <SectionLabel label={t('account_data_privacy', lang)} />
          <div className="mb-4 overflow-hidden rounded-2xl border border-[#e0d8cc] bg-white">
            <SettingsRow
              icon={<Download className="h-4 w-4 text-[#2d4a26]" />}
              iconBg="#eaf3de"
              label={t('account_export', lang)}
              subtitle={t('account_export_sub', lang)}
            />
            <Divider />
            <SettingsRow
              icon={<ShieldCheck className="h-4 w-4 text-[#9a8e7e]" />}
              iconBg="#f0ebe0"
              label={t('account_privacy_policy', lang)}
              subtitle={t('account_privacy_policy_sub', lang)}
              href="/privacy"
            />
          </div>

          {/* ── Account actions ── */}
          <SectionLabel label={t('account_title', lang)} />
          <div className="overflow-hidden rounded-2xl border border-[#e0d8cc] bg-white">
            <SettingsRow
              icon={<LogOut className="h-4 w-4 text-[#9a8e7e]" />}
              iconBg="#f0ebe0"
              label={t('account_sign_out', lang)}
              subtitle={user?.email ?? ""}
              onClick={() => void signOut()}
            />
            <Divider />
            <SettingsRow
              icon={<Trash2 className="h-4 w-4 text-[#aa1818]" />}
              iconBg="#fcebeb"
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
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => void deleteAccount()}
        email={user?.email ?? ""}
        lang={lang}
      />
      <BottomNav />
    </>
  );
}
