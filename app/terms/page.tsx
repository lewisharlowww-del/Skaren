import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use | Skaren",
  description: "The terms that govern your use of the Skaren app and service.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      eyebrowNo="Vilkår"
      title="Terms of Use"
      titleNo="Brukervilkår"
      updated="June 11, 2026"
      intro="By using Skaren, you agree to these terms. They are written to be clear and fair — please read them before using the app."
      introNo="Ved å bruke Skaren godtar du disse vilkårene. De er skrevet for å være tydelige og rettferdige — les dem gjerne før du bruker appen."
      sections={[
        {
          title: "About Skaren",
          body: [
            "Skaren is a food scanning app operated by Skaren AS, Oslo, Norway. It helps you understand what is in the products you buy by providing nutritional data, additive information, NOVA processing levels, and environmental grades.",
            "Skaren is an informational tool, not a medical, dietary, or environmental authority.",
          ],
        },
        {
          title: "Using the app",
          body: [
            "You may use Skaren for personal, non-commercial purposes only. You may not scrape, copy, redistribute, or reverse-engineer any part of the app, its data, or its APIs.",
            "You are responsible for keeping your account credentials secure. Do not share your account with others.",
          ],
        },
        {
          title: "Accuracy of information",
          body: [
            "Product data in Skaren comes from third-party open databases and may be incomplete, outdated, or inaccurate. Always verify information against the physical product label before making any health, allergy, or dietary decision.",
            "Skaren grades are simplified indicators designed to help you compare products quickly — they are not clinical assessments and should not be treated as such.",
          ],
        },
        {
          title: "Premium subscription",
          body: [
            "Skaren Premium is available for 49 kr/month and includes a 7-day free trial for new subscribers. Your subscription begins at the end of the trial period unless cancelled beforehand.",
            "Subscriptions renew automatically each month. You can cancel at any time through your App Store subscription settings. Cancellation takes effect at the end of the current billing period — you retain access until then.",
            "Skaren does not handle payment directly. All billing is managed by Apple through the App Store.",
          ],
        },
        {
          title: "Limitation of liability",
          body: [
            "Skaren is provided \"as is\" without warranties of any kind. We do not guarantee uninterrupted access, completeness of data, or fitness for any particular purpose.",
            "Skaren AS is not liable for any loss or damage arising from your use of or reliance on the app, including decisions made based on product grades or nutritional information.",
          ],
        },
        {
          title: "Account termination",
          body: [
            "You can delete your account at any time from Account settings in the app. We may suspend or terminate accounts that violate these terms.",
          ],
        },
        {
          title: "Governing law",
          body: [
            "These terms are governed by Norwegian law. Any disputes shall be resolved by the courts of Oslo, Norway.",
          ],
        },
        {
          title: "Changes to these terms",
          body: [
            "We may update these terms as Skaren evolves. Continued use of the app after changes are published constitutes acceptance of the updated terms. The latest version is always available at skaren.app/terms.",
          ],
        },
      ]}
      sectionsNo={[
        {
          title: "Om Skaren",
          body: [
            "Skaren er en matvare-skannerapp drevet av Skaren AS i Oslo, Norge. Den hjelper deg å forstå hva produktene du kjøper inneholder, ved å gi ernæringsdata, informasjon om tilsetningsstoffer, NOVA-prosesseringsnivå og miljøkarakterer.",
            "Skaren er et informasjonsverktøy — ikke en medisinsk, ernæringsmessig eller miljøfaglig myndighet.",
          ],
        },
        {
          title: "Bruk av appen",
          body: [
            "Du kan bruke Skaren til personlige, ikke-kommersielle formål. Du kan ikke skrape, kopiere, redistribuere eller reversenginere noen del av appen, dens data eller APIer.",
            "Du er ansvarlig for å holde kontoopplysningene dine sikre. Del ikke kontoen din med andre.",
          ],
        },
        {
          title: "Nøyaktighet av informasjon",
          body: [
            "Produktdata i Skaren kommer fra åpne tredjepartsdatabaser og kan være ufullstendige, utdaterte eller unøyaktige. Kontroller alltid informasjonen mot den fysiske produktetiketten før du tar helse-, allergi- eller kostholdsavgjørelser.",
            "Skarens karakterer er forenklede indikatorer for å hjelpe deg å sammenligne produkter raskt — de er ikke kliniske vurderinger.",
          ],
        },
        {
          title: "Premium-abonnement",
          body: [
            "Skaren Premium koster 49 kr/måned og inkluderer 7 dagers gratis prøveperiode for nye abonnenter. Abonnementet starter ved utløpet av prøveperioden med mindre det kanselleres på forhånd.",
            "Abonnementer fornyes automatisk hver måned. Du kan kansellere når som helst via App Store-abonnementsinnstillingene. Kanselleringen trer i kraft ved slutten av gjeldende betalingsperiode — du beholder tilgangen frem til da.",
            "Skaren håndterer ikke betaling direkte. All fakturering administreres av Apple via App Store.",
          ],
        },
        {
          title: "Ansvarsbegrensning",
          body: [
            "Skaren leveres «som den er» uten garantier av noe slag. Vi garanterer ikke uavbrutt tilgang, fullstendighet av data eller egnethet for et bestemt formål.",
            "Skaren AS er ikke ansvarlig for tap eller skade som oppstår som følge av din bruk av eller avhengighet av appen, inkludert avgjørelser tatt basert på produktkarakterer eller ernæringsinformasjon.",
          ],
        },
        {
          title: "Sletting av konto",
          body: [
            "Du kan slette kontoen din når som helst fra Kontoinnstillinger i appen. Vi kan suspendere eller avslutte kontoer som bryter disse vilkårene.",
          ],
        },
        {
          title: "Gjeldende lov",
          body: [
            "Disse vilkårene er underlagt norsk lov. Eventuelle tvister skal løses av domstolene i Oslo, Norge.",
          ],
        },
        {
          title: "Endringer i vilkårene",
          body: [
            "Vi kan oppdatere disse vilkårene etter hvert som Skaren utvikler seg. Fortsatt bruk av appen etter at endringer er publisert, innebærer aksept av de oppdaterte vilkårene. Den nyeste versjonen er alltid tilgjengelig på skaren.app/terms.",
          ],
        },
      ]}
    />
  );
}
