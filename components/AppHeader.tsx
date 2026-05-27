"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BadgeCheck, BarChart3, History, Home, LogOut, ScanBarcode, UserRound } from "lucide-react";
import { SkarenMark, SkarenWordmark } from "@/components/SkarenLogo";
import { supabase } from "@/lib/supabase";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isApp =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/scan") ||
    pathname.startsWith("/product");
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
      if (active) {
        setIsSignedIn(Boolean(data.user));
      }
    }

    loadSession();

    const listener = supabase?.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session?.user));
    });

    return () => {
      active = false;
      listener?.data.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase?.auth.signOut();
    document.cookie = "sb-skaren-auth-token=; path=/; max-age=0; SameSite=Lax";
    router.push("/");
  }

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-white/60 bg-porcelain/88 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] sm:py-4">
        <Link href="/" className="group flex items-center gap-3 font-black text-soil-900">
          <SkarenMark className="h-9 w-9 transition duration-300 group-hover:-rotate-6 group-hover:scale-105 sm:h-11 sm:w-11" iconClassName="h-5 w-5 text-white sm:h-6 sm:w-6" />
          <SkarenWordmark className="text-[1.8rem] sm:text-[2.05rem]" />
        </Link>

        <nav className="hidden items-center gap-2 text-sm font-medium text-soil-600 sm:flex">
          <Link className="rounded-full px-4 py-2 transition hover:bg-white hover:text-ink hover:shadow-sm" href="/pricing">
            Pricing
          </Link>
          {isApp ? (
            <>
              <Link className="rounded-full px-4 py-2 transition hover:bg-white hover:text-ink hover:shadow-sm" href="/dashboard">
                Stats
              </Link>
              <Link className="rounded-full px-4 py-2 transition hover:bg-white hover:text-ink hover:shadow-sm" href="/history">
                History
              </Link>
              <Link className="rounded-full px-4 py-2 transition hover:bg-white hover:text-ink hover:shadow-sm" href="/account">
                Account
              </Link>
              <Link className="rounded-full px-4 py-2 transition hover:bg-white hover:text-ink hover:shadow-sm" href="/scan">
                Scan
              </Link>
              {isSignedIn ? (
                <button
                  onClick={signOut}
                  className="focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 transition hover:bg-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              ) : (
                <Link className="rounded-full bg-ink px-5 py-3 text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-forest" href="/auth">
                  Save history
                </Link>
              )}
            </>
          ) : (
            null
          )}
        </nav>

        <div className="flex items-center gap-2 sm:hidden">
          <Link
            href="/support"
            aria-label="Support Skaren"
            className="focus-ring tap-feedback grid min-h-10 min-w-10 place-items-center rounded-full border border-black/5 bg-white text-forest shadow-sm"
          >
            <BadgeCheck className="h-5 w-5" />
          </Link>
          <Link href="/scan" className="focus-ring tap-feedback inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-black text-white shadow-soft">
            <ScanBarcode className="h-4 w-4" />
            Scan
          </Link>
        </div>
      </div>
    </header>
    <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-[1.7rem] border border-white/70 bg-white/85 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-phone backdrop-blur-2xl sm:hidden">
      {[
        { href: "/", label: "Home", icon: Home },
        { href: isSignedIn ? "/history" : "/login?next=%2Fhistory", label: "History", icon: History },
        { href: "/scan", label: "Scan", icon: ScanBarcode, primary: true },
        { href: isSignedIn ? "/dashboard" : "/login?next=%2Fdashboard", label: "Stats", icon: BarChart3 },
        { href: isSignedIn ? "/account" : "/login", label: isSignedIn ? "Account" : "Login", icon: UserRound }
      ].map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`focus-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[0.68rem] font-black transition active:scale-95 ${
              item.primary
                ? "bg-ink text-white shadow-soft"
                : active
                  ? "bg-lime-100 text-ink"
                  : "text-soil-600 hover:bg-white"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
    </>
  );
}
