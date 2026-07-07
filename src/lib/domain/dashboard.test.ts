import { describe, expect, it } from "vitest";
import { buildDashboardData, getFleetAffectedScore } from "./dashboard";
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

  it("excludes hidden reports and counts the last day", () => {
    const data = buildDashboardData([
      report({ id: "1", line: "L1", state: "infierno", createdAt: new Date("2026-07-05T11:30:00Z") }),
      report({ id: "2", line: "L1", state: "infierno", hiddenAt: now }),
      report({ id: "3", line: "L5", state: "calor", createdAt: new Date("2026-07-04T12:30:00Z") }),
    ], now);

    expect(data.reportsLastDay).toBe(2);
    expect(data.lineSummaries.find((summary) => summary.line === "L1")?.reports).toBe(1);
  });

  it("uses hourly buckets for today charts", () => {
    const data = buildDashboardData([
      report({ id: "1", line: "L1", state: "infierno", createdAt: new Date("2026-07-05T08:30:00Z") }),
      report({ id: "2", line: "L5", state: "calor", createdAt: new Date("2026-07-05T10:45:00Z") }),
    ], now, undefined, "today");

    expect(data.trend).toHaveLength(24);
    expect(data.trend.reduce((total, point) => total + point.reports, 0)).toBe(2);
    expect(data.lineEvolution).toHaveLength(24);
    expect(data.lineEvolution.reduce((total, point) => total + (point.L1 ?? 0) + (point.L5 ?? 0), 0)).toBe(2);
  });

  it("uses daily buckets for wider range charts and tracks the busiest lines", () => {
    const data = buildDashboardData([
      report({ id: "1", line: "L1", state: "infierno", createdAt: new Date("2026-07-04T08:30:00Z") }),
      report({ id: "2", line: "L1", state: "calor", createdAt: new Date("2026-07-05T10:45:00Z") }),
      report({ id: "3", line: "L5", state: "calor", createdAt: new Date("2026-07-05T11:15:00Z") }),
    ], now, undefined, "sevenDays");

    expect(data.trend).toHaveLength(7);
    expect(data.trend.reduce((total, point) => total + point.reports, 0)).toBe(3);
    expect(data.lineEvolution.reduce((total, point) => total + (point.L1 ?? 0), 0)).toBe(2);
    expect(data.lineEvolution.reduce((total, point) => total + (point.L5 ?? 0), 0)).toBe(1);
  });

  it("scores heat evolution by affected fleet coverage only", () => {
    const noAffectedFleetScore = getFleetAffectedScore([
      report({ id: "1", line: "L1", state: "fresco", car: "M1001" }),
    ], 10);
    const singleCarScore = getFleetAffectedScore([
      report({ id: "1", line: "L1", state: "calor", car: "M1001" }),
    ], 10);
    const widerFleetSignalScore = getFleetAffectedScore([
      report({ id: "1", line: "L1", state: "calor", car: "M1001" }),
      report({ id: "2", line: "L1", state: "calor", car: "M1002" }),
      report({ id: "3", line: "L1", state: "calor", car: "M1003" }),
    ], 10);
    const fullFleetScore = getFleetAffectedScore(Array.from({ length: 10 }, (_, index) =>
      report({ id: String(index), line: "L1", state: "infierno", car: `M10${String(index).padStart(2, "0")}` }),
    ), 10);

    expect(noAffectedFleetScore).toBe(0);
    expect(singleCarScore).toBe(10);
    expect(widerFleetSignalScore).toBe(30);
    expect(fullFleetScore).toBe(100);
  });

  it("excludes reports after the summer window", () => {
    const data = buildDashboardData([
      report({ id: "1", line: "L1", state: "infierno", createdAt: new Date("2026-10-15T12:00:00Z") }),
      report({ id: "2", line: "L5", state: "infierno", createdAt: new Date("2026-11-01T12:00:00Z") }),
    ], new Date("2026-11-02T12:00:00Z"), undefined, "summer");

    expect(data.lineSummaries.find((summary) => summary.line === "L1")?.reports).toBe(1);
    expect(data.lineSummaries.find((summary) => summary.line === "L5")?.reports).toBe(0);
    expect(data.recentReports).toHaveLength(1);
  });
});
