import Link from "next/link";
import { Search } from "lucide-react";
import { getAllAdditives, localizedCategory, type AdditiveEntry } from "@/lib/additivesSeo";
import { getSafetyColours } from "@/lib/enumbers";
import { COPY, type Lang } from "@/lib/additivesI18n";

export function AdditivesIndex({
  lang,
  detailBase,
}: {
  lang: Lang;
  detailBase: string;
}) {
  const t = COPY[lang];
  const all = getAllAdditives();

  // Group by localized category for scannable, internally-linked sections.
  const groups = new Map<string, AdditiveEntry[]>();
  for (const entry of all) {
    const cat = localizedCategory(entry, lang);
    const list = groups.get(cat) ?? [];
    list.push(entry);
    groups.set(cat, list);
  }
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="min-h-screen bg-[#f7f2ea]">
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <header>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t.indexH1}</h1>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-soil-600">{t.indexLede}</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-soil-500 shadow-sm">
            <Search className="h-4 w-4" />
            {all.length}+ {lang === "no" ? "tilsetningsstoffer" : "additives"}
          </div>
        </header>

        <div className="mt-10 space-y-10">
          {sortedGroups.map(([category, entries]) => (
            <section key={category}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-soil-400">
                {category}
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {entries.map((entry) => {
                  const colours = getSafetyColours(entry.safety);
                  return (
                    <li key={entry.code}>
                      <Link
                        href={`${detailBase}/${entry.slug}`}
                        className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 transition hover:border-forest/30"
                      >
                        <span className="rounded-lg bg-ink px-2 py-1 font-mono text-xs font-bold text-white">
                          {entry.code}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-semibold text-ink">
                          {entry.name}
                        </span>
                        <span className={`h-2.5 w-2.5 flex-none rounded-full ${colours.bg} ${colours.border} border`} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-12 text-xs text-soil-400">{t.disclaimer}</p>
      </div>
    </div>
  );
}
