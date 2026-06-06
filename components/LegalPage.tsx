import { AppHeader } from "@/components/AppHeader";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalPage({ eyebrow, title, updated, intro, sections }: LegalPageProps) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:pt-12">
        <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-glass backdrop-blur-xl sm:rounded-[2.5rem] sm:p-8">
          <p className="type-section-label text-forest">{eyebrow}</p>
          <h1 className="type-display-lg mt-3 text-ink">
            {title}
          </h1>
          <p className="type-body-lg mt-4 text-soil-700">{intro}</p>
          <div className="type-body-sm mt-5 flex flex-wrap gap-2 font-bold text-soil-600">
            <span className="rounded-full bg-leaf-50 px-3 py-2">App: Skaren</span>
            <span className="rounded-full bg-leaf-50 px-3 py-2">Country: Norway</span>
            <span className="rounded-full bg-leaf-50 px-3 py-2">Language: English</span>
            <span className="rounded-full bg-leaf-50 px-3 py-2">Updated: {updated}</span>
          </div>
        </section>

        <section className="mt-5 space-y-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="type-heading-2 text-ink">{section.title}</h2>
              <div className="type-body mt-3 space-y-3 text-soil-700">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="type-body-sm mt-5 rounded-[1.75rem] border border-forest/10 bg-leaf-50 p-5 font-bold text-forest">
          Questions or account deletion requests: email hello@skaren.app.
        </section>
      </main>
    </>
  );
}
