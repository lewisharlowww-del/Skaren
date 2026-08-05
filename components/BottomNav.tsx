"use client";

/**
 * BottomNav — canvas 9A, "Peel".
 *
 * The bar is a dark slab. The active tab is a cream sticker with Merk's
 * folded corner: the tab you are on is literally a label stuck to the bar.
 * Switching tabs peels one off and sticks the next, so Scan has no permanent
 * special case — it is simply the tab that is stuck by default.
 *
 * Icons come from components/NavIcons: one 24×24 grid, 1.75px stroke, round
 * caps and joins, no fills, rendered at 18px.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import {
  IconAccount,
  IconHistory,
  IconLists,
  IconScan,
  IconStats,
} from "@/components/NavIcons";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/language-context";

const navItems = [
  { href: "/history",       key: "nav_history" as const,  Icon: IconHistory },
  { href: "/shopping-list", key: "nav_list" as const,     Icon: IconLists },
  { href: "/scan",          key: "nav_scan" as const,     Icon: IconScan, primary: true },
  { href: "/stats",         key: "nav_stats" as const,    Icon: IconStats },
  { href: "/account",       key: "nav_account" as const,  Icon: IconAccount },
];

const tabPaths = ["/history", "/shopping-list", "/scan", "/stats", "/dashboard", "/account"];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLang();
  const [, startTransition] = useTransition();

  // Optimistic target so the sticker peels on the same frame as the tap.
  const [pending, setPending] = useState<string | null>(null);
  const activePath = pending ?? pathname;

  const hasSelectedTab = tabPaths.some(
    (path) => activePath === path || activePath.startsWith(`${path}/`)
  );

  const isActive = (itemPath: string, primary?: boolean) =>
    activePath === itemPath ||
    activePath.startsWith(`${itemPath}/`) ||
    (itemPath === "/stats" && activePath.startsWith("/dashboard")) ||
    (!!primary && !hasSelectedTab);

  useEffect(() => {
    if (pending && (pathname === pending || pathname.startsWith(`${pending}/`))) setPending(null);
  }, [pathname, pending]);

  const handleTap = (href: string) => (e: React.MouseEvent) => {
    const target = href.split("?")[0];
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (target === pathname) return;
    setPending(target);
    startTransition(() => router.push(href));
  };

  return (
    <nav
      className="sk-nav fixed inset-x-0 bottom-0 z-50 flex sm:hidden"
      style={{
        alignItems: "flex-end",
        background: "var(--sk-nav-bar-bg)",
        borderRadius: "22px 22px 0 0",
        padding: "0 8px calc(24px + env(safe-area-inset-bottom))",
      }}
      aria-label={t("nav_scan", lang)}
    >
      {navItems.map((item) => {
        const itemPath = item.href.split("?")[0];
        const active = isActive(itemPath, item.primary);
        const { Icon } = item;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleTap(item.href)}
            aria-current={active ? "page" : undefined}
            className="focus-ring sk-nav-tab"
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
            }}
          >
            <span
              style={{
                position: "relative",
                overflow: "hidden",
                width: active ? 78 : "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 6,
                // Canvas 9A: the sticker has its own ground (11/10); an idle
                // tab only carries the top lead-in, so both share a baseline.
                padding: active ? "11px 0 10px" : "11px 0 0",
                minHeight: "var(--sk-min-tap)",
                borderRadius: 16,
                background: active ? "var(--sk-nav-sticker-bg)" : "transparent",
                color: active ? "var(--sk-nav-sticker-fg)" : "var(--sk-nav-idle)",
                transition: "background-color 180ms ease-out, color 180ms ease-out",
              }}
            >
              {/* Merk's folded corner — only the stuck label has one. */}
              {active ? (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    width: 15,
                    height: 15,
                    background: "var(--sk-nav-sticker-fold)",
                    clipPath: "polygon(0 0, 100% 100%, 0 100%)",
                  }}
                />
              ) : null}
              <Icon size={18} />
              <span style={{ fontFamily: "var(--sk-font-ui)", fontSize: 10, fontWeight: 500 }}>
                {t(item.key, lang)}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
