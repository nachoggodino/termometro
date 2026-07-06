import { AppHeader } from "@/components/shell/app-header";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

export default async function MethodologyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dictionary = await getDictionary(lang);

  const sections = [
    [dictionary.methodology.scoreTitle, dictionary.methodology.scoreBody],
    [dictionary.methodology.confidenceTitle, dictionary.methodology.confidenceBody],
    [dictionary.methodology.fleetTitle, dictionary.methodology.fleetBody],
    [dictionary.methodology.abuseTitle, dictionary.methodology.abuseBody],
  ] as const;

  return (
    <main className="min-h-dvh">
      <AppHeader dictionary={dictionary} locale={lang} pathname="/metodologia" />
      <article className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-[680] tracking-[-0.025em]">{dictionary.methodology.title}</h1>
        <p className="mt-3 text-muted">{dictionary.methodology.intro}</p>
        <div className="mt-8 flex flex-col gap-4">
          {sections.map(([title, body]) => (
            <section className="rounded-md border border-border bg-surface-raised p-4" key={title}>
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 text-xs text-muted">{dictionary.common.disclaimer}</p>
      </article>
    </main>
  );
}
