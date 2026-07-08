import { ReportForm } from "@/components/report/report-form";
import { ReportActionIcon } from "@/components/ui/action-icons";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

export default async function ReportPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dictionary = await getDictionary(lang);

  return (
    <main>
      <section className="mx-auto max-w-xl px-4 pb-5 pt-6">
        <div className="mb-4 flex items-center justify-center gap-2">
          <ReportActionIcon className="size-6 text-heat-infierno" />
          <h1 className="text-center text-2xl font-[650] tracking-[-0.015em]">{dictionary.reportForm.title}</h1>
        </div>
        <div className="rounded-lg border border-border bg-surface-raised p-4">
          <ReportForm dictionary={dictionary} locale={lang} />
        </div>
      </section>
    </main>
  );
}
