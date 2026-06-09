"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const { lang } = useLang();
  const hasSelectedTab = tabPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-[1.6rem] border border-black/[0.07] bg-white/90 dark:bg-[#242018]/92 dark:border-[#2e2a24]/50 p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-phone backdrop-blur-2xl sm:hidden">
      {navItems.map((item) => {
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
                ? "bg-ink dark:bg-[#2d5025] text-white shadow-soft"
                : active
                  ? "bg-leaf-50 dark:bg-[#6abf58]/10 text-forest dark:text-[#6abf58]"
                  : "text-soil-500 dark:text-[#8a8070] hover:bg-soil-50/60 dark:hover:bg-[#6abf58]/5"
            }`}
          >
            <item.icon className={`h-[1.1rem] w-[1.1rem] ${item.primary ? "" : active ? "stroke-[2.4px]" : ""}`} />
            <span style={{ fontSize: 11 }}>{t(item.key, lang)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
