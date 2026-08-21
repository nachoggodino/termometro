export const PLATFORM_WITHOUT_AC_NET_HEAT_THRESHOLD = 5;

export type PlatformStateCounts = {
  frescoReports: number;
  calorReports: number;
  infiernoReports: number;
};

export function getPlatformHeatReports(counts: Pick<PlatformStateCounts, "calorReports" | "infiernoReports">) {
  return counts.calorReports + counts.infiernoReports;
}

export function hasPlatformWithoutAcSignal(counts: PlatformStateCounts) {
  return getPlatformHeatReports(counts) - counts.frescoReports > PLATFORM_WITHOUT_AC_NET_HEAT_THRESHOLD;
}
