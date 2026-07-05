import { describe, expect, it } from "vitest";
import { isDuplicateCandidate, normalizeCarCode, parseReportInput } from "./reports";

describe("report validation", () => {
  it("normalizes loose car codes", () => {
    expect(normalizeCarCode("m1234")).toBe("M-1234");
    expect(normalizeCarCode(" R-2401 ")).toBe("R-2401");
    expect(normalizeCarCode("nonsense")).toBeNull();
  });

  it("parses valid report input", () => {
    const parsed = parseReportInput({ line: "L1", state: "calor", car: "m1001" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.car).toBe("M-1001");
    }
  });

  it("detects short-window duplicates", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    expect(
      isDuplicateCandidate(
        { line: "L1", state: "calor", car: "M-1001" },
        { id: "1", line: "L1", state: "calor", car: "M-1001", createdAt: new Date("2026-07-05T11:55:00Z") },
        now,
      ),
    ).toBe(true);
  });
});
