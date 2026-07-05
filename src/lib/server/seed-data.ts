import type { HeatState } from "@/lib/domain/heat";
import type { MetroLine } from "@/lib/domain/lines";
import type { Report } from "@/lib/domain/reports";

const now = new Date();

const hotCars = ["M-1001", "M-1004", "R-2401", "M-1732", "R-4110"];
const l5Cars = ["M-5002", "R-5300", "M-5120", "R-5444"];
const normalCars = ["M-2201", "R-3304", "M-6012", "M-8066", "R-9010", "M-1204"];

function hoursAgo(hours: number) {
  return new Date(now.getTime() - hours * 3_600_000);
}

function makeReport(index: number, line: MetroLine, state: HeatState, hours: number, car: string | null): Report {
  return {
    id: `seed-${index}`,
    line,
    state,
    car,
    createdAt: hoursAgo(hours),
    hiddenAt: null,
  };
}

export const seedReports: Report[] = [
  ...Array.from({ length: 24 }, (_, index) =>
    makeReport(index, "L1", index % 5 === 0 ? "calor" : "infierno", index * 0.55, hotCars[index % hotCars.length]),
  ),
  ...Array.from({ length: 17 }, (_, index) =>
    makeReport(100 + index, "L5", index % 4 === 0 ? "calor" : "infierno", index * 0.8, l5Cars[index % l5Cars.length]),
  ),
  ...Array.from({ length: 16 }, (_, index) =>
    makeReport(
      200 + index,
      (["L2", "L3", "L6", "L8", "L10", "L12"] as MetroLine[])[index % 6],
      index % 6 === 0 ? "calor" : "fresco",
      index * 2.5,
      index % 3 === 0 ? null : normalCars[index % normalCars.length],
    ),
  ),
  makeReport(300, "L1", "fresco", 3.2, "M-1001"),
  makeReport(301, "L5", "fresco", 4.4, null),
  makeReport(302, "L7", "calor", 1.6, "M-7310"),
];
