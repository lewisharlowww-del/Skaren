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

  // Two states of the same bar:
  //   Scan page  → Peel: dark slab, Scan is the cream sticker.
  //   elsewhere  → inverse: beige paper bar, Scan is the black sticker, and
  //                the tab you are on is a soft pill on the paper.
  const scanActive = isActive("/scan", true);

  return (
    <nav
      className="sk-nav fixed inset-x-0 bottom-0 z-50 flex sm:hidden"
      style={{
        alignItems: "flex-end",
        background: scanActive ? "var(--sk-nav-bar-bg)" : "var(--sk-brand-mist-card)",
        borderRadius: "22px 22px 0 0",
        borderTop: scanActive ? "none" : "1px solid var(--sk-border-default)",
        padding: "0 8px calc(8px + env(safe-area-inset-bottom))",
        transition: "background-color 200ms ease-out",
      }}
      aria-label={t("nav_scan", lang)}
    >
      {navItems.map((item) => {
        const itemPath = item.href.split("?")[0];
        const active = isActive(itemPath, item.primary);
        const { Icon } = item;

        // A tab renders as a "sticker" (the raised label with a folded corner)
        // when it is the Scan CTA off-Scan, or the active tab in Peel mode.
        const isCta = !!item.primary && !scanActive;
        const isSticker = isCta || (scanActive && active);

        const stickerBg = isCta ? "var(--sk-nav-cta-bg)" : "var(--sk-nav-sticker-bg)";
        const stickerFg = isCta ? "var(--sk-nav-cta-fg)" : "var(--sk-nav-sticker-fg)";
        const stickerFold = isCta ? "var(--sk-nav-cta-fold)" : "var(--sk-nav-sticker-fold)";

        // Non-sticker tabs. In Peel the bar is dark, so idle text is light; in
        // inverse the bar is beige, so idle text is the muted paper ink and the
        // active tab wears the soft pill from the original Skaren nav.
        const idleColor = scanActive ? "var(--sk-nav-idle)" : "var(--sk-nav-inactive)";
        const pill = !scanActive && active ? "var(--sk-nav-active-pill)" : "transparent";
        const flatColor = !scanActive && active ? "var(--sk-text-primary)" : idleColor;

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
                width: isSticker ? 76 : "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 5,
                // Canvas 9A: the sticker has its own ground (9/8); a flat tab
                // only carries the top lead-in, so both share a baseline.
                padding: isSticker ? "9px 0 8px" : "9px 0 0",
                minHeight: 42,
                borderRadius: 16,
                background: isSticker ? stickerBg : pill,
                color: isSticker ? stickerFg : flatColor,
                transition: "background-color 180ms ease-out, color 180ms ease-out",
              }}
            >
              {/* Merk's folded corner — only a stuck label has one. */}
              {isSticker ? (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    width: 15,
                    height: 15,
                    background: stickerFold,
                    clipPath: "polygon(0 0, 100% 100%, 0 100%)",
                  }}
                />
              ) : null}
              <Icon size={18} />
              <span style={{ fontFamily: "var(--sk-font-ui)", fontSize: 9.5, fontWeight: 500 }}>
                {t(item.key, lang)}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
