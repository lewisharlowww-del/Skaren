"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SkarenWordmark } from "@/components/SkarenLogo";
import { supabase } from "@/lib/supabase";

const guestLinks = [
  { href: "/login", label: "Log in" },
  { href: "/auth", label: "Create account" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

const authedLinks = [
  { href: "/account", label: "Account" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function AppFooter() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => {
      setLoggedIn(Boolean(data.user));
    });
  }, []);

  if (pathname.startsWith("/product/")) {
    return null;
  }

  const links = loggedIn ? authedLinks : guestLinks;

  return (
    <footer className="border-t border-black/5 bg-porcelain/90 px-4 pb-32 pt-8 sm:pb-8">
      <div className="type-body-sm mx-auto flex max-w-6xl flex-col gap-5 rounded-[1.75rem] border border-white/70 bg-white/70 p-5 text-soil-600 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SkarenWordmark className="text-lg" />
          <p className="mt-2 max-w-md leading-6">
            Scan smarter. Live cleaner.
          </p>
        </div>
        <nav className="flex flex-wrap gap-3 font-bold text-forest">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="min-h-11 rounded-full bg-leaf-50 px-4 py-3 transition hover:bg-leaf-100">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
