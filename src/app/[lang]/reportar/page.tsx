import { ReportForm } from "@/components/report/report-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

export default async function ReportPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dictionary = await getDictionary(lang);

  return (
    <main className="min-h-dvh">
      <section className="mx-auto max-w-xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-[650] tracking-[-0.015em]">{dictionary.reportForm.title}</h1>
          <p className="mt-2 text-sm leading-5 text-muted">{dictionary.reportForm.subtitle}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-raised p-4">
          <ReportForm dictionary={dictionary} locale={lang} />
        </div>
      </section>
    </main>
  );
}
