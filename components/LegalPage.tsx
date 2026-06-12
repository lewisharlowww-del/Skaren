"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { SkarenWordmark } from "@/components/SkarenLogo";
import { useLang } from "@/lib/language-context";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  eyebrow: string;
  eyebrowNo: string;
  title: string;
  titleNo: string;
  updated: string;
  intro: string;
  introNo: string;
  sections: LegalSection[];
  sectionsNo: LegalSection[];
};

export function LegalPage({
  eyebrow, eyebrowNo,
  title, titleNo,
  updated,
  intro, introNo,
  sections, sectionsNo,
}: LegalPageProps) {
  const router = useRouter();
  const { lang } = useLang();
  const no = lang === "no";

  const displayEyebrow = no ? eyebrowNo : eyebrow;
  const displayTitle   = no ? titleNo   : title;
  const displayIntro   = no ? introNo   : intro;
  const displaySections = no ? sectionsNo : sections;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--sk-brand-mist, #faf7f2)" }}>

      {/* Sticky header */}
      <header
        className="border-b"
        style={{
          borderColor: "rgba(0,0,0,0.07)",
          backgroundColor: "rgba(250,247,242,0.92)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label={no ? "Gå tilbake" : "Go back"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors active:bg-black/5"
              style={{
                backgroundColor: "rgba(255,255,255,0.72)",
                border: "1px solid rgba(0,0,0,0.08)",
                color: "var(--sk-text-green, #3a6b2a)",
              }}
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <Link href="/" aria-label="Skaren home">
              <SkarenWordmark className="h-6 w-auto" />
            </Link>
          </div>
          <span
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--sk-text-muted, #999)" }}
          >
            {displayEyebrow}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-14">

        {/* Title block */}
        <div className="border-b pb-10" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <p
            className="mb-3 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "var(--sk-text-green, #3a6b2a)" }}
          >
            {displayEyebrow}
          </p>
          <h1
            className="text-[2.5rem] font-bold leading-tight tracking-tight"
            style={{ color: "var(--sk-text-primary, #1a1a1a)" }}
          >
            {displayTitle}
          </h1>
          <p
            className="mt-4 text-[1.05rem] leading-relaxed"
            style={{ color: "var(--sk-text-secondary, #555)", maxWidth: "56ch" }}
          >
            {displayIntro}
          </p>
          <p className="mt-6 text-[12px]" style={{ color: "var(--sk-text-muted, #aaa)" }}>
            {no ? "Sist oppdatert" : "Last updated"} {updated} · Skaren AS, Oslo, Norway
          </p>
        </div>

        {/* Sections */}
        <div className="mt-10 space-y-10">
          {displaySections.map((section, i) => (
            <div
              key={section.title}
              className="border-b pb-10"
              style={{ borderColor: "rgba(0,0,0,0.06)" }}
            >
              <div className="flex gap-6">
                <span
                  className="mt-1 shrink-0 text-[12px] font-bold tabular-nums"
                  style={{ color: "var(--sk-text-muted, #ccc)", minWidth: "1.5rem" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2
                    className="text-[1.05rem] font-bold"
                    style={{ color: "var(--sk-text-primary, #1a1a1a)" }}
                  >
                    {section.title}
                  </h2>
                  <div className="mt-3 space-y-3">
                    {section.body.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-[0.95rem] leading-relaxed"
                        style={{ color: "var(--sk-text-secondary, #555)" }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div
          className="mt-12 rounded-2xl px-6 py-5"
          style={{
            backgroundColor: "rgba(45,74,38,0.06)",
            border: "1px solid rgba(45,74,38,0.12)",
          }}
        >
          <p
            className="text-[0.875rem] font-medium"
            style={{ color: "var(--sk-text-primary, #1a1a1a)" }}
          >
            {no ? "Spørsmål? Ta kontakt." : "Questions? Get in touch."}
          </p>
          <a
            href="mailto:hello@skaren.app"
            className="mt-1 inline-block text-[0.875rem] font-bold"
            style={{ color: "var(--sk-text-green, #3a6b2a)" }}
          >
            hello@skaren.app
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6">
          <span className="text-[12px]" style={{ color: "var(--sk-text-muted, #aaa)" }}>
            © {new Date().getFullYear()} Skaren AS · Oslo, Norway
          </span>
          <div className="flex gap-5 text-[12px]" style={{ color: "var(--sk-text-muted, #aaa)" }}>
            <Link href="/privacy" className="hover:underline">{no ? "Personvern" : "Privacy"}</Link>
            <Link href="/terms" className="hover:underline">{no ? "Vilkår" : "Terms"}</Link>
            <Link href="/disclaimer" className="hover:underline">{no ? "Ansvarsfraskrivelse" : "Disclaimer"}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
