import { describe, expect, it } from "vitest";
import { getAgreement, getConfidence, getHeatTone, getWeightedHeatScore } from "./heat";

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

  it("computes agreement and confidence", () => {
    const reports = Array.from({ length: 10 }, () => ({
      state: "infierno" as const,
      createdAt: new Date("2026-07-05T12:00:00Z"),
    }));
    expect(getAgreement(reports)).toBe(1);
    expect(getConfidence(reports)).toBe("high");
  });

  it("uses lower confidence when samples are small or conflicted", () => {
    const conflicted = [
      { state: "infierno" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
      { state: "fresco" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
      { state: "calor" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
      { state: "infierno" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
      { state: "fresco" as const, createdAt: new Date("2026-07-05T12:00:00Z") },
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
});
