import { describe, expect, it } from "vitest";
import { formatCarCode, isDuplicateCandidate, normalizeCarCode, parseReportInput } from "./reports";

describe("report validation", () => {
  it("normalizes loose car codes", () => {
    expect(normalizeCarCode("m1234")).toBe("M1234");
    expect(normalizeCarCode(" R-2401 ")).toBe("R2401");
    expect(normalizeCarCode("z12345")).toBe("Z12345");
    expect(normalizeCarCode("nonsense")).toBeNull();
    expect(formatCarCode("z12345")).toBe("Z-12345");
  });

  it("parses valid report input", () => {
    const parsed = parseReportInput({ line: "L1", state: "calor", car: "m1001" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.car).toBe("M1001");
    }
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
  });

  it("detects short-window duplicates", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    expect(
      isDuplicateCandidate(
        { line: "L1", state: "calor", car: "M1001" },
        { id: "1", line: "L1", state: "calor", car: "M1001", createdAt: new Date("2026-07-05T11:55:00Z") },
        now,
      ),
    ).toBe(true);
  });

  it("does not globally suppress no-car reports as duplicates", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    expect(
      isDuplicateCandidate(
        { line: "L1", state: "calor", car: null },
        { id: "1", line: "L1", state: "calor", car: null, createdAt: new Date("2026-07-05T11:55:00Z") },
        now,
      ),
    ).toBe(false);
  });

  it("does not treat expired duplicate windows as duplicates", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    expect(
      isDuplicateCandidate(
        { line: "L1", state: "calor", car: "M1001" },
        { id: "1", line: "L1", state: "calor", car: "M1001", createdAt: new Date("2026-07-05T11:30:00Z") },
        now,
      ),
    ).toBe(false);
  });
});
