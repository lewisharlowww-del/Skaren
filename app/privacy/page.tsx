import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Skaren",
  description: "How Skaren collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      eyebrowNo="Personvern"
      title="Privacy Policy"
      titleNo="Personvernerklæring"
      updated="June 11, 2026"
      intro="Skaren is built on the principle that your data belongs to you. This policy explains exactly what we collect, why we collect it, and how you stay in control."
      introNo="Skaren er bygget på prinsippet om at dataene dine tilhører deg. Denne erklæringen forklarer nøyaktig hva vi samler inn, hvorfor vi samler det inn, og hvordan du beholder kontrollen."
      sections={[
        {
          title: "Who we are",
          body: [
            "Skaren is operated by Skaren AS, based in Oslo, Norway. We are the data controller for any personal data processed through the Skaren app and website.",
            "If you have any questions about this policy, contact us at hello@skaren.app.",
          ],
        },
        {
          title: "What we collect",
          body: [
            "When you create an account, we collect your email address and the date your account was created. We do not collect your name, phone number, or any payment details.",
            "When you scan products, we store the barcode, product name, brand, health grade, and scan date — so your history, stats, and badges work correctly.",
            "If you enable push notifications, we store a device token to deliver those notifications. You can turn this off at any time in Account settings.",
          ],
        },
        {
          title: "How we use your data",
          body: [
            "Your data is used solely to provide and improve the Skaren experience. This includes showing your scan history, calculating badges and streaks, and personalising your stats.",
            "We may use aggregated, anonymised analytics to understand how the app is used and which features to improve. This data cannot be traced back to you.",
            "We do not use your data for advertising, profiling, or any commercial purpose beyond running Skaren.",
          ],
        },
        {
          title: "Data storage and security",
          body: [
            "Your data is stored securely on Supabase infrastructure hosted in the European Union. All data is encrypted at rest and in transit.",
            "We apply strict access controls and do not share your personal data with any third party, except as required to operate the service.",
          ],
        },
        {
          title: "Third-party services",
          body: [
            "Product lookups use open databases to retrieve nutritional and environmental data. No personal information is included in these requests — only the barcode you scanned.",
            "Authentication is handled securely via Supabase. We do not store passwords directly.",
          ],
        },
        {
          title: "Your rights",
          body: [
            "Under GDPR, you have the right to access, correct, or delete your personal data at any time. You can delete your account and all associated data directly from Account settings in the app.",
            "You also have the right to object to processing, request data portability, or lodge a complaint with the Norwegian Data Protection Authority (Datatilsynet).",
            "To exercise any of these rights, contact us at hello@skaren.app.",
          ],
        },
        {
          title: "Age requirement",
          body: [
            "Skaren is intended for users aged 16 and older, in line with GDPR requirements. Users in jurisdictions where the minimum age is 13 may use the app from that age.",
            "We do not knowingly collect data from children below the applicable minimum age.",
          ],
        },
        {
          title: "Changes to this policy",
          body: [
            "We may update this policy as the app evolves. When we make significant changes, we will notify you through the app. The latest version is always available at skaren.app/privacy.",
          ],
        },
      ]}
      sectionsNo={[
        {
          title: "Hvem vi er",
          body: [
            "Skaren drives av Skaren AS, med base i Oslo, Norge. Vi er behandlingsansvarlig for personopplysninger som behandles gjennom Skaren-appen og nettstedet.",
            "Har du spørsmål om denne erklæringen, kan du kontakte oss på hello@skaren.app.",
          ],
        },
        {
          title: "Hva vi samler inn",
          body: [
            "Når du oppretter en konto, samler vi inn e-postadressen din og datoen kontoen ble opprettet. Vi samler ikke inn navn, telefonnummer eller betalingsinformasjon.",
            "Når du skanner produkter, lagrer vi strekkode, produktnavn, merkevare, helsekarakter og skannedato — slik at historikk, statistikk og merker fungerer.",
            "Hvis du aktiverer push-varsler, lagrer vi et enhetstok for å levere disse varslene. Du kan slå dette av når som helst under Kontoinnstillinger.",
          ],
        },
        {
          title: "Hvordan vi bruker dataene dine",
          body: [
            "Dataene dine brukes utelukkende til å levere og forbedre Skaren-opplevelsen. Dette inkluderer å vise skannehistorikk, beregne merker og rekker, og tilpasse statistikken din.",
            "Vi kan bruke aggregert, anonymisert analyse for å forstå hvordan appen brukes. Disse dataene kan ikke spores tilbake til deg.",
            "Vi bruker ikke dataene dine til reklame, profilering eller kommersielle formål utover å drive Skaren.",
          ],
        },
        {
          title: "Lagring og sikkerhet",
          body: [
            "Dataene dine lagres sikkert på Supabase-infrastruktur i EU. All data er kryptert i hvile og under overføring.",
            "Vi har strenge tilgangskontroller og deler ikke personopplysningene dine med tredjeparter, unntatt der det er nødvendig for å drive tjenesten.",
          ],
        },
        {
          title: "Tredjepartstjenester",
          body: [
            "Produktoppslag bruker åpne databaser for å hente ernærings- og miljødata. Ingen personlig informasjon er inkludert i disse forespørslene — kun strekkoden du skannet.",
            "Autentisering håndteres sikkert via Supabase. Vi lagrer ikke passord direkte.",
          ],
        },
        {
          title: "Dine rettigheter",
          body: [
            "I henhold til GDPR har du rett til å få tilgang til, rette eller slette personopplysningene dine når som helst. Du kan slette kontoen og alle tilknyttede data direkte fra Kontoinnstillinger i appen.",
            "Du har også rett til å protestere mot behandling, be om dataportabilitet, eller klage til Datatilsynet.",
            "For å utøve disse rettighetene, kontakt oss på hello@skaren.app.",
          ],
        },
        {
          title: "Alderskrav",
          body: [
            "Skaren er beregnet på brukere fra 16 år og eldre, i tråd med GDPR. I land der minimumsalderen er 13 år, kan appen brukes fra den alderen.",
            "Vi samler ikke bevisst inn data fra barn under gjeldende minimumsalder.",
          ],
        },
        {
          title: "Endringer i denne erklæringen",
          body: [
            "Vi kan oppdatere denne erklæringen etter hvert som appen utvikler seg. Ved vesentlige endringer vil vi varsle deg via appen. Den nyeste versjonen er alltid tilgjengelig på skaren.app/privacy.",
          ],
        },
      ]}
    />
  );
}
