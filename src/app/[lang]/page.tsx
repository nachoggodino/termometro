import Link from "next/link";
import { BarChart3, Clock3, Flame, Send, ThermometerSun } from "lucide-react";
import { AppHeader } from "@/components/shell/app-header";
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
      <section className="mx-auto flex min-h-[calc(100dvh-112px)] max-w-5xl flex-col px-4 py-7 sm:py-12">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-5">
          <div>
            <h1 className="whitespace-nowrap text-[1.75rem] font-[680] leading-none tracking-[-0.025em] sm:text-4xl">
              {dictionary.common.appName}
            </h1>
            <p className="mt-3 text-pretty text-sm leading-5 text-muted">{dictionary.home.mission}</p>
          </div>

          <div className="rounded-lg border border-border bg-surface-raised p-4">
            <div className="grid grid-cols-[1fr_auto] items-center gap-4">
              <div>
                <p className="font-mono text-6xl font-semibold leading-none tracking-[-0.035em] tabular-nums">
                  {dashboard.reportsLastTwoHours}
                </p>
                <p className="mt-2 text-base font-semibold text-muted">{dictionary.home.reportsInWindow}</p>
              </div>
              <div className="flex size-16 items-center justify-center rounded-md bg-heat-infierno-soft text-heat-infierno">
                <ThermometerSun aria-hidden="true" className="size-9" />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild className="home-report-action min-h-16 justify-between p-4 text-left" data-testid="home-report" variant="primary">
              <Link href={`/${lang}/reportar`}>
                <span>
                  <span className="block text-base">{dictionary.common.report}</span>
                  <span className="mt-1 block text-xs font-normal opacity-90">{dictionary.home.reportDescription}</span>
                </span>
                <Send aria-hidden="true" className="home-action-icon size-6" />
              </Link>
            </Button>
            <Button asChild className="home-explore-action min-h-16 justify-between p-4 text-left" data-testid="home-explore" variant="secondary">
              <Link href={`/${lang}/explorar`}>
                <span>
                  <span className="block text-base">{dictionary.common.explore}</span>
                  <span className="mt-1 block text-xs font-normal text-muted">{dictionary.home.exploreDescription}</span>
                </span>
                <BarChart3 aria-hidden="true" className="home-action-icon size-6" />
              </Link>
            </Button>
          </div>

          <section className="rounded-md border border-border bg-surface-raised p-4" aria-labelledby="home-recent-title">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold" id="home-recent-title">
                {dictionary.explore.modules.recent}
              </h2>
              <Clock3 aria-hidden="true" className="size-4 text-muted" />
            </div>
            {recentReports.length > 0 ? (
              <div className="mt-3 flex flex-col divide-y divide-border">
                {recentReports.map((report) => (
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
                      <p className="truncate font-mono text-sm font-semibold">{report.car ? formatCarCode(report.car) : dictionary.explore.noCar}</p>
                      <p className="text-xs text-muted">{dictionary.states[report.state].label}</p>
                    </div>
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
