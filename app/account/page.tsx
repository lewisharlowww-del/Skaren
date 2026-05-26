"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Crown, History, LogOut, Mail, ScanBarcode, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { SkarenMark } from "@/components/SkarenLogo";
import { SupporterBadge } from "@/components/SupporterBadge";
import { getStoredSupportStatus, getSupporterBadge, isPremiumMetadata, saveStoredSupportStatus } from "@/lib/premium";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AccountUser = {
  email?: string;
  created_at?: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [checkingPremium, setCheckingPremium] = useState(false);
  const [supporterBadge, setSupporterBadge] = useState("Supporter");
  const [supportAmount, setSupportAmount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

      if (!active) return;

      if (!data.user) {
        router.push("/login?next=%2Faccount");
        return;
      }

      setUser({
        email: data.user.email ?? undefined,
        created_at: data.user.created_at
      });
      const metadataPremium = isPremiumMetadata(data.user.user_metadata);
      const storedSupport = getStoredSupportStatus(data.user.email);
      const storedAmount = Number(data.user.user_metadata?.support_amount_nok ?? storedSupport.amountNok ?? "0");
      const storedBadge = String(data.user.user_metadata?.supporter_badge ?? storedSupport.badge ?? getSupporterBadge(storedAmount));
      setIsPremium(metadataPremium || storedSupport.isSupporter);
      setSupportAmount(Number.isFinite(storedAmount) ? storedAmount : 0);
      setSupporterBadge(storedBadge);
      setLoading(false);

      setCheckingPremium(true);
      const { data: sessionData } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
      const response = sessionData.session?.access_token
        ? await fetch("/api/stripe/premium-status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionData.session.access_token}`
            }
          }).catch(() => null)
        : null;
      const premiumStatus = (await response?.json().catch(() => null)) as { premium?: boolean; amountNok?: number; badge?: string } | null;

      if (active && premiumStatus?.premium) {
        const amountNok = premiumStatus.amountNok ?? 0;
        const badge = premiumStatus.badge ?? getSupporterBadge(amountNok);
        saveStoredSupportStatus({ email: data.user.email, amountNok, badge });
        setIsPremium(true);
        setSupportAmount(amountNok);
        setSupporterBadge(badge);
        await supabase?.auth.updateUser({
          data: {
            plan: "supporter",
            premium: true,
            supporter: true,
            supporter_badge: badge,
            support_amount_nok: amountNok,
            premium_source: "stripe_webhook"
          }
        });
      } else if (active && !metadataPremium && !storedSupport.isSupporter) {
        setIsPremium(false);
      }

      if (active) setCheckingPremium(false);
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

  const joinedDate = user?.created_at
    ? new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(user.created_at))
    : "Recently";

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[430px] overflow-x-hidden px-4 pb-28 pt-6 sm:max-w-3xl sm:pt-8">
        <section className="rounded-[2.5rem] border border-white/70 bg-white/85 p-6 shadow-glass backdrop-blur-xl sm:p-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
            <SkarenMark className="h-16 w-16 shrink-0" iconClassName="h-9 w-9 text-white" />
            <div className="min-w-0">
              <p className="font-black uppercase tracking-[0.16em] text-forest">Account</p>
              <h1 className="mt-2 whitespace-nowrap font-display text-[2rem] font-black leading-none tracking-[-0.055em] text-ink sm:text-4xl">You are logged in</h1>
              <p className="mt-3 text-base font-medium leading-7 text-soil-600">
                Your Skaren scans can be saved, synced, and reviewed across devices.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 space-y-3">
              <div className="h-20 animate-pulse rounded-[1.5rem] bg-soil-100" />
              <div className="h-20 animate-pulse rounded-[1.5rem] bg-soil-100" />
            </div>
          ) : (
            <div className="mt-8 space-y-3">
              <div className="flex min-h-20 items-center gap-4 rounded-[1.5rem] border border-black/5 bg-leaf-50 p-4">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-forest shadow-sm">
                  <Mail className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-soil-500">Signed in as</p>
                  <p className="truncate text-lg font-black text-ink">{user?.email ?? "Skaren user"}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
                  {isPremium ? <Crown className="h-6 w-6 text-forest" /> : <CheckCircle2 className="h-6 w-6 text-forest" />}
                  <p className="mt-3 text-sm font-black uppercase tracking-[0.14em] text-soil-500">Status</p>
                  <p className="mt-1 text-xl font-black text-ink">
                    {checkingPremium ? "Checking support..." : isPremium ? supporterBadge : "Free account"}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-5 text-soil-600">
                    {checkingPremium
                      ? "Looking for your completed Stripe support payment."
                      : isPremium
                        ? `${supportAmount > 0 ? `${supportAmount} kr support received. ` : ""}Thank you for helping Skaren grow.`
                        : "You can scan for free and support Skaren anytime."}
                  </p>
                  {isPremium ? <SupporterBadge badge={supporterBadge} amountNok={supportAmount} className="mt-4" /> : null}
                </div>
                <div className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
                  <ShieldCheck className="h-6 w-6 text-forest" />
                  <p className="mt-3 text-sm font-black uppercase tracking-[0.14em] text-soil-500">Joined</p>
                  <p className="mt-1 text-xl font-black text-ink">{joinedDate}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/history"
              className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-ink px-5 py-4 font-black text-white shadow-phone"
            >
              <History className="h-5 w-5" />
              View history
            </Link>
            {isPremium ? (
              <SupporterBadge badge={supporterBadge} amountNok={supportAmount} compact className="justify-center" />
            ) : (
              <Link
                href="/pricing"
                className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-leaf-100 px-5 py-4 font-black text-forest shadow-sm"
              >
                <Crown className="h-5 w-5" />
                Support Skaren
              </Link>
            )}
            <Link
              href="/scan"
              className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-5 py-4 font-black text-ink shadow-sm"
            >
              <ScanBarcode className="h-5 w-5" />
              Scan product
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={!isSupabaseConfigured}
              className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-4 font-black text-soil-700 shadow-sm disabled:opacity-50"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
