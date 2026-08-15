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

  it("allows only one no-car report per origin across lines every 30 minutes", async () => {
    vi.stubEnv("TERMO_ALLOW_MEMORY_STORE", "1");
    vi.stubEnv("TERMO_ABUSE_SECRET", "test-abuse-secret");
    const fingerprint = { ip: "203.0.113.20", userAgent: "no-car-window-browser" };
    const now = new Date("2026-08-01T12:00:00Z");

    const first = await createReportForRequest({ line: "L2", state: "fresco", car: null }, fingerprint, now);
    const atBoundary = await createReportForRequest(
      { line: "L3", state: "infierno", car: null },
      fingerprint,
      new Date(now.getTime() + 30 * 60_000),
    );
    const afterWindow = await createReportForRequest(
      { line: "L4", state: "calor", car: null },
      fingerprint,
      new Date(now.getTime() + 30 * 60_000 + 1),
    );

    expect(first.ok).toBe(true);
    expect(atBoundary).toEqual({ ok: false, reason: "duplicate" });
    expect(afterWindow.ok).toBe(true);
  });

  it("does not apply the no-car origin window to other origins or identified cars", async () => {
    vi.stubEnv("TERMO_ALLOW_MEMORY_STORE", "1");
    vi.stubEnv("TERMO_ABUSE_SECRET", "test-abuse-secret");
    const now = new Date("2026-08-02T12:00:00Z");
    const firstOrigin = { ip: "203.0.113.21", userAgent: "first-browser" };
    const secondOrigin = { ip: "203.0.113.22", userAgent: "second-browser" };

    const noCar = await createReportForRequest({ line: "L6", state: "calor", car: null }, firstOrigin, now);
    const otherOrigin = await createReportForRequest({ line: "L7", state: "calor", car: null }, secondOrigin, now);
    const identifiedCar = await createReportForRequest(
      { line: "L8", state: "calor", car: "S3124" },
      firstOrigin,
      new Date(now.getTime() + 60_000),
    );

    expect(noCar.ok).toBe(true);
    expect(otherOrigin.ok).toBe(true);
    expect(identifiedCar.ok).toBe(true);
  });

  it("rejects non-existing car and line combinations below the API validation layer", async () => {
    vi.stubEnv("TERMO_ALLOW_MEMORY_STORE", "1");

    await expect(
      createReportForRequest({ line: "L1", state: "calor", car: "M1234" }, null, new Date("2026-08-09T12:00:00Z")),
    ).resolves.toEqual({ ok: false, reason: "car_not_on_line" });
    await expect(
      createReportForRequest({ line: "L1", state: "calor", car: "M3000" }, null, new Date("2026-08-09T12:00:00Z")),
    ).resolves.toEqual({ ok: false, reason: "car_not_on_line" });
    await expect(
      createReportForRequest({ line: "L2", state: "calor", car: "M12000" }, null, new Date("2026-08-09T12:00:00Z")),
    ).resolves.toEqual({ ok: false, reason: "car_not_on_line" });
  });

  it("limits request fingerprints to four reports in ten minutes", async () => {
    vi.stubEnv("TERMO_ALLOW_MEMORY_STORE", "1");
    vi.stubEnv("TERMO_ABUSE_SECRET", "test-abuse-secret");
    const now = new Date("2026-07-05T12:00:00Z");
    const fingerprint = { ip: "203.0.113.10", userAgent: "test-browser" };

    const reports = await Promise.all(
      Array.from({ length: RATE_LIMIT_MAX_REPORTS }, (_, index) =>
        createReportForRequest({ line: "L1", state: "calor", car: `M200${index}` }, fingerprint, now),
      ),
    );
    const limited = await createReportForRequest({ line: "L1", state: "calor", car: "M2009" }, fingerprint, now);

    expect(reports.every((report) => report.ok)).toBe(true);
    expect(limited).toEqual({ ok: false, reason: "rate_limited" });
  });
});
