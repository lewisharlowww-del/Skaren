import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Disclaimer | Skaren",
  description: "Important limits of Skaren's product grades, nutrition data, and environmental estimates.",
};

export default function DisclaimerPage() {
  return (
    <LegalPage
      eyebrow="Disclaimer"
      eyebrowNo="Ansvarsfraskrivelse"
      title="Nutrition & Data Disclaimer"
      titleNo="Ernærings- og dataansvarsfraskrivelse"
      updated="June 11, 2026"
      intro="Skaren is designed to make product information easier to understand — but it has limits. Please read this before relying on any grade, score, or data point in the app."
      introNo="Skaren er laget for å gjøre produktinformasjon lettere å forstå — men det har begrensninger. Les dette før du stoler på karakterer, poeng eller datapunkter i appen."
      sections={[
        {
          title: "Not a medical tool",
          body: [
            "Skaren is not a medical device, medical service, or health authority. Nothing in the app constitutes medical advice, diagnosis, or treatment.",
            "If you have a health condition, allergy, food intolerance, or specific dietary requirement, always consult a qualified healthcare professional and rely on the physical product label — not Skaren grades.",
          ],
        },
        {
          title: "Health grades are simplified estimates",
          body: [
            "Skaren's A–E health grades are calculated from available nutritional data using general thresholds for sugar, salt, fat, protein, fibre, and calories. They are intended to help you compare products at a glance.",
            "These grades are not validated by any health authority, and they do not account for your individual health status, dietary needs, medications, or medical history.",
          ],
        },
        {
          title: "Environmental grades are estimates",
          body: [
            "Environmental grades in Skaren are based on publicly available data including Eco-Score, packaging information, country of origin, and product category. They are estimates, not official certifications.",
            "Skaren is not affiliated with or endorsed by any environmental certification body.",
          ],
        },
        {
          title: "Additive and NOVA information",
          body: [
            "Additive flags and E-number explanations in Skaren are simplified summaries based on publicly available safety assessments. They are not personalised risk assessments.",
            "NOVA processing levels depend on available ingredient data and may be missing or incorrect for some products. A NOVA level alone does not determine whether a product is suitable for your diet.",
          ],
        },
        {
          title: "Data may be incomplete or incorrect",
          body: [
            "Product data in Skaren is sourced from third-party open databases. These sources rely partly on user-submitted data and may contain missing, outdated, or incorrect information.",
            "Skaren scores should be treated as helpful signals for comparison — not as definitive or precise measurements. Always check the physical packaging for allergen, ingredient, and nutritional information.",
          ],
        },
        {
          title: "Your responsibility",
          body: [
            "Final food, health, and shopping decisions are always yours. Skaren is a tool to help you make more informed choices — it does not make choices for you.",
            "Skaren AS accepts no liability for decisions made based on information provided by the app.",
          ],
        },
      ]}
      sectionsNo={[
        {
          title: "Ikke et medisinsk verktøy",
          body: [
            "Skaren er ikke en medisinsk enhet, medisinsk tjeneste eller helsemyndighet. Ingenting i appen utgjør medisinsk rådgivning, diagnose eller behandling.",
            "Har du en helsesykdom, allergi, matintoleranse eller spesielle kostholdsbeho, bør du alltid konsultere en kvalifisert helsefaglig person og stole på den fysiske produktetiketten — ikke Skarens karakterer.",
          ],
        },
        {
          title: "Helsekarakterer er forenklede estimater",
          body: [
            "Skarens A–E-helsekarakterer beregnes fra tilgjengelige ernæringsdata ved hjelp av generelle terskler for sukker, salt, fett, protein, fiber og kalorier. De er ment for å hjelpe deg å sammenligne produkter raskt.",
            "Disse karakterene er ikke validert av noen helsemyndighet og tar ikke hensyn til din individuelle helsestatus, kostholdsbeho, medisiner eller sykehistorie.",
          ],
        },
        {
          title: "Miljøkarakterer er estimater",
          body: [
            "Miljøkarakterer i Skaren er basert på offentlig tilgjengelige data, inkludert Eco-Score, emballasjeinfo, opprinnelsesland og produktkategori. De er estimater, ikke offisielle sertifiseringer.",
            "Skaren er ikke tilknyttet eller godkjent av noen miljøsertifiseringsorganisasjon.",
          ],
        },
        {
          title: "Tilsetningsstoffer og NOVA-informasjon",
          body: [
            "Tilsetningsstoffflagg og E-nummerforklaringer i Skaren er forenklede sammendrag basert på offentlig tilgjengelige sikkerhetsvurderinger. De er ikke personlige risikovurderinger.",
            "NOVA-prosesseringsnivåer avhenger av tilgjengelige ingrediensdata og kan mangle eller være feil for noen produkter. Et NOVA-nivå alene avgjør ikke om et produkt passer for kostholdet ditt.",
          ],
        },
        {
          title: "Data kan være ufullstendige eller feil",
          body: [
            "Produktdata i Skaren hentes fra åpne tredjepartsdatabaser. Disse kildene er delvis basert på brukerbidrag og kan inneholde manglende, utdaterte eller feilaktige opplysninger.",
            "Skarens poeng bør behandles som nyttige signaler for sammenligning — ikke som definitive eller presise målinger. Sjekk alltid den fysiske emballasjen for allergen-, ingrediens- og ernæringsinformasjon.",
          ],
        },
        {
          title: "Ditt ansvar",
          body: [
            "Endelige mat-, helse- og handlebeslutninger er alltid dine. Skaren er et verktøy for å hjelpe deg med å ta mer informerte valg — det tar ikke valg for deg.",
            "Skaren AS påtar seg ikke ansvar for beslutninger tatt basert på informasjon fra appen.",
          ],
        },
      ]}
    />
  );
}
