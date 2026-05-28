"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, History, Home, LogOut, ScanBarcode, UserRound } from "lucide-react";
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
      if (active) setIsSignedIn(Boolean(data.user));
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
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] sm:py-3.5">
          <Link href="/" className="group flex items-center gap-2.5 font-black text-ink">
            <SkarenMark
              className="h-9 w-9 transition duration-300 group-hover:-rotate-6 group-hover:scale-105 sm:h-10 sm:w-10"
              iconClassName="h-5 w-5 text-white sm:h-5 sm:w-5"
            />
            <SkarenWordmark className="text-[1.65rem] sm:text-[1.85rem]" />
          </Link>

          <nav className="hidden items-center gap-1 text-[0.82rem] font-semibold text-soil-600 sm:flex">
            <NavLink href="/pricing" pathname={pathname}>Pricing</NavLink>
            {isApp && (
              <>
                <NavLink href="/dashboard" pathname={pathname}>Stats</NavLink>
                <NavLink href="/history" pathname={pathname}>History</NavLink>
                <NavLink href="/account" pathname={pathname}>Account</NavLink>
                <Link
                  href="/scan"
                  className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[0.82rem] font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-forest active:scale-95"
                >
                  <ScanBarcode className="h-3.5 w-3.5" />
                  Scan
                </Link>
                {isSignedIn ? (
                  <button
                    onClick={signOut}
                    className="focus-ring ml-1 inline-flex items-center gap-1.5 rounded-full border border-black/8 px-3.5 py-2 text-[0.82rem] transition hover:bg-white hover:shadow-sm active:scale-95"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    className="ml-1 rounded-full border border-black/10 px-4 py-2 text-[0.82rem] transition hover:bg-white hover:shadow-sm active:scale-95"
                  >
                    Save history
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center gap-2 sm:hidden">
            <Link
              href="/scan"
              className="focus-ring tap-feedback inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 py-2 text-[0.82rem] font-black text-white shadow-soft"
            >
              <ScanBarcode className="h-4 w-4" />
              Scan
            </Link>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-[1.6rem] border border-black/[0.07] bg-white/90 p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-phone backdrop-blur-2xl sm:hidden">
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
              className={`focus-ring flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-[1.2rem] px-2 py-2 text-[0.62rem] font-black transition active:scale-95 ${
                item.primary
                  ? "bg-ink text-white shadow-soft"
                  : active
                    ? "bg-leaf-50 text-forest"
                    : "text-soil-500 hover:bg-soil-50/60"
              }`}
            >
              <item.icon className={`h-[1.1rem] w-[1.1rem] ${item.primary ? "" : active ? "stroke-[2.4px]" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function NavLink({ href, pathname, children }: { href: string; pathname: string; children: React.ReactNode }) {
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`rounded-full px-3.5 py-2 transition ${
        active
          ? "bg-leaf-50 font-black text-forest"
          : "hover:bg-black/5 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}