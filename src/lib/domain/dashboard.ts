import { getAgreement, getConfidence, getHeatTone, getWeightedHeatScore, type Confidence, type HeatState } from "./heat";
import { ESTIMATED_TOTAL_CARS, METRO_LINES, type MetroLine } from "./lines";
import type { Report } from "./reports";

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

export type DashboardData = {
  lineSummaries: LineSummary[];
  worstCars: CarSummary[];
  trend: TrendPoint[];
  recentReports: Report[];
  reportsLastTwoHours: number;
  hottestLine: LineSummary | null;
};

export function buildDashboardData(reports: Report[], now = new Date()): DashboardData {
  const visibleReports = reports.filter((report) => !report.hiddenAt);
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
      estimatedCars: ESTIMATED_TOTAL_CARS[line],
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
    .slice(0, 8);

  const trend = buildTrend(visibleReports, now);
  const twoHoursAgo = new Date(now.getTime() - 2 * 3_600_000);
  const reportsLastTwoHours = visibleReports.filter((report) => report.createdAt >= twoHoursAgo).length;

  return {
    lineSummaries,
    worstCars,
    trend,
    recentReports: visibleReports.toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 18),
    reportsLastTwoHours,
    hottestLine: lineSummaries.find((summary) => summary.reports > 0) ?? null,
  };
}

function buildTrend(reports: Report[], now: Date): TrendPoint[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setDate(day.getDate() - (6 - index));
    const label = day.toLocaleDateString("es-ES", { weekday: "short" });
    const dayReports = reports.filter((report) => {
      return (
        report.createdAt.getFullYear() === day.getFullYear() &&
        report.createdAt.getMonth() === day.getMonth() &&
        report.createdAt.getDate() === day.getDate()
      );
    });
    return {
      label,
      score: getWeightedHeatScore(dayReports, now),
      reports: dayReports.length,
    };
  });
}
