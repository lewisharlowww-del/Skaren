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
      title="Terms of Use"
      updated="June 11, 2026"
      intro="By using Skaren, you agree to these terms. They are written to be clear and fair — please read them before using the app."
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
    />
  );
}
