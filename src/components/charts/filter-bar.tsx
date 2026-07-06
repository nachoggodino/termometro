import Link from "next/link";
import { METRO_LINES } from "@/lib/domain/lines";
import { TIME_RANGES, type TimeRange } from "@/lib/domain/ranges";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function FilterBar({
  dictionary,
  locale,
  selectedLine,
  selectedRange,
}: {
  dictionary: Dictionary;
  locale: Locale;
  selectedLine: string | null;
  selectedRange: TimeRange;
}) {
  function href(line: string | null, range = selectedRange) {
    const params = new URLSearchParams();
    if (line) params.set("linea", line);
    if (range !== "today") params.set("rango", range);
    return `/${locale}/explorar${params.size ? `?${params.toString()}` : ""}`;
  }

  return (
    <div className="sticky top-[65px] z-20 -mx-4 border-b border-border bg-background/96 px-4 py-3 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Link aria-current={!selectedLine ? "true" : undefined} className={chipClass(!selectedLine)} href={href(null)}>
          {dictionary.explore.allLines}
        </Link>
        {METRO_LINES.map((line) => (
          <Link aria-current={selectedLine === line ? "true" : undefined} className={chipClass(selectedLine === line)} href={href(line)} key={line}>
            {line}
          </Link>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {TIME_RANGES.map((range) => (
          <Link aria-current={selectedRange === range ? "true" : undefined} className={chipClass(selectedRange === range)} href={href(selectedLine, range)} key={range}>
            {dictionary.explore.ranges[range]}
          </Link>
        ))}
      </div>
    </div>
  );
}

function chipClass(selected: boolean) {
  return cn(
    "shrink-0 rounded-md border px-3 py-2 text-sm font-semibold transition",
    selected ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]" : "border-border bg-surface-raised text-muted hover:text-foreground",
  );
}
