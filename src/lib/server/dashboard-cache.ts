import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { MetroLine } from "@/lib/domain/lines";
import type { ReportLocationKind } from "@/lib/domain/reports";
import type { Locale } from "@/lib/i18n/config";
import { parseSelectedCarSeries, parseSelectedLines } from "@/lib/domain/dashboard-query";
import { isTimeRange, type DashboardRange } from "@/lib/domain/ranges";
import {
  getCarDetailModule,
  getCarSeriesModule,
  getHeatTrendModule,
  getLineDetailsModule,
  getLineSummariesModule,
  getWorstCarsModule,
  type DashboardModuleSearch,
} from "./dashboard-modules";
import { getCarOverview } from "./car-overview";
import { getPlatformDashboard, getPlatformDetail } from "./platform-dashboard";
import { getPlatformGlobalOverview } from "./platform-overview";
import { getHomeSnapshot } from "./reports-repository";

const REPORTS_CACHE_TAG = "reports";

export async function getCachedHomeSnapshot() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 300 });
  cacheTag(REPORTS_CACHE_TAG);
  return getHomeSnapshot();
}

export async function getCachedExplorePageData(
  rangeKey: string,
  linesKey: string,
  carSeriesKey: string,
  locale: Locale,
  locationKind: ReportLocationKind = "car",
) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  cacheTag(REPORTS_CACHE_TAG);

  const search = parseSearch(rangeKey, linesKey, carSeriesKey);
  if (locationKind === "platform") search.carSeries = [];
  search.locale = locale;
  const baseSearch = { range: search.range, lines: search.lines };
  const now = new Date();
  const availableSeriesPromise = getCarSeriesModule(baseSearch, now);
  const carSeriesPromise = search.carSeries?.length
    ? getCarSeriesModule(search, now)
    : availableSeriesPromise;
  const overviewPromise =
    locationKind === "car"
      ? getCarOverview(
          {
            range: search.range,
            lines: search.lines,
            carSeries: search.carSeries ?? [],
            locale,
          },
          now,
        )
      : getPlatformGlobalOverview({ range: search.range, lines: search.lines, locale }, now).then(
          (overview) => ({
            ...overview,
            worstHours: [],
          }),
        );

  const [
    availableSeries,
    overview,
    lineSummariesModule,
    carSeries,
    worstCars,
    heatTrend,
    platformDashboard,
  ] = await Promise.all([
    availableSeriesPromise,
    overviewPromise,
    getLineSummariesModule(search, now),
    carSeriesPromise,
    getWorstCarsModule(search, now),
    getHeatTrendModule(search, now),
    getPlatformDashboard(baseSearch, now),
  ]);

  return {
    availableCarSeries: availableSeries.carSeries,
    ...overview,
    lineSummaries: lineSummariesModule.lineSummaries,
    carLineSummaries: lineSummariesModule.lineSummaries,
    ...carSeries,
    ...worstCars,
    ...heatTrend,
    ...platformDashboard,
  };
}

export async function getCachedCarDetail(
  rangeKey: string,
  linesKey: string,
  carSeriesKey: string,
  car: string,
  locale: Locale,
) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  cacheTag(REPORTS_CACHE_TAG);
  const search = parseSearch(rangeKey, linesKey, carSeriesKey);
  search.locale = locale;
  return getCarDetailModule(search, car);
}

export async function getCachedPlatformDetail(
  rangeKey: string,
  linesKey: string,
  stationId: string,
  locale: Locale,
) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  cacheTag(REPORTS_CACHE_TAG);
  const range: DashboardRange = isTimeRange(rangeKey) ? rangeKey : "month";
  return getPlatformDetail(range, parseSelectedLines(linesKey), stationId, locale);
}

export async function getCachedLineDetail(
  rangeKey: string,
  line: MetroLine,
  carSeriesKey: string,
) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  cacheTag(REPORTS_CACHE_TAG);
  const result = await getLineDetailsModule(parseSearch(rangeKey, line, carSeriesKey));
  return (
    result.lineCarReports.find((summary) => summary.line === line) ?? {
      line,
      totalCars: 0,
      cars: [],
    }
  );
}

export function normalizeDashboardCacheKey(search: DashboardModuleSearch) {
  return {
    rangeKey: search.range,
    linesKey: [...new Set(search.lines)].toSorted().join(","),
    carSeriesKey: [...new Set(search.carSeries ?? [])]
      .toSorted((a, b) => a - b)
      .join(","),
  };
}

function parseSearch(
  rangeKey: string,
  linesKey: string,
  carSeriesKey: string,
): DashboardModuleSearch {
  const range: DashboardRange = isTimeRange(rangeKey) ? rangeKey : "month";
  const lines = parseSelectedLines(linesKey);
  const carSeries = parseSelectedCarSeries(carSeriesKey);
  return { range, lines, carSeries };
}
