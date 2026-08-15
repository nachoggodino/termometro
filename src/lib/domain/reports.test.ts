import { describe, expect, it } from "vitest";
import {
  CAR_NOT_ON_LINE_REASON,
  isDuplicateCandidate,
  parseReportInput,
} from "./reports";

describe("report validation", () => {
  it("parses valid report input", () => {
    const parsed = parseReportInput({ line: "L1", state: "calor", car: "m2001" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.car).toBe("M2001");
    }
  });

  it("rejects cars outside existing series and cars that do not exist on L1", () => {
    for (const [line, car] of [
      ["L2", "M1000"],
      ["L2", "R-1999"],
      ["L2", "S12000"],
      ["L1", "M3000"],
      ["L1", "S11999"],
    ] as const) {
      const parsed = parseReportInput({ line, state: "calor", car });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues.some((issue) => issue.message === CAR_NOT_ON_LINE_REASON)).toBe(true);
      }
    }
  });

  it("accepts the boundary series that exist on each line", () => {
    expect(parseReportInput({ line: "L1", state: "calor", car: "M2000" }).success).toBe(true);
    expect(parseReportInput({ line: "L1", state: "calor", car: "M2999" }).success).toBe(true);
    expect(parseReportInput({ line: "L2", state: "calor", car: "M2000" }).success).toBe(true);
    expect(parseReportInput({ line: "L2", state: "calor", car: "M3000" }).success).toBe(true);
    expect(parseReportInput({ line: "L12", state: "calor", car: "M11000" }).success).toBe(true);
    expect(parseReportInput({ line: "L12", state: "calor", car: "M11999" }).success).toBe(true);
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
