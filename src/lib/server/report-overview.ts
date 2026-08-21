import {
  buildDashboardBuckets,
  buildDashboardDayBuckets,
  DASHBOARD_TIME,
  type LineEvolutionPoint,
  type TotalReportsPoint,
} from "@/lib/domain/dashboard";
import { isMetroLine, METRO_LINES, type MetroLine } from "@/lib/domain/lines";
import type { DashboardRange } from "@/lib/domain/ranges";
import type { Locale } from "@/lib/i18n/config";

export type BucketCountRow = {
  bucket_start: string;
  line: string;
  reports: number;
};

export function getChartBucketSeconds(range: DashboardRange) {
  const hourSeconds = DASHBOARD_TIME.millisecondsPerHour / 1000;
  return range === "today" || range === "last24Hours"
    ? hourSeconds
    : hourSeconds * DASHBOARD_TIME.hoursPerDay;
}

export function getDayBucketSeconds() {
  return (DASHBOARD_TIME.millisecondsPerHour / 1000) * DASHBOARD_TIME.hoursPerDay;
}

export function buildLineEvolutionFromRows(
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

export function buildTotalReportsFromRows(
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
