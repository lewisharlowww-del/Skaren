import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Skaren",
  description: "How Skaren handles account data, scan history, product data, and third-party services."
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      updated="May 25, 2026"
      intro="This policy explains what Skaren collects, why it is collected, and how you can control your data."
      sections={[
        {
          title: "What we collect",
          body: [
            "If you create an account, Skaren may collect your email address, authentication details, and basic account settings.",
            "When you scan products, Skaren may store your barcode, product name, brand, grade, image reference, and scan date so your history and dashboard can work."
          ]
        },
        {
          title: "Product and scan data",
          body: [
            "Scan history is used to show your recent scans, product grades, progress, badges, and streaks.",
            "You can use product scanning without an account, but signed-in features may store scan history in your account."
          ]
        },
        {
          title: "Third-party services",
          body: [
            "Skaren uses Kassalapp for Norwegian product data, product images, store data, nutrition, allergens, and labels. It uses Open Food Facts for public product data such as Eco-Score, additives, NOVA processing level, categories, packaging, origins, and ingredients.",
            "Supabase powers authentication and database storage. Stripe powers supporter payments. If AI features are enabled, Skaren may send product fields such as name, category, ingredients, and grades to a configured AI provider to create plain-English insights."
          ]
        },
        {
          title: "Analytics",
          body: [
            "Skaren may use privacy-conscious analytics if enabled, to understand app performance and which screens need improvement.",
            "Analytics should be used to improve the app, not to sell personal data."
          ]
        },
        {
          title: "Your choices",
          body: [
            "You can request account deletion, scan history deletion, or supporter account help by contacting hello@skaren.app.",
            "Skaren does not sell your personal data."
          ]
        }
      ]}
    />
  );
}
