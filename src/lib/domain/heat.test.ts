import { describe, expect, it } from "vitest";
import { calculateMetroHeatIndex, getAgreement, getConfidence, getExponentialDecayWeight, getHeatTone, getWeightedHeatScore } from "./heat";

describe("heat scoring", () => {
  it("maps heat scores to tones", () => {
    expect(getHeatTone(10)).toBe("fresco");
    expect(getHeatTone(60)).toBe("calor");
    expect(getHeatTone(90)).toBe("infierno");
  });

  it("weights reports by recency", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    const score = getWeightedHeatScore(
      [
        { state: "infierno", createdAt: new Date("2026-07-05T11:55:00Z") },
        { state: "fresco", createdAt: new Date("2026-07-04T12:00:00Z") },
      ],
      now,
    );
    expect(score).toBeGreaterThan(50);
  });

  it("uses a 3-day exponential half-life for report weights", () => {
    const now = new Date("2026-07-05T12:00:00Z");

    expect(getExponentialDecayWeight(new Date("2026-07-05T12:00:00Z"), now)).toBe(1);
    expect(getExponentialDecayWeight(new Date("2026-07-02T12:00:00Z"), now)).toBeCloseTo(0.5);
    expect(getExponentialDecayWeight(new Date("2026-06-29T12:00:00Z"), now)).toBeCloseTo(0.25);
  });

  it("calculates the cumulative Metro Heat Index diagnostics", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    const diagnostics = calculateMetroHeatIndex([
      { heat: 100, timestamp: now, carId: "M1001" },
      { heat: 60, timestamp: new Date("2026-07-02T12:00:00Z"), carId: "M1002" },
    ], 10, now);

    expect(diagnostics).toEqual({
      heat_index: 19.84,
      weighted_heat: 86.67,
      effective_reports: 1.5,
      report_score: 8.3,
      weighted_fleet_percentage: 15,
      fleet_score: 50,
    });
  });

  it("lets recent low-heat reports reduce the index even as volume increases", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    const hotOnly = calculateMetroHeatIndex([
      { heat: 100, timestamp: now, carId: "M1001" },
    ], 10, now);
    const withFreshReports = calculateMetroHeatIndex([
      { heat: 100, timestamp: now, carId: "M1001" },
      { heat: 0, timestamp: now, carId: "M1002" },
      { heat: 0, timestamp: now, carId: "M1003" },
    ], 10, now);

    expect(withFreshReports.effective_reports).toBeGreaterThan(hotOnly.effective_reports);
    expect(withFreshReports.heat_index).toBeLessThan(hotOnly.heat_index);
  });

  it("counts duplicate car reports for pressure but not for fleet coverage", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    const duplicateCarReports = calculateMetroHeatIndex([
      { heat: 100, timestamp: now, carId: "M1001" },
      { heat: 100, timestamp: now, carId: "M1001" },
    ], 10, now);
    const distinctCarReports = calculateMetroHeatIndex([
      { heat: 100, timestamp: now, carId: "M1001" },
      { heat: 100, timestamp: now, carId: "M1002" },
    ], 10, now);

    expect(duplicateCarReports.effective_reports).toBe(2);
    expect(duplicateCarReports.report_score).toBe(distinctCarReports.report_score);
    expect(duplicateCarReports.weighted_fleet_percentage).toBe(10);
    expect(distinctCarReports.weighted_fleet_percentage).toBe(20);
    expect(distinctCarReports.heat_index).toBeGreaterThan(duplicateCarReports.heat_index);
  });

  it("saturates report pressure and fleet coverage without exceeding 100", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    const diagnostics = calculateMetroHeatIndex(
      Array.from({ length: 200 }, (_, index) => ({
        heat: 100,
        timestamp: now,
        carId: `M${String(index).padStart(4, "0")}`,
      })),
      100,
      now,
    );

    expect(diagnostics.report_score).toBeGreaterThan(99);
    expect(diagnostics.fleet_score).toBeGreaterThan(99);
    expect(diagnostics.heat_index).toBeGreaterThan(99);
    expect(diagnostics.heat_index).toBeLessThanOrEqual(100);
  });

  it("computes agreement and confidence", () => {
    const reports = Array.from({ length: 10 }, () => ({
      state: "infierno" as const,
      createdAt: new Date("2026-07-05T12:00:00Z"),
    }));
    expect(getAgreement(reports)).toBe(1);
    expect(getConfidence(reports)).toBe("high");
  });

  it("uses lower confidence when samples are small or split between fresh and heat", () => {
    const conflicted = [
      { state: "infierno" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
      { state: "fresco" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
      { state: "fresco" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
      { state: "calor" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
      { state: "fresco" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
      { state: "infierno" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
    ];
    expect(getConfidence(conflicted)).toBe("low");
    expect(
      getConfidence([
        { state: "calor", createdAt: new Date("2026-07-05T12:00:00Z") },
        { state: "calor", createdAt: new Date("2026-07-05T12:00:00Z") },
        { state: "calor", createdAt: new Date("2026-07-05T12:00:00Z") },
        { state: "fresco", createdAt: new Date("2026-07-05T12:00:00Z") },
        { state: "infierno", createdAt: new Date("2026-07-05T12:00:00Z") },
      ]),
    ).toBe("medium");
  });

  it("treats calor and infierno as agreement against fresco", () => {
    const reports = [
      { state: "calor" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
      { state: "infierno" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
      { state: "calor" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
      { state: "infierno" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
      { state: "fresco" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
    ];

    expect(getAgreement(reports)).toBe(0.8);
    expect(getConfidence(reports)).toBe("medium");
  });
});
