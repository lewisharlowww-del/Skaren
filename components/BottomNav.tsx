"use client";

/**
 * BottomNav — D1 "The Shelf", step 6.
 *
 * The bar is paper (--sk-brand-mist-card) with a hairline top border. Scan is
 * permanently raised out of it — a dark tab with a 16px 16px 0 0 radius that
 * never changes state, because it is the app's anchor. The other four show
 * active state as a soft pill behind icon and label.
 *
 * Icons come from components/NavIcons: one 24×24 grid, 1.7px stroke, round
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

  // Optimistic target so the tapped tab reacts on the same frame as the tap.
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
        background: "var(--sk-brand-mist-card)",
        borderTop: "1px solid var(--sk-border-default)",
        padding: "0 6px calc(26px + env(safe-area-inset-bottom))",
      }}
      aria-label={t("nav_scan", lang)}
    >
      {navItems.map((item) => {
        const itemPath = item.href.split("?")[0];
        const active = isActive(itemPath, item.primary);
        const { Icon } = item;

        // The raised Scan tab. Permanently dark, permanently the same — it is
        // the anchor, so it never renders an active or inactive variant.
        if (item.primary) {
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleTap(item.href)}
              aria-current={active ? "page" : undefined}
              className="focus-ring sk-nav-scan"
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
              }}
            >
              <span
                style={{
                  marginTop: -26,
                  background: "var(--sk-nav-scan-bg)",
                  borderRadius: "16px 16px 0 0",
                  padding: "13px 0 14px",
                  width: 72,
                  minHeight: "var(--sk-min-tap)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                  color: "var(--sk-nav-scan-fg)",
                }}
              >
                <Icon size={18} />
                <span style={{ fontFamily: "var(--sk-font-ui)", fontSize: 10, fontWeight: 500 }}>
                  {t(item.key, lang)}
                </span>
              </span>
            </Link>
          );
        }

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
              padding: "13px 0 14px",
            }}
          >
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "6px 12px 5px",
                borderRadius: 13,
                minHeight: "var(--sk-min-tap)",
                background: active ? "var(--sk-nav-active-pill)" : "transparent",
                color: active ? "var(--sk-text-primary)" : "var(--sk-nav-inactive)",
                transition: "background-color 160ms ease-out, color 160ms ease-out",
              }}
            >
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
