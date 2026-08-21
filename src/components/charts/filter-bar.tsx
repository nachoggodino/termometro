"use client";

import * as Popover from "@radix-ui/react-popover";
import { Building2, ListTree, SlidersHorizontal, TrainFront, type LucideIcon } from "lucide-react";
import { useEffect, useOptimistic, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { CarSeriesSummary } from "@/lib/domain/dashboard";
import { LINE_COLORS, METRO_LINES, type MetroLine } from "@/lib/domain/lines";
import type { ReportLocationKind } from "@/lib/domain/reports";
import { TIME_RANGES, type TimeRange } from "@/lib/domain/ranges";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { getPlatformMessages } from "@/lib/i18n/platform-messages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CenteredPopoverPanel, StickyUtilityBar } from "@/components/ui/popover-shell";

export function FilterBar({
  availableCarSeries,
  children,
  dictionary,
  locale,
  locationKind,
  selectedCarSeries,
  selectedLines,
  selectedRange,
}: {
  availableCarSeries: CarSeriesSummary[];
  children: ReactNode;
  dictionary: Dictionary;
  locale: Locale;
  locationKind: ReportLocationKind;
  selectedCarSeries: number[];
  selectedLines: MetroLine[];
  selectedRange: TimeRange;
}) {
  const router = useRouter();
  const messages = getPlatformMessages(locale);
  const [isPending, startTransition] = useTransition();
  const [optimisticLocationKind, setOptimisticLocationKind] = useOptimistic(locationKind);
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

  function href(
    lines: MetroLine[],
    range = selectedRange,
    carSeries = selectedCarSeries,
    nextLocationKind = optimisticLocationKind,
  ) {
    const params = new URLSearchParams();
    if (lines.length > 0) params.set("linea", lines.join(","));
    if (nextLocationKind === "car" && carSeries.length > 0) params.set("serie", carSeries.join(","));
    if (range !== "summer") params.set("rango", range);
    if (nextLocationKind === "platform") params.set("tipo", "anden");
    return `/${locale}/explorar${params.size ? `?${params.toString()}` : ""}`;
  }

  function selectLocationKind(nextLocationKind: ReportLocationKind) {
    if (nextLocationKind === optimisticLocationKind) return;
    setOpen(false);
    setNavigationOpen(false);
    startTransition(() => {
      setOptimisticLocationKind(nextLocationKind);
      router.push(
        href(
          selectedLines,
          selectedRange,
          nextLocationKind === "car" ? selectedCarSeries : [],
          nextLocationKind,
        ),
      );
    });
  }

  function applyFilters() {
    setOpen(false);
    startTransition(() => {
      router.push(
        href(
          draftLines,
          draftRange,
          optimisticLocationKind === "car" ? draftCarSeries : [],
          optimisticLocationKind,
        ),
      );
    });
  }

  function clearFilters() {
    setDraftLines([]);
    setDraftCarSeries([]);
    setDraftRange("summer");
  }

  function toggleLine(line: MetroLine) {
    setDraftLines((current) =>
      current.includes(line) ? current.filter((item) => item !== line) : [...current, line],
    );
  }

  function toggleCarSeries(series: number) {
    setDraftCarSeries((current) =>
      current.includes(series) ? current.filter((item) => item !== series) : [...current, series],
    );
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
  const exploreSections =
    optimisticLocationKind === "car"
      ? [
          { id: "line-evolution", label: dictionary.explore.modules.lineEvolution },
          { id: "total-reports", label: dictionary.explore.modules.totalReports },
          { id: "report-volume", label: dictionary.explore.modules.volume },
          { id: "line-cars", label: dictionary.explore.modules.lineCars },
          { id: "car-series", label: dictionary.explore.modules.carSeries },
          { id: "worst-cars", label: dictionary.explore.modules.worstCars },
          { id: "car-explorer", label: dictionary.explore.modules.carExplorer },
          { id: "heat-trend", label: dictionary.explore.modules.trend },
          { id: "worst-hours", label: dictionary.explore.modules.worstHours },
          { id: "fleet", label: dictionary.explore.modules.fleet },
          { id: "line-details", label: dictionary.explore.modules.lineDetails },
        ]
      : [
          { id: "line-evolution", label: dictionary.explore.modules.lineEvolution },
          { id: "total-reports", label: dictionary.explore.modules.totalReports },
          { id: "worst-platforms", label: messages.explore.worstPlatforms },
          { id: "platform-explorer", label: messages.explore.platformExplorerTitle },
          { id: "platform-coverage", label: messages.explore.platformCoverageTitle },
        ];

  return (
    <>
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <StickyUtilityBar>
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
              <LocationModeButton
                active={optimisticLocationKind === "car"}
                icon={TrainFront}
                label={messages.reportForm.carMode}
                onClick={() => selectLocationKind("car")}
              />
              <LocationModeButton
                active={optimisticLocationKind === "platform"}
                icon={Building2}
                label={messages.reportForm.platformMode}
                onClick={() => selectLocationKind("platform")}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted">{dictionary.explore.filters.active}</p>
                <p className="truncate text-sm font-semibold">
                  {[
                    selectedLineLabel,
                    optimisticLocationKind === "car" ? selectedCarSeriesLabel : null,
                    activeRangeLabel,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Popover.Root open={navigationOpen} onOpenChange={setNavigationOpen}>
                  <Popover.Trigger asChild>
                    <Button
                      aria-label={dictionary.explore.navigation.button}
                      className="min-h-10 px-3 py-2"
                      type="button"
                      variant="secondary"
                    >
                      <ListTree aria-hidden="true" className="size-4" />
                      <span className="hidden sm:inline">{dictionary.explore.navigation.button}</span>
                    </Button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    {navigationOpen ? (
                      <CenteredPopoverPanel
                        closeLabel={dictionary.common.closeMenu}
                        title={dictionary.explore.navigation.title}
                      >
                        <nav aria-label={dictionary.explore.navigation.title} className="mt-4 grid gap-2">
                          {exploreSections.map((section) => (
                            <Popover.Close asChild key={section.id}>
                              <a
                                className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm font-semibold transition duration-200 ease-out hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                href={`#${section.id}`}
                              >
                                {section.label}
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
          </div>
        </StickyUtilityBar>
        <Popover.Portal>
          {open ? (
            <CenteredPopoverPanel
              closeLabel={dictionary.common.closeMenu}
              title={dictionary.explore.filters.title}
              widthClass="w-[min(calc(100vw-2rem),24rem)]"
            >
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
                    <LineSwatch
                      active={draftLines.includes(line)}
                      key={line}
                      label={line}
                      line={line}
                      onClick={() => toggleLine(line)}
                    />
                  ))}
                </div>
              </div>

              {optimisticLocationKind === "car" && availableCarSeries.length > 0 ? (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold text-muted">{dictionary.explore.filters.series}</p>
                  <div className="flex flex-wrap items-stretch gap-1.5">
                    <SeriesSwatch
                      active={draftCarSeries.length === 0}
                      ariaLabel={dictionary.explore.allSeries}
                      label={dictionary.explore.allSeries}
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

      {isPending ? <ExploreResultsSkeleton locationKind={optimisticLocationKind} /> : children}
    </>
  );
}

function ExploreResultsSkeleton({ locationKind }: { locationKind: ReportLocationKind }) {
  const mainCardCount = locationKind === "car" ? 7 : 4;

  return (
    <div aria-busy="true" data-testid="explore-results-loading">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.82fr]">
        <div className="flex flex-col gap-4">
          {Array.from({ length: mainCardCount }, (_, index) => (
            <section className="rounded-md border border-border bg-surface-raised p-4" key={index}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="h-5 w-40 animate-pulse rounded-sm bg-surface" />
                  <div className="mt-2 h-3 w-20 animate-pulse rounded-sm bg-surface" />
                </div>
                <div className="size-9 animate-pulse rounded-md bg-surface" />
              </div>
              <div className="h-56 animate-pulse rounded-md bg-surface" />
              <div className="mt-4 h-4 w-2/3 animate-pulse rounded-sm bg-surface" />
            </section>
          ))}
        </div>
        <aside className="flex flex-col gap-4">
          <section className="rounded-md border border-border bg-surface-raised p-4">
            <div className="h-5 w-36 animate-pulse rounded-sm bg-surface" />
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: 5 }, (_, row) => (
                <div className="h-12 animate-pulse rounded-sm bg-surface" key={row} />
              ))}
            </div>
          </section>
        </aside>
      </div>

      {locationKind === "car" ? (
        <section className="pt-4">
          <div className="mb-4 h-5 w-36 animate-pulse rounded-sm bg-surface" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="h-36 animate-pulse rounded-md border border-border bg-surface-raised" key={index} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function LocationModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "selection-flow flex min-h-10 items-center justify-center gap-2 bg-surface-raised px-3 py-2 text-sm font-semibold transition duration-200 ease-out focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary",
        active ? "bg-[var(--accent)] text-[var(--accent-contrast)]" : "text-muted hover:bg-surface hover:text-foreground",
      )}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </button>
  );
}

function SeriesSwatch({ active, ariaLabel, label, onClick }: { active: boolean; ariaLabel?: string; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={ariaLabel ?? label}
      aria-pressed={active}
      className={cn(
        "filter-swatch filter-swatch-text selection-flow flex items-center justify-center rounded-md border px-2 py-1 font-mono font-bold tabular-nums transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        active ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-border bg-surface-raised text-foreground hover:bg-surface",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

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
        "filter-swatch filter-swatch-text selection-flow flex items-center justify-center gap-1 rounded-md border px-2 py-1 font-bold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
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
    "filter-swatch filter-swatch-text flex items-center justify-center rounded-md border px-2 py-1 font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    selected ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-border bg-surface-raised text-muted hover:bg-surface hover:text-foreground",
  );
}

function rangeClass(selected: boolean) {
  return cn(
    "filter-swatch filter-swatch-text rounded-md border px-2 py-1 font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    selected ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-border bg-surface-raised text-muted hover:bg-surface hover:text-foreground",
  );
}

function getSelectedLineLabel(selectedLines: MetroLine[], dictionary: Dictionary) {
  if (selectedLines.length === 0) return dictionary.explore.allLines;
  if (selectedLines.length <= 3) return selectedLines.join(", ");
  return dictionary.explore.filters.lineCount.replace("{count}", String(selectedLines.length));
}

function getSelectedCarSeriesLabel(selectedCarSeries: number[], dictionary: Dictionary) {
  if (selectedCarSeries.length === 0) return null;
  if (selectedCarSeries.length <= 2) {
    return selectedCarSeries
      .map((series) => `${dictionary.explore.seriesLabel} ${series}`)
      .join(", ");
  }
  return dictionary.explore.filters.seriesCount.replace("{count}", String(selectedCarSeries.length));
}
