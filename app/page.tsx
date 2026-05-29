import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Database,
  HeartPulse,
  Lock,
  MapPin,
  ScanBarcode,
  ShieldCheck,
  Sparkles,
  Star
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
    gradeLabel: "Average",
    pillTone: "bg-amber-50 text-amber-700 border border-amber-200",
    heroBg: "bg-gradient-to-br from-amber-50 to-white",
    iconBg: "bg-amber-100",
    detail: "Salty & processed",
    emoji: "🌭",
    facts: [
      { label: "Protein", value: "13 g", color: "text-forest" },
      { label: "Salt", value: "1.8 g", color: "text-amber-600" },
      { label: "NOVA", value: "4", color: "text-rose-600" },
      { label: "Additive", value: "E250", color: "text-rose-600" },
    ]
  },
  {
    name: "Green grapes",
    brand: "Bama",
    grade: "A",
    gradeLabel: "Excellent",
    pillTone: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    heroBg: "bg-gradient-to-br from-emerald-50 to-white",
    iconBg: "bg-emerald-100",
    detail: "No additives",
    emoji: "🍇",
    facts: [
      { label: "Fat", value: "Low", color: "text-forest" },
      { label: "NOVA", value: "1", color: "text-forest" },
      { label: "Additives", value: "None", color: "text-forest" },
      { label: "Sugar", value: "Natural", color: "text-ink" },
    ]
  },
  {
    name: "Chocolate spread",
    brand: "Ferrero",
    grade: "E",
    gradeLabel: "Poor",
    pillTone: "bg-rose-50 text-rose-700 border border-rose-200",
    heroBg: "bg-gradient-to-br from-rose-50 to-white",
    iconBg: "bg-rose-100",
    detail: "Treat only",
    emoji: "🍫",
    facts: [
      { label: "Sugar", value: "High", color: "text-rose-600" },
      { label: "Fat", value: "High", color: "text-rose-600" },
      { label: "NOVA", value: "4", color: "text-rose-600" },
      { label: "Daily", value: "Spike", color: "text-rose-600" },
    ]
  }
];

export default function LandingPage() {
  return (
    <>
      <AppHeader />
      <main>
        {/* HERO */}
        <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 overflow-hidden px-4 py-8 md:grid-cols-[0.92fr_1.08fr] md:py-16">
          <div className="relative z-10">
            {/* Norway badge — Option A */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-black text-white shadow-sm">
              <MapPin className="h-3.5 w-3.5" />
              Made for Norwegian stores
            </div>

            {/* Stronger headline — Option A */}
            <h1 className="font-display max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-ink sm:text-6xl">
              Know what&apos;s{" "}
              <span className="text-forest">really</span>{" "}
              in your food.
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-soil-600">
              Scan any barcode. Get instant health grades, additives, allergens,
              and eco scores — in plain language.
            </p>

            {/* CTAs — Option A: green primary */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/scan"
                className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-forest px-7 py-4 font-black text-white shadow-phone transition hover:bg-ink"
              >
                Start scanning — free
                <ScanBarcode className="h-5 w-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-7 py-4 font-black text-ink shadow-sm transition hover:bg-leaf-50"
              >
                How it works
              </Link>
            </div>

            {/* Social proof — Option C */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex">
                {["#4CAF7D", "#1A5C3A", "#32885D", "#6DC797"].map((color, i) => (
                  <div
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-black text-white"
                    style={{ background: color, marginLeft: i === 0 ? 0 : "-8px", zIndex: 4 - i }}
                  >
                    {["A", "K", "M", "L"][i]}
                  </div>
                ))}
              </div>
              <div className="text-sm font-medium text-soil-600">
                <span className="font-black text-ink">Trusted by early users</span> in Norway
                <div className="mt-0.5 flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>

            {/* Trust strip — Option C */}
            <div className="mt-5 flex flex-row flex-wrap gap-3 text-sm font-bold text-soil-600">
              {[
                { label: "No ads, ever", icon: ShieldCheck },
                { label: "Private by default", icon: Lock },
                { label: "Norwegian data", icon: MapPin }
              ].map((item) => (
                <span key={item.label} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm">
                  <item.icon className="h-4 w-4 text-forest" />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* Phone mockup — Option B: upgraded with Health + Eco + Overall grades */}
          <div className="relative hidden min-h-[39rem] md:flex">
            <div className="absolute left-1/2 top-8 hidden h-[31rem] w-[31rem] -translate-x-1/2 rounded-full bg-leaf-100 blur-3xl sm:block" />
            <PhoneFrame className="absolute left-1/2 top-0 z-20 w-[18.5rem] -translate-x-1/2 sm:left-[45%]">
              <div>
                <div className="text-center">
                  <SkarenMark className="mx-auto mb-4 h-14 w-14 rounded-[1.2rem]" iconClassName="h-8 w-8 text-white" />
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-forest">Skaren Grade</p>
                  <p className="mt-1 text-sm font-semibold text-soil-500">Salakis Gresk Yoghurt</p>
                </div>

                {/* Three grades side by side */}
                <div className="mt-5 flex items-center justify-around">
                  {[
                    { grade: "B", label: "Health", color: "#4CAF7D", text: "#32885D", bg: "rgba(76,175,125,0.08)", glow: "rgba(76,175,125,0.18)" },
                    { grade: "C", label: "Overall", color: "#F4A261", text: "#C47A35", bg: "rgba(244,162,97,0.08)", glow: "rgba(244,162,97,0.18)", large: true },
                    { grade: "E", label: "Eco", color: "#E63946", text: "#C0202C", bg: "rgba(230,57,70,0.07)", glow: "rgba(230,57,70,0.15)" }
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-1.5">
                      <div
                        className="flex items-center justify-center rounded-full font-black"
                        style={{
                          width: item.large ? 64 : 46,
                          height: item.large ? 64 : 46,
                          border: `${item.large ? 5 : 4}px solid ${item.color}`,
                          color: item.text,
                          background: item.bg,
                          boxShadow: `0 0 0 3px ${item.glow}`,
                          fontSize: item.large ? "1.6rem" : "1.1rem"
                        }}
                      >
                        {item.grade}
                      </div>
                      <span
                        className="text-[0.65rem] font-black uppercase tracking-wide"
                        style={{ color: item.text }}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Nutrition grid */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {[
                    { label: "Protein", value: "18 g", good: true },
                    { label: "Sugar", value: "2 g", good: true },
                    { label: "Salt", value: "0.7 g", good: true },
                    { label: "Fat", value: "8 g", warn: true }
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-leaf-50 p-2.5">
                      <p className="text-[0.6rem] font-bold uppercase tracking-wide text-soil-500">{item.label}</p>
                      <p
                        className={`text-sm font-black ${item.good ? "text-forest" : item.warn ? "text-amber-600" : "text-ink"}`}
                        style={{ color: item.good ? "#1A5C3A" : item.warn ? "#C47A35" : "#101512" }}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <Link href="/scan" className="mt-5 inline-flex w-full justify-center rounded-full bg-forest px-5 py-3.5 text-sm font-black text-white">
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

        {/* HOW IT WORKS — Option C: now linked from nav */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-14">
          <div className="max-w-2xl">
            <p className="font-black text-forest">How it works</p>
            <h2 className="font-display mt-2 text-4xl font-black tracking-[-0.05em] text-ink">
              Built for the supermarket aisle.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {/* Desktop cards */}
            <div className="hidden md:contents">
              {howItWorks.map((step, i) => (
                <article key={step.title} className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
                  <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[2rem] bg-gradient-to-r from-leaf-500 to-forest" />
                  <div className="mb-8 flex items-center justify-between">
                    <span className="rounded-full bg-forest px-3 py-1 text-xs font-black text-white">Step {i + 1}</span>
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-leaf-50 text-forest"><step.icon className="h-5 w-5" /></span>
                  </div>
                  <h3 className="text-xl font-black text-ink">{step.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-soil-600">{step.text}</p>
                </article>
              ))}
            </div>
            {/* Mobile compact steps */}
            <div className="col-span-full space-y-3 md:hidden">
              {howItWorks.map((step, i) => (
                <div key={step.title} className="flex items-start gap-4 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm">
                  <span className="mt-0.5 shrink-0 rounded-full bg-forest px-3 py-1 text-xs font-black text-white">Step {i + 1}</span>
                  <div>
                    <p className="text-sm font-black text-ink">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-soil-500">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto hidden max-w-6xl px-4 py-14 md:block">
          <div className="rounded-[2.5rem] border border-black/5 bg-white p-6 shadow-soft md:p-10">
            <p className="font-black text-forest">Why Skaren?</p>
            <h2 className="font-display mt-2 text-4xl font-black tracking-[-0.05em] text-ink">
              Fast answers without the nutrition homework.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit, i) => {
                const iconStyles = [
                  "bg-leaf-50 text-forest",
                  "bg-rose-50 text-rose-600",
                  "bg-amber-50 text-amber-600",
                  "bg-blue-50 text-blue-600",
                ];
                return (
                  <article key={benefit.title} className="rounded-[1.5rem] border border-black/5 p-5">
                    <div className={`mb-5 grid h-11 w-11 place-items-center rounded-xl ${iconStyles[i]}`}>
                      <benefit.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-black text-ink">{benefit.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-soil-600">{benefit.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-9 md:py-14">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-black text-forest">Product reports</p>
              <h2 className="font-display mt-2 text-3xl font-black tracking-[-0.05em] text-ink md:text-4xl">
                A product report that feels useful in the aisle.
              </h2>
              <p className="mt-3 hidden max-w-xl text-base font-medium leading-7 text-soil-600 md:block">
                Preview the kind of signals Skaren shows: health grade, additives, processing level, allergens, and the nutrients that affect your day.
              </p>
            </div>
            <Link href="/scan" className="inline-flex min-h-11 items-center gap-2 font-black text-forest underline decoration-leaf-300 decoration-2 underline-offset-4">
              Try your product
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 flex gap-3 overflow-x-auto pb-2 md:mt-8 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            {sampleReports.map((scan) => (
              <article key={scan.name} className="min-w-[78vw] max-w-[20rem] overflow-hidden rounded-[1.5rem] border border-black/5 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-phone md:min-w-0 md:max-w-none md:rounded-[2rem]">
                <div className={`p-4 md:p-5 ${scan.heroBg}`}>
                  <div className={`mb-3 grid h-12 w-12 place-items-center rounded-[1rem] text-2xl md:mb-4 md:h-14 md:w-14 md:text-3xl ${scan.iconBg}`}>
                    {scan.emoji}
                  </div>
                  <h3 className="text-lg font-black leading-6 text-ink md:text-xl">{scan.name}</h3>
                  <p className="mt-1 text-sm font-bold text-soil-600">{scan.brand}</p>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-black/5 px-4 py-3 md:px-5">
                  <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-black ${scan.pillTone}`}>
                    {scan.grade} — {scan.gradeLabel}
                  </span>
                  <span className="truncate text-xs font-semibold text-soil-500">{scan.detail}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 pt-2 md:p-4 md:pt-2">
                  {scan.facts.map((fact, index) => (
                    <div key={fact.label} className={`rounded-xl bg-soil-50 p-2.5 ${index > 1 ? "hidden md:block" : ""}`}>
                      <p className="text-[0.6rem] font-bold uppercase tracking-wide text-soil-400">{fact.label}</p>
                      <p className={`text-sm font-black ${fact.color}`}>{fact.value}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-9 md:py-14">
          <div className="grid overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-glass backdrop-blur-xl md:rounded-[2.5rem] lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-ink p-5 text-white md:p-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-leaf-200 md:mb-6 md:px-4 md:py-2 md:text-sm">
                <BadgeCheck className="h-4 w-4" />
                Support Skaren
              </div>
              <h2 className="font-display text-3xl font-black tracking-[-0.05em] md:text-4xl">
                Help keep Skaren independent.
              </h2>
              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/70 md:mt-4 md:text-base md:leading-7">
                Choose a one-time amount, get a Supporter or Founder badge, and help fund better product data and future improvements.
              </p>
              <div className="mt-5 max-w-sm md:mt-8">
                <SupportCheckout className="p-3 md:p-4" activeClassName="bg-white text-ink hover:bg-leaf-50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5 md:gap-4 md:p-10">
              {[
                ["Unlimited scans", "No monthly scan limit when comparing products."],
                ["Full history", "Keep your product reports synced across devices."],
                ["Deeper insights", "Clearer ingredient and nutrition notes as Skaren improves."],
                ["Monthly stats", "See patterns in sugar, salt, protein, and product grades."]
              ].map(([title, text]) => (
                <article key={title} className="rounded-[1.25rem] border border-black/5 bg-leaf-50 p-4 md:rounded-[1.5rem] md:p-5">
                  <div className="mb-3 grid h-8 w-8 place-items-center rounded-full bg-white text-forest shadow-sm md:mb-4 md:h-10 md:w-10">
                    <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <h3 className="text-sm font-black leading-5 text-ink md:text-base">{title}</h3>
                  <p className="mt-2 hidden text-sm font-medium leading-6 text-soil-600 md:block">{text}</p>
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
