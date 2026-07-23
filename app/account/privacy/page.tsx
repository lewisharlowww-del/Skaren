"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Database,
  ExternalLink,
  FileText,
  Info,
  Lock,
  Mail,
  Server,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useLang } from "@/lib/language-context";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  badge?: string;
  content: React.ReactNode;
}

// ── Accordion item ────────────────────────────────────────────────────────────

function AccordionItem({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--sk-grade-a-bg)" }}
        >
          {section.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold" style={{ color: "var(--sk-text-primary)" }}>
            {section.title}
          </p>
          {section.badge && (
            <span
              className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: "var(--sk-grade-a-bg)", color: "var(--sk-text-green)", border: "1px solid var(--sk-grade-a-border)" }}
            >
              {section.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform"
          style={{ color: "var(--sk-text-faint)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div
          className="px-5 pb-5 text-[13px] leading-relaxed space-y-3"
          style={{ borderTop: "0.5px solid var(--sk-border-muted)", color: "var(--sk-text-secondary)" }}
        >
          {section.content}
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <div className="mx-5 h-px" style={{ background: "var(--sk-border-muted)" }} />;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-4 overflow-hidden rounded-2xl"
      style={{ background: "var(--sk-surface-white)", border: "1px solid var(--sk-border-default)" }}
    >
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function UL({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 mt-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "var(--sk-text-green)" }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PrivacyPage() {
  const router = useRouter();
  const { lang } = useLang();
  const no = lang === "no";

  const LAST_UPDATED = no ? "Juni 2026" : "June 2026";

  const green = { color: "var(--sk-text-green)" } as const;
  const iconStyle = { color: "var(--sk-text-green)" } as const;

  const sections: Section[] = [
    {
      id: "collect",
      icon: <Database className="h-4 w-4" style={iconStyle} />,
      title: no ? "Data vi samler inn" : "Data we collect",
      content: (
        <>
          <P>{no ? "Vi samler kun inn det som er nødvendig for å levere Skarens funksjoner." : "We collect only what is necessary to provide Skaren\u2019s features."}</P>
          <UL items={no ? [
            "E-postadresse — brukes til å opprette og identifisere kontoen din.",
            "Skannehistorikk — strekkodene du skanner og tilhørende produktdata, lagret slik at du kan se historikken din.",
            "Streak og bruksstatistikk — utledet fra skannedatoene dine; deles aldri med tredjeparter.",
            "Token for push-varsler — kun hvis du eksplisitt aktiverer varsler; brukes utelukkende til å levere påminnelser.",
            "Enhetens språk og språkvalg — lagret lokalt på enheten din.",
          ] : [
            "Email address — used to create and identify your account.",
            "Scan history — barcodes you scan and the associated product data, stored so you can review your history.",
            "Streak & usage stats — derived from your scan dates; never sent to third parties.",
            "Push notification token — only if you explicitly enable notifications; used solely to deliver reminders.",
            "Device locale & language preference — stored locally on your device.",
          ]} />
          <P>{no ? "Vi samler ikke inn posisjonen din, kontakter, kamerarull eller andre enhetsdata utover det som er nevnt ovenfor." : "We do not collect your location, contacts, camera roll, or any other device data beyond what is listed above."}</P>
        </>
      ),
    },
    {
      id: "use",
      icon: <Info className="h-4 w-4" style={iconStyle} />,
      title: no ? "Hvordan vi bruker dataene dine" : "How we use your data",
      content: (
        <>
          <P>{no ? "Dataene dine brukes utelukkende til å drifte og forbedre Skaren:" : "Your data is used exclusively to operate and improve Skaren:"}</P>
          <UL items={no ? [
            "Autentisere deg og holde kontoen din sikker.",
            "Vise deg din personlige skannehistorikk og ernæringsstatistikk.",
            "Sende streak-påminnelser og ukentlige sammendrag (kun hvis du velger det).",
            "Aggregere anonyme bruksmønstre for å forbedre produktvurderinger (ingen personopplysninger involvert).",
          ] : [
            "Authenticating you and keeping your account secure.",
            "Showing you your personal scan history and nutrition stats.",
            "Sending streak reminders and weekly summaries (only if you opt in).",
            "Aggregating anonymous usage patterns to improve product ratings (no personal data involved).",
          ]} />
          <P>{no ? "Vi selger, leier ut eller deler ikke personopplysningene dine med annonsører eller markedsføringstjenester fra tredjeparter." : "We do not sell, rent, or share your personal data with advertisers or third-party marketing services."}</P>
        </>
      ),
    },
    {
      id: "third-party",
      icon: <Server className="h-4 w-4" style={iconStyle} />,
      title: no ? "Tredjepartstjenester" : "Third-party services",
      content: (
        <>
          <P>{no ? "Skaren bruker følgende underleverandører. Hver er bundet av en databehandleravtale:" : "Skaren uses the following sub-processors. Each is bound by a data processing agreement:"}</P>
          <UL items={no ? [
            "Supabase (EU-region) — autentisering, database og fillagring. Dataene dine er kryptert både under lagring og overføring.",
            "Open Food Facts — åpen produktdatabase. Vi spør kun med strekkode; ingen personopplysninger sendes noen gang.",
            "Vercel — hosting og edge-levering. Tilgangslogger oppbevares i 30 dager.",
          ] : [
            "Supabase (EU region) — authentication, database, and file storage. Your data is encrypted at rest and in transit.",
            "Open Food Facts — open-source product database. We query it by barcode only; no personal data is ever sent.",
            "Vercel — hosting and edge delivery. Access logs are retained for 30 days.",
          ]} />
          <P>{no ? "Ingen analyse-SDK-er (f.eks. Google Analytics, Meta Pixel, Mixpanel) er innebygd i appen." : "No analytics SDKs (e.g. Google Analytics, Meta Pixel, Mixpanel) are embedded in the app."}</P>
        </>
      ),
    },
    {
      id: "retention",
      icon: <Lock className="h-4 w-4" style={iconStyle} />,
      title: no ? "Datalagring og sikkerhet" : "Data retention & security",
      content: (
        <>
          <P>{no ? "Vi oppbevarer dataene dine så lenge kontoen din er aktiv. Når du sletter kontoen:" : "We keep your data for as long as your account is active. When you delete your account:"}</P>
          <UL items={no ? [
            "Skannehistorikken din slettes permanent innen 30 dager.",
            "Autentiseringsoppføringen din fjernes umiddelbart.",
            "Token for push-varsler avmeldes og forkastes innen 24 timer.",
            "Aggregert, anonymisert statistikk utledet fra skanningene dine kan oppbevares på ubestemt tid — denne kan ikke spores tilbake til deg.",
          ] : [
            "Your scan history is permanently deleted within 30 days.",
            "Your authentication record is removed immediately.",
            "Push notification tokens are unsubscribed and discarded within 24 hours.",
            "Aggregated, anonymised stats derived from your scans may be retained indefinitely — these cannot be traced back to you.",
          ]} />
          <P>{no ? "All data overføres over TLS 1.2+ og lagres med AES-256-kryptering." : "All data is transmitted over TLS 1.2+ and stored with AES-256 encryption at rest."}</P>
        </>
      ),
    },
    {
      id: "rights",
      icon: <ShieldCheck className="h-4 w-4" style={iconStyle} />,
      title: no ? "Dine rettigheter (GDPR / CCPA)" : "Your rights (GDPR / CCPA)",
      badge: "GDPR · CCPA",
      content: (
        <>
          <P>{no ? "Avhengig av hvor du bor, har du rett til å:" : "Depending on where you live, you have the right to:"}</P>
          <UL items={no ? [
            "Innsyn — be om en kopi av alle personopplysninger vi har om deg.",
            "Dataportabilitet — eksportere skannehistorikken din som CSV fra Data og personvern.",
            "Retting — korrigere unøyaktige data ved å oppdatere kontoen din.",
            "Sletting — slette kontoen din og alle tilhørende data når som helst.",
            "Innsigelse — reservere deg mot enhver ikke-nødvendig databehandling.",
            "Begrensning — be oss om å pause behandlingen mens en klage undersøkes.",
          ] : [
            "Access — request a copy of all personal data we hold about you.",
            "Portability — export your scan history as CSV from the Data & Privacy section.",
            "Rectification — correct inaccurate data by updating your account.",
            "Erasure — delete your account and all associated data at any time.",
            "Object — opt out of any non-essential data processing.",
            "Restriction — ask us to pause processing while a complaint is investigated.",
          ]} />
          <P>{no ? <>For å utøve en rettighet, send oss e-post på <span style={{ ...green, fontWeight: 600 }}>hello@skaren.app</span>. Vi svarer innen 30 dager.</> : <>To exercise any right, email us at <span style={{ ...green, fontWeight: 600 }}>hello@skaren.app</span>. We respond within 30 days.</>}</P>
        </>
      ),
    },
    {
      id: "ios",
      icon: <FileText className="h-4 w-4" style={iconStyle} />,
      title: no ? "iOS og App Store" : "iOS & App Store",
      badge: "iOS",
      content: (
        <>
          <P>{no ? "Skaren distribueres via Apple App Store og følger Apples retningslinjer for App Store-gjennomgang." : "Skaren is distributed via the Apple App Store and complies with Apple\u2019s App Store Review Guidelines."}</P>
          <UL items={no ? [
            "App Tracking Transparency (ATT) — Skaren bruker ikke IDFA eller noen sporingsidentifikator på tvers av apper. Ingen ATT-forespørsel vises.",
            "Kamera — brukes kun til å skanne strekkoder i sanntid. Ingen bilder lagres eller overføres.",
            "Push-varsler — bes kun om når du velger å aktivere påminnelser. Du kan trekke tilbake tillatelsen når som helst i iOS-innstillinger → Skaren.",
            "Kjøp i appen — behandles sikkert gjennom Apple. Apples personvernerklæring styrer betalingsdata.",
            "Krasjrapportering — vi bruker ingen tredjeparts krasj-SDK-er. iOS kan sende anonymiserte krasjrapporter til Apple i henhold til enhetsinnstillingene dine.",
          ] : [
            "App Tracking Transparency (ATT) — Skaren does not use the IDFA or any cross-app tracking identifier. No ATT prompt is shown.",
            "Camera — used only to scan barcodes in real time. No images are stored or transmitted.",
            "Push Notifications — only requested when you choose to enable reminders. You can revoke permission at any time in iOS Settings → Skaren.",
            "In-App Purchases — processed securely through Apple. Apple's privacy policy governs payment data.",
            "Crash reporting — we use no third-party crash SDKs. iOS may send anonymised crash reports to Apple as per your device settings.",
          ]} />
        </>
      ),
    },
    {
      id: "disclaimer",
      icon: <TriangleAlert className="h-4 w-4" style={iconStyle} />,
      title: no ? "Ernærings- og helseansvarsfraskrivelse" : "Nutrition & health disclaimer",
      content: (
        <>
          <P>{no ? "Skaren er et informasjonsverktøy. Innholdet det viser — inkludert Nutri-Score-karakterer, sikkerhetsvurderinger av tilsetningsstoffer, NOVA-poeng og estimater for daglig inntak — er:" : "Skaren is an informational tool. The content it displays — including Nutri-Score grades, additive safety ratings, NOVA scores, and daily intake estimates — is:"}</P>
          <UL items={no ? [
            "Basert på data fra Open Food Facts, en åpen fellesskapsdatabase. Nøyaktigheten avhenger av produktoppføringer sendt inn av brukere.",
            "Ikke gjennomgått av ernæringsfysiologer, leger eller noen helsemyndighet.",
            "Ikke en erstatning for profesjonell medisinsk, ernæringsmessig eller klinisk rådgivning.",
            "Ikke tilpasset dine individuelle helsetilstander, allergier eller medisiner.",
          ] : [
            "Based on data from Open Food Facts, an open community database. Accuracy depends on user-submitted product entries.",
            "Not reviewed by dietitians, physicians, or any health authority.",
            "Not a substitute for professional medical, dietary, or clinical advice.",
            "Not tailored to your individual health conditions, allergies, or medications.",
          ]} />
          <P>{no ? "Rådfør deg alltid med kvalifisert helsepersonell før du gjør vesentlige kostholdsendringer. Se bort fra profesjonelle råd basert på informasjon vist i denne appen." : "Always consult a qualified healthcare professional before making significant dietary changes. Do not disregard professional advice based on information shown in this app."}</P>
          <P>{no ? "Sikkerhetsvurderinger av tilsetningsstoffer (trygg / moderat / unngå) gjenspeiler generell vitenskapelig konsensus slik den tolkes av Skarens database. Individuell følsomhet varierer; vurderinger bør ikke behandles som absolutt medisinsk veiledning." : "Additive safety ratings (safe / moderate / avoid) reflect general scientific consensus as interpreted by Skaren\u2019s database. Individual sensitivity varies; ratings should not be treated as absolute medical guidance."}</P>
        </>
      ),
    },
    {
      id: "terms",
      icon: <FileText className="h-4 w-4" style={iconStyle} />,
      title: no ? "Brukervilkår" : "Terms of use",
      content: (
        <>
          <P>{no ? "Ved å bruke Skaren godtar du følgende:" : "By using Skaren you agree to the following:"}</P>
          <UL items={no ? [
            "Du er minst 16 år gammel (eller 13 i jurisdiksjoner som tillater det).",
            "Du vil ikke forsøke å reversere, skrape eller misbruke appen eller dens API-er.",
            "Du vil ikke bruke appen til å krenke andres rettigheter.",
            "Skaren leveres «som den er» uten garanti av noe slag.",
            "Skaren er ikke ansvarlig for skader som oppstår fra bruk av appen eller tillit til innholdet.",
            "Vi forbeholder oss retten til å suspendere kontoer som bryter disse vilkårene.",
          ] : [
            "You are at least 16 years old (or 13 in jurisdictions that permit it).",
            "You will not attempt to reverse-engineer, scrape, or abuse the app or its APIs.",
            "You will not use the app to infringe the rights of others.",
            'Skaren is provided "as is" without warranty of any kind.',
            "Skaren is not liable for any damages arising from use of the app or reliance on its content.",
            "We reserve the right to suspend accounts that violate these terms.",
          ]} />
          <P>{no ? "Disse vilkårene er underlagt norsk lov. Tvister skal løses av domstolene i Oslo, Norge." : "These terms are governed by Norwegian law. Disputes shall be resolved by the courts of Oslo, Norway."}</P>
          <P>{no ? "Vi kan oppdatere disse vilkårene når som helst. Fortsatt bruk av appen etter endringer utgjør aksept." : "We may update these terms at any time. Continued use of the app after changes constitutes acceptance."}</P>
        </>
      ),
    },
    {
      id: "cookies",
      icon: <Database className="h-4 w-4" style={iconStyle} />,
      title: no ? "Informasjonskapsler og lokal lagring" : "Cookies & local storage",
      content: (
        <>
          <P>{no ? "Skaren er en Progressive Web App (PWA) og bruker nettleserlagring kun til nødvendig funksjonalitet:" : "Skaren is a Progressive Web App (PWA) and uses browser storage only for essential functionality:"}</P>
          <UL items={no ? [
            "Autentiseringstoken — et sikkert sesjonstoken lagret i en informasjonskapsel for å holde deg innlogget.",
            "Temavalg — lyst eller mørkt modus, lagret i localStorage.",
            "Språkvalg — lagret i localStorage.",
            "Ingen annonse- eller sporingskapsler brukes.",
          ] : [
            "Authentication token — a secure session token stored in a cookie to keep you logged in.",
            "Theme preference — light or dark mode, stored in localStorage.",
            "Language preference — stored in localStorage.",
            "No advertising or tracking cookies are used.",
          ]} />
          <P>{no ? "Du kan slette alle lagrede data ved å logge ut og tømme nettleserdataene dine. Dette logger deg ut og tilbakestiller innstillingene dine." : "You can clear all stored data by signing out and clearing your browser data. This will log you out and reset your preferences."}</P>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--sk-brand-mist)", fontFamily: "Manrope, sans-serif" }}>
      <BottomNav />
      <main className="mx-auto min-h-screen w-full max-w-[430px] pb-32 pt-4">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pb-5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--sk-surface-white)", border: "1px solid var(--sk-border-default)" }}
          >
            <ArrowLeft size={18} style={{ color: "var(--sk-text-green)" }} />
          </button>
          <div>
            <h1
              className="text-[22px] font-black tracking-tight"
              style={{ fontFamily: "Satoshi, sans-serif", color: "var(--sk-text-green)" }}
            >
              {no ? "Personvern og juridisk" : "Privacy & Legal"}
            </h1>
            <p className="text-[12px]" style={{ color: "var(--sk-text-muted)" }}>
              {no ? "Sist oppdatert" : "Last updated"} {LAST_UPDATED}
            </p>
          </div>
        </div>

        {/* Disclaimer banner */}
        <div
          className="mx-4 mb-4 rounded-2xl px-4 py-3.5 flex items-start gap-3"
          style={{ background: "var(--sk-grade-a-bg)", border: "1px solid var(--sk-grade-a-border)" }}
        >
          <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--sk-text-green)" }} />
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--sk-text-green)" }}>
            {no ? "Skaren selger ikke dataene dine og viser ingen annonser. Vi samler kun inn det som trengs for å drifte appen." : "Skaren does not sell your data or show ads. We collect only what is needed to run the app."}
          </p>
        </div>

        {/* Main accordion */}
        <SectionCard>
          {sections.map((s, i) => (
            <div key={s.id}>
              <AccordionItem section={s} />
              {i < sections.length - 1 && <Divider />}
            </div>
          ))}
        </SectionCard>

        {/* Contact card */}
        <SectionCard>
          <div className="px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--sk-text-muted)" }}>
              {no ? "Kontakt" : "Contact"}
            </p>
            <a
              href="mailto:hello@skaren.app"
              className="flex items-center gap-3.5"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--sk-grade-a-bg)" }}
              >
                <Mail className="h-4 w-4" style={{ color: "var(--sk-text-green)" }} />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold" style={{ color: "var(--sk-text-primary)" }}>{no ? "Personvernhenvendelser" : "Privacy enquiries"}</p>
                <p className="text-[12px]" style={{ color: "var(--sk-text-green)" }}>hello@skaren.app</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0" style={{ color: "var(--sk-text-faint)" }} />
            </a>
            <div className="mx-0 my-3 h-px" style={{ background: "var(--sk-border-muted)" }} />
            <a
              href="mailto:hello@skaren.app"
              className="flex items-center gap-3.5"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--sk-grade-b-bg)" }}
              >
                <Mail className="h-4 w-4" style={{ color: "var(--sk-text-green)" }} />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold" style={{ color: "var(--sk-text-primary)" }}>{no ? "Generell support" : "General support"}</p>
                <p className="text-[12px]" style={{ color: "var(--sk-text-green)" }}>hello@skaren.app</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0" style={{ color: "var(--sk-text-faint)" }} />
            </a>
          </div>
        </SectionCard>

        {/* Delete data CTA */}
        <div
          className="mx-4 mb-4 rounded-2xl px-5 py-4 flex items-center gap-3.5"
          style={{ background: "var(--sk-grade-e-bg)", border: "1px solid var(--sk-grade-e-border)" }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(0,0,0,0.1)" }}
          >
            <Trash2 className="h-4 w-4" style={{ color: "var(--sk-text-red)" }} />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold" style={{ color: "var(--sk-text-red)" }}>{no ? "Slett kontoen din" : "Delete your account"}</p>
            <p className="text-[11px]" style={{ color: "var(--sk-text-muted)" }}>{no ? "Fjerner permanent alle dataene dine. Gå til Konto → Slett konto." : "Permanently removes all your data. Go to Account → Delete account."}</p>
          </div>
        </div>

        {/* Footer */}
        <p
          className="mx-4 mt-2 text-[11px] text-center leading-relaxed"
          style={{ color: "var(--sk-text-faint)" }}
        >
          {no ? "Skaren drives av Skaren AS, Oslo, Norge." : "Skaren is operated by Skaren AS, Oslo, Norway."}{"\n"}
          Org. nr. 000 000 000 MVA
        </p>
      </main>
    </div>
  );
}
