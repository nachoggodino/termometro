import { isMetroLine, type MetroLine } from "@/lib/domain/lines";
import { isTimeRange, type TimeRange } from "@/lib/domain/ranges";
import { getReportsForDashboard } from "./reports-repository";

export async function getDashboardDataForPage(search?: { range?: string | null; line?: string | null; lines?: MetroLine[] | null }) {
  const range: TimeRange = isTimeRange(search?.range) ? search.range : "today";
  const lines = search?.lines?.length ? search.lines : isMetroLine(search?.line) ? [search.line] : null;
  return getReportsForDashboard({ range, lines });
}
