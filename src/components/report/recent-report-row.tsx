import { LINE_COLORS } from "@/lib/domain/lines";
import { formatCarCode, type Report } from "@/lib/domain/reports";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatReportTime } from "@/lib/i18n/format";
import { HeatStateBadge } from "./heat-state-badge";

export function RecentReportRow({
  dictionary,
  locale,
  report,
}: {
  dictionary: Dictionary;
  locale: Locale;
  report: Report;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 py-3">
      <span
        className="rounded-sm px-1.5 py-1 text-xs font-bold"
        style={{
          background: LINE_COLORS[report.line].fill,
          color: LINE_COLORS[report.line].textOnFill,
        }}
      >
        {report.line}
      </span>
      <p className="min-w-0 truncate font-mono text-sm font-semibold">{report.car ? formatCarCode(report.car) : dictionary.explore.noCar}</p>
      <HeatStateBadge dictionary={dictionary} state={report.state} />
      <time className="font-mono text-xs text-muted">{formatReportTime(report.createdAt, locale)}</time>
    </div>
  );
}
