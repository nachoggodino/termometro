import { AppHeader } from "@/components/shell/app-header";
import { DashboardCharts } from "@/components/charts/dashboard-charts";
import { FilterBar } from "@/components/charts/filter-bar";
import { InfoTooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { getDashboardDataForPage } from "@/lib/server/page-data";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { isTimeRange } from "@/lib/domain/ranges";
import { isMetroLine } from "@/lib/domain/lines";
import { LINE_COLORS } from "@/lib/domain/lines";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ linea?: string; rango?: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const search = await searchParams;
  const dictionary = await getDictionary(lang);
  const selectedRange = isTimeRange(search.rango) ? search.rango : "today";
  const selectedLine = isMetroLine(search.linea) ? search.linea : null;
  const data = await getDashboardDataForPage({ range: selectedRange, line: selectedLine });
  const rangeLabel = dictionary.explore.ranges[selectedRange];

  return (
    <main className="min-h-dvh">
      <AppHeader dictionary={dictionary} locale={lang} pathname="/explorar" title={dictionary.explore.title} />
      <div className="mx-auto max-w-5xl px-4 pb-10">
        <FilterBar dictionary={dictionary} locale={lang} selectedLine={selectedLine} selectedRange={selectedRange} />

        <section className="py-6">
          <h1 className="text-2xl font-[650] tracking-[-0.015em]">{dictionary.explore.title}</h1>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-2xl text-sm leading-5 text-muted">{dictionary.explore.subtitle}</p>
            <Button asChild className="w-fit px-3 py-2 text-sm" variant="secondary">
              <Link href={`/${lang}/metodologia`}>{dictionary.explore.methodologyLink}</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-3 pb-4 sm:grid-cols-3">
          {data.lineSummaries.slice(0, 3).map((summary) => (
            <div className="rounded-md border border-border bg-surface-raised p-4" key={summary.line}>
              <div className="flex items-center justify-between">
                <span
                  className="rounded-sm px-2 py-1 text-sm font-bold"
                  style={{
                    background: LINE_COLORS[summary.line].fill,
                    color: LINE_COLORS[summary.line].textOnFill,
                  }}
                >
                  {summary.line}
                </span>
                <span className="font-mono text-2xl font-semibold">{summary.score}</span>
              </div>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                {dictionary.common.confidence} {dictionary.common[summary.confidence]}
                <InfoTooltip label={dictionary.common.confidence}>{dictionary.explore.confidenceHelp}</InfoTooltip>
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-muted">{dictionary.common.reports}</dt>
                  <dd className="font-mono font-semibold">{summary.reports}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-muted">
                    {dictionary.common.disagreement}
                    <InfoTooltip label={dictionary.common.disagreement}>{dictionary.explore.disagreementHelp}</InfoTooltip>
                  </dt>
                  <dd className="font-mono font-semibold">{summary.disagreement}%</dd>
                </div>
                <div>
                  <dt className="text-muted">{dictionary.explore.latestReport}</dt>
                  <dd className="font-mono font-semibold">{formatRelativeReport(summary.latestReportAt, lang, dictionary)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.82fr]">
          <DashboardCharts data={data} dictionary={dictionary} rangeLabel={rangeLabel} />
          <aside className="flex flex-col gap-4">
            <section className="rounded-md border border-border bg-surface-raised p-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{dictionary.explore.modules.fleet}</h2>
                <InfoTooltip label={dictionary.explore.modules.fleet}>{dictionary.explore.caveats.fleet}</InfoTooltip>
              </div>
              <p className="mt-1 text-xs font-semibold text-muted">
                {dictionary.explore.moduleRange}: {rangeLabel}
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {data.lineSummaries.slice(0, 6).map((summary) => {
                  const coverage = Math.round((summary.carsReported / summary.estimatedCars) * 100);
                  return (
                    <div key={summary.line}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-semibold">{summary.line}</span>
                        <span className="text-muted">
                          {coverage}% {dictionary.explore.estimatedFleet}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, coverage)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-md border border-border bg-surface-raised p-4">
              <h2 className="text-base font-semibold">{dictionary.explore.modules.recent}</h2>
              <div className="mt-4 flex flex-col divide-y divide-border">
                {data.recentReports.slice(0, 12).map((report) => (
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3" key={report.id}>
                    <span
                      className="rounded-sm px-1.5 py-1 text-xs font-bold"
                      style={{
                        background: LINE_COLORS[report.line].fill,
                        color: LINE_COLORS[report.line].textOnFill,
                      }}
                    >
                      {report.line}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-semibold">{report.car ?? dictionary.explore.noCar}</p>
                      <p className="text-xs text-muted">{dictionary.states[report.state].label}</p>
                    </div>
                    <time className="font-mono text-xs text-muted">{formatTime(report.createdAt, lang)}</time>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function formatTime(date: Date, locale: string) {
  return date.toLocaleTimeString(locale === "en" ? "en-GB" : "es-ES", { hour: "2-digit", minute: "2-digit" });
}

function formatRelativeReport(date: Date | null, locale: string, dictionary: Awaited<ReturnType<typeof getDictionary>>) {
  if (!date) return dictionary.explore.noRecentReport;
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return locale === "en" ? `${hours}h` : `${hours}h`;
}
