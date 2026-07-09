import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdditiveDetail } from "@/components/AdditiveDetail";
import {
  additiveMetaDescription,
  getAdditiveBySlug,
  getAllAdditives,
} from "@/lib/additivesSeo";
import { additiveJsonLd } from "@/lib/additivesJsonLd";

const DETAIL_BASE = "/additives";
const INDEX_HREF = "/additives";
const SITE = "https://skaren.app";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllAdditives().map((e) => ({ code: e.slug }));
}

export function generateMetadata({ params }: { params: { code: string } }): Metadata {
  const entry = getAdditiveBySlug(params.code);
  if (!entry) return {};
  const url = `${SITE}${DETAIL_BASE}/${entry.slug}`;
  const title = `${entry.code} (${entry.name}) — Food Additive`;
  const description = additiveMetaDescription(entry, "en");
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: url,
        no: `${SITE}/tilsetningsstoffer/${entry.slug}`,
      },
    },
    openGraph: { title, description, url, type: "article" },
  };
}

export default function Page({ params }: { params: { code: string } }) {
  const entry = getAdditiveBySlug(params.code);
  if (!entry) notFound();
  const url = `${SITE}${DETAIL_BASE}/${entry.slug}`;
  const jsonLd = additiveJsonLd(entry, "en", url);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AdditiveDetail entry={entry} lang="en" indexHref={INDEX_HREF} detailBase={DETAIL_BASE} />
    </>
  );
}
