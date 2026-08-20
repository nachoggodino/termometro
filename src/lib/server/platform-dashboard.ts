import type { DashboardRange } from "@/lib/domain/ranges";
import { getRangeWindow } from "@/lib/domain/ranges";
import { getReportLocationKind, type Report } from "@/lib/domain/reports";
import { isMetroLine, type MetroLine } from "@/lib/domain/lines";
import { getStationName } from "@/lib/domain/stations";
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
  latestReportAt: Date | null;
};

export type PlatformLineSummary = {
  line: MetroLine;
  reports: number;
  heatReports: number;
  calorReports: number;
  infiernoReports: number;
  latestReportAt: Date | null;
};

export type PlatformDashboardData = {
  platformSummaries: PlatformSummary[];
  platformLineSummaries: PlatformLineSummary[];
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
    .map((row): PlatformSummary => ({
      line: row.line as MetroLine,
      stationId: row.station_id,
      stationName: row.station_name,
      reports: row.reports,
      frescoReports: row.fresco_reports,
      calorReports: row.calor_reports,
      infiernoReports: row.infierno_reports,
      heatReports: row.calor_reports + row.infierno_reports,
      latestReportAt: row.latest_report_at ? new Date(row.latest_report_at) : null,
    }))
    .toSorted(comparePlatforms);

  return {
    platformSummaries,
    platformLineSummaries: buildPlatformLineSummaries(platformSummaries),
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
      const frescoReports = group.filter((report) => report.state === "fresco").length;
      const calorReports = group.filter((report) => report.state === "calor").length;
      const infiernoReports = group.filter((report) => report.state === "infierno").length;
      return {
        line: first.line,
        stationId,
        stationName: getStationName(first.line, stationId) ?? stationId,
        reports: group.length,
        frescoReports,
        calorReports,
        infiernoReports,
        heatReports: calorReports + infiernoReports,
        latestReportAt: group.toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt ?? null,
      };
    })
    .toSorted(comparePlatforms);

  return {
    platformSummaries,
    platformLineSummaries: buildPlatformLineSummaries(platformSummaries),
  };
}

function buildPlatformLineSummaries(platforms: PlatformSummary[]) {
  const byLine = new Map<MetroLine, PlatformLineSummary>();
  for (const platform of platforms) {
    const current = byLine.get(platform.line) ?? {
      line: platform.line,
      reports: 0,
      heatReports: 0,
      calorReports: 0,
      infiernoReports: 0,
      latestReportAt: null,
    };
    current.reports += platform.reports;
    current.heatReports += platform.heatReports;
    current.calorReports += platform.calorReports;
    current.infiernoReports += platform.infiernoReports;
    if (
      platform.latestReportAt &&
      (!current.latestReportAt || platform.latestReportAt.getTime() > current.latestReportAt.getTime())
    ) {
      current.latestReportAt = platform.latestReportAt;
    }
    byLine.set(platform.line, current);
  }
  return Array.from(byLine.values()).toSorted(
    (a, b) => b.heatReports - a.heatReports || b.infiernoReports - a.infiernoReports || b.reports - a.reports,
  );
}

function comparePlatforms(a: PlatformSummary, b: PlatformSummary) {
  return (
    b.heatReports - a.heatReports ||
    b.infiernoReports - a.infiernoReports ||
    (b.latestReportAt?.getTime() ?? 0) - (a.latestReportAt?.getTime() ?? 0) ||
    a.stationName.localeCompare(b.stationName)
  );
}
