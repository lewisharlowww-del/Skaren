import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | Skaren",
  description: "Terms for using Skaren product scanning and product information features."
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of Service"
      updated="May 25, 2026"
      intro="These terms explain how Skaren should be used and what you can expect from the service."
      sections={[
        {
          title: "Informational use only",
          body: [
            "Skaren provides product information, A-E grades, additives explanations, NOVA processing information, daily intake comparisons, and simple product notes for general informational use.",
            "Skaren is not a substitute for professional health, nutrition, medical, legal, or environmental advice."
          ]
        },
        {
          title: "Accuracy and availability",
          body: [
            "Product data can be incomplete, outdated, or different from the product in your hand. Always check the product packaging before making a decision.",
            "Skaren may change, pause, or become unavailable at any time, including when third-party services are unavailable."
          ]
        },
        {
          title: "Your responsibility",
          body: [
            "You are responsible for your own food, allergy, health, and shopping decisions.",
            "Do not rely on Skaren as the only source for allergen, ingredient, additive, or dietary safety information. Always check the physical label."
          ]
        },
        {
          title: "Accounts",
          body: [
            "If you create an account, keep your login details secure and use the app lawfully.",
            "You can delete your account and all associated data directly from Account settings in the app."
          ]
        },
        {
          title: "Changes to these terms",
          body: [
            "Skaren may update these terms as the product evolves. The latest version will be available in the app."
          ]
        }
      ]}
    />
  );
}
