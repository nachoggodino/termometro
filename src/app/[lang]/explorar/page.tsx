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
import {
  getCarSeriesModule,
  getHeatTrendModule,
  getLineDetailsModule,
  getLineEvolutionModule,
  getLineSummariesModule,
  getTotalReportsModule,
  getWorstCarsModule,
  getWorstHoursModule,
  type CarSeriesModuleData,
  type HeatTrendModuleData,
  type LineDetailsModuleData,
  type LineEvolutionModuleData,
  type LineSummariesModuleData,
  type TotalReportsModuleData,
  type WorstCarsModuleData,
  type WorstHoursModuleData,
} from "@/lib/server/dashboard-modules";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { isTimeRange } from "@/lib/domain/ranges";
import { isMetroLine, type MetroLine } from "@/lib/domain/lines";
import { normalizeCarCode } from "@/lib/domain/reports";
import { notFound } from "next/navigation";

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ linea?: string; rango?: string; coche?: string; reported?: string; serie?: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const search = await searchParams;
  const dictionary = await getDictionary(lang);
  const selectedRange = isTimeRange(search.rango) ? search.rango : "summer";
  const selectedLines = parseSelectedLines(search.linea);
  const selectedCarSeries = parseSelectedCarSeries(search.serie);
  const selectedCar = search.coche ? normalizeCarCode(search.coche) : null;
  const rangeLabel = dictionary.explore.ranges[selectedRange];
  const now = new Date();

  const baseSearch = { range: selectedRange, lines: selectedLines };
  const availableCarSeries = (await getCarSeriesModule(baseSearch, now)).carSeries;
  const validSelectedCarSeries = selectedCarSeries.filter((series) => availableCarSeries.some((item) => item.series === series));
  const moduleSearch = { ...baseSearch, carSeries: validSelectedCarSeries };

  const lineEvolutionPromise = getLineEvolutionModule(moduleSearch, now);
  const totalReportsPromise = getTotalReportsModule(moduleSearch, now);
  const lineSummariesPromise = getLineSummariesModule(moduleSearch, now);
  const carSeriesPromise = getCarSeriesModule(moduleSearch, now);
  const worstCarsPromise = getWorstCarsModule(moduleSearch, selectedCar, now);
  const heatTrendPromise = getHeatTrendModule(moduleSearch, now);
  const worstHoursPromise = getWorstHoursModule(moduleSearch, now);
  const lineDetailsPromise = getLineDetailsModule(moduleSearch, now);

  return (
    <main className="min-h-dvh">
      <div className="mx-auto max-w-5xl px-4 pb-5">
        <FilterBar
          availableCarSeries={availableCarSeries}
          dictionary={dictionary}
          locale={lang}
          selectedCarSeries={validSelectedCarSeries}
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
            <Suspense fallback={<ChartModuleSkeleton rangeLabel={rangeLabel} title={dictionary.explore.modules.lineEvolution} />}>
              <LineEvolutionSection dictionary={dictionary} locale={lang} promise={lineEvolutionPromise} rangeLabel={rangeLabel} selectedLines={selectedLines} selectedRange={selectedRange} />
            </Suspense>
            <Suspense fallback={<ChartModuleSkeleton rangeLabel={rangeLabel} title={dictionary.explore.modules.totalReports} />}>
              <TotalReportsSection dictionary={dictionary} locale={lang} promise={totalReportsPromise} rangeLabel={rangeLabel} selectedLines={selectedLines} selectedRange={selectedRange} />
            </Suspense>
            <Suspense fallback={<ChartModuleSkeleton rangeLabel={rangeLabel} title={dictionary.explore.modules.volume} />}>
              <ReportVolumeSection dictionary={dictionary} locale={lang} promise={lineSummariesPromise} rangeLabel={rangeLabel} selectedLines={selectedLines} />
            </Suspense>
            <Suspense fallback={<ChartModuleSkeleton rangeLabel={rangeLabel} title={dictionary.explore.modules.lineCars} />}>
              <LineCarsSection dictionary={dictionary} locale={lang} promise={lineSummariesPromise} rangeLabel={rangeLabel} selectedLines={selectedLines} />
            </Suspense>
            <Suspense fallback={<ChartModuleSkeleton rangeLabel={rangeLabel} title={dictionary.explore.modules.carSeries} />}>
              <CarSeriesSection dictionary={dictionary} locale={lang} promise={carSeriesPromise} rangeLabel={rangeLabel} />
            </Suspense>
            <Suspense fallback={<ChartModuleSkeleton rangeLabel={rangeLabel} title={dictionary.explore.modules.worstCars} />}>
              <WorstCarsSection dictionary={dictionary} initialCar={selectedCar} locale={lang} promise={worstCarsPromise} rangeLabel={rangeLabel} selectedRange={selectedRange} />
            </Suspense>
            <Suspense fallback={<ChartModuleSkeleton rangeLabel={rangeLabel} title={dictionary.explore.modules.trend} />}>
              <HeatTrendSection
                dictionary={dictionary}
                lineSummariesPromise={lineSummariesPromise}
                locale={lang}
                promise={heatTrendPromise}
                rangeLabel={rangeLabel}
                selectedLines={selectedLines}
                selectedRange={selectedRange}
              />
            </Suspense>
            <Suspense fallback={<ChartModuleSkeleton rangeLabel={rangeLabel} title={dictionary.explore.modules.worstHours} />}>
              <WorstHoursSection dictionary={dictionary} locale={lang} promise={worstHoursPromise} rangeLabel={rangeLabel} />
            </Suspense>
          </div>

          <Suspense fallback={<SideModuleSkeleton rangeLabel={rangeLabel} title={dictionary.explore.modules.fleet} />}>
            <FleetSection dictionary={dictionary} locale={lang} promise={lineSummariesPromise} rangeLabel={rangeLabel} selectedLines={selectedLines} />
          </Suspense>
        </div>

        <Suspense fallback={<LineDetailsSkeleton title={dictionary.explore.modules.lineDetails} />}>
          <LineDetailsSection dictionary={dictionary} lineSummariesPromise={lineSummariesPromise} locale={lang} promise={lineDetailsPromise} selectedLines={selectedLines} />
        </Suspense>
      </div>
    </main>
  );
}

async function LineEvolutionSection({
  promise,
  ...props
}: Omit<Parameters<typeof LineEvolutionChartCard>[0], "data"> & {
  promise: Promise<LineEvolutionModuleData>;
}) {
  return <LineEvolutionChartCard data={await promise} {...props} />;
}

async function TotalReportsSection({
  promise,
  ...props
}: Omit<Parameters<typeof TotalReportsChartCard>[0], "data"> & {
  promise: Promise<TotalReportsModuleData>;
}) {
  return <TotalReportsChartCard data={await promise} {...props} />;
}

async function ReportVolumeSection({
  promise,
  ...props
}: Omit<Parameters<typeof ReportVolumeChartCard>[0], "data"> & {
  promise: Promise<LineSummariesModuleData>;
}) {
  return <ReportVolumeChartCard data={await promise} {...props} />;
}

async function LineCarsSection({
  promise,
  ...props
}: Omit<Parameters<typeof LineCarsChartCard>[0], "data"> & {
  promise: Promise<LineSummariesModuleData>;
}) {
  return <LineCarsChartCard data={await promise} {...props} />;
}

async function CarSeriesSection({
  promise,
  ...props
}: Omit<Parameters<typeof CarSeriesChartCard>[0], "data"> & {
  promise: Promise<CarSeriesModuleData>;
}) {
  return <CarSeriesChartCard data={await promise} {...props} />;
}

async function WorstCarsSection({
  promise,
  ...props
}: Omit<Parameters<typeof WorstCarsExplorerChartCards>[0], "data"> & {
  promise: Promise<WorstCarsModuleData>;
}) {
  return <WorstCarsExplorerChartCards data={await promise} {...props} />;
}

async function HeatTrendSection({
  lineSummariesPromise,
  promise,
  ...props
}: Omit<Parameters<typeof HeatTrendChartCard>[0], "data"> & {
  lineSummariesPromise: Promise<LineSummariesModuleData>;
  promise: Promise<HeatTrendModuleData>;
}) {
  const [trendData, summaryData] = await Promise.all([promise, lineSummariesPromise]);
  return <HeatTrendChartCard data={{ ...trendData, ...summaryData }} {...props} />;
}

async function WorstHoursSection({
  promise,
  ...props
}: Omit<Parameters<typeof WorstHoursChartCard>[0], "data"> & {
  promise: Promise<WorstHoursModuleData>;
}) {
  return <WorstHoursChartCard data={await promise} {...props} />;
}

async function FleetSection({
  promise,
  ...props
}: Omit<Parameters<typeof ExploreFleetPanel>[0], "data"> & {
  promise: Promise<LineSummariesModuleData>;
}) {
  return <ExploreFleetPanel data={await promise} {...props} />;
}

async function LineDetailsSection({
  lineSummariesPromise,
  promise,
  ...props
}: Omit<Parameters<typeof LineDetailCards>[0], "data"> & {
  lineSummariesPromise: Promise<LineSummariesModuleData>;
  promise: Promise<LineDetailsModuleData>;
}) {
  const [detailsData, summaryData] = await Promise.all([promise, lineSummariesPromise]);
  return <LineDetailCards data={{ ...summaryData, ...detailsData }} {...props} />;
}

function ChartModuleSkeleton({ title, rangeLabel }: { title: string; rangeLabel: string }) {
  return (
    <section className="scroll-mt-[13rem] rounded-md border border-border bg-surface-raised p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{title}</p>
          <p className="mt-1 text-xs font-semibold text-muted">{rangeLabel}</p>
        </div>
        <div className="size-9 animate-pulse rounded-md bg-surface" />
      </div>
      <div className="h-56 animate-pulse rounded-md bg-surface" />
      <div className="mt-4 h-4 w-2/3 animate-pulse rounded-sm bg-surface" />
    </section>
  );
}

function SideModuleSkeleton({ title, rangeLabel }: { title: string; rangeLabel: string }) {
  return (
    <aside className="flex flex-col gap-4">
      <section className="rounded-md border border-border bg-surface-raised p-4">
        <p className="text-base font-semibold">{title}</p>
        <p className="mt-1 text-xs font-semibold text-muted">{rangeLabel}</p>
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="h-12 animate-pulse rounded-sm bg-surface" key={index} />
          ))}
        </div>
      </section>
    </aside>
  );
}

function LineDetailsSkeleton({ title }: { title: string }) {
  return (
    <section className="pt-4">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="rounded-md border border-border bg-surface-raised p-4" key={index}>
            <div className="flex items-center justify-between">
              <div className="h-8 w-10 animate-pulse rounded-sm bg-surface" />
              <div className="h-8 w-12 animate-pulse rounded-sm bg-surface" />
            </div>
            <div className="mt-4 h-4 w-32 animate-pulse rounded-sm bg-surface" />
          </div>
        ))}
      </div>
    </section>
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

function parseSelectedCarSeries(value: string | undefined) {
  if (!value) return [];
  const series: number[] = [];
  for (const item of value.split(",")) {
    const parsed = Number(item);
    if (Number.isInteger(parsed) && parsed >= 0 && !series.includes(parsed)) {
      series.push(parsed);
    }
  }
  return series;
}
