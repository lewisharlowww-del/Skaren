import type { Metadata } from "next";
import { AboutContent } from "./AboutContent";

export const metadata: Metadata = {
  title: "About Skaren | Norwegian Product Scanner",
  description:
    "Skaren helps Norwegian shoppers scan and search grocery products to understand nutrition, processing, allergens, additives, and environmental information.",
};

export default function AboutPage() {
  return <AboutContent />;
}
