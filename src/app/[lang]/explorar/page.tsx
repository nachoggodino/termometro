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
import {
  PlatformCoveragePanel,
  WorstPlatformsExplorerChartCards,
} from "@/components/charts/platform-charts";
import { getCachedExplorePageData, normalizeDashboardCacheKey } from "@/lib/server/dashboard-cache";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import {
  parseDashboardRange,
  parseSelectedCarSeries,
  parseSelectedLines,
} from "@/lib/domain/dashboard-query";
import { normalizeCarCode, type ReportLocationKind } from "@/lib/domain/reports";
import { notFound } from "next/navigation";
import ExploreLoading from "./loading";

type ExploreSearchParams = {
  linea?: string;
  rango?: string;
  coche?: string;
  serie?: string;
  tipo?: string;
  anden?: string;
};

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<ExploreSearchParams>;
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
  searchParams: Promise<ExploreSearchParams>;
}) {
  const search = await searchParams;
  const locationKind: ReportLocationKind = search.tipo === "anden" ? "platform" : "car";
  const selectedRange = parseDashboardRange(search.rango);
  const selectedLines = parseSelectedLines(search.linea);
  const selectedCarSeries =
    locationKind === "car" ? parseSelectedCarSeries(search.serie) : [];
  const selectedCar =
    locationKind === "car" && search.coche ? normalizeCarCode(search.coche) : null;
  const rangeLabel = dictionary.explore.ranges[selectedRange];
  const cacheKey = normalizeDashboardCacheKey({
    range: selectedRange,
    lines: selectedLines,
    carSeries: selectedCarSeries,
  });
  const data = await getCachedExplorePageData(
    cacheKey.rangeKey,
    cacheKey.linesKey,
    cacheKey.carSeriesKey,
    lang,
    locationKind,
  );
  const initialStationId =
    locationKind === "platform" && search.anden
      ? data.platformSummaries.some(
          (platform) =>
            platform.stationId === search.anden &&
            (selectedLines.length === 0 || selectedLines.includes(platform.line)),
        )
        ? search.anden
        : null
      : null;

  return (
    <main className="min-h-dvh">
      <div className="mx-auto max-w-5xl px-4 pb-4">
        <FilterBar
          availableCarSeries={data.availableCarSeries}
          dictionary={dictionary}
          locale={lang}
          locationKind={locationKind}
          selectedCarSeries={selectedCarSeries}
          selectedLines={selectedLines}
          selectedRange={selectedRange}
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_0.82fr]">
            <div className="flex flex-col gap-4">
              <LineEvolutionChartCard
                data={data}
                dictionary={dictionary}
                locale={lang}
                rangeLabel={rangeLabel}
                selectedLines={selectedLines}
                selectedRange={selectedRange}
              />
              <TotalReportsChartCard
                data={data}
                dictionary={dictionary}
                locale={lang}
                rangeLabel={rangeLabel}
                selectedLines={selectedLines}
                selectedRange={selectedRange}
              />

              {locationKind === "car" ? (
                <>
                  <ReportVolumeChartCard
                    data={{ lineSummaries: data.carLineSummaries }}
                    dictionary={dictionary}
                    locale={lang}
                    rangeLabel={rangeLabel}
                    selectedLines={selectedLines}
                  />
                  <LineCarsChartCard
                    data={{ lineSummaries: data.carLineSummaries }}
                    dictionary={dictionary}
                    locale={lang}
                    rangeLabel={rangeLabel}
                    selectedLines={selectedLines}
                  />
                  <CarSeriesChartCard
                    data={data}
                    dictionary={dictionary}
                    locale={lang}
                    rangeLabel={rangeLabel}
                  />
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
                  <HeatTrendChartCard
                    data={data}
                    dictionary={dictionary}
                    locale={lang}
                    rangeLabel={rangeLabel}
                    selectedLines={selectedLines}
                    selectedRange={selectedRange}
                  />
                  <WorstHoursChartCard
                    data={data}
                    dictionary={dictionary}
                    locale={lang}
                    rangeLabel={rangeLabel}
                  />
                </>
              ) : (
                <WorstPlatformsExplorerChartCards
                  data={data}
                  dictionary={dictionary}
                  initialStationId={initialStationId}
                  locale={lang}
                  rangeLabel={rangeLabel}
                  selectedRange={selectedRange}
                />
              )}
            </div>

            {locationKind === "car" ? (
              <ExploreFleetPanel
                data={{ lineSummaries: data.carLineSummaries }}
                dictionary={dictionary}
                locale={lang}
                rangeLabel={rangeLabel}
                selectedLines={selectedLines}
              />
            ) : (
              <PlatformCoveragePanel
                data={data}
                dictionary={dictionary}
                locale={lang}
                rangeLabel={rangeLabel}
                selectedLines={selectedLines}
              />
            )}
          </div>

          {locationKind === "car" ? (
            <LineDetailCards
              carSeries={selectedCarSeries}
              cards={data.carLineSummaries}
              dictionary={dictionary}
              locale={lang}
              range={selectedRange}
              selectedLines={selectedLines}
            />
          ) : null}
        </FilterBar>
      </div>
    </main>
  );
}
