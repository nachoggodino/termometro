import { afterEach, describe, expect, it, vi } from "vitest";
import { createReportForRequest } from "./reports-repository";

describe("reports repository runtime safeguards", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails closed when a persistent store is required but Supabase env vars are missing", async () => {
    vi.stubEnv("TERMO_REQUIRE_SUPABASE", "1");

    await expect(
      createReportForRequest({ line: "L1", state: "calor", car: null }, null, new Date("2026-07-05T12:00:00Z")),
    ).rejects.toThrow("TERMO_ABUSE_SECRET is required");
  });

  it("allows repeated no-car reports instead of globally treating them as duplicates", async () => {
    vi.stubEnv("TERMO_ALLOW_MEMORY_STORE", "1");
    const now = new Date("2026-07-05T12:00:00Z");

    const first = await createReportForRequest({ line: "L12", state: "fresco", car: null }, null, now);
    const second = await createReportForRequest({ line: "L12", state: "fresco", car: null }, null, now);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
  });
});
