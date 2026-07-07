import { describe, expect, it } from "vitest";
import { getRangeEnd, getRangeStart, getRangeWindow, getSummerEnd, isTimeRange } from "./ranges";

describe("time ranges", () => {
  it("validates range names", () => {
    expect(isTimeRange("today")).toBe(true);
    expect(isTimeRange("quarter")).toBe(false);
  });

  it("computes today, seven day, and month starts", () => {
    const now = new Date("2026-07-05T12:34:00Z");
    expect(getRangeStart("today", now).getDate()).toBe(5);
    expect(getRangeStart("sevenDays", now).getDate()).toBe(29);
    expect(getRangeStart("month", now).getDate()).toBe(6);
  });

  it("uses current summer after May 15", () => {
    const start = getRangeStart("summer", new Date("2026-07-05T12:00:00Z"));
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(4);
    expect(start.getDate()).toBe(15);
    expect(getSummerEnd(new Date("2026-07-05T12:00:00Z")).getFullYear()).toBe(2026);
  });

  it("uses previous summer before May 15", () => {
    expect(getRangeStart("summer", new Date("2027-02-01T12:00:00Z")).getFullYear()).toBe(2026);
  });

  it("caps summer at October 15 after the season ends", () => {
    const now = new Date("2026-11-02T12:00:00Z");
    const end = getRangeEnd("summer", now);

    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(9);
    expect(end.getDate()).toBe(15);
  });

  it("returns bounded windows for summer", () => {
    const window = getRangeWindow("summer", new Date("2026-11-02T12:00:00Z"));

    expect(window.start.getFullYear()).toBe(2026);
    expect(window.start.getMonth()).toBe(4);
    expect(window.start.getDate()).toBe(15);
    expect(window.end.getFullYear()).toBe(2026);
    expect(window.end.getMonth()).toBe(9);
    expect(window.end.getDate()).toBe(15);
  });
});
