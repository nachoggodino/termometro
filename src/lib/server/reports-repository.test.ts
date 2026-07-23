import { afterEach, describe, expect, it, vi } from "vitest";
import { RATE_LIMIT_MAX_REPORTS } from "@/lib/domain/reports";
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

  it("suppresses repeated same-line no-car reports as duplicates", async () => {
    vi.stubEnv("TERMO_ALLOW_MEMORY_STORE", "1");
    const now = new Date("2026-07-05T12:00:00Z");

    const first = await createReportForRequest({ line: "L12", state: "fresco", car: null }, null, now);
    const second = await createReportForRequest({ line: "L12", state: "infierno", car: null }, null, now);

    expect(first.ok).toBe(true);
    expect(second).toEqual({ ok: false, reason: "duplicate" });
  });

  it("limits request fingerprints to four reports in ten minutes", async () => {
    vi.stubEnv("TERMO_ALLOW_MEMORY_STORE", "1");
    vi.stubEnv("TERMO_ABUSE_SECRET", "test-abuse-secret");
    const now = new Date("2026-07-05T12:00:00Z");
    const fingerprint = { ip: "203.0.113.10", userAgent: "test-browser" };

    const reports = await Promise.all(
      Array.from({ length: RATE_LIMIT_MAX_REPORTS }, (_, index) =>
        createReportForRequest({ line: "L1", state: "calor", car: `M100${index}` }, fingerprint, now),
      ),
    );
    const limited = await createReportForRequest({ line: "L1", state: "calor", car: "M1009" }, fingerprint, now);

    expect(reports.every((report) => report.ok)).toBe(true);
    expect(limited).toEqual({ ok: false, reason: "rate_limited" });
  });
});
