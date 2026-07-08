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
    const rpcMigration = readFileSync(join(root, "supabase/migrations/0005_fix_create_report_created_at_ambiguity.sql"), "utf8");

    expect(rpcMigration).toContain("security definer");
    expect(rpcMigration).toContain("revoke all on function public.create_report");
    expect(rpcMigration).toContain("grant execute on function public.create_report");
    expect(rpcMigration).toContain("to service_role");
  });

  it("only applies duplicate suppression when a car identifier is present", () => {
    const rpcMigration = readFileSync(join(root, "supabase/migrations/0005_fix_create_report_created_at_ambiguity.sql"), "utf8");

    expect(rpcMigration).toContain("if input_car is not null then");
    expect(rpcMigration).toContain("reports.car = input_car");
    expect(rpcMigration).not.toContain("(input_car is null and reports.car is null)");
  });
});
