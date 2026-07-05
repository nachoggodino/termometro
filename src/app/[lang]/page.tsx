import Link from "next/link";
import { BarChart3, Send, ThermometerSun } from "lucide-react";
import { AppHeader } from "@/components/shell/app-header";
import { AppLogo } from "@/components/ui/app-logo";
import { Button } from "@/components/ui/button";
import { getDashboardDataForPage } from "@/lib/server/page-data";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dictionary = await getDictionary(lang);
  const dashboard = await getDashboardDataForPage({ range: "today" });
  const hottestLine = dashboard.hottestLine;

  return (
    <main className="min-h-dvh">
      <AppHeader dictionary={dictionary} locale={lang} pathname="" />
      <section className="mx-auto flex min-h-[calc(100dvh-68px)] max-w-5xl flex-col px-4 py-8 sm:py-12">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-7">
          <div className="flex items-center gap-3">
            <AppLogo />
            <div>
              <h1 className="text-4xl font-[680] leading-none tracking-[-0.025em]">{dictionary.common.appName}</h1>
              <p className="mt-2 text-sm leading-5 text-muted">{dictionary.home.mission}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface-raised p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-3xl font-semibold tracking-[-0.02em]">{dashboard.reportsLastTwoHours}</p>
                <p className="text-sm font-semibold text-muted">{dictionary.home.reportsInWindow}</p>
              </div>
              <div className="rounded-md bg-heat-infierno-soft p-2 text-heat-infierno">
                <ThermometerSun aria-hidden="true" />
              </div>
            </div>
            <p className="mt-5 text-lg font-semibold">
              {hottestLine ? `${hottestLine.line}: ${dictionary.home.hottestLine}` : dictionary.home.noReports}
            </p>
            <p className="mt-1 text-sm text-muted">{hottestLine ? dictionary.explore.criticalSummary : dictionary.home.noReportsCopy}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild className="min-h-24 justify-between p-4 text-left" data-testid="home-report" variant="primary">
              <Link href={`/${lang}/reportar`}>
                <span>
                  <span className="block text-lg">{dictionary.common.report}</span>
                  <span className="mt-1 block text-sm font-normal opacity-85">{dictionary.home.reportDescription}</span>
                </span>
                <Send aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild className="min-h-24 justify-between p-4 text-left" data-testid="home-explore" variant="secondary">
              <Link href={`/${lang}/explorar`}>
                <span>
                  <span className="block text-lg">{dictionary.common.explore}</span>
                  <span className="mt-1 block text-sm font-normal text-muted">{dictionary.home.exploreDescription}</span>
                </span>
                <BarChart3 aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <p className="text-center text-xs text-muted">{dictionary.common.disclaimer}</p>
        </div>
      </section>
    </main>
  );
}
