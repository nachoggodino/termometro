import { DashboardCharts } from "@/components/charts/dashboard-charts";
import { FilterBar } from "@/components/charts/filter-bar";
import { RecentReportRow } from "@/components/report/recent-report-row";
import { InfoTooltip } from "@/components/ui/tooltip";
import { DASHBOARD_LIMITS } from "@/lib/domain/dashboard";
import { getDashboardDataForPage } from "@/lib/server/page-data";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { isTimeRange } from "@/lib/domain/ranges";
import { isMetroLine, type MetroLine } from "@/lib/domain/lines";
import { LINE_COLORS } from "@/lib/domain/lines";
import { notFound } from "next/navigation";
import { BarChart3 } from "lucide-react";

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
  const selectedRange = isTimeRange(search.rango) ? search.rango : "summer";
  const selectedLines = parseSelectedLines(search.linea);
  const data = await getDashboardDataForPage({ range: selectedRange, lines: selectedLines });
  const rangeLabel = dictionary.explore.ranges[selectedRange];
  const visibleSummaries = data.lineSummaries.filter((summary) => (selectedLines.length > 0 ? selectedLines.includes(summary.line) : summary.reports > 0));
  const fleetSummaries = visibleSummaries
    .map((summary) => ({
      ...summary,
      fleetWithoutAcPercentage: Math.round((summary.carsWithoutAcReported / summary.estimatedCars) * 100),
    }))
    .toSorted((a, b) => b.fleetWithoutAcPercentage - a.fleetWithoutAcPercentage || b.reports - a.reports);
  const reportSummaryCards = visibleSummaries.toSorted((a, b) => b.reports - a.reports || b.score - a.score);

  return (
    <main className="min-h-dvh bg-[image:radial-gradient(circle_at_50%_-10%,var(--page-glow),transparent_32rem)]">
      <div className="mx-auto max-w-5xl px-4 pb-5">
        <FilterBar dictionary={dictionary} locale={lang} selectedLines={selectedLines} selectedRange={selectedRange} />

        <section className="py-6">
          <div className="flex items-center justify-center gap-2">
            <BarChart3 aria-hidden="true" className="size-6 text-muted" />
            <h1 className="text-center text-2xl font-[650] tracking-[-0.015em]">{dictionary.explore.title}</h1>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.82fr]">
          <DashboardCharts data={data} dictionary={dictionary} rangeLabel={rangeLabel} selectedRange={selectedRange} selectedLines={selectedLines} />
          <aside className="flex flex-col gap-4">
            <section className="scroll-mt-32 rounded-md border border-border bg-surface-raised p-4" id="fleet">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{dictionary.explore.modules.fleet}</h2>
                <InfoTooltip label={dictionary.explore.modules.fleet}>{dictionary.explore.caveats.fleet}</InfoTooltip>
              </div>
              <p className="mt-1 text-xs font-semibold text-muted">
                {dictionary.explore.moduleRange}: {rangeLabel}
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {fleetSummaries.map((summary) => {
                  const coverage = summary.fleetWithoutAcPercentage;
                  return (
                    <div key={summary.line}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span
                          className="rounded-sm px-1.5 py-1 text-xs font-bold"
                          style={{
                            background: LINE_COLORS[summary.line].fill,
                            color: LINE_COLORS[summary.line].textOnFill,
                          }}
                        >
                          {summary.line}
                        </span>
                        <span className="text-muted">
                          {coverage}% {dictionary.explore.fleetWithoutAc} ({summary.carsWithoutAcReported}/{summary.estimatedCars})
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, coverage)}%`, background: LINE_COLORS[summary.line].fill }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="scroll-mt-32 rounded-md border border-border bg-surface-raised p-4" id="recent-reports">
              <h2 className="text-base font-semibold">{dictionary.explore.modules.recent}</h2>
              <div className="mt-4 flex flex-col divide-y divide-border">
                {data.recentReports.slice(0, DASHBOARD_LIMITS.recentReportCount).map((report) => (
                  <RecentReportRow dictionary={dictionary} key={report.id} locale={lang} report={report} />
                ))}
              </div>
            </section>
          </aside>
        </div>

        <section className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportSummaryCards.map((summary) => (
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
                <span className="font-mono text-2xl font-semibold">{summary.reports}</span>
              </div>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                {dictionary.common.confidence} {dictionary.common[summary.confidence]}
                <InfoTooltip label={dictionary.common.confidence}>{dictionary.explore.confidenceHelp}</InfoTooltip>
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-muted">{dictionary.explore.score}</dt>
                  <dd className="font-mono font-semibold">{summary.score}</dd>
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
      </div>
    </main>
  );
}

function parseSelectedLines(value: string | undefined) {
  if (!value) return [];
  const lines: MetroLine[] = [];
  for (const item of value.split(",")) {
    if (isMetroLine(item) && !lines.includes(item)) {
      lines.push(item);
    }
  }
  return lines;
}

function formatRelativeReport(date: Date | null, locale: string, dictionary: Awaited<ReturnType<typeof getDictionary>>) {
  if (!date) return dictionary.explore.noRecentReport;
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return locale === "en" ? `${hours}h` : `${hours}h`;
}
