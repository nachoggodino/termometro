import {
  buildDashboardBuckets,
  buildDashboardData,
  buildDashboardDayBuckets,
  DASHBOARD_TIME,
  type HourlyReportSummary,
  type LineEvolutionPoint,
  type TotalReportsPoint,
} from "@/lib/domain/dashboard";
import { getCarSeries } from "@/lib/domain/cars";
import { ESTIMATED_TOTAL_CARS } from "@/lib/domain/fleet-estimates";
import { isMetroLine, METRO_LINES, type MetroLine } from "@/lib/domain/lines";
import type { Locale } from "@/lib/i18n/config";
import { getRangeWindow, type DashboardRange } from "@/lib/domain/ranges";
import { getReportLocationKind } from "@/lib/domain/reports";
import { getMemoryReportsSnapshot, getSupabase } from "./reports-repository";

type BucketCountRow = {
  bucket_start: string;
  line: string;
  reports: number;
};

type WorstHourRow = {
  madrid_hour: number;
  reports: number;
};

export async function getCarOverview(
  search: { range: DashboardRange; lines: MetroLine[]; carSeries: number[]; locale: Locale },
  now = new Date(),
) {
  const supabase = getSupabase();
  if (!supabase) {
    const window = getRangeWindow(search.range, now);
    const selectedSeries = search.carSeries.length ? new Set(search.carSeries) : null;
    const reports = getMemoryReportsSnapshot().filter((report) => {
      if (report.hiddenAt || getReportLocationKind(report) !== "car") return false;
      if (report.createdAt < window.start || report.createdAt > window.end) return false;
      if (search.lines.length > 0 && !search.lines.includes(report.line)) return false;
      if (!selectedSeries) return true;
      if (!report.car) return false;
      const series = getCarSeries(report.car);
      return series !== null && selectedSeries.has(series);
    });
    const dashboard = buildDashboardData(reports, now, ESTIMATED_TOTAL_CARS, search.range, search.locale);
    return {
      lineEvolution: dashboard.lineEvolution,
      totalReportsTrend: dashboard.totalReportsTrend,
      worstHours: dashboard.worstHours,
    };
  }

  const window = getRangeWindow(search.range, now);
  const inputLines = search.lines.length > 0 ? search.lines : null;
  const inputCarSeries = search.carSeries.length > 0 ? search.carSeries : null;
  const chartBucketSeconds =
    search.range === "today" || search.range === "last24Hours"
      ? DASHBOARD_TIME.millisecondsPerHour / 1000
      : (DASHBOARD_TIME.millisecondsPerHour / 1000) * DASHBOARD_TIME.hoursPerDay;
  const dayBucketSeconds = (DASHBOARD_TIME.millisecondsPerHour / 1000) * DASHBOARD_TIME.hoursPerDay;

  const [chartResult, dayResult, worstHoursResult] = await Promise.all([
    supabase.rpc("dashboard_bucket_counts_v2", {
      input_start: window.start.toISOString(),
      input_end: window.end.toISOString(),
      input_bucket_seconds: chartBucketSeconds,
      input_lines: inputLines,
      input_car_series: inputCarSeries,
    }),
    supabase.rpc("dashboard_bucket_counts_v2", {
      input_start: window.start.toISOString(),
      input_end: window.end.toISOString(),
      input_bucket_seconds: dayBucketSeconds,
      input_lines: inputLines,
      input_car_series: inputCarSeries,
    }),
    supabase.rpc("dashboard_worst_hours_v2", {
      input_start: window.start.toISOString(),
      input_end: window.end.toISOString(),
      input_lines: inputLines,
      input_car_series: inputCarSeries,
    }),
  ]);
  if (chartResult.error) throw chartResult.error;
  if (dayResult.error) throw dayResult.error;
  if (worstHoursResult.error) throw worstHoursResult.error;

  const worstHourCounts = new Map(
    ((worstHoursResult.data ?? []) as WorstHourRow[]).map((row) => [row.madrid_hour, row.reports]),
  );

  return {
    lineEvolution: buildLineEvolutionFromRows(
      (chartResult.data ?? []) as BucketCountRow[],
      now,
      search.range,
      search.locale,
    ),
    totalReportsTrend: buildTotalReportsFromRows(
      (dayResult.data ?? []) as BucketCountRow[],
      now,
      search.range,
      search.locale,
    ),
    worstHours: Array.from(
      { length: DASHBOARD_TIME.worstHourEnd - DASHBOARD_TIME.worstHourStart + 1 },
      (_, index): HourlyReportSummary => {
        const hour = index + DASHBOARD_TIME.worstHourStart;
        return { hour, label: `${hour}h`, reports: worstHourCounts.get(hour) ?? 0 };
      },
    ),
  };
}

function buildLineEvolutionFromRows(
  rows: BucketCountRow[],
  now: Date,
  range: DashboardRange,
  locale: Locale,
): LineEvolutionPoint[] {
  const counts = buildBucketLineCountMap(rows);
  return buildDashboardBuckets(now, range, locale).map((bucket) => {
    const point: LineEvolutionPoint = { label: bucket.label };
    for (const line of METRO_LINES) {
      point[line] = counts.get(bucket.start.getTime())?.get(line) ?? 0;
    }
    return point;
  });
}

function buildTotalReportsFromRows(
  rows: BucketCountRow[],
  now: Date,
  range: DashboardRange,
  locale: Locale,
): TotalReportsPoint[] {
  const counts = buildBucketLineCountMap(rows);
  return buildDashboardDayBuckets(now, range, locale).map((bucket) => ({
    label: bucket.label,
    reports: sumLineCounts(counts.get(bucket.start.getTime())),
  }));
}

function buildBucketLineCountMap(rows: BucketCountRow[]) {
  const counts = new Map<number, Map<MetroLine, number>>();
  for (const row of rows) {
    if (!isMetroLine(row.line)) continue;
    const bucketKey = new Date(row.bucket_start).getTime();
    const lineCounts = counts.get(bucketKey) ?? new Map<MetroLine, number>();
    lineCounts.set(row.line, row.reports);
    counts.set(bucketKey, lineCounts);
  }
  return counts;
}

function sumLineCounts(counts: Map<MetroLine, number> | undefined) {
  if (!counts) return 0;
  let total = 0;
  for (const count of counts.values()) total += count;
  return total;
}
