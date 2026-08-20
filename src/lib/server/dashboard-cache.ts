import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { LineSummary } from "@/lib/domain/dashboard";
import type { MetroLine } from "@/lib/domain/lines";
import type { Locale } from "@/lib/i18n/config";
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
import { getPlatformDashboard, type PlatformDashboardData } from "./platform-dashboard";
import { getHomeSnapshot } from "./reports-repository";

const REPORTS_CACHE_TAG = "reports";

export async function getCachedHomeSnapshot() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 300 });
  cacheTag(REPORTS_CACHE_TAG);
  return getHomeSnapshot();
}

export async function getCachedExplorePageData(rangeKey: string, linesKey: string, carSeriesKey: string, locale: Locale) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  cacheTag(REPORTS_CACHE_TAG);

  const search = parseSearch(rangeKey, linesKey, carSeriesKey);
  search.locale = locale;
  const baseSearch = { range: search.range, lines: search.lines };
  const now = new Date();
  const availableSeriesPromise = getCarSeriesModule(baseSearch, now);
  const carSeriesPromise = search.carSeries?.length ? getCarSeriesModule(search, now) : availableSeriesPromise;
  const [
    availableSeries,
    lineEvolution,
    totalReports,
    lineSummariesModule,
    carSeries,
    worstCars,
    heatTrend,
    worstHours,
    platformDashboard,
  ] = await Promise.all([
    availableSeriesPromise,
    getLineEvolutionModule(search, now),
    getTotalReportsModule(search, now),
    getLineSummariesModule(search, now),
    carSeriesPromise,
    getWorstCarsModule(search, now),
    getHeatTrendModule(search, now),
    getWorstHoursModule(search, now),
    getPlatformDashboard(baseSearch, now),
  ]);

  const lineSummaries = mergePlatformCountsIntoLineSummaries(
    lineSummariesModule.lineSummaries,
    platformDashboard,
    !search.carSeries?.length,
  );

  return {
    availableCarSeries: availableSeries.carSeries,
    ...lineEvolution,
    ...totalReports,
    lineSummaries,
    carLineSummaries: lineSummariesModule.lineSummaries,
    ...carSeries,
    ...worstCars,
    ...heatTrend,
    ...worstHours,
    ...platformDashboard,
  };
}

export async function getCachedCarDetail(rangeKey: string, linesKey: string, carSeriesKey: string, car: string, locale: Locale) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  cacheTag(REPORTS_CACHE_TAG);
  const search = parseSearch(rangeKey, linesKey, carSeriesKey);
  search.locale = locale;
  return getCarDetailModule(search, car);
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

function mergePlatformCountsIntoLineSummaries(
  lineSummaries: LineSummary[],
  platformDashboard: PlatformDashboardData,
  includePlatforms: boolean,
) {
  if (!includePlatforms) return lineSummaries;

  const platformsByLine = new Map(platformDashboard.platformLineSummaries.map((summary) => [summary.line, summary]));
  return lineSummaries.map((summary) => {
    const platform = platformsByLine.get(summary.line);
    if (!platform) return summary;

    const latestReportAt =
      platform.latestReportAt && (!summary.latestReportAt || platform.latestReportAt > summary.latestReportAt)
        ? platform.latestReportAt
        : summary.latestReportAt;
    return {
      ...summary,
      reports: summary.reports + platform.reports,
      latestReportAt,
    };
  });
}

function parseSearch(rangeKey: string, linesKey: string, carSeriesKey: string): DashboardModuleSearch {
  const range: DashboardRange = isTimeRange(rangeKey) ? rangeKey : "summer";
  const lines = parseSelectedLines(linesKey);
  const carSeries = parseSelectedCarSeries(carSeriesKey);
  return { range, lines, carSeries };
}
