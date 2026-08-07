"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { Merk } from "@/components/Merk";
import { useLang } from "@/lib/language-context";
import { useUser } from "@/hooks/useUser";
import { useScans } from "@/hooks/useScans";
import { useStats } from "@/hooks/useStats";
import type { ActiveSubscription } from "@/lib/revenuecat";

/**
 * ProSubscriber — the Pro-active state of /pricing (canvas 21A).
 *
 * "A subscriber page is not a paywall." The person here has already paid, so
 * nothing sells: it opens with what they got (their own usage numbers), states
 * the trust line, lists what Pro unlocks, shows the live plan with a Switch,
 * and puts cancellation in plain sight. Merk is confident, not celebratory —
 * the same calm face as a good scan result, never confetti.
 *
 * Payment, plan-switching and cancellation all go through Apple/StoreKit, so
 * the actionable rows deep-link to the App Store rather than fake an in-app
 * flow.
 */

const APPLE_SUBSCRIPTIONS_URL = "https://apps.apple.com/account/subscriptions";
const APPLE_REDEEM_URL = "https://apps.apple.com/redeem";

type UnlockItem = { title: string; sub: string };

const UNLOCKS: Record<"en" | "no", UnlockItem[]> = {
  en: [
    { title: "Full E-number analysis", sub: "Every additive explained, worth-watching flags" },
    { title: "Merk's verdict and alternatives", sub: "Plain-language take, better swaps on request" },
    { title: "Processing level (NOVA)", sub: "Where each product sits on the four steps" },
    { title: "Of-your-day nutrition", sub: "Each nutrient as a share of a 2000 kcal day" },
    { title: "Unlimited history and stats", sub: "Free keeps 30 days; Pro keeps everything" },
    { title: "Search without scanning", sub: "Look up any product by name" },
  ],
  no: [
    { title: "Full E-nummer-analyse", sub: "Hvert tilsetningsstoff forklart, følg-med-flagg" },
    { title: "Merks dom og alternativer", sub: "Klar tale, bedre bytter på forespørsel" },
    { title: "Prosesseringsnivå (NOVA)", sub: "Hvor hvert produkt ligger på de fire trinnene" },
    { title: "Av-dagen-din næring", sub: "Hvert næringsstoff som andel av 2000 kcal" },
    { title: "Ubegrenset historikk og statistikk", sub: "Gratis beholder 30 dager; Pro beholder alt" },
    { title: "Søk uten å skanne", sub: "Slå opp et hvilket som helst produkt på navn" },
  ],
};

function formatRenewDate(iso: string | null, isNo: boolean): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(isNo ? "nb-NO" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ProSubscriber({ subscription }: { subscription: ActiveSubscription | null }) {
  const { lang } = useLang();
  const isNo = lang === "no";
  const { user } = useUser();
  const { scans } = useScans(user);
  const stats = useStats("all", lang);

  // The card's three numbers are the retention argument: their own usage, not a
  // sales pitch. All read from real data, falling back to 0 while it loads.
  const proScans = scans.length;
  const eNumbers = stats.additivesTotal ?? 0;
  const betterSwaps = stats.mostScanned?.length
    ? stats.additivesToAvoid ?? 0
    : 0;

  const plan = subscription?.plan ?? null;
  const renewDate = formatRenewDate(subscription?.renewsAtISO ?? null, isNo);
  const willRenew = subscription?.willRenew ?? true;

  const yearlyIsCurrent = plan === "yearly";
  const monthlyIsCurrent = plan === "monthly";
  // When we can't read the live plan (e.g. web preview), show yearly as current
  // by default — it matches the design and never misstates a charge because the
  // actual plan/price always lives in Apple's sheet, which we link to.
  const showYearlyCurrent = yearlyIsCurrent || plan === null;

  const planLine = (() => {
    if (!renewDate) return isNo ? "Aktiv" : "Active";
    const verb = willRenew ? (isNo ? "fornyes" : "renews") : (isNo ? "utløper" : "ends");
    return `${plan === "monthly" ? (isNo ? "Månedlig" : "Monthly") : isNo ? "Årlig" : "Yearly"} · ${verb} ${renewDate}`;
  })();

  const u = UNLOCKS[isNo ? "no" : "en"];

  return (
    <main
      className="relative mx-auto flex w-full max-w-[440px] flex-col"
      style={{
        background: "var(--sk-brand-mist)",
        minHeight: "100dvh",
        paddingTop: "calc(env(safe-area-inset-top) + 8px)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
        fontFamily: "var(--sk-font-ui)",
      }}
    >
      {/* Header */}
      <div className="flex items-center px-5 pb-2 pt-2">
        <Link
          href="/account"
          className="-ml-2 flex h-11 items-center gap-1.5 rounded-xl px-2 text-[15px] font-medium text-[var(--sk-text-secondary)]"
        >
          <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} />
          {isNo ? "Konto" : "Account"}
        </Link>
      </div>

      <div className="px-5">
        {/* ── Pro card (dark, folded corner, Merk confident) ─────────────── */}
        <div
          className="relative overflow-hidden rounded-[22px] px-5 pb-5 pt-5"
          style={{ background: "#201D15" }}
        >
          {/* folded corner */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: 34,
              height: 34,
              background: "#100E0A",
              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
            }}
          />

          <div className="flex items-center gap-3.5">
            <Merk expression="confident" size={54} limbs={false} still aria-label="Merk" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[19px] font-bold text-[#F7F4EC]">Skaren Pro</span>
                <span
                  className="rounded-md px-2 py-[3px] text-[10px] font-bold tracking-[0.12em]"
                  style={{
                    fontFamily: "var(--sk-font-data)",
                    background: "rgba(143,199,158,0.16)",
                    color: "#8FC79E",
                  }}
                >
                  {isNo ? "AKTIV" : "ACTIVE"}
                </span>
              </div>
              <div className="mt-1 text-[13.5px] font-medium text-[#C9C0AB]">{planLine}</div>
            </div>
          </div>

          {/* three usage stats */}
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {[
              { n: proScans, label: isNo ? "Pro-skanninger" : "Pro scans" },
              { n: eNumbers, label: isNo ? "E-numre forklart" : "E-numbers explained" },
              { n: betterSwaps, label: isNo ? "bedre bytter" : "better swaps" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl px-3 py-3"
                style={{ background: "rgba(247,244,236,0.05)" }}
              >
                <div
                  className="text-[22px] font-bold leading-none text-[#F7F4EC]"
                  style={{ fontFamily: "var(--sk-font-brand)", fontVariantNumeric: "tabular-nums" }}
                >
                  {s.n}
                </div>
                <div className="mt-1.5 text-[11.5px] font-medium leading-tight text-[#948B76]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* trust line, directly under the Pro card */}
        <p className="px-2 py-3.5 text-center text-[13px] font-medium leading-snug text-[var(--sk-text-muted)]">
          {isNo
            ? "Abonnementet ditt er grunnen til at ingenting her er sponset."
            : "Your subscription is why nothing here is sponsored."}
        </p>

        {/* ── What Pro unlocks ───────────────────────────────────────────── */}
        <SectionLabel>{isNo ? "Hva Pro låser opp" : "What Pro unlocks"}</SectionLabel>
        <div className="rounded-[20px] bg-[var(--sk-surface-white)] px-4">
          {u.map((item, i) => (
            <div
              key={item.title}
              className={`flex items-start gap-3 py-3.5 ${
                i < u.length - 1 ? "border-b border-[var(--sk-border-default)]" : ""
              }`}
            >
              <span
                className="mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-lg"
                style={{ background: "#E4EEE7" }}
              >
                <Check className="h-3.5 w-3.5 text-[#33684A]" strokeWidth={3} />
              </span>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold leading-tight text-[var(--sk-text-primary)]">
                  {item.title}
                </div>
                <div className="mt-0.5 text-[12.5px] font-medium leading-snug text-[var(--sk-text-muted)]">
                  {item.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Plan ───────────────────────────────────────────────────────── */}
        <SectionLabel>{isNo ? "Plan" : "Plan"}</SectionLabel>
        <div className="overflow-hidden rounded-[20px] bg-[var(--sk-surface-white)]">
          <PlanRow
            title={isNo ? "Årlig · 490 kr/år" : "Yearly · 490 kr/yr"}
            sub={isNo ? "Sparer 98 kr vs månedlig" : "Saves 98 kr vs monthly"}
            current={showYearlyCurrent}
            currentLabel={isNo ? "NÅVÆRENDE" : "CURRENT"}
            actionLabel={isNo ? "Bytt" : "Switch"}
            href={APPLE_SUBSCRIPTIONS_URL}
            border
          />
          <PlanRow
            title={isNo ? "Månedlig · 49 kr/mnd" : "Monthly · 49 kr/mo"}
            sub={isNo ? "Bytter ved neste fornyelse" : "Switches at next renewal"}
            current={monthlyIsCurrent}
            currentLabel={isNo ? "NÅVÆRENDE" : "CURRENT"}
            actionLabel={isNo ? "Bytt" : "Switch"}
            href={APPLE_SUBSCRIPTIONS_URL}
          />
        </div>

        {/* ── Manage ─────────────────────────────────────────────────────── */}
        <SectionLabel>{isNo ? "Administrer" : "Manage"}</SectionLabel>
        <div className="overflow-hidden rounded-[20px] bg-[var(--sk-surface-white)]">
          <ManageRow
            title={isNo ? "Administrer i App Store" : "Manage in App Store"}
            sub={isNo ? "Betaling, fornyelse og oppsigelse bor hos Apple" : "Payment, renewal and cancellation live with Apple"}
            href={APPLE_SUBSCRIPTIONS_URL}
            border
          />
          <ManageRow
            title={isNo ? "Gjenopprett kjøp" : "Restore purchases"}
            sub={isNo ? "Logget inn på en ny telefon" : "Signed in on a new phone"}
            href={APPLE_SUBSCRIPTIONS_URL}
            border
          />
          <ManageRow
            title={isNo ? "Løs inn en kode" : "Redeem a code"}
            sub={isNo ? "Gave eller kampanjekode" : "Gift or promo code"}
            href={APPLE_REDEEM_URL}
          />
        </div>

        {/* cancellation, stated plainly */}
        <p className="px-3 pb-1 pt-4 text-center text-[12.5px] font-medium leading-snug text-[var(--sk-text-muted)]">
          {isNo
            ? "Si opp når som helst — Pro er aktiv til perioden er over, og historikken din slettes aldri."
            : "Cancel any time — Pro stays active until the period ends, and your history is never deleted."}
        </p>
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-1 pb-2.5 pt-6 text-[10px] font-semibold uppercase tracking-[0.15em]"
      style={{ fontFamily: "var(--sk-font-data)", color: "#948B76" }}
    >
      {children}
    </div>
  );
}

function PlanRow({
  title,
  sub,
  current,
  currentLabel,
  actionLabel,
  href,
  border,
}: {
  title: string;
  sub: string;
  current: boolean;
  currentLabel: string;
  actionLabel: string;
  href: string;
  border?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3.5 ${
        border ? "border-b border-[var(--sk-border-default)]" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="text-[15px] font-semibold leading-tight text-[var(--sk-text-primary)]">{title}</div>
        <div className="mt-0.5 text-[12.5px] font-medium text-[var(--sk-text-muted)]">{sub}</div>
      </div>
      {current ? (
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.1em]"
          style={{ fontFamily: "var(--sk-font-data)", background: "#E4EEE7", color: "#33684A" }}
        >
          {currentLabel}
        </span>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 shrink-0 items-center px-1 text-[14px] font-semibold text-[#33684A]"
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}

function ManageRow({
  title,
  sub,
  href,
  border,
}: {
  title: string;
  sub: string;
  href: string;
  border?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-between gap-3 px-4 py-3.5 ${
        border ? "border-b border-[var(--sk-border-default)]" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="text-[15px] font-semibold leading-tight text-[var(--sk-text-primary)]">{title}</div>
        <div className="mt-0.5 text-[12.5px] font-medium text-[var(--sk-text-muted)]">{sub}</div>
      </div>
      <ChevronRight className="h-[18px] w-[18px] shrink-0 text-[var(--sk-text-muted)]" strokeWidth={2} />
    </a>
  );
}
