import { buildDashboardData } from "@/lib/domain/dashboard";
import { ESTIMATED_TOTAL_CARS } from "@/lib/domain/fleet-estimates";
import type { MetroLine } from "@/lib/domain/lines";
import { getRangeWindow, type DashboardRange } from "@/lib/domain/ranges";
import type { Locale } from "@/lib/i18n/config";
import {
  buildLineEvolutionFromRows,
  buildTotalReportsFromRows,
  getChartBucketSeconds,
  getDayBucketSeconds,
  type BucketCountRow,
} from "./report-overview";
import { getMemoryReportsSnapshot, getSupabase } from "./reports-repository";

export async function getGlobalReportOverview(
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
    const dashboard = buildDashboardData(
      reports,
      now,
      ESTIMATED_TOTAL_CARS,
      search.range,
      search.locale,
    );
    return {
      lineEvolution: dashboard.lineEvolution,
      totalReportsTrend: dashboard.totalReportsTrend,
    };
  }

  const window = getRangeWindow(search.range, now);
  const inputLines = search.lines.length > 0 ? search.lines : null;
  const [chartResult, dayResult] = await Promise.all([
    supabase.rpc("dashboard_bucket_counts_v3", {
      input_start: window.start.toISOString(),
      input_end: window.end.toISOString(),
      input_bucket_seconds: getChartBucketSeconds(search.range),
      input_lines: inputLines,
      input_car_series: null,
    }),
    supabase.rpc("dashboard_bucket_counts_v3", {
      input_start: window.start.toISOString(),
      input_end: window.end.toISOString(),
      input_bucket_seconds: getDayBucketSeconds(),
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
