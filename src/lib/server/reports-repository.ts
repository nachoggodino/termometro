import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getCarSeries,
  isCarAllowedOnLine,
  MAX_EXISTING_CAR_SERIES,
  MIN_EXISTING_CAR_SERIES,
} from "@/lib/domain/cars";
import {
  buildCarExplorerSelection,
  buildDashboardData,
  DASHBOARD_LIMITS,
  DASHBOARD_TIME,
} from "@/lib/domain/dashboard";
import { ESTIMATED_TOTAL_CARS } from "@/lib/domain/fleet-estimates";
import { isMetroLine, type MetroLine } from "@/lib/domain/lines";
import { getRangeWindow, type DashboardRange } from "@/lib/domain/ranges";
import {
  DUPLICATE_WINDOW_MINUTES,
  getReportInputErrorReason,
  getReportLocationKind,
  isDuplicateCandidate,
  NO_CAR_ORIGIN_WINDOW_MINUTES,
  parseReportInput,
  RATE_LIMIT_MAX_REPORTS,
  RATE_LIMIT_NETWORK_MAX_REPORTS,
  STATION_NOT_ON_LINE_REASON,
  type ParsedReportInput,
  type Report,
  type ReportCreateFailureReason,
  type ReportInput,
  type ReportLocationKind,
} from "@/lib/domain/reports";
import { isStationOnLine } from "@/lib/domain/stations";
import type { Locale } from "@/lib/i18n/config";
import {
  createAbuseKey,
  createNetworkAbuseKey,
  createUndoToken,
  getRateLimitStart,
  getRequestFingerprint,
  getUndoExpiresAt,
  hashUndoToken,
  shouldRequirePersistentStore,
  verifyUndoToken,
  type RequestFingerprint,
} from "./report-security";
import { seedReports } from "./seed-data";

type CreateResult =
  | { ok: true; report: Report; undoToken: string }
  | { ok: false; reason: ReportCreateFailureReason };

type CreateReportRpcRow = {
  ok: boolean;
  reason: string | null;
  id: string | null;
  line: MetroLine | null;
  car: string | null;
  location_kind: ReportLocationKind | null;
  station_id: string | null;
  state: ParsedReportInput["state"] | null;
  created_at: string | null;
  hidden_at: string | null;
};

type DashboardOptions = {
  range: DashboardRange;
  line?: string | null;
  lines?: MetroLine[] | null;
  carSeries?: number[] | null;
  now?: Date;
  locale?: Locale;
};

export type HomeSnapshot = {
  reportsLastDay: number;
  recentReports: Report[];
};

type HomeSnapshotRow = {
  reports_last_day: number;
  recent_reports: Array<{
    id: string;
    line: MetroLine;
    car: string | null;
    location_kind?: ReportLocationKind | null;
    station_id?: string | null;
    state: ParsedReportInput["state"];
    created_at: string;
  }> | null;
};

const globalForReports = globalThis as typeof globalThis & {
  termoReports?: MemoryReport[];
};

type MemoryReport = Report & {
  abuseKey?: string | null;
  networkAbuseKey?: string | null;
  undoTokenHash?: string | null;
  undoExpiresAt?: Date | null;
};

function getMemoryReports() {
  if (!globalForReports.termoReports) {
    globalForReports.termoReports = seedReports.map((report) => ({ ...report }));
  }
  return globalForReports.termoReports;
}

export function getMemoryReportsSnapshot() {
  return getMemoryReports().map((report) => ({ ...report }));
}

let supabaseServiceClient: SupabaseClient | null = null;

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (shouldRequirePersistentStore() && !process.env.TERMO_ABUSE_SECRET) {
    throw new Error("TERMO_ABUSE_SECRET is required in this environment.");
  }

  if (!url || !key) {
    if (shouldRequirePersistentStore()) {
      const missing = [
        !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
        !key ? "SUPABASE_SERVICE_ROLE_KEY" : null,
      ].filter(Boolean);
      throw new Error(`Supabase is required in this environment. Missing: ${missing.join(", ")}`);
    }
    return null;
  }

  if (!supabaseServiceClient) {
    supabaseServiceClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return supabaseServiceClient;
}

export function getMemoryDashboard(options: DashboardOptions) {
  const now = options.now ?? new Date();
  const { start, end } = getRangeWindow(options.range, now);
  const summerStart = getRangeWindow("summer", now).start;
  const queryStart = summerStart < start ? summerStart : start;
  const selectedLines = options.lines?.length
    ? options.lines
    : isMetroLine(options.line)
      ? [options.line]
      : null;
  const selectedCarSeries = normalizeCarSeries(options.carSeries);
  const reports = getMemoryReports()
    .filter((report) => report.createdAt >= queryStart && report.createdAt <= end)
    .filter((report) => !selectedLines || selectedLines.includes(report.line));

  if (selectedCarSeries) {
    return buildDashboardData(
      reports.filter((report) => matchesCarSeries(report, selectedCarSeries)),
      now,
      ESTIMATED_TOTAL_CARS,
      options.range,
      options.locale ?? "es",
    );
  }

  const carDashboard = buildDashboardData(
    reports.filter((report) => getReportLocationKind(report) === "car"),
    now,
    ESTIMATED_TOTAL_CARS,
    options.range,
    options.locale ?? "es",
  );
  const globalDashboard = buildDashboardData(
    reports,
    now,
    ESTIMATED_TOTAL_CARS,
    options.range,
    options.locale ?? "es",
  );

  return {
    ...carDashboard,
    lineEvolution: globalDashboard.lineEvolution,
    totalReportsTrend: globalDashboard.totalReportsTrend,
    worstHours: globalDashboard.worstHours,
    recentReports: globalDashboard.recentReports,
    reportsLastDay: globalDashboard.reportsLastDay,
  };
}

function normalizeCarSeries(series: number[] | null | undefined) {
  if (!series?.length) return null;
  return new Set(
    series.filter(
      (item) =>
        Number.isInteger(item) &&
        item >= MIN_EXISTING_CAR_SERIES &&
        item <= MAX_EXISTING_CAR_SERIES &&
        item % 1000 === 0,
    ),
  );
}

function matchesCarSeries(report: Report, selectedCarSeries: Set<number> | null) {
  if (!selectedCarSeries) return true;
  if (getReportLocationKind(report) !== "car" || !report.car) return false;
  const series = getCarSeries(report.car);
  return series !== null && selectedCarSeries.has(series);
}

export function getMemoryCarDetail(options: DashboardOptions & { car: string }) {
  const now = options.now ?? new Date();
  const window = getRangeWindow(options.range, now);
  const selectedLines = options.lines?.length
    ? options.lines
    : isMetroLine(options.line)
      ? [options.line]
      : null;
  const selectedCarSeries = normalizeCarSeries(options.carSeries);
  const reports = getMemoryReports().filter(
    (report) =>
      !report.hiddenAt &&
      report.createdAt >= window.start &&
      report.createdAt <= window.end &&
      getReportLocationKind(report) === "car" &&
      (!selectedLines || selectedLines.includes(report.line)) &&
      matchesCarSeries(report, selectedCarSeries),
  );
  return buildCarExplorerSelection(
    options.car,
    reports,
    now,
    options.range,
    undefined,
    options.locale ?? "es",
  );
}

export async function getHomeSnapshot(now = new Date()): Promise<HomeSnapshot> {
  const start = new Date(
    now.getTime() - DASHBOARD_TIME.hoursPerDay * DASHBOARD_TIME.millisecondsPerHour,
  );
  const supabase = getSupabase();

  if (!supabase) {
    const recentReports = getMemoryReports()
      .filter((report) => !report.hiddenAt && report.createdAt >= start && report.createdAt <= now)
      .toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return {
      reportsLastDay: recentReports.length,
      recentReports: recentReports.slice(0, DASHBOARD_LIMITS.recentReportCount),
    };
  }

  const { data, error } = await supabase
    .rpc("dashboard_home_snapshot_v2", {
      input_start: start.toISOString(),
      input_end: now.toISOString(),
      input_limit: DASHBOARD_LIMITS.recentReportCount,
    })
    .single();
  if (error) throw error;

  const row = data as HomeSnapshotRow;
  return {
    reportsLastDay: row.reports_last_day,
    recentReports: (row.recent_reports ?? []).map((report) => ({
      id: report.id,
      line: report.line,
      car: report.car,
      locationKind: report.location_kind ?? "car",
      stationId: report.station_id ?? null,
      state: report.state,
      createdAt: new Date(report.created_at),
      hiddenAt: null,
    })),
  };
}

export async function createReportForRequest(
  input: ReportInput,
  fingerprint: RequestFingerprint | Request | null,
  now = new Date(),
): Promise<CreateResult> {
  const parsed = parseReportInput(input);
  if (!parsed.success) {
    return { ok: false, reason: getReportInputErrorReason(parsed.error) };
  }
  const normalizedInput = parsed.data;
  const { locationKind, stationId } = normalizedInput;

  if (locationKind === "platform" && (!stationId || !isStationOnLine(stationId, normalizedInput.line))) {
    return { ok: false, reason: STATION_NOT_ON_LINE_REASON };
  }
  if (
    locationKind === "car" &&
    normalizedInput.car &&
    !isCarAllowedOnLine(normalizedInput.car, normalizedInput.line)
  ) {
    return { ok: false, reason: "car_not_on_line" };
  }

  const requestFingerprint =
    fingerprint instanceof Request ? getRequestFingerprint(fingerprint) : fingerprint;
  const abuseKey = requestFingerprint ? createAbuseKey(requestFingerprint) : null;
  const networkAbuseKey = requestFingerprint ? createNetworkAbuseKey(requestFingerprint) : null;
  const undoToken = createUndoToken();
  const undoTokenHash = hashUndoToken(undoToken);
  const undoExpiresAt = getUndoExpiresAt(now);
  const supabase = getSupabase();

  if (!supabase) {
    const memoryReports = getMemoryReports();
    const rateLimitStart = getRateLimitStart(now);
    if (abuseKey) {
      const originReports = memoryReports.filter(
        (report) => report.abuseKey === abuseKey && report.createdAt >= rateLimitStart,
      );
      if (originReports.length >= RATE_LIMIT_MAX_REPORTS) {
        return { ok: false, reason: "rate_limited" };
      }
    }
    if (networkAbuseKey) {
      const networkReports = memoryReports.filter(
        (report) =>
          report.networkAbuseKey === networkAbuseKey && report.createdAt >= rateLimitStart,
      );
      if (networkReports.length >= RATE_LIMIT_NETWORK_MAX_REPORTS) {
        return { ok: false, reason: "rate_limited" };
      }
    }

    if (locationKind === "car" && !normalizedInput.car && abuseKey) {
      const noCarWindowStart = new Date(
        now.getTime() - NO_CAR_ORIGIN_WINDOW_MINUTES * 60_000,
      );
      const hasRecentNoCarReport = memoryReports.some(
        (report) =>
          getReportLocationKind(report) === "car" &&
          !report.car &&
          report.abuseKey === abuseKey &&
          report.createdAt >= noCarWindowStart &&
          !report.hiddenAt,
      );
      if (hasRecentNoCarReport) return { ok: false, reason: "duplicate" };
    }

    const recentDuplicate = memoryReports.find((report) =>
      isDuplicateCandidate(normalizedInput, report, now),
    );
    if (recentDuplicate) return { ok: false, reason: "duplicate" };

    const report: MemoryReport = {
      id: crypto.randomUUID(),
      line: normalizedInput.line,
      car: locationKind === "car" ? normalizedInput.car : null,
      locationKind,
      stationId: locationKind === "platform" ? stationId : null,
      state: normalizedInput.state,
      createdAt: now,
      hiddenAt: null,
      abuseKey,
      networkAbuseKey,
      undoTokenHash,
      undoExpiresAt,
    };
    memoryReports.unshift(report);
    return { ok: true, report, undoToken };
  }

  const duplicateWindowStart = new Date(
    now.getTime() - DUPLICATE_WINDOW_MINUTES * 60_000,
  );
  const { data: rpcData, error } = await supabase
    .rpc("create_report_v3", {
      input_line: normalizedInput.line,
      input_car: locationKind === "car" ? normalizedInput.car : null,
      input_location_kind: locationKind,
      input_station_id: locationKind === "platform" ? stationId : null,
      input_state: normalizedInput.state,
      input_origin_abuse_key: abuseKey,
      input_network_abuse_key: networkAbuseKey,
      input_undo_token_hash: undoTokenHash,
      input_undo_expires_at: undoExpiresAt.toISOString(),
      input_now: now.toISOString(),
      input_rate_limit_start: getRateLimitStart(now).toISOString(),
      input_rate_limit_max: RATE_LIMIT_MAX_REPORTS,
      input_network_rate_limit_max: RATE_LIMIT_NETWORK_MAX_REPORTS,
      input_duplicate_window_start: duplicateWindowStart.toISOString(),
    })
    .single();

  if (error) throw error;
  const data = rpcData as CreateReportRpcRow;
  if (!data.ok) {
    return { ok: false, reason: data.reason as ReportCreateFailureReason };
  }

  if (!data.id || !data.line || !data.state || !data.created_at || !data.location_kind) {
    throw new Error("Report creation returned an incomplete row.");
  }

  return {
    ok: true,
    undoToken,
    report: {
      id: data.id,
      line: data.line,
      car: data.car,
      locationKind: data.location_kind,
      stationId: data.station_id,
      state: data.state,
      createdAt: new Date(data.created_at),
      hiddenAt: data.hidden_at ? new Date(data.hidden_at) : null,
    },
  };
}

export async function undoReport(id: string, undoToken: string, now = new Date()) {
  const supabase = getSupabase();
  if (!supabase) {
    const reports = getMemoryReports();
    const index = reports.findIndex((report) => report.id === id);
    const report = reports[index];
    if (!report || report.hiddenAt) return false;
    if (!report.undoExpiresAt || report.undoExpiresAt < now) return false;
    if (!verifyUndoToken(undoToken, report.undoTokenHash)) return false;
    reports.splice(index, 1);
    return true;
  }

  const { data, error } = await supabase
    .from("reports")
    .select("undo_token_hash,undo_expires_at,hidden_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.hidden_at) return false;
  if (!data.undo_expires_at || new Date(data.undo_expires_at) < now) return false;
  if (!verifyUndoToken(undoToken, data.undo_token_hash)) return false;

  const { error: updateError } = await supabase
    .from("reports")
    .update({ hidden_at: now.toISOString(), hidden_reason: "user_undo" })
    .eq("id", id)
    .is("hidden_at", null);

  if (updateError) throw updateError;
  return true;
}

export async function getCarSuggestions(line: string) {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("cars")
      .select("code")
      .eq("line", line)
      .eq("active", true)
      .order("code", { ascending: true })
      .limit(8);

    if (error) throw error;
    return (data ?? []).map((car) => car.code);
  }

  const reports = getMemoryReports().filter(
    (report) => report.line === line && getReportLocationKind(report) === "car" && report.car,
  );
  const counts = new Map<string, number>();
  for (const report of reports) {
    counts.set(report.car!, (counts.get(report.car!) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .toSorted((a, b) => b[1] - a[1])
    .map(([car]) => car)
    .slice(0, 8);
}
