import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { MetroLine } from "@/lib/domain/lines";
import { parseSelectedCarSeries, parseSelectedLines } from "@/lib/domain/dashboard-query";
import { isTimeRange, type DashboardRange } from "@/lib/domain/ranges";
import {
  getCarDetailModule,
  getCarSeriesModule,
  getHeatTrendModule,
  getLineDetailsModule,
  getLineEvolutionModule,
  getLineSummariesModule,
  getTotalReportsModule,
  getWorstCarsModule,
  getWorstHoursModule,
  type DashboardModuleSearch,
} from "./dashboard-modules";
import { getHomeSnapshot } from "./reports-repository";

const REPORTS_CACHE_TAG = "reports";

export async function getCachedHomeSnapshot() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 300 });
  cacheTag(REPORTS_CACHE_TAG);
  return getHomeSnapshot();
}

export async function getCachedExplorePageData(rangeKey: string, linesKey: string, carSeriesKey: string) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  cacheTag(REPORTS_CACHE_TAG);

  const search = parseSearch(rangeKey, linesKey, carSeriesKey);
  const baseSearch = { range: search.range, lines: search.lines };
  const now = new Date();
  const availableSeriesPromise = getCarSeriesModule(baseSearch, now);
  const carSeriesPromise = search.carSeries?.length ? getCarSeriesModule(search, now) : availableSeriesPromise;
  const [availableSeries, lineEvolution, totalReports, lineSummaries, carSeries, worstCars, heatTrend, worstHours] = await Promise.all([
    availableSeriesPromise,
    getLineEvolutionModule(search, now),
    getTotalReportsModule(search, now),
    getLineSummariesModule(search, now),
    carSeriesPromise,
    getWorstCarsModule(search, now),
    getHeatTrendModule(search, now),
    getWorstHoursModule(search, now),
  ]);

  return {
    availableCarSeries: availableSeries.carSeries,
    ...lineEvolution,
    ...totalReports,
    ...lineSummaries,
    ...carSeries,
    ...worstCars,
    ...heatTrend,
    ...worstHours,
  };
}

export async function getCachedCarDetail(rangeKey: string, linesKey: string, carSeriesKey: string, car: string) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  cacheTag(REPORTS_CACHE_TAG);
  return getCarDetailModule(parseSearch(rangeKey, linesKey, carSeriesKey), car);
}

export async function getCachedLineDetail(rangeKey: string, line: MetroLine, carSeriesKey: string) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  cacheTag(REPORTS_CACHE_TAG);
  const result = await getLineDetailsModule(parseSearch(rangeKey, line, carSeriesKey));
  return result.lineCarReports.find((summary) => summary.line === line) ?? { line, totalCars: 0, cars: [] };
}

export function normalizeDashboardCacheKey(search: DashboardModuleSearch) {
  return {
    rangeKey: search.range,
    linesKey: [...new Set(search.lines)].toSorted().join(","),
    carSeriesKey: [...new Set(search.carSeries ?? [])].toSorted((a, b) => a - b).join(","),
  };
}

function parseSearch(rangeKey: string, linesKey: string, carSeriesKey: string): DashboardModuleSearch {
  const range: DashboardRange = isTimeRange(rangeKey) ? rangeKey : "summer";
  const lines = parseSelectedLines(linesKey);
  const carSeries = parseSelectedCarSeries(carSeriesKey);
  return { range, lines, carSeries };
}
