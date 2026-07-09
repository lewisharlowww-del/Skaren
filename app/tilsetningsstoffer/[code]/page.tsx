import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdditiveDetail } from "@/components/AdditiveDetail";
import {
  additiveMetaDescription,
  getAdditiveBySlug,
  getAllAdditives,
} from "@/lib/additivesSeo";
import { additiveJsonLd } from "@/lib/additivesJsonLd";

const DETAIL_BASE = "/tilsetningsstoffer";
const INDEX_HREF = "/tilsetningsstoffer";
const SITE = "https://skaren.app";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllAdditives().map((e) => ({ code: e.slug }));
}

export function generateMetadata({ params }: { params: { code: string } }): Metadata {
  const entry = getAdditiveBySlug(params.code);
  if (!entry) return {};
  const url = `${SITE}${DETAIL_BASE}/${entry.slug}`;
  const title = `${entry.code} (${entry.name}) — Tilsetningsstoff`;
  const description = additiveMetaDescription(entry, "no");
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        no: url,
        en: `${SITE}/additives/${entry.slug}`,
      },
    },
    openGraph: { title, description, url, type: "article", locale: "nb_NO" },
  };
}

export default function Page({ params }: { params: { code: string } }) {
  const entry = getAdditiveBySlug(params.code);
  if (!entry) notFound();
  const url = `${SITE}${DETAIL_BASE}/${entry.slug}`;
  const jsonLd = additiveJsonLd(entry, "no", url);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AdditiveDetail entry={entry} lang="no" indexHref={INDEX_HREF} detailBase={DETAIL_BASE} />
    </>
  );
}
