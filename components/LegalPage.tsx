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
          <p className="text-sm font-black uppercase tracking-[0.18em] text-forest">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.05em] text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-base font-medium leading-7 text-soil-700">{intro}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold text-soil-600">
            <span className="rounded-full bg-leaf-50 px-3 py-2">App: Skaren</span>
            <span className="rounded-full bg-leaf-50 px-3 py-2">Country: Norway</span>
            <span className="rounded-full bg-leaf-50 px-3 py-2">Language: English</span>
            <span className="rounded-full bg-leaf-50 px-3 py-2">Updated: {updated}</span>
          </div>
        </section>

        <section className="mt-5 space-y-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-black text-ink">{section.title}</h2>
              <div className="mt-3 space-y-3 text-[0.98rem] font-medium leading-7 text-soil-700">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-5 rounded-[1.75rem] border border-forest/10 bg-leaf-50 p-5 text-sm font-bold leading-6 text-forest">
          Questions or account deletion requests: email hello@skaren.app.
        </section>
      </main>
    </>
  );
}
