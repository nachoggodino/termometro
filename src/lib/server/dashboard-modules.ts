import {
  DASHBOARD_LIMITS,
  DASHBOARD_TIME,
  buildDashboardBuckets,
  buildDashboardDayBuckets,
  type CarExplorerOption,
  type CarExplorerSelection,
  type DashboardData,
  type HourlyReportSummary,
  type LineCarReportSummary,
  type LineEvolutionPoint,
  type LineSummary,
  type TotalReportsPoint,
  type TrendPoint,
} from "@/lib/domain/dashboard";
import { ESTIMATED_TOTAL_CARS } from "@/lib/domain/fleet-estimates";
import { getAgreement, getConfidence, getHeatTone, type Confidence, type HeatIndexDiagnostics, type HeatState } from "@/lib/domain/heat";
import { isMetroLine, METRO_LINES, type MetroLine } from "@/lib/domain/lines";
import { getRangeWindow, type DashboardRange } from "@/lib/domain/ranges";
import { getReportsForDashboard, getSupabase } from "./reports-repository";

export type DashboardModuleSearch = {
  range: DashboardRange;
  lines: MetroLine[];
  carSeries?: number[];
};

export type LineEvolutionModuleData = Pick<DashboardData, "lineEvolution">;
export type TotalReportsModuleData = Pick<DashboardData, "totalReportsTrend">;
export type LineSummariesModuleData = Pick<DashboardData, "lineSummaries">;
export type CarSeriesModuleData = Pick<DashboardData, "carSeries">;
export type WorstCarsModuleData = Pick<DashboardData, "worstCars" | "carExplorer">;
export type HeatTrendModuleData = Pick<DashboardData, "trend">;
export type WorstHoursModuleData = Pick<DashboardData, "worstHours">;
export type LineDetailsModuleData = Pick<DashboardData, "lineCarReports">;

type BucketCountRow = {
  bucket_start: string;
  line: string;
  reports: number;
};

type LineSummaryRow = {
  line: string;
  reports: number;
  fresco_reports: number;
  calor_reports: number;
  infierno_reports: number;
  cars_reported: number;
  cars_without_ac_reported: number;
  latest_report_at: string | null;
  heat_index: number;
  weighted_heat: number;
  effective_reports: number;
  report_score: number;
  weighted_fleet_percentage: number;
  fleet_score: number;
};

type CarSummaryRow = {
  car: string;
  lines: string[];
  reports: number;
  fresco_reports: number;
  calor_reports: number;
  infierno_reports: number;
};

type AllCarHistoryRow = {
  car: string;
  bucket_start: string;
  reports: number;
};

type CarSeriesRow = {
  series: number;
  reports: number;
};

type WorstHourRow = {
  madrid_hour: number;
  reports: number;
};

type HeatTrendRow = {
  bucket_start: string;
  line: string;
  heat_index: number;
};

type LineCarReportRow = {
  line: string;
  car: string;
  reports: number;
  fresco_reports: number;
  calor_reports: number;
  infierno_reports: number;
};

export async function getLineEvolutionModule(search: DashboardModuleSearch, now = new Date()): Promise<LineEvolutionModuleData> {
  if (search.carSeries?.length) return { lineEvolution: (await getFallbackDashboard(search, now)).lineEvolution };
  const rows = await getBucketCountRows(search, now, "chart");
  if (!rows) return { lineEvolution: (await getFallbackDashboard(search, now)).lineEvolution };
  return { lineEvolution: buildLineEvolutionFromRows(rows, now, search.range) };
}

export async function getTotalReportsModule(search: DashboardModuleSearch, now = new Date()): Promise<TotalReportsModuleData> {
  if (search.carSeries?.length) return { totalReportsTrend: (await getFallbackDashboard(search, now)).totalReportsTrend };
  const rows = await getBucketCountRows(search, now, "day");
  if (!rows) return { totalReportsTrend: (await getFallbackDashboard(search, now)).totalReportsTrend };
  return { totalReportsTrend: buildTotalReportsFromRows(rows, now, search.range) };
}

export async function getLineSummariesModule(search: DashboardModuleSearch, now = new Date()): Promise<LineSummariesModuleData> {
  if (search.carSeries?.length) return { lineSummaries: (await getFallbackDashboard(search, now)).lineSummaries };
  const summaries = await getSqlLineSummaries(search, now);
  return { lineSummaries: summaries ?? (await getFallbackDashboard(search, now)).lineSummaries };
}

export async function getCarSeriesModule(search: DashboardModuleSearch, now = new Date()): Promise<CarSeriesModuleData> {
  const supabase = getSupabase();
  if (!supabase) return { carSeries: (await getFallbackDashboard(search, now)).carSeries };
  const window = getRangeWindow(search.range, now);
  const { data, error } = await supabase.rpc("dashboard_car_series", {
    input_start: window.start.toISOString(),
    input_end: window.end.toISOString(),
    input_lines: selectedLinesArg(search.lines),
  });
  if (error) throw error;
  return {
    carSeries: ((data ?? []) as CarSeriesRow[]).map((row) => ({
      series: row.series,
      label: String(row.series),
      reports: row.reports,
    })),
  };
}

export async function getWorstCarsModule(search: DashboardModuleSearch, initialCar: string | null, now = new Date()): Promise<WorstCarsModuleData> {
  if (search.carSeries?.length) {
    const fallback = await getFallbackDashboard(search, now);
    return { worstCars: fallback.worstCars, carExplorer: fallback.carExplorer };
  }
  const supabase = getSupabase();
  if (!supabase) {
    const fallback = await getFallbackDashboard(search, now);
    return { worstCars: fallback.worstCars, carExplorer: fallback.carExplorer };
  }
  const window = getRangeWindow(search.range, now);
  const { data, error } = await supabase.rpc("dashboard_car_summaries", {
    input_start: window.start.toISOString(),
    input_end: window.end.toISOString(),
    input_lines: selectedLinesArg(search.lines),
  });
  if (error) throw error;

  const options = ((data ?? []) as CarSummaryRow[]).map(toCarExplorerOption);
  const worstCars = options
    .filter((car) => car.heatReports > 0)
    .slice(0, DASHBOARD_LIMITS.worstCarCount)
    .map((car) => ({
      car: car.car,
      lines: car.lines,
      reports: car.heatReports,
      totalReports: car.reports,
      heatReports: car.heatReports,
      calorReports: car.calorReports,
      infiernoReports: car.infiernoReports,
      confidence: confidenceFromCounts(car.reports, car.frescoReports, car.heatReports),
    }));

  const selections = await getCarExplorerSelections(options, search, now);
  const defaultOption = options[0] ?? null;
  const defaultCar = selections.find((selection) => selection.car === defaultOption?.car) ?? null;

  return {
    worstCars,
    carExplorer: {
      options,
      selections,
      defaultCar,
    },
  };
}

export async function getHeatTrendModule(search: DashboardModuleSearch, now = new Date()): Promise<HeatTrendModuleData> {
  if (search.carSeries?.length) {
    const fallback = await getFallbackDashboard(search, now);
    return { trend: fallback.trend };
  }
  const trend = await getSqlHeatTrend(search, now);
  return { trend: trend ?? (await getFallbackDashboard(search, now)).trend };
}

export async function getWorstHoursModule(search: DashboardModuleSearch, now = new Date()): Promise<WorstHoursModuleData> {
  if (search.carSeries?.length) return { worstHours: (await getFallbackDashboard(search, now)).worstHours };
  const supabase = getSupabase();
  if (!supabase) return { worstHours: (await getFallbackDashboard(search, now)).worstHours };
  const window = getRangeWindow(search.range, now);
  const { data, error } = await supabase.rpc("dashboard_worst_hours", {
    input_start: window.start.toISOString(),
    input_end: window.end.toISOString(),
    input_lines: selectedLinesArg(search.lines),
  });
  if (error) throw error;
  const counts = new Map(((data ?? []) as WorstHourRow[]).map((row) => [row.madrid_hour, row.reports]));
  return {
    worstHours: Array.from({ length: DASHBOARD_TIME.worstHourEnd - DASHBOARD_TIME.worstHourStart + 1 }, (_, index): HourlyReportSummary => {
      const hour = index + DASHBOARD_TIME.worstHourStart;
      return { hour, label: `${hour}h`, reports: counts.get(hour) ?? 0 };
    }),
  };
}

export async function getLineDetailsModule(search: DashboardModuleSearch, now = new Date()): Promise<LineDetailsModuleData> {
  if (search.carSeries?.length) return { lineCarReports: (await getFallbackDashboard(search, now)).lineCarReports };
  const lineCarReports = await getSqlLineCarReports(search, now);
  return {
    lineCarReports: lineCarReports ?? (await getFallbackDashboard(search, now)).lineCarReports,
  };
}

async function getFallbackDashboard(search: DashboardModuleSearch, now: Date) {
  return getReportsForDashboard({ range: search.range, lines: search.lines.length ? search.lines : null, carSeries: search.carSeries, now });
}

async function getBucketCountRows(search: DashboardModuleSearch, now: Date, bucketKind: "chart" | "day") {
  const supabase = getSupabase();
  if (!supabase) return null;
  const window = getRangeWindow(search.range, now);
  const bucketSeconds = getBucketSeconds(search.range, bucketKind);
  const { data, error } = await supabase.rpc("dashboard_bucket_counts", {
    input_start: window.start.toISOString(),
    input_end: window.end.toISOString(),
    input_bucket_seconds: bucketSeconds,
    input_lines: selectedLinesArg(search.lines),
  });
  if (error) throw error;
  return (data ?? []) as BucketCountRow[];
}

async function getSqlLineSummaries(search: DashboardModuleSearch, now: Date) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const window = getRangeWindow(search.range, now);
  const indexStart = getRangeWindow("summer", now).start;
  const { data, error } = await supabase.rpc("dashboard_line_summaries", {
    input_visible_start: window.start.toISOString(),
    input_visible_end: window.end.toISOString(),
    input_index_start: indexStart.toISOString(),
    input_lines: selectedLinesArg(search.lines),
    input_as_of: now.toISOString(),
  });
  if (error) throw error;
  return ((data ?? []) as LineSummaryRow[])
    .filter((row) => isMetroLine(row.line))
    .map(toLineSummary)
    .sort((a, b) => b.score - a.score || b.reports - a.reports);
}

async function getSqlLineCarReports(search: DashboardModuleSearch, now: Date) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const window = getRangeWindow(search.range, now);
  const { data, error } = await supabase.rpc("dashboard_line_car_reports", {
    input_start: window.start.toISOString(),
    input_end: window.end.toISOString(),
    input_lines: selectedLinesArg(search.lines),
  });
  if (error) throw error;
  const byLine = new Map<MetroLine, LineCarReportSummary["cars"]>();
  for (const row of (data ?? []) as LineCarReportRow[]) {
    if (!isMetroLine(row.line)) continue;
    const cars = byLine.get(row.line) ?? [];
    cars.push({
      car: row.car,
      reports: row.reports,
      frescoReports: row.fresco_reports,
      heatReports: row.calor_reports + row.infierno_reports,
      calorReports: row.calor_reports,
      infiernoReports: row.infierno_reports,
    });
    byLine.set(row.line, cars);
  }
  return METRO_LINES.map((line) => {
    const cars = (byLine.get(line) ?? []).toSorted((a, b) => b.reports - a.reports || a.car.localeCompare(b.car));
    return { line, totalCars: cars.length, cars };
  });
}

async function getSqlHeatTrend(search: DashboardModuleSearch, now: Date) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const window = getRangeWindow(search.range, now);
  const [trendResult, bucketRows] = await Promise.all([
    supabase.rpc("dashboard_heat_trend", {
      input_range_start: window.start.toISOString(),
      input_range_end: window.end.toISOString(),
      input_index_start: getRangeWindow("summer", now).start.toISOString(),
      input_bucket_seconds: getBucketSeconds(search.range, "chart"),
      input_lines: selectedLinesArg(search.lines),
      input_as_of: now.toISOString(),
    }),
    getBucketCountRows(search, now, "chart"),
  ]);
  if (trendResult.error) throw trendResult.error;
  if (!bucketRows) return null;
  const heatCounts = new Map<number, Map<MetroLine, number>>();
  for (const row of (trendResult.data ?? []) as HeatTrendRow[]) {
    if (!isMetroLine(row.line)) continue;
    const bucketKey = new Date(row.bucket_start).getTime();
    const lineCounts = heatCounts.get(bucketKey) ?? new Map<MetroLine, number>();
    lineCounts.set(row.line, row.heat_index);
    heatCounts.set(bucketKey, lineCounts);
  }
  const reportCounts = buildBucketLineCountMap(bucketRows);
  return buildDashboardBuckets(now, search.range).map((bucket): TrendPoint => {
    const point: TrendPoint = {
      label: bucket.label,
      reports: sumLineCounts(reportCounts.get(bucket.start.getTime())),
    };
    for (const line of METRO_LINES) {
      point[line] = heatCounts.get(bucket.start.getTime())?.get(line) ?? 0;
    }
    return point;
  });
}

async function getCarExplorerSelections(options: CarExplorerOption[], search: DashboardModuleSearch, now: Date): Promise<CarExplorerSelection[]> {
  const supabase = getSupabase();
  const buckets = buildDashboardBuckets(now, search.range);
  if (!supabase) {
    return options.map((option) => ({
      ...option,
      history: buckets.map((bucket) => ({ label: bucket.label, reports: 0 })),
    }));
  }
  const window = getRangeWindow(search.range, now);
  const { data, error } = await supabase.rpc("dashboard_car_histories", {
    input_start: window.start.toISOString(),
    input_end: window.end.toISOString(),
    input_bucket_seconds: getBucketSeconds(search.range, "chart"),
    input_lines: selectedLinesArg(search.lines),
  });
  if (error) throw error;
  const counts = new Map<string, Map<number, number>>();
  for (const row of (data ?? []) as AllCarHistoryRow[]) {
    const carCounts = counts.get(row.car) ?? new Map<number, number>();
    carCounts.set(new Date(row.bucket_start).getTime(), row.reports);
    counts.set(row.car, carCounts);
  }
  return options.map((option) => ({
    ...option,
    history: buckets.map((bucket) => ({
      label: bucket.label,
      reports: counts.get(option.car)?.get(bucket.start.getTime()) ?? 0,
    })),
  }));
}

function buildLineEvolutionFromRows(rows: BucketCountRow[], now: Date, range: DashboardRange): LineEvolutionPoint[] {
  const counts = buildBucketLineCountMap(rows);
  return buildDashboardBuckets(now, range).map((bucket) => {
    const point: LineEvolutionPoint = { label: bucket.label };
    for (const line of METRO_LINES) {
      point[line] = counts.get(bucket.start.getTime())?.get(line) ?? 0;
    }
    return point;
  });
}

function buildTotalReportsFromRows(rows: BucketCountRow[], now: Date, range: DashboardRange): TotalReportsPoint[] {
  const counts = buildBucketLineCountMap(rows);
  return buildDashboardDayBuckets(now, range).map((bucket) => ({
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

function toLineSummary(row: LineSummaryRow): LineSummary {
  const reports = row.reports;
  const heatReports = row.calor_reports + row.infierno_reports;
  const heatIndex: HeatIndexDiagnostics = {
    heat_index: row.heat_index,
    weighted_heat: row.weighted_heat,
    effective_reports: row.effective_reports,
    report_score: row.report_score,
    weighted_fleet_percentage: row.weighted_fleet_percentage,
    fleet_score: row.fleet_score,
  };
  return {
    line: row.line as MetroLine,
    score: row.heat_index,
    heatIndex,
    tone: getHeatTone(row.heat_index),
    reports,
    confidence: confidenceFromCounts(reports, row.fresco_reports, heatReports),
    disagreement: disagreementFromCounts(reports, row.fresco_reports, heatReports),
    latestReportAt: row.latest_report_at ? new Date(row.latest_report_at) : null,
    carsReported: row.cars_reported,
    carsWithoutAcReported: row.cars_without_ac_reported,
    estimatedCars: ESTIMATED_TOTAL_CARS[row.line as MetroLine],
  };
}

function toCarExplorerOption(row: CarSummaryRow): CarExplorerOption & { frescoReports: number } {
  const lines = row.lines.filter(isMetroLine).sort((a, b) => a.localeCompare(b));
  return {
    car: row.car,
    reports: row.reports,
    frescoReports: row.fresco_reports,
    heatReports: row.calor_reports + row.infierno_reports,
    calorReports: row.calor_reports,
    infiernoReports: row.infierno_reports,
    lines,
  };
}

function confidenceFromCounts(totalReports: number, frescoReports: number, heatReports: number): Confidence {
  const reports = reportsFromCounts(frescoReports, heatReports);
  if (reports.length === totalReports) return getConfidence(reports);
  if (totalReports < 3) return "low";
  const agreement = Math.max(frescoReports, heatReports) / totalReports;
  if (totalReports >= 10 && agreement >= 0.7) return "high";
  if (totalReports >= 5 && agreement >= 0.55) return "medium";
  return "low";
}

function disagreementFromCounts(totalReports: number, frescoReports: number, heatReports: number) {
  if (totalReports === 0) return 100;
  const reports = reportsFromCounts(frescoReports, heatReports);
  if (reports.length === totalReports) return Math.round((1 - getAgreement(reports)) * 100);
  return Math.round((1 - Math.max(frescoReports, heatReports) / totalReports) * 100);
}

function reportsFromCounts(frescoReports: number, heatReports: number) {
  return [
    ...Array.from({ length: frescoReports }, () => ({ state: "fresco" as HeatState, createdAt: new Date() })),
    ...Array.from({ length: heatReports }, () => ({ state: "calor" as HeatState, createdAt: new Date() })),
  ];
}

function selectedLinesArg(lines: MetroLine[]) {
  return lines.length > 0 ? lines : null;
}

function getBucketSeconds(range: DashboardRange, bucketKind: "chart" | "day") {
  const secondsPerHour = DASHBOARD_TIME.millisecondsPerHour / 1000;
  const secondsPerDay = secondsPerHour * DASHBOARD_TIME.hoursPerDay;
  if (bucketKind === "day") return secondsPerDay;
  return range === "today" || range === "last24Hours" ? secondsPerHour : secondsPerDay;
}
