import { describe, expect, it } from "vitest";
import {
  formatCarCode,
  isDuplicateCandidate,
  isRetiredCarCode,
  normalizeCarCode,
  parseReportInput,
  RETIRED_CAR_SERIES_REASON,
} from "./reports";

describe("report validation", () => {
  it("normalizes loose car codes", () => {
    expect(normalizeCarCode("m1234")).toBe("M1234");
    expect(normalizeCarCode(" R-2401 ")).toBe("R2401");
    expect(normalizeCarCode("s12345")).toBe("S12345");
    expect(normalizeCarCode("z12345")).toBeNull();
    expect(normalizeCarCode("nonsense")).toBeNull();
    expect(formatCarCode("s12345")).toBe("S-12345");
  });

  it("parses valid report input", () => {
    const parsed = parseReportInput({ line: "L1", state: "calor", car: "m2001" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.car).toBe("M2001");
    }
  });

  it("rejects retired series 1000 car codes", () => {
    for (const car of ["M1000", "R-1255", "S1999"]) {
      const parsed = parseReportInput({ line: "L1", state: "calor", car });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues.some((issue) => issue.message === RETIRED_CAR_SERIES_REASON)).toBe(true);
      }
      expect(isRetiredCarCode(car)).toBe(true);
    }

    expect(isRetiredCarCode("M2000")).toBe(false);
    expect(parseReportInput({ line: "L1", state: "calor", car: "M2000" }).success).toBe(true);
    expect(parseReportInput({ line: "L1", state: "calor", car: "M4000" }).success).toBe(true);
  });

  it("accepts omitted or null optional car input", () => {
    const omitted = parseReportInput({ line: "L1", state: "calor" });
    const nullable = parseReportInput({ line: "L1", state: "calor", car: null });

    expect(omitted.success).toBe(true);
    expect(nullable.success).toBe(true);
    if (nullable.success) {
      expect(nullable.data.car).toBeNull();
    }
  });

  it("rejects non-empty invalid car input", () => {
    expect(parseReportInput({ line: "L1", state: "calor", car: "1234" }).success).toBe(false);
    expect(parseReportInput({ line: "L1", state: "calor", car: "AB1234" }).success).toBe(false);
    expect(parseReportInput({ line: "L1", state: "calor", car: "M123" }).success).toBe(false);
    expect(parseReportInput({ line: "L1", state: "calor", car: "Z1234" }).success).toBe(false);
  });

  it("detects short-window duplicates", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    expect(
      isDuplicateCandidate(
        { line: "L1", state: "calor", car: "M2001" },
        { id: "1", line: "L1", state: "calor", car: "M2001", createdAt: new Date("2026-07-05T11:55:00Z") },
        now,
      ),
    ).toBe(true);
  });

  it("suppresses same-line no-car reports inside the duplicate window", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    expect(
      isDuplicateCandidate(
        { line: "L1", state: "infierno", car: null },
        { id: "1", line: "L1", state: "calor", car: null, createdAt: new Date("2026-07-05T11:55:00Z") },
        now,
      ),
    ).toBe(true);
  });

  it("does not suppress no-car reports across different lines", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    expect(
      isDuplicateCandidate(
        { line: "L2", state: "calor", car: null },
        { id: "1", line: "L1", state: "calor", car: null, createdAt: new Date("2026-07-05T11:55:00Z") },
        now,
      ),
    ).toBe(false);
  });

  it("does not treat expired duplicate windows as duplicates", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    expect(
      isDuplicateCandidate(
        { line: "L1", state: "calor", car: "M2001" },
        { id: "1", line: "L1", state: "calor", car: "M2001", createdAt: new Date("2026-07-05T11:30:00Z") },
        now,
      ),
    ).toBe(false);
  });
});
