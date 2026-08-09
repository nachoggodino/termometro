import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const dashboardRpcV2Names = [
  "dashboard_bucket_counts_v2",
  "dashboard_car_summaries_v2",
  "dashboard_car_histories_v2",
  "dashboard_car_series_v2",
  "dashboard_worst_hours_v2",
  "dashboard_line_car_reports_v2",
  "dashboard_line_summaries_v2",
  "dashboard_heat_trend_v2",
] as const;

describe("Supabase migration contracts", () => {
  it("keeps private report fields out of public column grants", () => {
    const initialMigration = readFileSync(join(root, "supabase/migrations/0001_initial.sql"), "utf8");

    expect(initialMigration).toContain("alter table public.reports enable row level security");
    expect(initialMigration).toContain("grant select (id, line, car, state, created_at, hidden_at) on public.reports to anon, authenticated");
    expect(initialMigration).not.toContain("grant select (id, line, car, state, created_at, abuse_key");
    expect(initialMigration).not.toContain("grant select (id, line, car, state, created_at, undo_token_hash");
  });

  it("keeps report creation behind the service role RPC", () => {
    const rpcMigration = readFileSync(join(root, "supabase/migrations/0002_create_report_rpc.sql"), "utf8");

    expect(rpcMigration).toContain("security definer");
    expect(rpcMigration).toContain("revoke all on function public.create_report");
    expect(rpcMigration).toContain("grant execute on function public.create_report");
    expect(rpcMigration).toContain("to service_role");
  });

  it("only applies duplicate suppression when a car identifier is present", () => {
    const rpcMigration = [
      readFileSync(join(root, "supabase/migrations/0002_create_report_rpc.sql"), "utf8"),
      readFileSync(join(root, "supabase/migrations/0005_tighten_report_abuse_and_no_car_duplicates.sql"), "utf8"),
    ].join("\n");

    expect(rpcMigration).toContain("if input_car is null then");
    expect(rpcMigration).toContain("reports.car is null");
    expect(rpcMigration).toContain("if input_car is not null then");
    expect(rpcMigration).toContain("reports.car = input_car");
  });

  it("adds dashboard aggregate RPCs without granting private report fields", () => {
    const dashboardMigration = readFileSync(join(root, "supabase/migrations/0006_dashboard_aggregate_rpcs.sql"), "utf8");

    expect(dashboardMigration).toContain("create index if not exists reports_visible_created_line_idx");
    expect(dashboardMigration).toContain("create or replace function public.dashboard_line_summaries");
    expect(dashboardMigration).toContain("create or replace function public.dashboard_bucket_counts");
    expect(dashboardMigration).toContain("create or replace function public.dashboard_car_summaries");
    expect(dashboardMigration).toContain("create or replace function public.dashboard_car_histories");
    expect(dashboardMigration).toContain("create or replace function public.dashboard_heat_trend");
    expect(dashboardMigration).toContain("grant execute on function public.dashboard_line_summaries to anon, authenticated");
    expect(dashboardMigration).not.toContain("abuse_key");
    expect(dashboardMigration).not.toContain("undo_token_hash");
  });

  it("keeps deployed fleet qualification and Termo parameters aligned with domain rules", () => {
    const trafficMigration = readFileSync(join(root, "supabase/migrations/0007_prepare_for_traffic_spike.sql"), "utf8");

    expect(trafficMigration).toContain("visible_car_counts.calor_reports + visible_car_counts.infierno_reports - visible_car_counts.fresco_reports > 2");
    expect(trafficMigration).toContain("-line_weights.effective_reports / 30.0");
    expect(trafficMigration).toContain("-diagnostics.weighted_fleet_percentage / 30.0");
    expect(trafficMigration).not.toContain("-line_weights.effective_reports / 12.0");
    expect(trafficMigration).not.toContain("-diagnostics.weighted_fleet_percentage / 15.0");
  });

  it("hardens car prefixes and no-car moderation without exposing origin keys", () => {
    const hardeningMigration = readFileSync(join(root, "supabase/migrations/20260805085948_harden_validation_and_moderation.sql"), "utf8");

    expect(hardeningMigration).toContain("car ~ '^[MRS][0-9]{4,5}$'");
    expect(hardeningMigration).toContain("code ~ '^[MRS][0-9]{4,5}$'");
    expect(hardeningMigration.match(/not valid/g)).toHaveLength(2);
    expect(hardeningMigration).toContain("reports.abuse_key = input_abuse_key");
    expect(hardeningMigration).toContain("reports.car is null");
    expect(hardeningMigration).toContain("input_now - interval '30 minutes'");
    expect(hardeningMigration).toContain("pg_advisory_xact_lock(hashtext('rate:' || input_abuse_key))");
    expect(hardeningMigration).not.toContain("grant select (id, line, car, state, created_at, abuse_key");
  });

  it("blocks retired series 1000 in inventory, reports, and the creation RPC", () => {
    const retiredSeriesMigration = readFileSync(
      join(root, "supabase/migrations/20260809212720_block_series_1000_reports.sql"),
      "utf8",
    );

    expect(retiredSeriesMigration).toContain("reports_car_series_1000_retired_check");
    expect(retiredSeriesMigration).toContain("cars_active_series_1000_retired_check");
    expect(retiredSeriesMigration).toContain("between 1000 and 1999");
    expect(retiredSeriesMigration).toContain("'retired_series'::text");
    expect(retiredSeriesMigration).toContain("hidden_at is not null");
    expect(retiredSeriesMigration).toContain("not active");
    expect(retiredSeriesMigration).toContain("grant execute on function public.create_report");
    expect(retiredSeriesMigration.indexOf("'retired_series'::text")).toBeLessThan(
      retiredSeriesMigration.indexOf("insert into public.reports"),
    );
  });

  it("adds the optimized dashboard path without removing the current production path", () => {
    const expansion = readFileSync(join(root, "supabase/migrations/20260806001521_expand_dashboard_database_cpu.sql"), "utf8");
    const backfill = readFileSync(join(root, "supabase/migrations/20260806093759_backfill_dashboard_database_cpu.sql"), "utf8");

    expect(expansion).toContain("create table private.dashboard_report_hourly");
    expect(expansion).toContain("create trigger sync_dashboard_report_hourly");
    expect(expansion).toContain("input_car_series integer[] default null");
    expect(expansion).not.toContain("alter table public.reports");
    expect(expansion).toContain("cars.calor_reports + cars.infierno_reports - cars.fresco_reports > 2");
    expect(expansion).toContain("-line_weights.effective_reports / 30.0");
    expect(expansion).toContain("-diagnostics.weighted_fleet_percentage / 30.0");
    expect(backfill).toContain("insert into private.dashboard_report_hourly");
    expect(backfill).toContain("on conflict (hour_start, line, car_key, state) do nothing");
    expect(backfill).toContain("values ('dashboard_v2_backfill')");
    for (const name of dashboardRpcV2Names) {
      expect(expansion).toContain(`create function public.${name}`);
      expect(expansion).toContain(`grant execute on function public.${name}`);
    }
    expect(expansion).toContain("grant execute on function public.dashboard_home_snapshot");
    expect(expansion).not.toContain("drop function public.dashboard_");
    expect(expansion).not.toContain("revoke select on public.reports");
    expect(expansion).not.toContain('drop policy if exists "Public reports are readable"');
  });

  it("applies the guarded cleanup after the compatibility window", () => {
    const cleanup = readFileSync(join(root, "supabase/migrations/20260809213453_cleanup_dashboard_database_cpu.sql"), "utf8");

    expect(readdirSync(join(root, "supabase/migrations")).some((file) => file.includes("cleanup_dashboard_database_cpu"))).toBe(true);
    expect(cleanup).toContain("Dashboard V2 expansion is incomplete; cleanup aborted");
    expect(cleanup).toContain("private.dashboard_migration_state");
    expect(cleanup.match(/set search_path = ''/g)).toHaveLength(9);
    expect(cleanup).toContain("drop function public.dashboard_line_summaries");
    expect(cleanup).toContain("revoke select (id, line, car, state, created_at, hidden_at) on public.reports");
    expect(cleanup).toContain('drop policy if exists "Public reports are readable"');
  });

  it("calls only the versioned optimized dashboard RPCs", () => {
    const dashboardModules = readFileSync(join(root, "src/lib/server/dashboard-modules.ts"), "utf8");

    for (const name of dashboardRpcV2Names) {
      expect(dashboardModules).toContain(`rpc("${name}"`);
    }
  });
});
