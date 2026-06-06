"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Crown, History, LogOut, Mail, ScanBarcode, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { SkarenMark } from "@/components/SkarenLogo";
import { SupporterBadge } from "@/components/SupporterBadge";
import { getSupporterBadge } from "@/lib/premium";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AccountUser = {
  email?: string;
  created_at?: string;
};

type PremiumStatusResponse = {
  premium?: boolean;
  amountNok?: number;
  badge?: string;
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
      setIsPremium(false);
      setSupportAmount(0);
      setSupporterBadge("Supporter");
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
      const premiumStatus = (await response?.json().catch(() => null)) as PremiumStatusResponse | null;

      if (active && premiumStatus?.premium) {
        const amountNok = premiumStatus.amountNok ?? 0;
        const badge = premiumStatus.badge ?? getSupporterBadge(amountNok);
        setIsPremium(true);
        setSupportAmount(amountNok);
        setSupporterBadge(badge);
      } else if (active) {
        setIsPremium(false);
        setSupportAmount(0);
        setSupporterBadge("Supporter");
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
      <main className="page-fade-up mx-auto w-full max-w-[430px] overflow-x-hidden px-4 pb-36 pt-4 sm:max-w-3xl sm:pt-8">
        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-glass backdrop-blur-xl sm:rounded-[2.5rem] sm:p-8">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
            <SkarenMark className="h-12 w-12 shrink-0 sm:h-16 sm:w-16" iconClassName="h-7 w-7 text-white sm:h-9 sm:w-9" />
            <div className="min-w-0">
              <p className="type-section-label text-forest">Account</p>
              <h1 className="type-heading-1 mt-1 text-ink sm:mt-2">You are logged in</h1>
              <p className="type-body-lg mt-2 text-soil-600 sm:mt-3">
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
                  <p className="type-section-label text-soil-500">Signed in as</p>
                  <p className="type-heading-3 truncate text-ink">{user?.email ?? "Skaren user"}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
                  {isPremium ? <Crown className="h-6 w-6 text-forest" /> : <CheckCircle2 className="h-6 w-6 text-forest" />}
                  <p className="type-section-label mt-3 text-soil-500">Status</p>
                  <p className="type-heading-2 mt-1 text-ink">
                    {checkingPremium ? "Checking support..." : isPremium ? supporterBadge : "Free account"}
                  </p>
                  <p className="type-body-sm mt-2 font-bold text-soil-600">
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
                  <p className="type-section-label mt-3 text-soil-500">Joined</p>
                  <p className="type-heading-2 mt-1 text-ink">{joinedDate}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/history"
              className="focus-ring tap-feedback type-button inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-ink px-5 py-4 text-white shadow-phone"
            >
              <History className="h-5 w-5" />
              View history
            </Link>
            {isPremium ? (
              <SupporterBadge badge={supporterBadge} amountNok={supportAmount} compact className="justify-center" />
            ) : (
              <Link
                href="/pricing"
                className="focus-ring tap-feedback type-button inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-leaf-100 px-5 py-4 text-forest shadow-sm"
              >
                <Crown className="h-5 w-5" />
                Support Skaren
              </Link>
            )}
            <Link
              href="/scan"
              className="focus-ring tap-feedback type-button inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-5 py-4 text-ink shadow-sm"
            >
              <ScanBarcode className="h-5 w-5" />
              Scan product
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={!isSupabaseConfigured}
              className="focus-ring tap-feedback type-button inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-4 text-soil-700 shadow-sm disabled:opacity-50"
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
