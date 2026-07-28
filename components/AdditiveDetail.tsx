import Link from "next/link";
import { ArrowLeft, Check, Leaf, ShieldAlert, ShieldCheck } from "lucide-react";
import { getSafetyColours } from "@/lib/enumbers";
import {
  additiveIntro,
  getRelatedAdditives,
  localizedCategory,
  localizedDescription,
  localizedNotes,
  localizedSafety,
  type AdditiveEntry,
} from "@/lib/additivesSeo";
import { COPY, type Lang } from "@/lib/additivesI18n";

const APP_STORE_URL = "https://apps.apple.com/no/app/skaren/id6779550646";

function safetyIcon(safety: AdditiveEntry["safety"]) {
  if (safety === "safe") return ShieldCheck;
  if (safety === "avoid") return ShieldAlert;
  return ShieldAlert;
}

export function AdditiveDetail({
  entry,
  lang,
  indexHref,
  detailBase,
}: {
  entry: AdditiveEntry;
  lang: Lang;
  indexHref: string;
  detailBase: string;
}) {
  const t = COPY[lang];
  const colours = getSafetyColours(entry.safety);
  const category = localizedCategory(entry, lang);
  const safety = localizedSafety(entry, lang);
  const description = localizedDescription(entry, lang);
  const notes = localizedNotes(entry, lang);
  const intro = additiveIntro(entry, lang);
  const related = getRelatedAdditives(entry);
  const SafetyIcon = safetyIcon(entry.safety);

  return (
    <div className="min-h-screen bg-[#f7f2ea]">
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-8">
        <Link
          href={indexHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToIndex}
        </Link>

        <header className="mt-6">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-ink px-3 py-1.5 font-mono text-lg font-bold text-white">
              {entry.code}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${colours.bg} ${colours.text} ${colours.border}`}
            >
              <SafetyIcon className="h-4 w-4" />
              {safety}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
            {entry.name}
          </h1>
          <p className="mt-2 text-soil-500">{category}</p>
        </header>

        <p className="mt-6 text-lg leading-relaxed text-soil-700">{intro}</p>

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-soil-400">
              {t.category}
            </dt>
            <dd className="mt-1 font-semibold text-ink">{category}</dd>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-soil-400">
              {t.safety}
            </dt>
            <dd className="mt-1 font-semibold text-ink">{safety}</dd>
          </div>
          {entry.vegan !== undefined && (
            <div className="rounded-2xl border border-black/5 bg-white p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-soil-400">
                {t.vegan}
              </dt>
              <dd className="mt-1 inline-flex items-center gap-1.5 font-semibold text-ink">
                <Leaf className="h-4 w-4 text-forest" />
                {entry.vegan ? t.veganYes : t.veganNo}
              </dd>
            </div>
          )}
        </dl>

        {notes && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="font-semibold">{notes}</p>
          </div>
        )}

        {/* FAQ-style content blocks — great for search snippets */}
        <section className="mt-10 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-ink">{t.whatIs(entry.code)}</h2>
            <p className="mt-2 leading-relaxed text-soil-700">
              {entry.code} ({entry.name}) — {description}.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">{t.isItSafe(entry.code, entry.name)}</h2>
            <p className="mt-2 leading-relaxed text-soil-700">{intro}</p>
          </div>
        </section>

        {/* App CTA */}
        <section className="mt-10 rounded-3xl bg-ink p-6 text-white">
          <h2 className="text-xl font-bold">{t.ctaTitle}</h2>
          <p className="mt-2 text-white/80">{t.ctaBody}</p>
          <a
            href={APP_STORE_URL}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-ink"
          >
            <Check className="h-4 w-4" />
            {t.ctaButton}
          </a>
        </section>

        {/* Internal links to related additives */}
        <section className="mt-10">
          <h2 className="text-lg font-bold text-ink">{t.relatedTitle}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.code}
                href={`${detailBase}/${r.slug}`}
                className="rounded-full border border-black/5 bg-white px-3 py-2 text-sm font-semibold text-forest transition hover:bg-leaf-50"
              >
                {r.code} · {r.name}
              </Link>
            ))}
          </div>
        </section>

        <p className="mt-10 text-xs text-soil-400">{t.disclaimer}</p>
      </div>
    </div>
  );
}
