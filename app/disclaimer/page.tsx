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
      title="Nutrition & Data Disclaimer"
      updated="June 11, 2026"
      intro="Skaren is designed to make product information easier to understand — but it has limits. Please read this before relying on any grade, score, or data point in the app."
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
    />
  );
}
