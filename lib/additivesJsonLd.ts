import { localizedCategory, localizedDescription, additiveIntro, type AdditiveEntry } from "@/lib/additivesSeo";
import type { Lang } from "@/lib/additivesI18n";

const SITE = "https://skaren.app";

/**
 * JSON-LD structured data for a single additive page. Uses schema.org
 * ChemicalSubstance + FAQPage so Google can render rich results for queries
 * like "is E211 safe". Rendered as a <script type="application/ld+json">.
 */
export function additiveJsonLd(entry: AdditiveEntry, lang: Lang, url: string) {
  const description = localizedDescription(entry, lang);
  const intro = additiveIntro(entry, lang);
  const isSafeQ =
    lang === "no"
      ? `Er ${entry.code} (${entry.name}) trygt?`
      : `Is ${entry.code} (${entry.name}) safe?`;
  const whatQ = lang === "no" ? `Hva er ${entry.code}?` : `What is ${entry.code}?`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ChemicalSubstance",
        name: `${entry.code} (${entry.name})`,
        alternateName: entry.name,
        description,
        url,
        category: localizedCategory(entry, lang),
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: whatQ,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${entry.code} (${entry.name}) — ${description}.`,
            },
          },
          {
            "@type": "Question",
            name: isSafeQ,
            acceptedAnswer: { "@type": "Answer", text: intro },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: lang === "no" ? "E-numre" : "E-numbers",
            item: `${SITE}${lang === "no" ? "/tilsetningsstoffer" : "/additives"}`,
          },
          { "@type": "ListItem", position: 2, name: entry.code, item: url },
        ],
      },
    ],
  };
}

/** JSON-LD for the index page: a searchable ItemList of all additives. */
export function additivesIndexJsonLd(
  entries: AdditiveEntry[],
  lang: Lang,
  url: string,
  detailBase: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: lang === "no" ? "E-numre og tilsetningsstoffer" : "E-Numbers & Food Additives",
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: entries.length,
      itemListElement: entries.slice(0, 100).map((e, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${e.code} ${e.name}`,
        url: `${SITE}${detailBase}/${e.slug}`,
      })),
    },
  };
}
