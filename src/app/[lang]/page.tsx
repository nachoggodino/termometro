import Link from "next/link";
import { Suspense } from "react";
import { Clock3, Flame, ThermometerSun } from "lucide-react";
import { RecentReportRow } from "@/components/report/recent-report-row";
import { ExploreActionIcon, ReportActionIcon } from "@/components/ui/action-icons";
import { Button } from "@/components/ui/button";
import { getDashboardDataForPage } from "@/lib/server/page-data";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { LINE_COLORS, type MetroLine } from "@/lib/domain/lines";
import type { Report } from "@/lib/domain/reports";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dictionary = await getDictionary(lang);

  return (
    <main>
      <section className="mx-auto flex max-w-5xl flex-col px-4 pb-5 pt-7 sm:pt-12">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
          <TrainSilhouette />
          <p className="mx-auto max-w-md text-center text-pretty text-sm leading-5 text-muted sm:text-base sm:leading-6">{dictionary.home.mission}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild className="home-report-action min-h-0 justify-between rounded-md py-1.5 pl-3 pr-6 text-left" data-testid="home-report" variant="primary">
              <Link href={`/${lang}/reportar`}>
                <span>
                  <span className="block text-base">{dictionary.common.report}</span>
                  <span className="mt-px block text-xs font-normal opacity-90">{dictionary.home.reportDescription}</span>
                </span>
                <ReportActionIcon className="home-action-icon size-[1.875rem] text-white" />
              </Link>
            </Button>
            <Button asChild className="home-explore-action min-h-0 justify-between rounded-md py-1.5 pl-3 pr-6 text-left" data-testid="home-explore" variant="secondary">
              <Link href={`/${lang}/explorar`}>
                <span>
                  <span className="block text-base">{dictionary.common.explore}</span>
                  <span className="mt-px block text-xs font-normal text-muted">{dictionary.home.exploreDescription}</span>
                </span>
                <ExploreActionIcon className="home-action-icon h-[1.875rem] w-9" />
              </Link>
            </Button>
          </div>

          <Suspense fallback={<HomeReportsSkeleton dictionary={dictionary} />}>
            <HomeReports dictionary={dictionary} locale={lang} />
          </Suspense>

          <p className="text-center text-xs text-muted">{dictionary.common.disclaimer}</p>
        </div>
      </section>
    </main>
  );
}

async function HomeReports({ dictionary, locale }: { dictionary: Awaited<ReturnType<typeof getDictionary>>; locale: "es" | "en" }) {
  const dashboard = await getDashboardDataForPage({ range: "today" });
  const recentReports = dashboard.recentReports;
  const topRecentLines = getTopRecentLines(recentReports);

  return (
    <>
      <a
        className="flex min-h-16 items-center gap-3 rounded-md border border-border bg-surface-raised p-3 transition duration-200 ease-out hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        href="#home-recent-reports"
      >
        <span className="font-mono text-5xl font-semibold leading-none tracking-[-0.035em] tabular-nums">{dashboard.reportsLastDay}</span>
        <span className="min-w-0 flex-1 whitespace-nowrap text-base font-semibold text-muted">{dictionary.home.reportsInWindow}</span>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-heat-infierno-soft text-heat-infierno">
          <ThermometerSun aria-hidden="true" className="size-6" />
        </span>
      </a>

      <section className="scroll-mt-24 rounded-md border border-border bg-surface-raised p-4" aria-labelledby="home-recent-title" id="home-recent-reports">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold" id="home-recent-title">
            {dictionary.explore.modules.recent}
          </h2>
          <Clock3 aria-hidden="true" className="size-4 text-muted" />
        </div>
        {recentReports.length > 0 ? (
          <>
            <div className="mt-3 flex items-center gap-x-3 overflow-hidden whitespace-nowrap">
              {topRecentLines.map(({ line, reports }) => (
                <span
                    className="inline-flex items-center font-mono text-xs font-semibold tabular-nums"
                  key={line}
                  style={{
                    color: LINE_COLORS[line].fill,
                  }}
                  >
                    {line}
                    <span className="mx-0.5 text-muted">·</span>
                    {reports}
                  </span>
              ))}
            </div>
            <div className="mt-3 flex max-h-[28rem] flex-col divide-y divide-border overflow-y-auto pr-1">
              {recentReports.map((report) => (
                <RecentReportRow dictionary={dictionary} key={report.id} locale={locale} report={report} />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-4 flex items-start gap-3 rounded-md bg-surface p-3">
            <Flame aria-hidden="true" className="mt-0.5 size-5 text-heat-calor" />
            <div>
              <p className="font-semibold">{dictionary.home.noReports}</p>
              <p className="mt-1 text-sm text-muted">{dictionary.home.noReportsCopy}</p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function HomeReportsSkeleton({ dictionary }: { dictionary: Awaited<ReturnType<typeof getDictionary>> }) {
  return (
    <>
      <div className="flex min-h-16 items-center gap-3 rounded-md border border-border bg-surface-raised p-3">
        <div className="h-12 w-16 animate-pulse rounded-sm bg-surface" />
        <div className="h-5 flex-1 animate-pulse rounded-sm bg-surface" />
        <div className="size-11 animate-pulse rounded-md bg-surface" />
      </div>
      <section className="scroll-mt-24 rounded-md border border-border bg-surface-raised p-4" aria-labelledby="home-recent-title" id="home-recent-reports">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold" id="home-recent-title">
            {dictionary.explore.modules.recent}
          </h2>
          <Clock3 aria-hidden="true" className="size-4 text-muted" />
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="h-12 animate-pulse rounded-sm bg-surface" key={index} />
          ))}
        </div>
      </section>
    </>
  );
}

function TrainSilhouette() {
  return <span aria-hidden="true" className="home-train-silhouette mx-auto mb-1 h-16 w-48 text-muted opacity-35" />;
}

function getTopRecentLines(reports: Report[]) {
  const counts = new Map<MetroLine, number>();
  for (const report of reports) {
    counts.set(report.line, (counts.get(report.line) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([line, count]) => ({ line, reports: count }))
    .toSorted((a, b) => b.reports - a.reports || a.line.localeCompare(b.line));
}
