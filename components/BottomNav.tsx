"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, useState, useEffect, useRef, useCallback } from "react";
import { BarChart3, History, Leaf, ScanBarcode, ShoppingCart, UserRound } from "lucide-react";
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

type Indicator = { left: number; top: number; width: number; height: number; visible: boolean };

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLang();
  const [, startTransition] = useTransition();

  // Optimistic target so the tapped tab reacts on the same frame as the tap.
  const [pending, setPending] = useState<string | null>(null);
  // Tapped-icon feedback (gentle grow) + drifting leaf, retriggerable via nonce.
  const [tap, setTap] = useState<{ index: number; nonce: number } | null>(null);
  // The organic leaf-blob position + a nonce to restart its settle wobble.
  const [indicator, setIndicator] = useState<Indicator>({ left: 0, top: 0, width: 0, height: 0, visible: false });
  const [settleNonce, setSettleNonce] = useState(0);
  const firstMeasure = useRef(true);

  const navRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePath = pending ?? pathname;

  const hasSelectedTab = tabPaths.some(
    (path) => activePath === path || activePath.startsWith(`${path}/`)
  );

  const isActive = (itemPath: string, primary?: boolean) =>
    activePath === itemPath ||
    activePath.startsWith(`${itemPath}/`) ||
    (itemPath === "/stats" && activePath.startsWith("/dashboard")) ||
    (!!primary && !hasSelectedTab);

  const activeIndex = navItems.findIndex((it) => isActive(it.href.split("?")[0], it.primary));
  const activeIsPrimary = activeIndex >= 0 && !!navItems[activeIndex].primary;

  // Glide the organic leaf-blob under whichever non-primary tab is active.
  const measure = useCallback((animate: boolean) => {
    const nav = navRef.current;
    const el = activeIndex >= 0 ? itemRefs.current[activeIndex] : null;
    if (!nav || !el || activeIsPrimary) {
      setIndicator((i) => ({ ...i, visible: false }));
      return;
    }
    const nr = nav.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setIndicator({ left: r.left - nr.left, top: r.top - nr.top, width: r.width, height: r.height, visible: true });
    if (animate) setSettleNonce((n) => n + 1);
  }, [activeIndex, activeIsPrimary]);

  useEffect(() => {
    const animate = !firstMeasure.current;
    firstMeasure.current = false;
    measure(animate);
  }, [measure, lang]);

  useEffect(() => {
    const onResize = () => measure(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);

  useEffect(() => {
    if (pending && (pathname === pending || pathname.startsWith(`${pending}/`))) setPending(null);
  }, [pathname, pending]);

  useEffect(() => () => { if (tapTimer.current) clearTimeout(tapTimer.current); }, []);

  const handleTap = (href: string, index: number) => (e: React.MouseEvent) => {
    const target = href.split("?")[0];
    // Always play the grow + leaf drift, even on the current tab.
    setTap({ index, nonce: Date.now() });
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => setTap(null), 900);

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (target === pathname) return;
    setPending(target);
    startTransition(() => router.push(href));
  };

  return (
    <nav
      ref={navRef}
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-black/[0.07] bg-white/95 dark:bg-[#242018]/96 dark:border-[#2e2a24]/50 px-2 pt-1.5 backdrop-blur-2xl sm:hidden"
      style={{ paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom))" }}
    >
      {/* Organic leaf-blob that glides between tabs and gently breathes */}
      <span
        aria-hidden
        className="nav-blob-outer pointer-events-none absolute z-0"
        style={{
          left: indicator.left,
          top: indicator.top,
          width: indicator.width,
          height: indicator.height,
          opacity: indicator.visible ? 1 : 0,
        }}
      >
        <span key={settleNonce} className="nav-blob-inner" />
      </span>

      {navItems.map((item, index) => {
        const itemPath = item.href.split("?")[0];
        const active = isActive(itemPath, item.primary);
        const isTapping = tap?.index === index;

        return (
          <Link
            key={item.href}
            href={item.href}
            ref={(el) => { itemRefs.current[index] = el; }}
            onClick={handleTap(item.href, index)}
            className={`focus-ring type-caption relative z-10 flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-[1.2rem] px-2 py-2 transition-transform duration-150 ease-out active:scale-95 ${
              item.primary
                ? "bg-ink dark:bg-[#2d5025] text-white shadow-soft"
                : active
                  ? "text-forest dark:text-[#6abf58]"
                  : "text-soil-500 dark:text-[#8a8070] hover:bg-soil-50/60 dark:hover:bg-[#6abf58]/5"
            }`}
          >
            <span className="relative flex items-center justify-center">
              {/* A single small leaf drifts up and fades on tap */}
              {isTapping && (
                <Leaf key={`leaf-${tap!.nonce}`} className="nav-leaf pointer-events-none absolute h-3 w-3" aria-hidden />
              )}
              <item.icon
                key={isTapping ? `grow-${tap!.nonce}` : "idle"}
                className={`relative h-[1.1rem] w-[1.1rem] ${isTapping ? "nav-grow" : ""} ${
                  item.primary ? "" : active ? "stroke-[2.4px]" : ""
                }`}
              />
            </span>
            <span className="relative" style={{ fontSize: 11 }}>{t(item.key, lang)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
