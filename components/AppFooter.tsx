"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SkarenWordmark } from "@/components/SkarenLogo";
import { t, type TranslationKey } from "@/lib/i18n";

const legalLinks = [
  { href: "/login", labelKey: "nav.login" },
  { href: "/auth", labelKey: "nav.create_account" },
  { href: "/support", labelKey: "nav.support" },
  { href: "/privacy", labelKey: "footer.privacy" },
  { href: "/terms", labelKey: "footer.terms" },
  { href: "/disclaimer", labelKey: "footer.disclaimer" }
] satisfies Array<{ href: string; labelKey: TranslationKey }>;

export function AppFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/product/")) {
    return null;
  }

  return (
    <footer className="border-t border-black/5 bg-porcelain/90 px-4 pb-32 pt-8 sm:pb-8">
      <div className="type-body-sm mx-auto flex max-w-6xl flex-col gap-5 rounded-[1.75rem] border border-white/70 bg-white/70 p-5 text-soil-600 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SkarenWordmark className="text-lg" />
          <p className="mt-2 max-w-md leading-6">
            {t("footer.description")}
          </p>
          <p className="mt-1">{t("footer.contact")}</p>
        </div>
        <nav className="flex flex-wrap gap-3 font-bold text-forest">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="min-h-11 rounded-full bg-leaf-50 px-4 py-3 transition hover:bg-leaf-100">
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
