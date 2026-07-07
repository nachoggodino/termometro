import { getAgreement, getConfidence, getHeatTone, getWeightedHeatScore, type Confidence, type HeatState } from "./heat";
import { ESTIMATED_TOTAL_CARS } from "./fleet-estimates";
import { METRO_LINES, type MetroLine } from "./lines";
import { getRangeWindow, type TimeRange } from "./ranges";
import type { Report } from "./reports";

export const DASHBOARD_LIMITS = {
  topLineCount: 6,
  summaryLineCount: 3,
  recentReportCount: 12,
  worstCarCount: 8,
} as const;

export type LineSummary = {
  line: MetroLine;
  score: number;
  tone: HeatState;
  reports: number;
  confidence: Confidence;
  disagreement: number;
  latestReportAt: Date | null;
  carsReported: number;
  estimatedCars: number;
};

export type CarSummary = {
  car: string;
  line: MetroLine;
  score: number;
  reports: number;
  confidence: Confidence;
};

export type TrendPoint = {
  label: string;
  score: number;
  reports: number;
};

export type LineEvolutionPoint = {
  label: string;
} & Partial<Record<MetroLine, number>>;

export type DashboardData = {
  lineSummaries: LineSummary[];
  worstCars: CarSummary[];
  trend: TrendPoint[];
  lineEvolution: LineEvolutionPoint[];
  recentReports: Report[];
  reportsLastDay: number;
};

export function buildDashboardData(
  reports: Report[],
  now = new Date(),
  estimatedCarsByLine: Record<MetroLine, number> = ESTIMATED_TOTAL_CARS,
  range: TimeRange = "sevenDays",
): DashboardData {
  const rangeWindow = getRangeWindow(range, now);
  const visibleReports = reports.filter((report) => !report.hiddenAt && report.createdAt >= rangeWindow.start && report.createdAt <= rangeWindow.end);
  const lineSummaries = METRO_LINES.map((line) => {
    const lineReports = visibleReports.filter((report) => report.line === line);
    const reportedCars = new Set(lineReports.map((report) => report.car).filter(Boolean));
    const score = getWeightedHeatScore(lineReports, now);
    const latestReportAt =
      lineReports.length > 0
        ? lineReports.toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
        : null;
    return {
      line,
      score,
      tone: getHeatTone(score),
      reports: lineReports.length,
      confidence: getConfidence(lineReports),
      disagreement: Math.round((1 - getAgreement(lineReports)) * 100),
      latestReportAt,
      carsReported: reportedCars.size,
      estimatedCars: estimatedCarsByLine[line],
    };
  }).sort((a, b) => b.score - a.score || b.reports - a.reports);

  const carGroups = new Map<string, Report[]>();
  for (const report of visibleReports) {
    if (!report.car) continue;
    const key = `${report.line}:${report.car}`;
    carGroups.set(key, [...(carGroups.get(key) ?? []), report]);
  }

  const worstCars = Array.from(carGroups.entries())
    .map(([key, carReports]) => {
      const [line, car] = key.split(":") as [MetroLine, string];
      return {
        line,
        car,
        score: getWeightedHeatScore(carReports, now),
        reports: carReports.length,
        confidence: getConfidence(carReports),
      };
    })
    .sort((a, b) => b.score - a.score || b.reports - a.reports)
    .slice(0, DASHBOARD_LIMITS.worstCarCount);

  const trend = buildTrend(visibleReports, now, range);
  const lineEvolution = buildLineEvolution(visibleReports, now, range, lineSummaries);
  const dayAgo = new Date(now.getTime() - 24 * 3_600_000);
  const reportsLastDay = visibleReports.filter((report) => report.createdAt >= dayAgo).length;

  return {
    lineSummaries,
    worstCars,
    trend,
    lineEvolution,
    recentReports: visibleReports.toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, DASHBOARD_LIMITS.recentReportCount),
    reportsLastDay,
  };
}

function buildTrend(reports: Report[], now: Date, range: TimeRange): TrendPoint[] {
  return buildBuckets(now, range).map((bucket) => {
    const bucketReports = reports.filter((report) => report.createdAt >= bucket.start && report.createdAt < bucket.end);
    return {
      label: bucket.label,
      score: getWeightedHeatScore(bucketReports, now),
      reports: bucketReports.length,
    };
  });
}

function buildLineEvolution(
  reports: Report[],
  now: Date,
  range: TimeRange,
  lineSummaries: LineSummary[],
): LineEvolutionPoint[] {
  const lines = lineSummaries
    .filter((summary) => summary.reports > 0)
    .toSorted((a, b) => b.reports - a.reports || b.score - a.score)
    .slice(0, 4)
    .map((summary) => summary.line);

  return buildBuckets(now, range).map((bucket) => {
    const point: LineEvolutionPoint = { label: bucket.label };
    for (const line of lines) {
      point[line] = reports.filter((report) => report.line === line && report.createdAt >= bucket.start && report.createdAt < bucket.end).length;
    }
    return point;
  });
}

function buildBuckets(now: Date, range: TimeRange) {
  const rangeWindow = getRangeWindow(range, now);
  if (range === "today") {
    const start = rangeWindow.start;
    return Array.from({ length: 24 }, (_, hour) => {
      const bucketStart = new Date(start);
      bucketStart.setHours(hour, 0, 0, 0);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setHours(hour + 1, 0, 0, 0);
      return {
        start: bucketStart,
        end: bucketEnd,
        label: bucketStart.toLocaleTimeString("es-ES", { hour: "2-digit" }),
      };
    });
  }

  const buckets = [];
  for (const day = new Date(rangeWindow.start); day <= rangeWindow.end; day.setDate(day.getDate() + 1)) {
    const bucketStart = new Date(day);
    bucketStart.setHours(0, 0, 0, 0);
    const bucketEnd = new Date(bucketStart);
    bucketEnd.setDate(bucketEnd.getDate() + 1);
    buckets.push({
      start: bucketStart,
      end: bucketEnd,
      label: bucketStart.toLocaleDateString("es-ES", range === "sevenDays" ? { weekday: "short" } : { day: "2-digit", month: "short" }),
    });
  }
  return buckets;
}
