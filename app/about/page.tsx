import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ScanBarcode } from "lucide-react";

export const metadata: Metadata = {
  title: "About Skaren | Norwegian Product Scanner",
  description:
    "Skaren helps Norwegian shoppers scan and search grocery products to understand nutrition, processing, allergens, additives, and environmental information.",
};

const features = [
  {
    title: "Scan products",
    text: "Scan a barcode to open a clear, structured product report.",
  },
  {
    title: "Search groceries",
    text: "Find Norwegian products by name when a barcode is not nearby.",
  },
  {
    title: "Understand the details",
    text: "Review nutrition, processing, allergens, additives, and ingredients.",
  },
];

export default function AboutPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "#f5f0e8",
        color: "#1e1e18",
        colorScheme: "light",
      }}
    >
      <header
        className="border-b"
        style={{ borderColor: "#e8e0d4", background: "rgba(255,255,255,0.82)" }}
      >
        <div className="mx-auto flex min-h-[76px] w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/about" className="flex items-center gap-3" aria-label="Skaren home">
            <Image
              src="/icons/icon-192.png?v=4"
              alt=""
              width={44}
              height={44}
              className="rounded-xl"
              priority
            />
            <span
              className="text-[18px] font-medium uppercase"
              style={{
                color: "#2d4a26",
                fontFamily: "Satoshi, var(--font-manrope), sans-serif",
                letterSpacing: "0.18em",
              }}
            >
              Skaren
            </span>
          </Link>

          <Link
            href="/scan"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[14px] font-bold text-white"
            style={{ background: "#1e1e18" }}
          >
            <ScanBarcode className="h-4 w-4" />
            Open app
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-16">
        <section className="max-w-3xl">
          <p
            className="text-[11px] font-semibold uppercase"
            style={{ color: "#5a4a38", letterSpacing: "0.12em" }}
          >
            Norwegian grocery intelligence
          </p>
          <h1
            className="mt-4 max-w-[760px] text-[40px] font-medium leading-[1.08] sm:text-[56px]"
            style={{
              color: "#1e1e18",
              fontFamily: "Satoshi, var(--font-manrope), sans-serif",
              letterSpacing: "-0.04em",
            }}
          >
            Understand grocery products at a glance
          </h1>
          <p
            className="mt-6 max-w-2xl text-[17px] font-medium leading-8 sm:text-[18px]"
            style={{ color: "#5a4a38" }}
          >
            Skaren helps Norwegian shoppers scan barcodes or search for products
            and understand what is inside before making a choice.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/scan"
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl px-6 text-[15px] font-bold text-white"
              style={{ background: "#2d4a26" }}
            >
              Try Skaren
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/privacy"
              className="inline-flex min-h-12 items-center rounded-2xl border px-6 text-[15px] font-bold"
              style={{
                background: "#ffffff",
                borderColor: "#e8e0d4",
                color: "#2d4a26",
              }}
            >
              Privacy policy
            </Link>
          </div>
        </section>

        <section className="mt-14 grid gap-3 sm:mt-20 sm:grid-cols-3">
          {features.map((item, index) => (
            <article
              key={item.title}
              className="rounded-2xl border p-5 sm:p-6"
              style={{ background: "#ffffff", borderColor: "#e8e0d4" }}
            >
              <span
                className="text-[11px] font-semibold"
                style={{ color: "#a09080", letterSpacing: "0.06em" }}
              >
                0{index + 1}
              </span>
              <h2 className="mt-5 text-[18px] font-bold" style={{ color: "#1e1e18" }}>
                {item.title}
              </h2>
              <p className="mt-2 text-[14px] leading-6" style={{ color: "#5a4a38" }}>
                {item.text}
              </p>
            </article>
          ))}
        </section>

        <section
          className="mt-6 rounded-2xl border p-5 sm:p-7"
          style={{ background: "#edf4e9", borderColor: "#d8eddc" }}
        >
          <h2 className="text-[18px] font-bold" style={{ color: "#2d4a26" }}>
            Clear information, not medical advice
          </h2>
          <p className="mt-2 max-w-3xl text-[14px] leading-6" style={{ color: "#5a4a38" }}>
            Product reports bring available nutrition, processing, allergens,
            additives, ingredients, and environmental information into one
            place. Skaren supports everyday decisions and does not replace
            professional medical or nutritional guidance.
          </p>
        </section>

        <footer
          className="mt-12 flex flex-col gap-4 border-t pt-6 text-[13px] sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "#e8e0d4", color: "#7f7466" }}
        >
          <p>© 2026 Skaren</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-3" aria-label="Legal">
            <Link href="/privacy" className="font-semibold" style={{ color: "#2d4a26" }}>
              Privacy
            </Link>
            <Link href="/terms" className="font-semibold" style={{ color: "#2d4a26" }}>
              Terms
            </Link>
            <Link href="/support" className="font-semibold" style={{ color: "#2d4a26" }}>
              Support
            </Link>
          </nav>
        </footer>
      </main>
    </div>
  );
}
