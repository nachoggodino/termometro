import { buildDashboardBuckets, type TrendPoint } from "@/lib/domain/dashboard";
import type { Confidence, HeatState } from "@/lib/domain/heat";
import type { Locale } from "@/lib/i18n/config";
import { getRangeWindow, type DashboardRange } from "@/lib/domain/ranges";
import { getReportLocationKind, type Report } from "@/lib/domain/reports";
import { isMetroLine, type MetroLine } from "@/lib/domain/lines";
import { getStationById, getStationName } from "@/lib/domain/stations";
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

export type PlatformExplorerSelection = Omit<PlatformSummary, "latestReportAt"> & {
  history: TrendPoint[];
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

type PlatformHistoryRow = {
  state: HeatState;
  created_at: string;
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
        confidence: confidenceFromCounts(row.reports, row.fresco_reports, heatReports),
        latestReportAt: row.latest_report_at ? new Date(row.latest_report_at) : null,
      };
    })
    .toSorted(comparePlatforms);

  return {
    platformSummaries,
    platformLineSummaries: buildPlatformLineSummaries(platformSummaries),
  };
}

export async function getPlatformDetail(
  range: DashboardRange,
  line: MetroLine,
  stationId: string,
  locale: Locale,
  now = new Date(),
): Promise<PlatformExplorerSelection | null> {
  const station = getStationById(line, stationId);
  if (!station) return null;

  const window = getRangeWindow(range, now);
  const supabase = getSupabase();
  let rows: Array<{ state: HeatState; createdAt: Date }>;

  if (supabase) {
    const { data, error } = await supabase
      .from("reports")
      .select("state,created_at")
      .eq("location_kind", "platform")
      .eq("line", line)
      .eq("station_id", stationId)
      .is("hidden_at", null)
      .gte("created_at", window.start.toISOString())
      .lt("created_at", window.end.toISOString())
      .order("created_at", { ascending: true });
    if (error) throw error;
    rows = ((data ?? []) as PlatformHistoryRow[]).map((row) => ({
      state: row.state,
      createdAt: new Date(row.created_at),
    }));
  } else {
    rows = getMemoryReportsSnapshot()
      .filter(
        (report) =>
          !report.hiddenAt &&
          getReportLocationKind(report) === "platform" &&
          report.line === line &&
          report.stationId === stationId &&
          report.createdAt >= window.start &&
          report.createdAt < window.end,
      )
      .map((report) => ({ state: report.state, createdAt: report.createdAt }));
  }

  if (rows.length === 0) return null;
  const counts = countStates(rows);
  const heatReports = counts.calorReports + counts.infiernoReports;

  return {
    line,
    stationId,
    stationName: station.name,
    reports: rows.length,
    ...counts,
    heatReports,
    confidence: confidenceFromCounts(rows.length, counts.frescoReports, heatReports),
    history: buildDashboardBuckets(now, range, locale).map((bucket) => ({
      label: bucket.label,
      reports: rows.filter((report) => report.createdAt >= bucket.start && report.createdAt < bucket.end).length,
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
      const counts = countStates(group);
      const heatReports = counts.calorReports + counts.infiernoReports;
      return {
        line: first.line,
        stationId,
        stationName: getStationName(first.line, stationId) ?? stationId,
        reports: group.length,
        ...counts,
        heatReports,
        confidence: confidenceFromCounts(group.length, counts.frescoReports, heatReports),
        latestReportAt: group.toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt ?? null,
      };
    })
    .toSorted(comparePlatforms);

  return {
    platformSummaries,
    platformLineSummaries: buildPlatformLineSummaries(platformSummaries),
  };
}

function countStates(reports: Array<{ state: HeatState }>) {
  let frescoReports = 0;
  let calorReports = 0;
  let infiernoReports = 0;
  for (const report of reports) {
    if (report.state === "fresco") frescoReports += 1;
    if (report.state === "calor") calorReports += 1;
    if (report.state === "infierno") infiernoReports += 1;
  }
  return { frescoReports, calorReports, infiernoReports };
}

function confidenceFromCounts(totalReports: number, frescoReports: number, heatReports: number): Confidence {
  if (totalReports < 3) return "low";
  const agreement = Math.max(frescoReports, heatReports) / totalReports;
  if (totalReports >= 10 && agreement >= 0.7) return "high";
  if (totalReports >= 5 && agreement >= 0.55) return "medium";
  return "low";
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
