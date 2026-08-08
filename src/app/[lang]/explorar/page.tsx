import { Suspense } from "react";
import {
  CarSeriesChartCard,
  HeatTrendChartCard,
  LineCarsChartCard,
  LineEvolutionChartCard,
  ReportVolumeChartCard,
  TotalReportsChartCard,
  WorstCarsExplorerChartCards,
  WorstHoursChartCard,
} from "@/components/charts/dashboard-charts";
import { ExploreFleetPanel, LineDetailCards } from "@/components/charts/explore-detail-panels";
import { FilterBar } from "@/components/charts/filter-bar";
import { ExploreActionIcon } from "@/components/ui/action-icons";
import { getCachedExplorePageData, normalizeDashboardCacheKey } from "@/lib/server/dashboard-cache";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { parseDashboardRange, parseSelectedCarSeries, parseSelectedLines } from "@/lib/domain/dashboard-query";
import { normalizeCarCode } from "@/lib/domain/reports";
import { notFound } from "next/navigation";
import ExploreLoading from "./loading";

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ linea?: string; rango?: string; coche?: string; serie?: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dictionary = await getDictionary(lang);

  return (
    <Suspense fallback={<ExploreLoading />}>
      <ExploreContent dictionary={dictionary} lang={lang} searchParams={searchParams} />
    </Suspense>
  );
}

async function ExploreContent({
  dictionary,
  lang,
  searchParams,
}: {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: "es" | "en";
  searchParams: Promise<{ linea?: string; rango?: string; coche?: string; serie?: string }>;
}) {
  const search = await searchParams;
  const selectedRange = parseDashboardRange(search.rango);
  const selectedLines = parseSelectedLines(search.linea);
  const selectedCarSeries = parseSelectedCarSeries(search.serie);
  const selectedCar = search.coche ? normalizeCarCode(search.coche) : null;
  const rangeLabel = dictionary.explore.ranges[selectedRange];
  const cacheKey = normalizeDashboardCacheKey({ range: selectedRange, lines: selectedLines, carSeries: selectedCarSeries });
  const data = await getCachedExplorePageData(cacheKey.rangeKey, cacheKey.linesKey, cacheKey.carSeriesKey);

  return (
    <main className="min-h-dvh">
      <div className="mx-auto max-w-5xl px-4 pb-5">
        <FilterBar
          availableCarSeries={data.availableCarSeries}
          dictionary={dictionary}
          locale={lang}
          selectedCarSeries={selectedCarSeries}
          selectedLines={selectedLines}
          selectedRange={selectedRange}
        />

        <section className="py-6">
          <div className="flex items-center justify-center gap-2">
            <ExploreActionIcon className="h-6 w-8" />
            <h1 className="text-center text-2xl font-[650] tracking-[-0.015em]">{dictionary.explore.title}</h1>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.82fr]">
          <div className="flex flex-col gap-4">
            <LineEvolutionChartCard data={data} dictionary={dictionary} locale={lang} rangeLabel={rangeLabel} selectedLines={selectedLines} selectedRange={selectedRange} />
            <TotalReportsChartCard data={data} dictionary={dictionary} locale={lang} rangeLabel={rangeLabel} selectedLines={selectedLines} selectedRange={selectedRange} />
            <ReportVolumeChartCard data={data} dictionary={dictionary} locale={lang} rangeLabel={rangeLabel} selectedLines={selectedLines} />
            <LineCarsChartCard data={data} dictionary={dictionary} locale={lang} rangeLabel={rangeLabel} selectedLines={selectedLines} />
            <CarSeriesChartCard data={data} dictionary={dictionary} locale={lang} rangeLabel={rangeLabel} />
            <WorstCarsExplorerChartCards
              carSeries={selectedCarSeries}
              data={data}
              dictionary={dictionary}
              initialCar={selectedCar}
              lines={selectedLines}
              locale={lang}
              rangeLabel={rangeLabel}
              selectedRange={selectedRange}
            />
            <HeatTrendChartCard data={data} dictionary={dictionary} locale={lang} rangeLabel={rangeLabel} selectedLines={selectedLines} selectedRange={selectedRange} />
            <WorstHoursChartCard data={data} dictionary={dictionary} locale={lang} rangeLabel={rangeLabel} />
          </div>

          <ExploreFleetPanel data={data} dictionary={dictionary} locale={lang} rangeLabel={rangeLabel} selectedLines={selectedLines} />
        </div>

        <LineDetailCards carSeries={selectedCarSeries} cards={data.lineSummaries} dictionary={dictionary} locale={lang} range={selectedRange} selectedLines={selectedLines} />
      </div>
    </main>
  );
}
