"use client";

import * as Popover from "@radix-ui/react-popover";
import { SlidersHorizontal, X } from "lucide-react";
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
  selectedLine,
  selectedRange,
}: {
  dictionary: Dictionary;
  locale: Locale;
  selectedLine: string | null;
  selectedRange: TimeRange;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [draftLine, setDraftLine] = useState<string | null>(selectedLine);
  const [draftRange, setDraftRange] = useState<TimeRange>(selectedRange);

  function href(line: string | null, range = selectedRange) {
    const params = new URLSearchParams();
    if (line) params.set("linea", line);
    if (range !== "today") params.set("rango", range);
    return `/${locale}/explorar${params.size ? `?${params.toString()}` : ""}`;
  }

  function applyFilters() {
    startTransition(() => {
      router.push(href(draftLine, draftRange));
      setOpen(false);
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftLine(selectedLine);
      setDraftRange(selectedRange);
    }
    setOpen(nextOpen);
  }

  const selectedLineLabel = selectedLine ?? dictionary.explore.allLines;
  const activeRangeLabel = dictionary.explore.ranges[selectedRange];

  return (
    <div className="sticky top-[80px] z-20 -mx-4 border-b border-border bg-background/96 px-4 py-3 backdrop-blur">
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted">{dictionary.explore.filters.active}</p>
            <p className="truncate text-sm font-semibold">
              {selectedLineLabel} · {activeRangeLabel}
            </p>
          </div>
          <Popover.Trigger asChild>
            <Button className="min-h-10 shrink-0 px-3 py-2" type="button" variant="secondary">
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              {dictionary.explore.filters.button}
            </Button>
          </Popover.Trigger>
        </div>
        <Popover.Portal>
          <Popover.Content
            align="end"
            className="z-[var(--z-popover)] w-[min(calc(100vw-2rem),24rem)] rounded-lg border border-border bg-surface-raised p-4 shadow-[var(--shadow-popover)]"
            sideOffset={8}
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
              <button className={allLinesClass(!draftLine)} onClick={() => setDraftLine(null)} type="button">
                {dictionary.explore.allLines}
              </button>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {METRO_LINES.map((line) => (
                  <LineSwatch active={draftLine === line} label={line} line={line} onClick={() => setDraftLine(line)} key={line} />
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

            <Button className="mt-5 w-full" disabled={isPending} onClick={applyFilters} type="button">
              {isPending ? dictionary.explore.filters.applying : dictionary.explore.filters.apply}
            </Button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
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
        "flex h-10 items-center justify-center rounded-md border text-xs font-bold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        active ? "border-foreground ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-surface-raised" : "border-border hover:border-foreground",
      )}
      onClick={onClick}
      style={
        lineColor
          ? {
              background: lineColor.fill,
              color: lineColor.textOnFill,
            }
          : undefined
      }
      type="button"
    >
      {line ?? label}
    </button>
  );
}

function allLinesClass(selected: boolean) {
  return cn(
    "flex min-h-10 w-full items-center justify-center rounded-md border px-3 text-sm font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    selected ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]" : "border-border bg-surface text-muted hover:text-foreground",
  );
}

function rangeClass(selected: boolean) {
  return cn(
    "rounded-md border px-3 py-2 text-sm font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    selected ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]" : "border-border bg-surface-raised text-muted hover:text-foreground",
  );
}
