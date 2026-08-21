import { buildDashboardData, DASHBOARD_TIME, type HourlyReportSummary } from "@/lib/domain/dashboard";
import { getCarSeries } from "@/lib/domain/cars";
import { ESTIMATED_TOTAL_CARS } from "@/lib/domain/fleet-estimates";
import type { MetroLine } from "@/lib/domain/lines";
import type { Locale } from "@/lib/i18n/config";
import { getRangeWindow, type DashboardRange } from "@/lib/domain/ranges";
import { getReportLocationKind } from "@/lib/domain/reports";
import {
  buildLineEvolutionFromRows,
  buildTotalReportsFromRows,
  getChartBucketSeconds,
  getDayBucketSeconds,
  type BucketCountRow,
} from "./report-overview";
import { getMemoryReportsSnapshot, getSupabase } from "./reports-repository";

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
      worstHours: dashboard.worstHours,
    };
  }

  const window = getRangeWindow(search.range, now);
  const inputLines = search.lines.length > 0 ? search.lines : null;
  const inputCarSeries = search.carSeries.length > 0 ? search.carSeries : null;

  const [chartResult, dayResult, worstHoursResult] = await Promise.all([
    supabase.rpc("dashboard_bucket_counts_v2", {
      input_start: window.start.toISOString(),
      input_end: window.end.toISOString(),
      input_bucket_seconds: getChartBucketSeconds(search.range),
      input_lines: inputLines,
      input_car_series: inputCarSeries,
    }),
    supabase.rpc("dashboard_bucket_counts_v2", {
      input_start: window.start.toISOString(),
      input_end: window.end.toISOString(),
      input_bucket_seconds: getDayBucketSeconds(),
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
