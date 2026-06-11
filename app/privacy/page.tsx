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
      title="Privacy Policy"
      updated="June 11, 2026"
      intro="Skaren is built on the principle that your data belongs to you. This policy explains exactly what we collect, why we collect it, and how you stay in control."
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
            "We apply strict access controls and do not share your personal data with any third party, except as required to operate the service (e.g. authentication infrastructure).",
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
    />
  );
}
