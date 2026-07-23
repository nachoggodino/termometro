import type { Locale } from "@/lib/i18n/config";
import { formatNumber } from "@/lib/i18n/format";

type HeatReportCountsProps = {
  calor?: number;
  calorLabel: string;
  className?: string;
  fresco?: number;
  frescoLabel?: string;
  hideZero?: boolean;
  infierno?: number;
  infiernoLabel: string;
  locale: Locale;
  orientation?: "inline" | "stack";
};

const STATE_COUNT_STYLES = {
  infierno: "text-heat-infierno",
  calor: "text-heat-calor",
  fresco: "text-heat-fresco",
} as const;

export function HeatReportCounts({
  calor = 0,
  calorLabel,
  className = "",
  fresco,
  frescoLabel,
  hideZero = false,
  infierno = 0,
  infiernoLabel,
  locale,
  orientation = "inline",
}: HeatReportCountsProps) {
  const counts = [
    { count: infierno, label: infiernoLabel, className: STATE_COUNT_STYLES.infierno },
    { count: calor, label: calorLabel, className: STATE_COUNT_STYLES.calor },
    ...(typeof fresco === "number" && frescoLabel ? [{ count: fresco, label: frescoLabel, className: STATE_COUNT_STYLES.fresco }] : []),
  ].filter((item) => !hideZero || item.count > 0);

  if (counts.length === 0) return null;

  if (orientation === "stack") {
    return (
      <span className={`flex max-h-10 flex-col justify-center gap-1 text-left text-[0.6875rem] font-semibold leading-none ${className}`}>
        {counts.map((item) => (
          <span className={item.className} key={item.label}>
            {formatNumber(item.count, locale)} {item.label}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[0.6875rem] font-semibold leading-none ${className}`}>
      {counts.map((item, index) => (
        <span className="contents" key={item.label}>
          {index > 0 ? <span className="text-muted">·</span> : null}
          <span className={item.className}>
            {formatNumber(item.count, locale)} {item.label}
          </span>
        </span>
      ))}
    </span>
  );
}
