import Link from "next/link";
import { Clock3, Flame, ThermometerSun, TriangleAlert } from "lucide-react";
import { AppHeader } from "@/components/shell/app-header";
import { HeatStateBadge } from "@/components/report/heat-state-badge";
import { Button } from "@/components/ui/button";
import { getDashboardDataForPage } from "@/lib/server/page-data";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { LINE_COLORS } from "@/lib/domain/lines";
import { formatCarCode } from "@/lib/domain/reports";
import { notFound } from "next/navigation";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dictionary = await getDictionary(lang);
  const dashboard = await getDashboardDataForPage({ range: "today" });
  const recentReports = dashboard.recentReports.slice(0, 5);

  return (
    <main className="min-h-dvh">
      <AppHeader dictionary={dictionary} locale={lang} pathname="" />
      <section className="mx-auto flex min-h-[calc(100dvh-80px)] max-w-5xl flex-col px-4 py-7 sm:py-12">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-5">
          <p className="mx-auto max-w-md text-center text-pretty text-sm leading-5 text-muted sm:text-base sm:leading-6">{dictionary.home.mission}</p>

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

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild className="home-report-action min-h-0 justify-between rounded-md py-1.5 pl-3 pr-6 text-left" data-testid="home-report" variant="primary">
              <Link href={`/${lang}/reportar`}>
                <span>
                  <span className="block text-base">{dictionary.common.report}</span>
                  <span className="mt-px block text-xs font-normal opacity-90">{dictionary.home.reportDescription}</span>
                </span>
                <TriangleAlert aria-hidden="true" className="home-action-icon size-[1.875rem] shrink-0 text-white" />
              </Link>
            </Button>
            <Button asChild className="home-explore-action min-h-0 justify-between rounded-md py-1.5 pl-3 pr-6 text-left" data-testid="home-explore" variant="secondary">
              <Link href={`/${lang}/explorar`}>
                <span>
                  <span className="block text-base">{dictionary.common.explore}</span>
                  <span className="mt-px block text-xs font-normal text-muted">{dictionary.home.exploreDescription}</span>
                </span>
                <span aria-hidden="true" className="home-action-icon flex h-[1.875rem] w-9 shrink-0 items-end justify-center gap-1.5">
                  <span className="h-4 w-1.5 rounded-sm bg-heat-fresco" />
                  <span className="h-6 w-1.5 rounded-sm bg-success" />
                  <span className="h-5 w-1.5 rounded-sm bg-heat-infierno" />
                </span>
              </Link>
            </Button>
          </div>

          <section className="scroll-mt-24 rounded-md border border-border bg-surface-raised p-4" aria-labelledby="home-recent-title" id="home-recent-reports">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold" id="home-recent-title">
                {dictionary.explore.modules.recent}
              </h2>
              <Clock3 aria-hidden="true" className="size-4 text-muted" />
            </div>
            {recentReports.length > 0 ? (
              <div className="mt-3 flex flex-col divide-y divide-border">
                {recentReports.map((report) => (
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 py-3" key={report.id}>
                    <span
                      className="rounded-sm px-1.5 py-1 text-xs font-bold"
                      style={{
                        background: LINE_COLORS[report.line].fill,
                        color: LINE_COLORS[report.line].textOnFill,
                      }}
                    >
                      {report.line}
                    </span>
                    <p className="min-w-0 truncate font-mono text-sm font-semibold">{report.car ? formatCarCode(report.car) : dictionary.explore.noCar}</p>
                    <HeatStateBadge dictionary={dictionary} state={report.state} />
                    <time className="font-mono text-xs text-muted">{formatTime(report.createdAt, lang)}</time>
                  </div>
                ))}
              </div>
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

          <p className="text-center text-xs text-muted">{dictionary.common.disclaimer}</p>
        </div>
      </section>
    </main>
  );
}

function formatTime(date: Date, locale: string) {
  return date.toLocaleTimeString(locale === "en" ? "en-GB" : "es-ES", { hour: "2-digit", minute: "2-digit" });
}
