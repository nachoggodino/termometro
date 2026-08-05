import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

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
    const hardeningMigration = readFileSync(
      join(root, "supabase/migrations/20260805085948_harden_validation_and_moderation.sql"),
      "utf8",
    );

    expect(hardeningMigration).toContain("car ~ '^[MRS][0-9]{4,5}$'");
    expect(hardeningMigration).toContain("code ~ '^[MRS][0-9]{4,5}$'");
    expect(hardeningMigration.match(/not valid/g)).toHaveLength(2);
    expect(hardeningMigration).toContain("reports.abuse_key = input_abuse_key");
    expect(hardeningMigration).toContain("reports.car is null");
    expect(hardeningMigration).toContain("input_now - interval '30 minutes'");
    expect(hardeningMigration).toContain("pg_advisory_xact_lock(hashtext('rate:' || input_abuse_key))");
    expect(hardeningMigration).not.toContain("grant select (id, line, car, state, created_at, abuse_key");
  });
});
