import type { Metadata } from "next";
import { AdditivesIndex } from "@/components/AdditivesIndex";
import { getAllAdditives } from "@/lib/additivesSeo";
import { additivesIndexJsonLd } from "@/lib/additivesJsonLd";
import { COPY } from "@/lib/additivesI18n";

const URL = "https://skaren.app/additives";
const DETAIL_BASE = "/additives";

export const metadata: Metadata = {
  title: COPY.en.indexTitle,
  description: COPY.en.indexDescription,
  alternates: {
    canonical: URL,
    languages: {
      en: URL,
      no: "https://skaren.app/tilsetningsstoffer",
    },
  },
  openGraph: {
    title: COPY.en.indexTitle,
    description: COPY.en.indexDescription,
    url: URL,
    type: "website",
  },
};

export default function Page() {
  const jsonLd = additivesIndexJsonLd(getAllAdditives(), "en", URL, DETAIL_BASE);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AdditivesIndex lang="en" detailBase={DETAIL_BASE} />
    </>
  );
}
