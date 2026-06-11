import Link from "next/link";
import { SkarenWordmark } from "@/components/SkarenLogo";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalPage({ eyebrow, title, updated, intro, sections }: LegalPageProps) {
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
        }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            <SkarenWordmark className="h-6 w-auto" />
          </Link>
          <span
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--sk-text-muted, #999)" }}
          >
            {eyebrow}
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
            {eyebrow}
          </p>
          <h1
            className="text-[2.5rem] font-bold leading-tight tracking-tight"
            style={{ color: "var(--sk-text-primary, #1a1a1a)" }}
          >
            {title}
          </h1>
          <p
            className="mt-4 text-[1.05rem] leading-relaxed"
            style={{ color: "var(--sk-text-secondary, #555)", maxWidth: "56ch" }}
          >
            {intro}
          </p>
          <p className="mt-6 text-[12px]" style={{ color: "var(--sk-text-muted, #aaa)" }}>
            Last updated {updated} · Skaren AS, Oslo, Norway
          </p>
        </div>

        {/* Sections */}
        <div className="mt-10 space-y-10">
          {sections.map((section, i) => (
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
            Questions or account deletion requests?
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
          <div
            className="flex gap-5 text-[12px]"
            style={{ color: "var(--sk-text-muted, #aaa)" }}
          >
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/disclaimer" className="hover:underline">Disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
