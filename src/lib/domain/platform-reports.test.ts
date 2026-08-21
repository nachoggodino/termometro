import { describe, expect, it } from "vitest";
import {
  STATION_NOT_ON_LINE_REASON,
  getReportInputErrorReason,
  isDuplicateCandidate,
  parseReportInput,
} from "./reports";
import { stationIdFromName } from "./stations";

describe("platform report validation", () => {
  it("keeps legacy report payloads as car reports", () => {
    const parsed = parseReportInput({ line: "L1", state: "calor", car: "M2234" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.locationKind).toBe("car");
      expect(parsed.data.stationId).toBeNull();
      expect(parsed.data.car).toBe("M2234");
    }
  });

  it("accepts a canonical station on the selected line", () => {
    const stationId = stationIdFromName("Núñez de Balboa");
    const parsed = parseReportInput({
      line: "L5",
      state: "infierno",
      locationKind: "platform",
      stationId,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.locationKind).toBe("platform");
      expect(parsed.data.stationId).toBe(stationId);
      expect(parsed.data.car).toBeNull();
    }
  });

  it("rejects a station that is not on the selected line", () => {
    const parsed = parseReportInput({
      line: "L1",
      state: "calor",
      locationKind: "platform",
      stationId: stationIdFromName("Núñez de Balboa"),
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(getReportInputErrorReason(parsed.error)).toBe(STATION_NOT_ON_LINE_REASON);
    }
  });

  it("deduplicates platforms by line, station and state without colliding with no-car reports", () => {
    const now = new Date("2026-08-20T05:00:00Z");
    const stationId = stationIdFromName("Sol");
    const platform = {
      id: "platform-1",
      line: "L1" as const,
      state: "calor" as const,
      car: null,
      locationKind: "platform" as const,
      stationId,
      createdAt: new Date("2026-08-20T04:55:00Z"),
    };
    const noCar = {
      id: "car-1",
      line: "L1" as const,
      state: "calor" as const,
      car: null,
      locationKind: "car" as const,
      stationId: null,
      createdAt: new Date("2026-08-20T04:55:00Z"),
    };

    expect(
      isDuplicateCandidate(
        { line: "L1", state: "calor", locationKind: "platform", stationId, car: null },
        platform,
        now,
      ),
    ).toBe(true);
    expect(
      isDuplicateCandidate(
        { line: "L1", state: "infierno", locationKind: "platform", stationId, car: null },
        platform,
        now,
      ),
    ).toBe(false);
    expect(
      isDuplicateCandidate(
        { line: "L1", state: "calor", locationKind: "platform", stationId, car: null },
        noCar,
        now,
      ),
    ).toBe(false);
  });
});
