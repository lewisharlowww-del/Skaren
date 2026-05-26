import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Disclaimer | Skaren",
  description: "Important limits of Skaren grades, product data, nutrition information, and environmental estimates."
};

export default function DisclaimerPage() {
  return (
    <LegalPage
      eyebrow="Disclaimer"
      title="Important Disclaimer"
      updated="May 25, 2026"
      intro="Skaren is designed to make product information easier to understand, but it has clear limits."
      sections={[
        {
          title: "Not a medical service",
          body: [
            "Skaren is not a medical service and does not diagnose, treat, or prevent any health condition.",
            "If you have allergies, medical needs, pregnancy-related needs, or a specific diet, check official product packaging and speak with a qualified professional."
          ]
        },
        {
          title: "Not an official nutrition authority",
          body: [
            "Skaren is not an official nutrition authority and does not replace national food guidance.",
            "Health grades are simplified estimates based on available nutrition data, labels, product category signals, and practical thresholds for sugar, salt, fat, protein, fiber, and calories."
          ]
        },
        {
          title: "Not an environmental certification",
          body: [
            "Skaren is not an official environmental certification system.",
            "Environmental grades are estimates based on available product data such as Eco-Score, packaging, origin, and category information."
          ]
        },
        {
          title: "Additives and NOVA are guidance",
          body: [
            "Additives and E-number explanations are simplified guidance, not a personal safety assessment.",
            "NOVA processing level depends on available product data and may be missing or incorrect."
          ]
        },
        {
          title: "Data may be incomplete",
          body: [
            "Skaren uses third-party product databases, including Kassalapp and Open Food Facts. These sources may have missing, user-submitted, or outdated information.",
            "Scores should be treated as helpful signals, not perfect truth."
          ]
        },
        {
          title: "Use your own judgement",
          body: [
            "Skaren can help you compare products faster, but final shopping and health decisions are yours."
          ]
        }
      ]}
    />
  );
}
