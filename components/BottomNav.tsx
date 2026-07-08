"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, useState, useEffect, useRef } from "react";
import { BarChart3, History, ScanBarcode, ShoppingCart, UserRound } from "lucide-react";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/language-context";

const navItems = [
  { href: "/history",       key: "nav_history" as const,  icon: History },
  { href: "/shopping-list", key: "nav_list" as const,     icon: ShoppingCart },
  { href: "/scan",          key: "nav_scan" as const,     icon: ScanBarcode, primary: true },
  { href: "/stats",         key: "nav_stats" as const,    icon: BarChart3 },
  { href: "/account",       key: "nav_account" as const,  icon: UserRound },
];

const tabPaths = ["/history", "/shopping-list", "/scan", "/stats", "/dashboard", "/account"];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLang();
  const [, startTransition] = useTransition();
  // Optimistic target: the tab the user just tapped. Lights up instantly,
  // before the route actually finishes changing.
  const [pending, setPending] = useState<string | null>(null);
  // Which tab is currently playing its tap animation, plus a nonce so the same
  // tab retriggers the animation on every tap.
  const [tapped, setTapped] = useState<{ path: string; nonce: number } | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Once the real route catches up to the tapped tab, drop the optimistic state.
  useEffect(() => {
    if (pending && (pathname === pending || pathname.startsWith(`${pending}/`))) {
      setPending(null);
    }
  }, [pathname, pending]);

  useEffect(() => () => { if (tapTimer.current) clearTimeout(tapTimer.current); }, []);

  // The path we treat as "current" for highlighting: the tapped tab wins so the
  // button reacts on the same frame as the tap.
  const activePath = pending ?? pathname;

  const hasSelectedTab = tabPaths.some(
    (path) => activePath === path || activePath.startsWith(`${path}/`)
  );

  const handleTap = (href: string) => (e: React.MouseEvent) => {
    const target = href.split("?")[0];
    // Always fire the visual effect, even when tapping the current tab.
    setTapped({ path: target, nonce: Date.now() });
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => setTapped(null), 520);

    // Ignore modifier clicks so open-in-new-tab etc. still work.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (target === pathname) return; // already here, just play the effect
    setPending(target);
    // Navigating inside a transition keeps the current screen on-screen instead
    // of flashing the full-page route loader, so the switch feels instant.
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-black/[0.07] bg-white/95 dark:bg-[#242018]/96 dark:border-[#2e2a24]/50 px-2 pt-1.5 backdrop-blur-2xl sm:hidden" style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom))' }}>
      {navItems.map((item) => {
        const itemPath = item.href.split("?")[0];
        const active =
          activePath === itemPath ||
          activePath.startsWith(`${itemPath}/`) ||
          (itemPath === "/stats" && activePath.startsWith("/dashboard")) ||
          (item.primary && !hasSelectedTab);
        const isTapping = tapped?.path === itemPath;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleTap(item.href)}
            className={`focus-ring type-caption relative flex min-h-[3.25rem] flex-col items-center justify-center gap-1 overflow-hidden rounded-[1.2rem] px-2 py-2 transition-all duration-150 ease-out active:scale-90 ${
              item.primary
                ? "bg-ink dark:bg-[#2d5025] text-white shadow-soft"
                : active
                  ? "bg-leaf-50 dark:bg-[#6abf58]/10 text-forest dark:text-[#6abf58] scale-[1.04]"
                  : "text-soil-500 dark:text-[#8a8070] hover:bg-soil-50/60 dark:hover:bg-[#6abf58]/5"
            }`}
          >
            {/* Ripple burst on tap. key+nonce restarts the animation each tap. */}
            {isTapping && (
              <span key={tapped!.nonce} className="nav-ripple run" aria-hidden />
            )}
            <item.icon
              key={isTapping ? `a-${tapped!.nonce}` : "idle"}
              className={`relative h-[1.1rem] w-[1.1rem] ${isTapping ? "nav-icon-anim" : ""} ${
                item.primary ? "" : active ? "stroke-[2.4px]" : ""
              }`}
            />
            <span className="relative" style={{ fontSize: 11 }}>{t(item.key, lang)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
