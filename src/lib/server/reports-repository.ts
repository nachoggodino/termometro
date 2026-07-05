import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildDashboardData } from "@/lib/domain/dashboard";
import { getRangeStart, type TimeRange } from "@/lib/domain/ranges";
import { isDuplicateCandidate, type Report, type ReportInput } from "@/lib/domain/reports";
import { seedReports } from "./seed-data";

type CreateResult =
  | { ok: true; report: Report }
  | { ok: false; reason: "duplicate" | "invalid" };

type DashboardOptions = {
  range: TimeRange;
  line?: string | null;
};

const globalForReports = globalThis as typeof globalThis & {
  termometroReports?: Report[];
};

function getMemoryReports() {
  if (!globalForReports.termometroReports) {
    globalForReports.termometroReports = seedReports.map((report) => ({ ...report }));
  }
  return globalForReports.termometroReports;
}

let supabaseClient: SupabaseClient | null = null;
let supabaseServiceClient: SupabaseClient | null = null;

function shouldRequireSupabase() {
  return process.env.VERCEL === "1" || process.env.TERMOMETRO_REQUIRE_SUPABASE === "1";
}

function getSupabase(options: { serviceRole?: boolean } = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = options.serviceRole ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (shouldRequireSupabase()) {
      const missing = [
        !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
        !key ? (options.serviceRole ? "SUPABASE_SERVICE_ROLE_KEY" : "NEXT_PUBLIC_SUPABASE_ANON_KEY") : null,
      ].filter(Boolean);
      throw new Error(`Supabase is required in this environment. Missing: ${missing.join(", ")}`);
    }
    return null;
  }

  if (options.serviceRole) {
    if (!supabaseServiceClient) {
      supabaseServiceClient = createClient(url, key, {
        auth: { persistSession: false },
      });
    }
    return supabaseServiceClient;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return supabaseClient;
}

export async function getReportsForDashboard(options: DashboardOptions) {
  const start = getRangeStart(options.range);
  const supabase = getSupabase();

  if (!supabase) {
    const reports = getMemoryReports().filter((report) => {
      return report.createdAt >= start && (!options.line || report.line === options.line);
    });
    return buildDashboardData(reports);
  }

  let query = supabase
    .from("reports")
    .select("id,line,car,state,created_at,hidden_at")
    .gte("created_at", start.toISOString())
    .is("hidden_at", null)
    .order("created_at", { ascending: false });

  if (options.line) {
    query = query.eq("line", options.line);
  }

  const { data, error } = await query;
  if (error) throw error;

  return buildDashboardData(
    (data ?? []).map((row) => ({
      id: row.id,
      line: row.line,
      car: row.car,
      state: row.state,
      createdAt: new Date(row.created_at),
      hiddenAt: row.hidden_at ? new Date(row.hidden_at) : null,
    })),
  );
}

export async function createReport(input: ReportInput): Promise<CreateResult> {
  const now = new Date();
  const supabase = getSupabase({ serviceRole: true });

  if (!supabase) {
    const memoryReports = getMemoryReports();
    const recentDuplicate = memoryReports.find((report) => isDuplicateCandidate(input, report, now));
    if (recentDuplicate) return { ok: false, reason: "duplicate" };

    const report: Report = {
      id: crypto.randomUUID(),
      line: input.line,
      car: input.car ?? null,
      state: input.state,
      createdAt: now,
      hiddenAt: null,
    };
    memoryReports.unshift(report);
    return { ok: true, report };
  }

  const duplicateWindowStart = new Date(now.getTime() - 12 * 60_000).toISOString();
  let duplicateQuery = supabase
    .from("reports")
    .select("id")
    .eq("line", input.line)
    .eq("state", input.state)
    .gte("created_at", duplicateWindowStart)
    .is("hidden_at", null)
    .limit(1);

  duplicateQuery = input.car ? duplicateQuery.eq("car", input.car) : duplicateQuery.is("car", null);

  const { data: duplicateData, error: duplicateError } = await duplicateQuery;
  if (duplicateError) throw duplicateError;
  if ((duplicateData ?? []).length > 0) return { ok: false, reason: "duplicate" };

  const { data, error } = await supabase
    .from("reports")
    .insert({
      line: input.line,
      car: input.car,
      state: input.state,
      abuse_key: null,
    })
    .select("id,line,car,state,created_at,hidden_at")
    .single();

  if (error) throw error;

  return {
    ok: true,
    report: {
      id: data.id,
      line: data.line,
      car: data.car,
      state: data.state,
      createdAt: new Date(data.created_at),
      hiddenAt: data.hidden_at ? new Date(data.hidden_at) : null,
    },
  };
}

export async function undoReport(id: string) {
  const supabase = getSupabase({ serviceRole: true });
  if (!supabase) {
    const reports = getMemoryReports();
    const index = reports.findIndex((report) => report.id === id);
    if (index >= 0) reports.splice(index, 1);
    return;
  }

  await supabase.from("reports").update({ hidden_at: new Date().toISOString(), hidden_reason: "user_undo" }).eq("id", id);
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

  const reports = getMemoryReports().filter((report) => report.line === line && report.car);
  const counts = new Map<string, number>();
  for (const report of reports) {
    counts.set(report.car!, (counts.get(report.car!) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .toSorted((a, b) => b[1] - a[1])
    .map(([car]) => car)
    .slice(0, 8);
}
