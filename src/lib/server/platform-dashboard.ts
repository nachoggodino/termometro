import { buildDashboardBuckets, type TrendPoint } from "@/lib/domain/dashboard";
import {
  getConfidenceFromCounts,
  type Confidence,
  type HeatState,
} from "@/lib/domain/heat";
import { isMetroLine, METRO_LINES, type MetroLine } from "@/lib/domain/lines";
import { getPlatformHeatReports } from "@/lib/domain/platforms";
import { getRangeWindow, type DashboardRange } from "@/lib/domain/ranges";
import { getReportLocationKind, type Report } from "@/lib/domain/reports";
import { getStationById, getStationName } from "@/lib/domain/stations";
import type { Locale } from "@/lib/i18n/config";
import { getMemoryReportsSnapshot, getSupabase } from "./reports-repository";

export type PlatformSummary = {
  line: MetroLine;
  stationId: string;
  stationName: string;
  reports: number;
  frescoReports: number;
  calorReports: number;
  infiernoReports: number;
  heatReports: number;
  confidence: Confidence;
  latestReportAt: Date | null;
};

export type PlatformExplorerSelection = {
  stationId: string;
  stationName: string;
  lines: MetroLine[];
  reports: number;
  frescoReports: number;
  calorReports: number;
  infiernoReports: number;
  heatReports: number;
  confidence: Confidence;
  history: TrendPoint[];
};

export type PlatformDashboardData = {
  platformSummaries: PlatformSummary[];
};

type PlatformSummaryRow = {
  line: string;
  station_id: string;
  station_name: string;
  reports: number;
  fresco_reports: number;
  calor_reports: number;
  infierno_reports: number;
  latest_report_at: string | null;
};

type PlatformHistoryRow = {
  hour_start: string;
  line: string;
  state: HeatState;
  reports: number;
};

type NormalizedHistoryRow = {
  hourStart: Date;
  line: MetroLine;
  state: HeatState;
  reports: number;
};

export async function getPlatformDashboard(
  search: { range: DashboardRange; lines: MetroLine[] },
  now = new Date(),
): Promise<PlatformDashboardData> {
  const supabase = getSupabase();
  if (!supabase) return buildMemoryPlatformDashboard(search, now);

  const window = getRangeWindow(search.range, now);
  const { data, error } = await supabase.rpc("dashboard_platform_summaries_v1", {
    input_start: window.start.toISOString(),
    input_end: window.end.toISOString(),
    input_lines: search.lines.length ? search.lines : null,
  });
  if (error) throw error;

  const platformSummaries = ((data ?? []) as PlatformSummaryRow[])
    .filter((row) => isMetroLine(row.line))
    .map((row): PlatformSummary => {
      const heatReports = row.calor_reports + row.infierno_reports;
      return {
        line: row.line as MetroLine,
        stationId: row.station_id,
        stationName: row.station_name,
        reports: row.reports,
        frescoReports: row.fresco_reports,
        calorReports: row.calor_reports,
        infiernoReports: row.infierno_reports,
        heatReports,
        confidence: getConfidenceFromCounts(row.reports, row.fresco_reports, heatReports),
        latestReportAt: row.latest_report_at ? new Date(row.latest_report_at) : null,
      };
    })
    .toSorted(comparePlatforms);

  return { platformSummaries };
}

export async function getPlatformDetail(
  range: DashboardRange,
  lines: MetroLine[],
  stationId: string,
  locale: Locale,
  now = new Date(),
): Promise<PlatformExplorerSelection | null> {
  const requestedLines = uniqueLines(lines).filter((line) => Boolean(getStationById(line, stationId)));
  if (requestedLines.length === 0) return null;

  const window = getRangeWindow(range, now);
  const supabase = getSupabase();
  let rows: NormalizedHistoryRow[];

  if (supabase) {
    const { data, error } = await supabase.rpc("dashboard_platform_history_v1", {
      input_start: window.start.toISOString(),
      input_end: window.end.toISOString(),
      input_lines: requestedLines,
      input_station_id: stationId,
    });
    if (error) throw error;
    rows = ((data ?? []) as PlatformHistoryRow[])
      .filter((row) => isMetroLine(row.line) && row.reports > 0)
      .map((row) => ({
        hourStart: new Date(row.hour_start),
        line: row.line as MetroLine,
        state: row.state,
        reports: row.reports,
      }));
  } else {
    rows = getMemoryReportsSnapshot()
      .filter(
        (report) =>
          !report.hiddenAt &&
          getReportLocationKind(report) === "platform" &&
          requestedLines.includes(report.line) &&
          report.stationId === stationId &&
          report.createdAt >= window.start &&
          report.createdAt < window.end,
      )
      .map((report) => ({
        hourStart: report.createdAt,
        line: report.line,
        state: report.state,
        reports: 1,
      }));
  }

  if (rows.length === 0) return null;
  const counts = countStates(rows);
  const reports = counts.frescoReports + counts.calorReports + counts.infiernoReports;
  const heatReports = getPlatformHeatReports(counts);
  const reportedLines = uniqueLines(rows.map((row) => row.line));
  const stationName =
    reportedLines
      .map((line) => getStationName(line, stationId))
      .find((name): name is string => Boolean(name)) ??
    requestedLines
      .map((line) => getStationName(line, stationId))
      .find((name): name is string => Boolean(name)) ??
    stationId;

  return {
    stationId,
    stationName,
    lines: reportedLines,
    reports,
    ...counts,
    heatReports,
    confidence: getConfidenceFromCounts(reports, counts.frescoReports, heatReports),
    history: buildDashboardBuckets(now, range, locale).map((bucket) => ({
      label: bucket.label,
      reports: rows.reduce(
        (total, report) =>
          report.hourStart >= bucket.start && report.hourStart < bucket.end
            ? total + report.reports
            : total,
        0,
      ),
    })),
  };
}

function buildMemoryPlatformDashboard(
  search: { range: DashboardRange; lines: MetroLine[] },
  now: Date,
): PlatformDashboardData {
  const window = getRangeWindow(search.range, now);
  const reports = getMemoryReportsSnapshot().filter(
    (report) =>
      !report.hiddenAt &&
      getReportLocationKind(report) === "platform" &&
      Boolean(report.stationId) &&
      report.createdAt >= window.start &&
      report.createdAt <= window.end &&
      (search.lines.length === 0 || search.lines.includes(report.line)),
  );

  const grouped = new Map<string, Report[]>();
  for (const report of reports) {
    const key = `${report.line}:${report.stationId}`;
    const group = grouped.get(key) ?? [];
    group.push(report);
    grouped.set(key, group);
  }

  const platformSummaries = Array.from(grouped.values())
    .map((group): PlatformSummary => {
      const first = group[0];
      const stationId = first.stationId!;
      const counts = countStates(group.map((report) => ({ state: report.state, reports: 1 })));
      const heatReports = getPlatformHeatReports(counts);
      return {
        line: first.line,
        stationId,
        stationName: getStationName(first.line, stationId) ?? stationId,
        reports: group.length,
        ...counts,
        heatReports,
        confidence: getConfidenceFromCounts(group.length, counts.frescoReports, heatReports),
        latestReportAt:
          group.toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt ??
          null,
      };
    })
    .toSorted(comparePlatforms);

  return { platformSummaries };
}

function countStates(reports: Array<{ state: HeatState; reports: number }>) {
  let frescoReports = 0;
  let calorReports = 0;
  let infiernoReports = 0;
  for (const report of reports) {
    if (report.state === "fresco") frescoReports += report.reports;
    if (report.state === "calor") calorReports += report.reports;
    if (report.state === "infierno") infiernoReports += report.reports;
  }
  return { frescoReports, calorReports, infiernoReports };
}

function comparePlatforms(a: PlatformSummary, b: PlatformSummary) {
  return (
    b.heatReports - a.heatReports ||
    b.infiernoReports - a.infiernoReports ||
    (b.latestReportAt?.getTime() ?? 0) - (a.latestReportAt?.getTime() ?? 0) ||
    a.stationName.localeCompare(b.stationName)
  );
}

function uniqueLines(lines: MetroLine[]) {
  return [...new Set(lines)].toSorted(
    (a, b) => METRO_LINES.indexOf(a) - METRO_LINES.indexOf(b),
  );
}
