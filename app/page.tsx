import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Database,
  HeartPulse,
  ScanBarcode,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { PhoneFrame } from "@/components/PhoneFrame";
import { SkarenMark } from "@/components/SkarenLogo";
import { SupportCheckout } from "@/components/SupportCheckout";

const howItWorks = [
  {
    number: "01",
    title: "Scan the barcode",
    text: "Use your camera or type the number. Skaren looks up real Norwegian product data when it is available.",
    icon: ScanBarcode
  },
  {
    number: "02",
    title: "Read the health grade",
    text: "Get a clear A-E view based on sugar, salt, fat, protein, fiber, calories, and useful food labels.",
    icon: HeartPulse
  },
  {
    number: "03",
    title: "Check the hidden details",
    text: "See additives, NOVA processing level, daily intake bars, allergens, ingredients, and nutrition facts in one calm report.",
    icon: ClipboardList
  }
];

const benefits = [
  {
    title: "Made for Norwegian shelves",
    text: "Skaren prioritizes local product records, store images, prices, and nutrition data when available.",
    icon: Database
  },
  {
    title: "Health-first grading",
    text: "Grades focus on practical signals like sugar, salt, unhealthy fat, protein, fiber, calories, and Nøkkelhull labels.",
    icon: HeartPulse
  },
  {
    title: "Additives made clear",
    text: "E-numbers are translated into simple risk labels so you know which additives are fine and which deserve caution.",
    icon: Sparkles
  },
  {
    title: "Progress over time",
    text: "Create an account to save history, track streaks, and see your product choices over time.",
    icon: BarChart3
  }
];

const sampleReports = [
  {
    name: "Chicken sausages",
    brand: "Prior",
    grade: "C",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
    detail: "Decent protein, but salty and processed",
    facts: ["Protein 13g", "Salt 1.8g", "NOVA 4", "E250 flagged"],
    emoji: "🌭"
  },
  {
    name: "Green grapes",
    brand: "Bama",
    grade: "A",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    detail: "Whole food with no additives detected",
    facts: ["Low fat", "NOVA 1", "No additives", "Natural sugar"],
    emoji: "🍇"
  },
  {
    name: "Chocolate spread",
    brand: "Ferrero",
    grade: "E",
    tone: "border-rose-200 bg-rose-50 text-rose-800",
    detail: "Very sweet, high fat, best as a treat",
    facts: ["High sugar", "High fat", "Daily intake spike", "Treat food"],
    emoji: "🍫"
  }
];

export default function LandingPage() {
  return (
    <>
      <AppHeader />
      <main>
        <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 overflow-hidden px-4 py-8 md:grid-cols-[0.92fr_1.08fr] md:py-16">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2 text-sm font-black text-forest shadow-sm">
              <Sparkles className="h-4 w-4" />
              Scan smarter. Live cleaner.
            </div>
            <h1 className="font-display max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-ink sm:text-6xl">
              Know what you are buying in seconds.
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-soil-600">
              Skaren turns barcodes into clear product reports with health grades, additives,
              NOVA processing level, daily intake bars, allergens, ingredients, and saved scan history.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/scan"
                className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-ink px-7 py-4 font-black text-white shadow-phone transition hover:bg-forest"
              >
                Start scanning
                <ScanBarcode className="h-5 w-5" />
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-3 text-sm font-bold text-soil-600">
              {["No login needed to scan", "Additives & E-numbers", "Clear A-E grades"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-forest" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative min-h-[39rem]">
            <div className="absolute left-1/2 top-8 hidden h-[31rem] w-[31rem] -translate-x-1/2 rounded-full bg-leaf-100 blur-3xl sm:block" />
            <PhoneFrame className="absolute left-1/2 top-0 z-20 w-[18.5rem] -translate-x-1/2 sm:left-[45%]">
              <div>
                <div className="text-center">
                  <SkarenMark className="mx-auto mb-5 h-16 w-16 rounded-[1.4rem]" iconClassName="h-9 w-9 text-white" />
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-forest">Product report</p>
                  <h2 className="font-display mt-2 text-3xl font-black tracking-[-0.05em] text-ink">Health Grade</h2>
                </div>
                <div className="mx-auto mt-7 grid h-36 w-36 place-items-center rounded-full border-[10px] border-forest bg-white shadow-soft">
                  <span className="font-display text-6xl font-black text-forest">B</span>
                </div>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  {["Protein 18g", "Sugar 2g", "Salt 0.7g", "Fat 8g"].map((fact) => (
                    <div key={fact} className="rounded-2xl bg-leaf-50 p-3 text-center text-xs font-black text-forest">
                      {fact}
                    </div>
                  ))}
                </div>
                <Link href="/scan" className="mt-8 inline-flex w-full justify-center rounded-full bg-ink px-5 py-4 font-black text-white">
                  Scan product
                </Link>
              </div>
            </PhoneFrame>

            <PhoneFrame dark className="absolute right-0 top-28 hidden w-[17rem] rotate-3 lg:block">
              <div>
                <p className="text-sm font-bold text-white/70">Food signals</p>
                <h2 className="mt-2 text-2xl font-black">What matters</h2>
                <div className="mt-8 space-y-3">
                  {["NOVA level 4", "Contains milk", "E250 to avoid"].map((item, index) => (
                    <div key={item} className="rounded-2xl bg-white/10 p-4 text-sm font-bold text-white">
                      {index === 0 ? "✅" : index === 1 ? "⚠️" : "ℹ️"} {item}
                    </div>
                  ))}
                </div>
              </div>
            </PhoneFrame>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="max-w-2xl">
            <p className="font-black text-forest">How it works</p>
            <h2 className="font-display mt-2 text-4xl font-black tracking-[-0.05em] text-ink">
              Built for the supermarket aisle.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {howItWorks.map((step) => (
              <article key={step.title} className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="font-display text-5xl font-black text-leaf-200">{step.number}</span>
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-leaf-50 text-forest">
                    <step.icon className="h-6 w-6" />
                  </span>
                </div>
                <h3 className="mt-8 text-xl font-black text-ink">{step.title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-soil-600">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="rounded-[2.5rem] bg-ink p-6 text-white shadow-phone md:p-10">
            <p className="font-black text-leaf-200">Why Skaren?</p>
            <h2 className="font-display mt-2 text-4xl font-black tracking-[-0.05em]">
              Fast answers without the nutrition homework.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit) => (
                <article key={benefit.title} className="rounded-[1.5rem] bg-white/10 p-5">
                  <div className="mb-5 grid h-11 w-11 place-items-center rounded-full bg-leaf-200 text-ink">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-black">{benefit.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/70">{benefit.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
            <p className="font-black text-forest">Product reports</p>
            <h2 className="font-display mt-2 text-4xl font-black tracking-[-0.05em] text-ink">
                A product report that feels useful in the aisle.
            </h2>
            <p className="mt-3 max-w-xl text-base font-medium leading-7 text-soil-600">
                Preview the kind of signals Skaren shows: health grade, additives, processing level, allergens, and the nutrients that affect your day.
            </p>
            </div>
            <Link href="/scan" className="inline-flex min-h-11 items-center gap-2 font-black text-forest underline decoration-leaf-300 decoration-2 underline-offset-4">
              Try your product
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {sampleReports.map((scan) => (
              <article key={scan.name} className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-phone">
                <div className="flex items-center gap-4 p-5">
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[1.35rem] bg-gradient-to-br from-leaf-50 to-white text-4xl shadow-inner">
                    {scan.emoji}
                  </div>
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-xl font-black leading-6 text-ink">{scan.name}</h3>
                    <p className="mt-1 text-sm font-bold text-soil-600">{scan.brand}</p>
                  </div>
                </div>
                <div className="border-t border-black/5 bg-gradient-to-b from-white to-soil-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-soil-500">Health grade</p>
                      <p className="mt-1 text-base font-black leading-6 text-ink">{scan.detail}</p>
                    </div>
                    <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-full border-[6px] text-3xl font-black ${scan.tone}`}>
                      {scan.grade}
                    </span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {scan.facts.map((fact) => (
                      <span key={fact} className="rounded-2xl bg-white px-3 py-2 text-center text-xs font-black text-soil-700 shadow-sm">
                        {fact}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/85 shadow-glass backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-ink p-6 text-white md:p-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-leaf-200">
                <BadgeCheck className="h-4 w-4" />
                Support Skaren
              </div>
              <h2 className="font-display text-4xl font-black tracking-[-0.05em]">
                Help keep Skaren independent.
              </h2>
              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-white/70">
                Choose a one-time amount, get a Supporter or Founder badge, and help fund better product data and future improvements.
              </p>
              <div className="mt-8 max-w-sm">
                <SupportCheckout activeClassName="bg-white text-ink hover:bg-leaf-50" />
              </div>
            </div>
            <div className="grid gap-4 p-6 md:p-10 sm:grid-cols-2">
              {[
                ["Unlimited scans", "No monthly scan limit when comparing products."],
                ["Full history", "Keep your product reports synced across devices."],
                ["Deeper insights", "Clearer ingredient and nutrition notes as Skaren improves."],
                ["Monthly stats", "See patterns in sugar, salt, protein, and product grades."]
              ].map(([title, text]) => (
                <article key={title} className="rounded-[1.5rem] border border-black/5 bg-leaf-50 p-5">
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white text-forest shadow-sm">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-black text-ink">{title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-soil-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="rounded-[2.5rem] border border-white/70 bg-white/80 p-6 shadow-glass backdrop-blur-xl md:p-10">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-black text-forest">Ready when you shop</p>
                <h2 className="font-display mt-2 text-4xl font-black tracking-[-0.05em] text-ink">
                  Start with one barcode.
                </h2>
                <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-soil-600">
                  Scan for free. Log in when you want your history, stats, and saved progress.
                </p>
              </div>
              <Link
                href="/scan"
                className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-forest px-7 py-4 font-black text-white shadow-phone"
              >
                Scan now
                <ScanBarcode className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
