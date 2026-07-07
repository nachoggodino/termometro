"use client";

import * as Popover from "@radix-ui/react-popover";
import { ListTree, SlidersHorizontal, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LINE_COLORS, METRO_LINES, type MetroLine } from "@/lib/domain/lines";
import { TIME_RANGES, type TimeRange } from "@/lib/domain/ranges";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function FilterBar({
  dictionary,
  locale,
  selectedLines,
  selectedRange,
}: {
  dictionary: Dictionary;
  locale: Locale;
  selectedLines: MetroLine[];
  selectedRange: TimeRange;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [hasOpenedFilters, setHasOpenedFilters] = useState(false);
  const [hasOpenedNavigation, setHasOpenedNavigation] = useState(false);
  const [draftLines, setDraftLines] = useState<MetroLine[]>(selectedLines);
  const [draftRange, setDraftRange] = useState<TimeRange>(selectedRange);

  function href(lines: MetroLine[], range = selectedRange) {
    const params = new URLSearchParams();
    if (lines.length > 0) params.set("linea", lines.join(","));
    if (range !== "sevenDays") params.set("rango", range);
    return `/${locale}/explorar${params.size ? `?${params.toString()}` : ""}`;
  }

  function applyFilters() {
    startTransition(() => {
      router.push(href(draftLines, draftRange));
      setOpen(false);
    });
  }

  function clearFilters() {
    setDraftLines([]);
    setDraftRange("sevenDays");
  }

  function toggleLine(line: MetroLine) {
    setDraftLines((current) => (current.includes(line) ? current.filter((item) => item !== line) : [...current, line]));
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setHasOpenedFilters(true);
      setDraftLines(selectedLines);
      setDraftRange(selectedRange);
    }
    setOpen(nextOpen);
  }

  function handleNavigationOpenChange(nextOpen: boolean) {
    if (nextOpen) setHasOpenedNavigation(true);
    setNavigationOpen(nextOpen);
  }

  const selectedLineLabel = getSelectedLineLabel(selectedLines, dictionary);
  const activeRangeLabel = dictionary.explore.ranges[selectedRange];

  return (
    <div className="sticky top-[80px] z-20 -mx-4 border-b border-border bg-[var(--nav-surface)] px-4 py-3 backdrop-blur">
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted">{dictionary.explore.filters.active}</p>
            <p className="truncate text-sm font-semibold">
              {selectedLineLabel} · {activeRangeLabel}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Popover.Root open={navigationOpen} onOpenChange={handleNavigationOpenChange}>
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
                <Popover.Content
                  align="end"
                  aria-hidden={!navigationOpen}
                  className="filter-popover z-[var(--z-popover)] w-[min(calc(100vw-2rem),20rem)] rounded-lg border border-border bg-surface-raised p-4 shadow-[var(--shadow-popover)]"
                  sideOffset={8}
                  {...(hasOpenedNavigation ? { forceMount: true } : {})}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold">{dictionary.explore.navigation.title}</h2>
                    <Popover.Close
                      aria-label={dictionary.common.closeMenu}
                      className="flex size-8 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <X aria-hidden="true" className="size-4" />
                    </Popover.Close>
                  </div>
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
                </Popover.Content>
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
        <Popover.Portal>
          <Popover.Content
            align="end"
            aria-hidden={!open}
            className="filter-popover z-[var(--z-popover)] w-[min(calc(100vw-2rem),24rem)] rounded-lg border border-border bg-surface-raised p-4 shadow-[var(--shadow-popover)]"
            sideOffset={8}
            {...(hasOpenedFilters ? { forceMount: true } : {})}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">{dictionary.explore.filters.title}</h2>
              <Popover.Close
                aria-label={dictionary.common.closeMenu}
                className="flex size-8 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <X aria-hidden="true" className="size-4" />
              </Popover.Close>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-muted">{dictionary.explore.filters.line}</p>
              <button className={allLinesClass(draftLines.length === 0)} onClick={() => setDraftLines([])} type="button">
                {dictionary.explore.allLines}
              </button>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {METRO_LINES.map((line) => (
                  <LineSwatch active={draftLines.includes(line)} label={line} line={line} onClick={() => toggleLine(line)} key={line} />
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold text-muted">{dictionary.explore.filters.range}</p>
              <div className="grid grid-cols-2 gap-2">
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

            <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
              <Button disabled={isPending} onClick={clearFilters} type="button" variant="secondary">
                {dictionary.explore.filters.clear}
              </Button>
              <Button disabled={isPending} onClick={applyFilters} type="button">
                {isPending ? dictionary.explore.filters.applying : dictionary.explore.filters.apply}
              </Button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

const EXPLORE_SECTIONS = [
  { id: "line-evolution", module: "lineEvolution" },
  { id: "report-volume", module: "volume" },
  { id: "line-cars", module: "lineCars" },
  { id: "worst-cars", module: "worstCars" },
  { id: "heat-trend", module: "trend" },
  { id: "fleet", module: "fleet" },
  { id: "recent-reports", module: "recent" },
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
        "selection-flow flex h-10 items-center justify-center gap-1 rounded-md border px-1 text-xs font-bold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
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
    "flex min-h-10 w-full items-center justify-center rounded-md border px-3 text-sm font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    selected ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]" : "border-border bg-surface-raised text-muted hover:bg-surface hover:text-foreground",
  );
}

function rangeClass(selected: boolean) {
  return cn(
    "rounded-md border px-3 py-2 text-sm font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    selected ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]" : "border-border bg-surface-raised text-muted hover:text-foreground",
  );
}

function getSelectedLineLabel(selectedLines: MetroLine[], dictionary: Dictionary) {
  if (selectedLines.length === 0) return dictionary.explore.allLines;
  if (selectedLines.length <= 3) return selectedLines.join(", ");
  return dictionary.explore.filters.lineCount.replace("{count}", String(selectedLines.length));
}
