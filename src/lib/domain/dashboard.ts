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
import { getRangeWindow, type DashboardRange } from "./ranges";
import type { Report } from "./reports";
import { APP_TIME_ZONE, getMadridStartOfDay } from "./time";

export const DASHBOARD_LIMITS = {
  topLineCount: 6,
  recentReportCount: 25,
  worstCarCollapsedCount: 4,
  worstCarCount: 15,
  fleetCollapsedCount: 5,
} as const;

export const DASHBOARD_TIME = {
  millisecondsPerHour: 3_600_000,
  hoursPerDay: 24,
  worstHourStart: 5,
  worstHourEnd: 23,
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

export type TotalReportsPoint = {
  label: string;
  reports: number;
};

export type CarSeriesSummary = {
  series: number;
  label: string;
  reports: number;
};

export type HourlyReportSummary = {
  hour: number;
  label: string;
  reports: number;
};

export type LineCarReportSummary = {
  line: MetroLine;
  totalCars: number;
  cars: Array<{
    car: string;
    reports: number;
    frescoReports: number;
    heatReports: number;
    calorReports: number;
    infiernoReports: number;
  }>;
};

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
  totalReportsTrend: TotalReportsPoint[];
  carSeries: CarSeriesSummary[];
  worstHours: HourlyReportSummary[];
  lineCarReports: LineCarReportSummary[];
  recentReports: Report[];
  reportsLastDay: number;
};

export function buildDashboardData(
  reports: Report[],
  now = new Date(),
  estimatedCarsByLine: Record<MetroLine, number> = ESTIMATED_TOTAL_CARS,
  range: DashboardRange = "sevenDays",
): DashboardData {
  const rangeWindow = getRangeWindow(range, now);
  const usableReports = reports.filter((report) => !report.hiddenAt);
  const visibleReports = usableReports.filter((report) => report.createdAt >= rangeWindow.start && report.createdAt <= rangeWindow.end);
  const recentReports =
    range === "last24Hours" ? visibleReports : usableReports.filter((report) => report.createdAt <= rangeWindow.end);
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
    pushGroupedReport(carGroups, report.car, report);
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
  const totalReportsTrend = buildTotalReportsTrend(visibleReports, now, range);
  const carSeries = buildCarSeries(visibleReports);
  const worstHours = buildWorstHours(visibleReports);
  const lineCarReports = buildLineCarReports(visibleReports);
  const dayAgo = new Date(now.getTime() - DASHBOARD_TIME.hoursPerDay * DASHBOARD_TIME.millisecondsPerHour);
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
    totalReportsTrend,
    carSeries,
    worstHours,
    lineCarReports,
    recentReports: recentReports.toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, DASHBOARD_LIMITS.recentReportCount),
    reportsLastDay,
  };
}

export function buildCarExplorerSelection(
  car: string,
  reports: Report[],
  now: Date,
  range: DashboardRange,
  options = buildCarExplorerOptions(reports),
): CarExplorerSelection | null {
  const option = options.find((item) => item.car === car);
  if (!option) return null;
  const carReports = reports.filter((report) => report.car === car);
  return {
    ...option,
    history: buildDashboardBuckets(now, range).map((bucket) => ({
      label: bucket.label,
      reports: carReports.filter((report) => report.createdAt >= bucket.start && report.createdAt < bucket.end).length,
    })),
  };
}

function buildCarExplorerOptions(reports: Report[]) {
  const carGroups = new Map<string, Report[]>();
  for (const report of reports) {
    if (!report.car) continue;
    pushGroupedReport(carGroups, report.car, report);
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

function pushGroupedReport(groups: Map<string, Report[]>, key: string, report: Report) {
  const groupedReports = groups.get(key);
  if (groupedReports) {
    groupedReports.push(report);
    return;
  }
  groups.set(key, [report]);
}

function getCarHeatCounts(reports: Report[]) {
  const { heatReports, calorReports, infiernoReports } = getCarStateCounts(reports);
  return { heatReports, calorReports, infiernoReports };
}

function getCarStateCounts(reports: Report[]) {
  let frescoReports = 0;
  let calorReports = 0;
  let infiernoReports = 0;
  for (const report of reports) {
    if (report.state === "fresco") frescoReports += 1;
    if (report.state === "calor") calorReports += 1;
    if (report.state === "infierno") infiernoReports += 1;
  }
  return {
    frescoReports,
    heatReports: calorReports + infiernoReports,
    calorReports,
    infiernoReports,
  };
}

function buildTrend(
  reports: Report[],
  now: Date,
  range: DashboardRange,
  estimatedCarsByLine: Record<MetroLine, number> = ESTIMATED_TOTAL_CARS,
): TrendPoint[] {
  const summerStart = getRangeWindow("summer", now).start;
  return buildDashboardBuckets(now, range).map((bucket) => {
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
  range: DashboardRange,
  lineSummaries: LineSummary[],
): LineEvolutionPoint[] {
  const lines = lineSummaries.map((summary) => summary.line);

  return buildDashboardBuckets(now, range).map((bucket) => {
    const point: LineEvolutionPoint = { label: bucket.label };
    for (const line of lines) {
      point[line] = reports.filter((report) => report.line === line && report.createdAt >= bucket.start && report.createdAt < bucket.end).length;
    }
    return point;
  });
}

function buildTotalReportsTrend(reports: Report[], now: Date, range: DashboardRange): TotalReportsPoint[] {
  return buildDashboardDayBuckets(now, range).map((bucket) => ({
    label: bucket.label,
    reports: reports.filter((report) => report.createdAt >= bucket.start && report.createdAt < bucket.end).length,
  }));
}

function buildCarSeries(reports: Report[]): CarSeriesSummary[] {
  const seriesCounts = new Map<number, number>();
  for (const report of reports) {
    if (!report.car) continue;
    const series = getCarSeries(report.car);
    if (!series) continue;
    seriesCounts.set(series, (seriesCounts.get(series) ?? 0) + 1);
  }

  return Array.from(seriesCounts.entries())
    .map(([series, reports]) => ({
      series,
      label: String(series),
      reports,
    }))
    .toSorted((a, b) => a.series - b.series);
}

function buildWorstHours(reports: Report[]): HourlyReportSummary[] {
  const reportCountsByHour = new Map<number, number>();
  for (const report of reports) {
    const hour = getMadridHour(report.createdAt);
    reportCountsByHour.set(hour, (reportCountsByHour.get(hour) ?? 0) + 1);
  }

  return Array.from({ length: DASHBOARD_TIME.worstHourEnd - DASHBOARD_TIME.worstHourStart + 1 }, (_, index) => {
    const hour = index + DASHBOARD_TIME.worstHourStart;
    return {
      hour,
      label: String(hour),
      reports: reportCountsByHour.get(hour) ?? 0,
    };
  });
}

function buildLineCarReports(reports: Report[]): LineCarReportSummary[] {
  return METRO_LINES.map((line) => {
    const cars = new Map<string, Report[]>();
    for (const report of reports) {
      if (report.line !== line || !report.car) continue;
      pushGroupedReport(cars, report.car, report);
    }
    const sortedCars = Array.from(cars.entries())
      .map(([car, carReports]) => ({
        car,
        reports: carReports.length,
        ...getCarStateCounts(carReports),
      }))
      .toSorted((a, b) => b.reports - a.reports || a.car.localeCompare(b.car));
    return {
      line,
      totalCars: sortedCars.length,
      cars: sortedCars,
    };
  });
}

export function buildDashboardDayBuckets(now: Date, range: DashboardRange) {
  const rangeWindow = getRangeWindow(range, now);
  const buckets = [];
  for (let offset = 0; ; offset += 1) {
    const bucketStart = getMadridStartOfDay(rangeWindow.start, offset);
    if (bucketStart > rangeWindow.end) break;
    const bucketEnd = getMadridStartOfDay(rangeWindow.start, offset + 1);
    buckets.push({
      start: bucketStart,
      end: bucketEnd,
      label: bucketStart.toLocaleDateString("es-ES", {
        ...(range === "today" || range === "last24Hours" || range === "sevenDays"
          ? { weekday: "short" as const }
          : { day: "2-digit" as const, month: "short" as const }),
        timeZone: APP_TIME_ZONE,
      }),
    });
  }
  return buckets;
}

export function getCarSeries(car: string) {
  const digits = car.match(/\d+/)?.[0];
  if (!digits) return null;
  const code = Number(digits);
  if (!Number.isFinite(code)) return null;
  return Math.floor(code / 1000) * 1000;
}

function getMadridHour(date: Date) {
  return Number(date.toLocaleTimeString("es-ES", { hour: "2-digit", hourCycle: "h23", timeZone: APP_TIME_ZONE }));
}

export function getHeatEvolutionScore(
  reports: Array<{ state: HeatState; car: string | null; createdAt: Date }>,
  estimatedCars = 1,
  now = new Date(),
) {
  return calculateMetroHeatIndex(reports, estimatedCars, now).heat_index;
}

export function buildDashboardBuckets(now: Date, range: DashboardRange) {
  const rangeWindow = getRangeWindow(range, now);
  if (range === "today" || range === "last24Hours") {
    const start = rangeWindow.start;
    return Array.from({ length: DASHBOARD_TIME.hoursPerDay }, (_, hour) => {
      const bucketStart = new Date(start.getTime() + hour * DASHBOARD_TIME.millisecondsPerHour);
      const bucketEnd = new Date(bucketStart.getTime() + DASHBOARD_TIME.millisecondsPerHour);
      return {
        start: bucketStart,
        end: bucketEnd,
        label: bucketStart.toLocaleTimeString("es-ES", { hour: "2-digit", timeZone: APP_TIME_ZONE }),
      };
    });
  }

  const buckets = [];
  for (let offset = 0; ; offset += 1) {
    const bucketStart = getMadridStartOfDay(rangeWindow.start, offset);
    if (bucketStart > rangeWindow.end) break;
    const bucketEnd = getMadridStartOfDay(rangeWindow.start, offset + 1);
    buckets.push({
      start: bucketStart,
      end: bucketEnd,
      label: bucketStart.toLocaleDateString("es-ES", {
        ...(range === "sevenDays" ? { weekday: "short" as const } : { day: "2-digit" as const, month: "short" as const }),
        timeZone: APP_TIME_ZONE,
      }),
    });
  }
  return buckets;
}
