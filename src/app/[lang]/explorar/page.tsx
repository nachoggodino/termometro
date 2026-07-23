import { DashboardCharts } from "@/components/charts/dashboard-charts";
import { ExploreFleetPanel, LineDetailCards } from "@/components/charts/explore-detail-panels";
import { FilterBar } from "@/components/charts/filter-bar";
import { ExploreActionIcon } from "@/components/ui/action-icons";
import { getDashboardDataForPage } from "@/lib/server/page-data";
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
  searchParams: Promise<{ linea?: string; rango?: string; coche?: string; reported?: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const search = await searchParams;
  const dictionary = await getDictionary(lang);
  const selectedRange = isTimeRange(search.rango) ? search.rango : "summer";
  const selectedLines = parseSelectedLines(search.linea);
  const selectedCar = search.coche ? normalizeCarCode(search.coche) : null;
  const data = await getDashboardDataForPage({ range: selectedRange, lines: selectedLines });
  const rangeLabel = dictionary.explore.ranges[selectedRange];

  return (
    <main className="min-h-dvh">
      <div className="mx-auto max-w-5xl px-4 pb-5">
        <FilterBar dictionary={dictionary} locale={lang} selectedLines={selectedLines} selectedRange={selectedRange} />

        <section className="py-6">
          <div className="flex items-center justify-center gap-2">
            <ExploreActionIcon className="h-6 w-8" />
            <h1 className="text-center text-2xl font-[650] tracking-[-0.015em]">{dictionary.explore.title}</h1>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.82fr]">
          <DashboardCharts
            data={data}
            dictionary={dictionary}
            initialCar={selectedCar}
            locale={lang}
            rangeLabel={rangeLabel}
            selectedRange={selectedRange}
            selectedLines={selectedLines}
          />
          <ExploreFleetPanel data={data} dictionary={dictionary} locale={lang} rangeLabel={rangeLabel} selectedLines={selectedLines} />
        </div>
        <LineDetailCards data={data} dictionary={dictionary} locale={lang} selectedLines={selectedLines} />
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
