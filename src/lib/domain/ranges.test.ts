import { describe, expect, it } from "vitest";
import { getRangeEnd, getRangeStart, getRangeWindow, getSummerEnd, isTimeRange } from "./ranges";

describe("time ranges", () => {
  it("validates range names", () => {
    expect(isTimeRange("today")).toBe(true);
    expect(isTimeRange("quarter")).toBe(false);
  });

  it("computes today, seven day, and month starts", () => {
    const now = new Date("2026-07-05T12:34:00Z");
    expect(getRangeStart("today", now).toISOString()).toBe("2026-07-04T22:00:00.000Z");
    expect(getRangeStart("sevenDays", now).toISOString()).toBe("2026-06-28T22:00:00.000Z");
    expect(getRangeStart("month", now).toISOString()).toBe("2026-06-05T22:00:00.000Z");
  });

  it("computes a rolling last 24 hour window", () => {
    const now = new Date("2026-07-05T12:34:00Z");
    const window = getRangeWindow("last24Hours", now);

    expect(window.start.toISOString()).toBe("2026-07-04T12:34:00.000Z");
    expect(window.end.toISOString()).toBe("2026-07-05T12:34:00.000Z");
  });

  it("uses Madrid calendar days across UTC date boundaries", () => {
    const now = new Date("2026-07-04T22:30:00Z");

    expect(getRangeStart("today", now).toISOString()).toBe("2026-07-04T22:00:00.000Z");
  });

  it("uses current summer after May 15", () => {
    const start = getRangeStart("summer", new Date("2026-07-05T12:00:00Z"));
    expect(start.toISOString()).toBe("2026-05-14T22:00:00.000Z");
    expect(getSummerEnd(new Date("2026-07-05T12:00:00Z")).toISOString()).toBe("2026-10-15T21:59:59.999Z");
  });

  it("uses previous summer before May 15", () => {
    expect(getRangeStart("summer", new Date("2027-02-01T12:00:00Z")).toISOString()).toBe("2026-05-14T22:00:00.000Z");
  });

  it("caps summer at October 15 after the season ends", () => {
    const now = new Date("2026-11-02T12:00:00Z");
    const end = getRangeEnd("summer", now);

    expect(end.toISOString()).toBe("2026-10-15T21:59:59.999Z");
  });

  it("returns bounded windows for summer", () => {
    const window = getRangeWindow("summer", new Date("2026-11-02T12:00:00Z"));

    expect(window.start.toISOString()).toBe("2026-05-14T22:00:00.000Z");
    expect(window.end.toISOString()).toBe("2026-10-15T21:59:59.999Z");
  });
});
