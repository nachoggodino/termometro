import {
  calculateMetroHeatIndex,
  getAgreement,
  getConfidence,
  getHeatTone,
  getWeightedHeatScore,
  type Confidence,
  type HeatIndexDiagnostics,
  type HeatState,
} from "./heat";
import { ESTIMATED_TOTAL_CARS } from "./fleet-estimates";
import { METRO_LINES, type MetroLine } from "./lines";
import { getRangeWindow, type TimeRange } from "./ranges";
import type { Report } from "./reports";

export const DASHBOARD_LIMITS = {
  topLineCount: 6,
  recentReportCount: 25,
  worstCarCount: 8,
} as const;

export type LineSummary = {
  line: MetroLine;
  score: number;
  heatIndex: HeatIndexDiagnostics;
  tone: HeatState;
  reports: number;
  confidence: Confidence;
  disagreement: number;
  latestReportAt: Date | null;
  carsReported: number;
  carsWithoutAcReported: number;
  estimatedCars: number;
};

export type CarSummary = {
  car: string;
  lines: MetroLine[];
  reports: number;
  totalReports: number;
  heatReports: number;
  calorReports: number;
  infiernoReports: number;
  confidence: Confidence;
};

export type CarExplorerOption = {
  car: string;
  reports: number;
  heatReports: number;
  calorReports: number;
  infiernoReports: number;
  lines: MetroLine[];
};

export type CarExplorerSelection = CarExplorerOption & {
  history: TrendPoint[];
};

export type TrendPoint = {
  label: string;
  reports: number;
} & Partial<Record<MetroLine, number>>;

export type LineEvolutionPoint = {
  label: string;
} & Partial<Record<MetroLine, number>>;

export type DashboardData = {
  lineSummaries: LineSummary[];
  worstCars: CarSummary[];
  carExplorer: {
    options: CarExplorerOption[];
    selections: CarExplorerSelection[];
    defaultCar: CarExplorerSelection | null;
  };
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
  const usableReports = reports.filter((report) => !report.hiddenAt);
  const visibleReports = usableReports.filter((report) => report.createdAt >= rangeWindow.start && report.createdAt <= rangeWindow.end);
  const recentReports = usableReports.filter((report) => report.createdAt <= rangeWindow.end);
  const summerStart = getRangeWindow("summer", now).start;
  const lineSummaries = METRO_LINES.map((line) => {
    const lineReports = visibleReports.filter((report) => report.line === line);
    const lineIndexReports = usableReports.filter((report) => report.line === line && report.createdAt >= summerStart && report.createdAt <= rangeWindow.end);
    const reportedCars = new Set(lineReports.map((report) => report.car).filter(Boolean));
    const reportedCarsWithoutAc = new Set(lineReports.filter((report) => report.state !== "fresco").map((report) => report.car).filter(Boolean));
    const heatIndex = calculateMetroHeatIndex(lineIndexReports, estimatedCarsByLine[line], rangeWindow.end);
    const score = heatIndex.heat_index;
    const latestReportAt =
      lineReports.length > 0
        ? lineReports.toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
        : null;
    return {
      line,
      score,
      heatIndex,
      tone: getHeatTone(score),
      reports: lineReports.length,
      confidence: getConfidence(lineReports),
      disagreement: Math.round((1 - getAgreement(lineReports)) * 100),
      latestReportAt,
      carsReported: reportedCars.size,
      carsWithoutAcReported: reportedCarsWithoutAc.size,
      estimatedCars: estimatedCarsByLine[line],
    };
  }).sort((a, b) => b.score - a.score || b.reports - a.reports);

  const carGroups = new Map<string, Report[]>();
  for (const report of visibleReports) {
    if (!report.car) continue;
    carGroups.set(report.car, [...(carGroups.get(report.car) ?? []), report]);
  }

  const worstCars = Array.from(carGroups.entries())
    .map(([car, carReports]) => {
      const heatCounts = getCarHeatCounts(carReports);
      return {
        car,
        lines: getReportedLines(carReports),
        heatSortScore: getWeightedHeatScore(carReports, now),
        reports: heatCounts.heatReports,
        totalReports: carReports.length,
        ...heatCounts,
        confidence: getConfidence(carReports),
      };
    })
    .filter((car) => car.heatReports > 0)
    .sort((a, b) => b.heatReports - a.heatReports || b.heatSortScore - a.heatSortScore || a.car.localeCompare(b.car))
    .slice(0, DASHBOARD_LIMITS.worstCarCount)
    .map(({ car, lines, reports, totalReports, heatReports, calorReports, infiernoReports, confidence }) => ({
      car,
      lines,
      reports,
      totalReports,
      heatReports,
      calorReports,
      infiernoReports,
      confidence,
    }));

  const carExplorerOptions = buildCarExplorerOptions(visibleReports);
  const carExplorerSelections = carExplorerOptions
    .map((option) => buildCarExplorerSelection(option.car, visibleReports, now, range, carExplorerOptions))
    .filter((selection): selection is CarExplorerSelection => selection !== null);
  const defaultCar = carExplorerSelections[0] ?? null;
  const trend = buildTrend(usableReports, now, range, estimatedCarsByLine);
  const lineEvolution = buildLineEvolution(visibleReports, now, range, lineSummaries);
  const dayAgo = new Date(now.getTime() - 24 * 3_600_000);
  const reportsLastDay = visibleReports.filter((report) => report.createdAt >= dayAgo).length;

  return {
    lineSummaries,
    worstCars,
    carExplorer: {
      options: carExplorerOptions,
      selections: carExplorerSelections,
      defaultCar,
    },
    trend,
    lineEvolution,
    recentReports: recentReports.toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, DASHBOARD_LIMITS.recentReportCount),
    reportsLastDay,
  };
}

export function buildCarExplorerSelection(
  car: string,
  reports: Report[],
  now: Date,
  range: TimeRange,
  options = buildCarExplorerOptions(reports),
): CarExplorerSelection | null {
  const option = options.find((item) => item.car === car);
  if (!option) return null;
  const carReports = reports.filter((report) => report.car === car);
  return {
    ...option,
    history: buildBuckets(now, range).map((bucket) => ({
      label: bucket.label,
      reports: carReports.filter((report) => report.createdAt >= bucket.start && report.createdAt < bucket.end).length,
    })),
  };
}

function buildCarExplorerOptions(reports: Report[]) {
  const carGroups = new Map<string, Report[]>();
  for (const report of reports) {
    if (!report.car) continue;
    carGroups.set(report.car, [...(carGroups.get(report.car) ?? []), report]);
  }

  return Array.from(carGroups.entries())
    .map(([car, carReports]) => ({
      car,
      reports: carReports.length,
      ...getCarHeatCounts(carReports),
      lines: getReportedLines(carReports),
    }))
    .toSorted((a, b) => b.heatReports - a.heatReports || b.reports - a.reports || a.car.localeCompare(b.car));
}

function getReportedLines(reports: Report[]) {
  return Array.from(new Set(reports.map((report) => report.line))).sort((a, b) => a.localeCompare(b)) as MetroLine[];
}

function getCarHeatCounts(reports: Report[]) {
  const calorReports = reports.filter((report) => report.state === "calor").length;
  const infiernoReports = reports.filter((report) => report.state === "infierno").length;
  return {
    heatReports: calorReports + infiernoReports,
    calorReports,
    infiernoReports,
  };
}

function buildTrend(
  reports: Report[],
  now: Date,
  range: TimeRange,
  estimatedCarsByLine: Record<MetroLine, number> = ESTIMATED_TOTAL_CARS,
): TrendPoint[] {
  const summerStart = getRangeWindow("summer", now).start;
  return buildBuckets(now, range).map((bucket) => {
    const bucketReports = reports.filter((report) => report.createdAt >= bucket.start && report.createdAt < bucket.end);
    const accumulatedReports = reports.filter((report) => report.createdAt >= summerStart && report.createdAt < bucket.end);
    const point: TrendPoint = {
      label: bucket.label,
      reports: bucketReports.length,
    };
    for (const line of METRO_LINES) {
      const bucketAsOf = bucket.end < now ? bucket.end : now;
      const lineReports = accumulatedReports.filter((report) => report.line === line && report.createdAt < bucketAsOf);
      point[line] = getHeatEvolutionScore(lineReports, estimatedCarsByLine[line], bucketAsOf);
    }
    return point;
  });
}

function buildLineEvolution(
  reports: Report[],
  now: Date,
  range: TimeRange,
  lineSummaries: LineSummary[],
): LineEvolutionPoint[] {
  const lines = lineSummaries.map((summary) => summary.line);

  return buildBuckets(now, range).map((bucket) => {
    const point: LineEvolutionPoint = { label: bucket.label };
    for (const line of lines) {
      point[line] = reports.filter((report) => report.line === line && report.createdAt >= bucket.start && report.createdAt < bucket.end).length;
    }
    return point;
  });
}

export function getHeatEvolutionScore(
  reports: Array<{ state: HeatState; car: string | null; createdAt: Date }>,
  estimatedCars = 1,
  now = new Date(),
) {
  return calculateMetroHeatIndex(reports, estimatedCars, now).heat_index;
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
