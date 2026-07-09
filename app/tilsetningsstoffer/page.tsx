import type { Metadata } from "next";
import { AdditivesIndex } from "@/components/AdditivesIndex";
import { getAllAdditives } from "@/lib/additivesSeo";
import { additivesIndexJsonLd } from "@/lib/additivesJsonLd";
import { COPY } from "@/lib/additivesI18n";

const URL = "https://skaren.app/tilsetningsstoffer";
const DETAIL_BASE = "/tilsetningsstoffer";

export const metadata: Metadata = {
  title: COPY.no.indexTitle,
  description: COPY.no.indexDescription,
  alternates: {
    canonical: URL,
    languages: {
      no: URL,
      en: "https://skaren.app/additives",
    },
  },
  openGraph: {
    title: COPY.no.indexTitle,
    description: COPY.no.indexDescription,
    url: URL,
    type: "website",
    locale: "nb_NO",
  },
};

export default function Page() {
  const jsonLd = additivesIndexJsonLd(getAllAdditives(), "no", URL, DETAIL_BASE);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AdditivesIndex lang="no" detailBase={DETAIL_BASE} />
    </>
  );
}
