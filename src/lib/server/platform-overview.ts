import {
  buildDashboardBuckets,
  buildDashboardData,
  buildDashboardDayBuckets,
  DASHBOARD_TIME,
  type LineEvolutionPoint,
  type TotalReportsPoint,
} from "@/lib/domain/dashboard";
import { ESTIMATED_TOTAL_CARS } from "@/lib/domain/fleet-estimates";
import { isMetroLine, METRO_LINES, type MetroLine } from "@/lib/domain/lines";
import type { Locale } from "@/lib/i18n/config";
import { getRangeWindow, type DashboardRange } from "@/lib/domain/ranges";
import { getMemoryReportsSnapshot, getSupabase } from "./reports-repository";

type BucketCountRow = {
  bucket_start: string;
  line: string;
  reports: number;
};

export async function getPlatformGlobalOverview(
  search: { range: DashboardRange; lines: MetroLine[]; locale: Locale },
  now = new Date(),
) {
  const supabase = getSupabase();
  if (!supabase) {
    const window = getRangeWindow(search.range, now);
    const reports = getMemoryReportsSnapshot().filter(
      (report) =>
        !report.hiddenAt &&
        report.createdAt >= window.start &&
        report.createdAt <= window.end &&
        (search.lines.length === 0 || search.lines.includes(report.line)),
    );
    const dashboard = buildDashboardData(reports, now, ESTIMATED_TOTAL_CARS, search.range, search.locale);
    return {
      lineEvolution: dashboard.lineEvolution,
      totalReportsTrend: dashboard.totalReportsTrend,
    };
  }

  const window = getRangeWindow(search.range, now);
  const inputLines = search.lines.length > 0 ? search.lines : null;
  const chartBucketSeconds =
    search.range === "today" || search.range === "last24Hours"
      ? DASHBOARD_TIME.millisecondsPerHour / 1000
      : (DASHBOARD_TIME.millisecondsPerHour / 1000) * DASHBOARD_TIME.hoursPerDay;
  const dayBucketSeconds = (DASHBOARD_TIME.millisecondsPerHour / 1000) * DASHBOARD_TIME.hoursPerDay;

  const [chartResult, dayResult] = await Promise.all([
    supabase.rpc("dashboard_bucket_counts_v3", {
      input_start: window.start.toISOString(),
      input_end: window.end.toISOString(),
      input_bucket_seconds: chartBucketSeconds,
      input_lines: inputLines,
      input_car_series: null,
    }),
    supabase.rpc("dashboard_bucket_counts_v3", {
      input_start: window.start.toISOString(),
      input_end: window.end.toISOString(),
      input_bucket_seconds: dayBucketSeconds,
      input_lines: inputLines,
      input_car_series: null,
    }),
  ]);
  if (chartResult.error) throw chartResult.error;
  if (dayResult.error) throw dayResult.error;

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
