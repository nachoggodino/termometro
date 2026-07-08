import { describe, expect, it } from "vitest";
import { buildDashboardData, getHeatEvolutionScore } from "./dashboard";
import { METRO_LINES, type MetroLine } from "./lines";
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

  it("builds the car explorer default from the most reported car in the selected range", () => {
    const data = buildDashboardData([
      report({ id: "1", line: "L1", state: "infierno", car: "M1001", createdAt: new Date("2026-07-05T08:30:00Z") }),
      report({ id: "2", line: "L5", state: "calor", car: "M1001", createdAt: new Date("2026-07-05T10:45:00Z") }),
      report({ id: "3", line: "L2", state: "calor", car: "M2002", createdAt: new Date("2026-07-05T11:00:00Z") }),
      report({ id: "4", line: "L1", state: "calor", car: "M1001", createdAt: new Date("2026-06-01T11:00:00Z") }),
    ], now, undefined, "today");

    expect(data.carExplorer.defaultCar?.car).toBe("M1001");
    expect(data.carExplorer.defaultCar?.reports).toBe(2);
    expect(data.carExplorer.defaultCar?.lines).toEqual(["L1", "L5"]);
    expect(data.carExplorer.defaultCar?.history).toHaveLength(24);
    expect(data.carExplorer.defaultCar?.history.reduce((total, point) => total + point.reports, 0)).toBe(2);
    expect(data.carExplorer.options.map((option) => option.car)).toEqual(["M1001", "M2002"]);
  });

  it("keeps worst car totals aligned with car explorer totals", () => {
    const data = buildDashboardData([
      report({ id: "1", line: "L1", state: "infierno", car: "M1001", createdAt: new Date("2026-07-05T08:30:00Z") }),
      report({ id: "2", line: "L5", state: "calor", car: "M1001", createdAt: new Date("2026-07-05T10:45:00Z") }),
      report({ id: "3", line: "L1", state: "fresco", car: "M1001", createdAt: new Date("2026-07-05T11:15:00Z") }),
      report({ id: "4", line: "L2", state: "infierno", car: "M2002", createdAt: new Date("2026-07-05T11:30:00Z") }),
    ], now, undefined, "today");

    const worstCar = data.worstCars.find((car) => car.car === "M1001");
    const explorerCar = data.carExplorer.selections.find((car) => car.car === "M1001");

    expect(worstCar?.reports).toBe(2);
    expect(worstCar?.totalReports).toBe(3);
    expect(worstCar?.calorReports).toBe(1);
    expect(worstCar?.infiernoReports).toBe(1);
    expect(worstCar?.lines).toEqual(["L1", "L5"]);
    expect(explorerCar?.reports).toBe(worstCar?.totalReports);
    expect(explorerCar?.calorReports).toBe(worstCar?.calorReports);
    expect(explorerCar?.infiernoReports).toBe(worstCar?.infiernoReports);
    expect(explorerCar?.history.reduce((total, point) => total + point.reports, 0)).toBe(worstCar?.totalReports);
  });

  it("ranks worst cars by hot report count before heat severity and ignores fresh reports", () => {
    const reports = [
      ...Array.from({ length: 10 }, (_, index) =>
        report({ id: `m2168-${index}`, line: "L1", state: "calor", car: "M2168", createdAt: new Date("2026-07-05T08:30:00Z") }),
      ),
      ...Array.from({ length: 30 }, (_, index) =>
        report({ id: `fresh-${index}`, line: "L1", state: "fresco", car: "M9999", createdAt: new Date("2026-07-05T08:30:00Z") }),
      ),
      ...Array.from({ length: 8 }, (_, index) =>
        report({ id: `hot-${index}`, line: "L5", state: "infierno", car: `R20${String(index).padStart(2, "0")}`, createdAt: new Date("2026-07-05T09:30:00Z") }),
      ),
    ];

    const data = buildDashboardData(reports, now, undefined, "today");

    expect(data.worstCars[0].car).toBe("M2168");
    expect(data.worstCars[0].reports).toBe(10);
    expect(data.worstCars.some((car) => car.car === "M9999")).toBe(false);
  });

  it("caps recent reports at the latest 25 reports", () => {
    const reports = Array.from({ length: 105 }, (_, index) =>
      report({
        id: String(index),
        line: "L1",
        state: "calor",
        createdAt: new Date(now.getTime() - index * 60_000),
      }),
    );

    const data = buildDashboardData(reports, now);

    expect(data.recentReports).toHaveLength(25);
    expect(data.recentReports[0].id).toBe("0");
    expect(data.recentReports.at(-1)?.id).toBe("24");
  });

  it("keeps latest reports even when they are before the selected range start", () => {
    const data = buildDashboardData([
      report({ id: "1", line: "L1", state: "infierno", createdAt: new Date("2026-06-01T08:30:00Z") }),
    ], now, undefined, "sevenDays");

    expect(data.lineSummaries.find((summary) => summary.line === "L1")?.reports).toBe(0);
    expect(data.recentReports).toHaveLength(1);
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

  it("uses accumulated summer reports for the Termo Indicator trend", () => {
    const estimatedCarsByLine = Object.fromEntries(METRO_LINES.map((line) => [line, 10])) as Record<MetroLine, number>;
    const reports = [
      report({ id: "1", line: "L1", state: "infierno", car: "M1001", createdAt: new Date("2026-06-01T08:30:00Z") }),
    ];
    const data = buildDashboardData(reports, now, estimatedCarsByLine, "sevenDays");
    const monthData = buildDashboardData(reports, now, estimatedCarsByLine, "month");

    const l1Values = data.trend.map((point) => point.L1);

    expect(l1Values).toEqual([0.03, 0.02, 0.02, 0.01, 0.01, 0.01, 0.01]);
    expect(monthData.trend.slice(-7).map((point) => point.L1)).toEqual(l1Values);
  });

  it("scores heat evolution with the cumulative Metro Heat Index", () => {
    const noAffectedFleetScore = getHeatEvolutionScore([
      report({ id: "1", line: "L1", state: "fresco", car: "M1001" }),
    ], 10, now);
    const singleCarScore = getHeatEvolutionScore([
      report({ id: "1", line: "L1", state: "calor", car: "M1001" }),
    ], 10, now);
    const widerFleetSignalScore = getHeatEvolutionScore([
      report({ id: "1", line: "L1", state: "calor", car: "M1001" }),
      report({ id: "2", line: "L1", state: "calor", car: "M1002" }),
      report({ id: "3", line: "L1", state: "calor", car: "M1003" }),
    ], 10, now);
    const fullFleetScore = getHeatEvolutionScore(Array.from({ length: 10 }, (_, index) =>
      report({ id: String(index), line: "L1", state: "infierno", car: `M10${String(index).padStart(2, "0")}` }),
    ), 10, now);

    expect(noAffectedFleetScore).toBe(0);
    expect(singleCarScore).toBe(9.96);
    expect(widerFleetSignalScore).toBeGreaterThan(singleCarScore);
    expect(fullFleetScore).toBeGreaterThan(widerFleetSignalScore);
    expect(fullFleetScore).toBeLessThanOrEqual(100);
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
