import { describe, expect, it } from "vitest";
import { buildDashboardData } from "./dashboard";
import type { Report } from "./reports";

const now = new Date("2026-07-05T12:00:00Z");

function report(partial: Partial<Report> & Pick<Report, "id" | "line" | "state">): Report {
  return {
    car: null,
    createdAt: now,
    hiddenAt: null,
    ...partial,
  };
}

describe("dashboard data", () => {
  it("ranks hot lines and keeps recent reports", () => {
    const data = buildDashboardData([
      report({ id: "1", line: "L1", state: "infierno", car: "M1001" }),
      report({ id: "2", line: "L1", state: "calor", car: "M1001" }),
      report({ id: "3", line: "L2", state: "fresco" }),
    ], now);

    expect(data.lineSummaries[0].line).toBe("L1");
    expect(data.worstCars[0].car).toBe("M1001");
    expect(data.recentReports).toHaveLength(3);
  });

  it("excludes hidden reports and counts last two hours", () => {
    const data = buildDashboardData([
      report({ id: "1", line: "L1", state: "infierno", createdAt: new Date("2026-07-05T11:30:00Z") }),
      report({ id: "2", line: "L1", state: "infierno", hiddenAt: now }),
      report({ id: "3", line: "L5", state: "calor", createdAt: new Date("2026-07-04T11:30:00Z") }),
    ], now);

    expect(data.reportsLastTwoHours).toBe(1);
    expect(data.lineSummaries.find((summary) => summary.line === "L1")?.reports).toBe(1);
  });
});
