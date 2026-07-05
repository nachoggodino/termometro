import { isMetroLine } from "@/lib/domain/lines";
import { isTimeRange, type TimeRange } from "@/lib/domain/ranges";
import { getReportsForDashboard } from "./reports-repository";

export async function getDashboardDataForPage(search?: { range?: string | null; line?: string | null }) {
  const range: TimeRange = isTimeRange(search?.range) ? search.range : "today";
  const line = isMetroLine(search?.line) ? search.line : null;
  return getReportsForDashboard({ range, line });
}
