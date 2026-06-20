"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, History, LogOut, ScanBarcode, ShoppingCart, UserRound } from "lucide-react";
import { SkarenMark, SkarenWordmark } from "@/components/SkarenLogo";
import { supabase } from "@/lib/supabase";
import { signOutEverywhere } from "@/lib/auth";

export function AppHeader({ showMobileScan = true }: { showMobileScan?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const isApp =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/stats") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/shopping-list") ||
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
    await signOutEverywhere();
    router.push("/scan");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] sm:py-3.5">
          <Link href="/" className="group flex items-center gap-2.5 text-ink">
            <SkarenMark
              className="h-9 w-9 transition duration-300 group-hover:-rotate-6 group-hover:scale-105 sm:h-10 sm:w-10"
              iconClassName="h-5 w-5 text-white sm:h-5 sm:w-5"
            />
            <SkarenWordmark className="text-2xl sm:text-[1.7rem]" />
          </Link>

          <nav className="type-body-sm hidden items-center gap-1 text-soil-600 sm:flex">
            <NavLink href="/pricing" pathname={pathname}>Pricing</NavLink>
            {isApp && (
              <>
                <NavLink href="/stats" pathname={pathname}>Stats</NavLink>
                <NavLink href="/history" pathname={pathname}>History</NavLink>
                <NavLink href="/account" pathname={pathname}>Account</NavLink>
                <Link
                  href="/scan"
                  className="type-button ml-1 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-forest active:scale-95"
                >
                  <ScanBarcode className="h-3.5 w-3.5" />
                  Scan
                </Link>
                {isSignedIn ? (
                  <button
                    onClick={signOut}
                    className="focus-ring type-button ml-1 inline-flex items-center gap-1.5 rounded-full border border-black/8 px-3.5 py-2 transition hover:bg-white hover:shadow-sm active:scale-95"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    className="type-button ml-1 rounded-full border border-black/10 px-4 py-2 transition hover:bg-white hover:shadow-sm active:scale-95"
                  >
                    Save history
                  </Link>
                )}
              </>
            )}
          </nav>

          {showMobileScan && (
            <div className="flex items-center gap-2 sm:hidden">
              <Link
                href="/scan"
                className="focus-ring tap-feedback type-button inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 py-2 text-white shadow-soft"
              >
                <ScanBarcode className="h-4 w-4" />
                Scan
              </Link>
            </div>
          )}
        </div>
      </header>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-[1.6rem] border border-black/[0.07] bg-white/90 p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-phone backdrop-blur-2xl sm:hidden">
        {([
          { href: "/history", label: "History", icon: History, primary: false },
          { href: "/shopping-list", label: "List", icon: ShoppingCart, primary: false },
          { href: "/scan", label: "Scan", icon: ScanBarcode, primary: true },
          { href: "/stats", label: "Stats", icon: BarChart3, primary: false },
          { href: "/account", label: "Account", icon: UserRound, primary: false }
        ] as const).map((item) => {
          const tabPaths = ["/history", "/shopping-list", "/scan", "/stats", "/dashboard", "/account"];
          const hasSelectedTab = tabPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
          const itemPath = item.href.split("?")[0];
          const active =
            pathname === itemPath ||
            pathname.startsWith(`${itemPath}/`) ||
            (itemPath === "/stats" && pathname.startsWith("/dashboard")) ||
            (item.primary && !hasSelectedTab);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`focus-ring type-caption flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-[1.2rem] px-2 py-2 transition active:scale-95 ${
                item.primary
                  ? "bg-ink text-white shadow-soft"
                  : active && itemPath === "/shopping-list"
                    ? "text-[var(--sk-brand-forest)]"
                  : active
                    ? "bg-leaf-50 text-forest"
                    : "text-soil-500 hover:bg-soil-50/60"
              }`}
            >
              <item.icon className={`h-[1.1rem] w-[1.1rem] ${item.primary ? "" : active ? "stroke-[2.4px]" : ""}`} />
              {item.label}
              {active && itemPath === "/shopping-list" ? (
                <span className="h-1 w-1 rounded-full bg-[var(--sk-brand-forest)]" aria-hidden="true" />
              ) : null}
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
          ? "bg-leaf-50 font-bold text-forest"
          : "hover:bg-black/5 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
