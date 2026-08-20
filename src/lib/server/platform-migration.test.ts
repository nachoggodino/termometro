import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = [
  "20260820052000_add_platform_reports.sql",
  "20260820052050_preserve_legacy_create_report.sql",
  "20260820052100_seed_platform_stations.sql",
  "20260820052200_add_platform_dashboard_facts.sql",
  "20260820052300_add_platform_dashboard_rpcs.sql",
]
  .map((filename) => readFileSync(join(process.cwd(), "supabase/migrations", filename), "utf8"))
  .join("\n");

describe("platform reports migration", () => {
  it("adds an explicit platform location dimension and canonical station catalogue", () => {
    expect(migration).toContain("add column if not exists location_kind text not null default 'car'");
    expect(migration).toContain("create table if not exists public.metro_stations");
    expect(migration).toContain("reports_location_payload_check");
    expect(migration).toContain("foreign key (line, station_id)");
    expect(migration).toContain("revoke all on table public.metro_stations from public, anon, authenticated");
  });

  it("keeps platform duplicates separate from unidentified car reports", () => {
    expect(migration).toContain("create or replace function public.create_report_v2");
    expect(migration).toContain("reports.location_kind = 'car'");
    expect(migration).toContain("reports.location_kind = 'platform'");
    expect(migration).toContain("'duplicate:platform:'");
    expect(migration).toContain("'station_not_on_line'::text");
  });

  it("preserves the legacy report RPC as a car-only compatibility contract", () => {
    expect(migration).toContain("create or replace function public.create_report(\n");
    expect(migration).toContain("where reports.abuse_key = input_abuse_key\n        and reports.location_kind = 'car'");
    expect(migration).toContain("where reports.location_kind = 'car'\n        and reports.line = input_line");
    expect(migration).toContain("grant execute on function public.create_report(text, text, public.heat_state");
  });

  it("keeps the fleet-adjusted fact table car-only and aggregates platforms separately", () => {
    expect(migration).toContain("and reports.location_kind = 'car'");
    expect(migration).toContain("create table if not exists private.dashboard_platform_report_hourly");
    expect(migration).toContain("create or replace function public.dashboard_platform_summaries_v1");
    expect(migration).toContain("where input_car_series is null");
  });

  it("keeps legacy dashboard RPC names car-only and exposes platform-aware versions separately", () => {
    expect(migration).not.toContain("create or replace function public.dashboard_bucket_counts_v2");
    expect(migration).not.toContain("create or replace function public.dashboard_worst_hours_v2");
    expect(migration).toContain("create or replace function public.dashboard_bucket_counts_v3");
    expect(migration).toContain("create or replace function public.dashboard_worst_hours_v3");
    expect(migration).toContain("create or replace function public.dashboard_home_snapshot_v2");
    expect(migration).toContain("create or replace function public.dashboard_home_snapshot(\n");
    expect(migration).toContain("and reports.location_kind = 'car'");
    expect(migration).toContain("'location_kind', recent.location_kind");
    expect(migration).toContain("'station_id', recent.station_id");
    expect(migration).toContain("grant execute on function public.dashboard_home_snapshot_v2");
  });
});
