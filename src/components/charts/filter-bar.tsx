"use client";

import * as Popover from "@radix-ui/react-popover";
import { ListTree, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CarSeriesSummary } from "@/lib/domain/dashboard";
import { LINE_COLORS, METRO_LINES, type MetroLine } from "@/lib/domain/lines";
import { TIME_RANGES, type TimeRange } from "@/lib/domain/ranges";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CenteredPopoverPanel, StickyUtilityBar } from "@/components/ui/popover-shell";

export function FilterBar({
  availableCarSeries,
  dictionary,
  locale,
  selectedCarSeries,
  selectedLines,
  selectedRange,
}: {
  availableCarSeries: CarSeriesSummary[];
  dictionary: Dictionary;
  locale: Locale;
  selectedCarSeries: number[];
  selectedLines: MetroLine[];
  selectedRange: TimeRange;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [draftLines, setDraftLines] = useState<MetroLine[]>(selectedLines);
  const [draftCarSeries, setDraftCarSeries] = useState<number[]>(selectedCarSeries);
  const [draftRange, setDraftRange] = useState<TimeRange>(selectedRange);

  useEffect(() => {
    if (!open && !navigationOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, navigationOpen]);

  function href(lines: MetroLine[], range = selectedRange, carSeries = selectedCarSeries) {
    const params = new URLSearchParams();
    if (lines.length > 0) params.set("linea", lines.join(","));
    if (carSeries.length > 0) params.set("serie", carSeries.join(","));
    if (range !== "summer") params.set("rango", range);
    return `/${locale}/explorar${params.size ? `?${params.toString()}` : ""}`;
  }

  function applyFilters() {
    setOpen(false);
    startTransition(() => {
      router.push(href(draftLines, draftRange, draftCarSeries));
    });
  }

  function clearFilters() {
    setDraftLines([]);
    setDraftCarSeries([]);
    setDraftRange("summer");
  }

  function toggleLine(line: MetroLine) {
    setDraftLines((current) => (current.includes(line) ? current.filter((item) => item !== line) : [...current, line]));
  }

  function toggleCarSeries(series: number) {
    setDraftCarSeries((current) => (current.includes(series) ? current.filter((item) => item !== series) : [...current, series]));
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftLines(selectedLines);
      setDraftCarSeries(selectedCarSeries);
      setDraftRange(selectedRange);
    }
    setOpen(nextOpen);
  }

  const selectedLineLabel = getSelectedLineLabel(selectedLines, dictionary);
  const selectedCarSeriesLabel = getSelectedCarSeriesLabel(selectedCarSeries, dictionary);
  const activeRangeLabel = dictionary.explore.ranges[selectedRange];

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <StickyUtilityBar>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted">{dictionary.explore.filters.active}</p>
              <p className="truncate text-sm font-semibold">
                {[selectedLineLabel, selectedCarSeriesLabel, activeRangeLabel].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Popover.Root open={navigationOpen} onOpenChange={setNavigationOpen}>
                <Popover.Trigger asChild>
                  <Button aria-label={dictionary.explore.navigation.button} className="min-h-10 px-3 py-2" type="button" variant="secondary">
                    <ListTree aria-hidden="true" className="size-4" />
                    <span className="hidden sm:inline">{dictionary.explore.navigation.button}</span>
                  </Button>
                </Popover.Trigger>
                <Popover.Portal>
                  {navigationOpen ? (
                  <CenteredPopoverPanel closeLabel={dictionary.common.closeMenu} title={dictionary.explore.navigation.title}>
                    <nav aria-label={dictionary.explore.navigation.title} className="mt-4 grid gap-2">
                      {EXPLORE_SECTIONS.map((section) => (
                        <Popover.Close asChild key={section.id}>
                          <a
                            className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm font-semibold transition duration-200 ease-out hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            href={`#${section.id}`}
                          >
                            {dictionary.explore.modules[section.module]}
                          </a>
                        </Popover.Close>
                      ))}
                    </nav>
                  </CenteredPopoverPanel>
                  ) : null}
                </Popover.Portal>
              </Popover.Root>
              <Popover.Trigger asChild>
                <Button className="min-h-10 px-3 py-2" type="button" variant="secondary">
                  <SlidersHorizontal aria-hidden="true" className="size-4" />
                  {dictionary.explore.filters.button}
                </Button>
              </Popover.Trigger>
            </div>
          </div>
      </StickyUtilityBar>
      <Popover.Portal>
        {open ? (
          <CenteredPopoverPanel closeLabel={dictionary.common.closeMenu} title={dictionary.explore.filters.title} widthClass="w-[min(calc(100vw-2rem),24rem)]">

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-muted">{dictionary.explore.filters.range}</p>
              <div className="flex flex-wrap items-stretch gap-1.5">
                {TIME_RANGES.map((range) => (
                  <button
                    aria-pressed={draftRange === range}
                    className={rangeClass(draftRange === range)}
                    key={range}
                    onClick={() => setDraftRange(range)}
                    type="button"
                  >
                    {dictionary.explore.ranges[range]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold text-muted">{dictionary.explore.filters.line}</p>
              <div className="flex flex-wrap items-stretch gap-1.5">
                <button className={allLinesClass(draftLines.length === 0)} onClick={() => setDraftLines([])} type="button">
                  {dictionary.explore.allLines}
                </button>
                {METRO_LINES.map((line) => (
                  <LineSwatch active={draftLines.includes(line)} label={line} line={line} onClick={() => toggleLine(line)} key={line} />
                ))}
              </div>
            </div>

            {availableCarSeries.length > 0 ? (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold text-muted">{dictionary.explore.filters.series}</p>
                <div className="flex flex-wrap items-stretch gap-1.5">
                  <SeriesSwatch
                    active={draftCarSeries.length === 0}
                    ariaLabel={dictionary.explore.allSeries}
                    label={dictionary.explore.allLines}
                    onClick={() => setDraftCarSeries([])}
                  />
                  {availableCarSeries.map((item) => (
                    <SeriesSwatch
                      active={draftCarSeries.includes(item.series)}
                      key={item.series}
                      label={item.label}
                      onClick={() => toggleCarSeries(item.series)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
              <Button disabled={isPending} onClick={clearFilters} type="button" variant="secondary">
                {dictionary.explore.filters.clear}
              </Button>
              <Button disabled={isPending} onClick={applyFilters} type="button">
                {isPending ? dictionary.explore.filters.applying : dictionary.explore.filters.apply}
              </Button>
            </div>
          </CenteredPopoverPanel>
        ) : null}
      </Popover.Portal>
    </Popover.Root>
  );
}

function SeriesSwatch({ active, ariaLabel, label, onClick }: { active: boolean; ariaLabel?: string; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={ariaLabel ?? label}
      aria-pressed={active}
      className={cn(
        "filter-date-swatch filter-swatch-text selection-flow flex items-center justify-center rounded-md border px-2 py-1 font-mono font-bold tabular-nums transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        active ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-border bg-surface-raised text-foreground hover:bg-surface",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

const EXPLORE_SECTIONS = [
  { id: "line-evolution", module: "lineEvolution" },
  { id: "total-reports", module: "totalReports" },
  { id: "report-volume", module: "volume" },
  { id: "line-cars", module: "lineCars" },
  { id: "car-series", module: "carSeries" },
  { id: "worst-cars", module: "worstCars" },
  { id: "car-explorer", module: "carExplorer" },
  { id: "heat-trend", module: "trend" },
  { id: "worst-hours", module: "worstHours" },
  { id: "fleet", module: "fleet" },
  { id: "line-details", module: "lineDetails" },
] as const;

function LineSwatch({
  active,
  label,
  line,
  onClick,
}: {
  active: boolean;
  label: string;
  line?: MetroLine;
  onClick: () => void;
}) {
  const lineColor = line ? LINE_COLORS[line] : null;
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "filter-date-swatch filter-swatch-text selection-flow flex items-center justify-center gap-1 rounded-md border px-2 py-1 font-bold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
        active ? "border-transparent" : "border-border bg-surface-raised text-foreground hover:bg-surface",
      )}
      onClick={onClick}
      style={
        active && lineColor
          ? {
              background: lineColor.fill,
              color: lineColor.textOnFill,
            }
          : undefined
      }
      type="button"
    >
      {lineColor ? (
        <span
          aria-hidden="true"
          className={cn("rounded-full transition duration-200 ease-out", active ? "size-2 bg-white" : "size-1.5")}
          style={!active ? { background: lineColor.fill } : undefined}
        />
      ) : null}
      {line ?? label}
    </button>
  );
}

function allLinesClass(selected: boolean) {
  return cn(
    "filter-date-swatch filter-swatch-text flex items-center justify-center rounded-md border px-2 py-1 font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    selected ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-border bg-surface-raised text-muted hover:bg-surface hover:text-foreground",
  );
}

function rangeClass(selected: boolean) {
  return cn(
    "filter-date-swatch filter-swatch-text rounded-md border px-2 py-1 font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    selected ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-border bg-surface-raised text-muted hover:text-foreground",
  );
}

function getSelectedLineLabel(selectedLines: MetroLine[], dictionary: Dictionary) {
  if (selectedLines.length === 0) return dictionary.explore.allLines;
  if (selectedLines.length <= 3) return selectedLines.join(", ");
  return dictionary.explore.filters.lineCount.replace("{count}", String(selectedLines.length));
}

function getSelectedCarSeriesLabel(selectedCarSeries: number[], dictionary: Dictionary) {
  if (selectedCarSeries.length === 0) return null;
  if (selectedCarSeries.length <= 2) return selectedCarSeries.map((series) => `${dictionary.explore.seriesLabel} ${series}`).join(", ");
  return dictionary.explore.filters.seriesCount.replace("{count}", String(selectedCarSeries.length));
}
