"use client";

import { Building2, Check } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { MetroLine } from "@/lib/domain/lines";
import {
  getStationById,
  normalizeStationSearch,
  searchStations,
  type MetroStation,
} from "@/lib/domain/stations";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/ui/tooltip";

export function StationCombobox({
  line,
  label,
  help,
  placeholder,
  query,
  stationId,
  error,
  onQueryChange,
  onStationChange,
}: {
  line: MetroLine;
  label: string;
  help: string;
  placeholder: string;
  query: string;
  stationId: string | null;
  error?: string | null;
  onQueryChange: (value: string) => void;
  onStationChange: (stationId: string | null, stationName?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxId = useId();
  const errorId = useId();
  const results = useMemo(() => searchStations(line, query), [line, query]);
  const selectedStation = getStationById(line, stationId);

  function selectStation(station: MetroStation) {
    onStationChange(station.id, station.name);
    onQueryChange(station.name);
    setOpen(false);
    setActiveIndex(0);
  }

  function handleBlur() {
    const exact = results.find(
      (station) => normalizeStationSearch(station.name) === normalizeStationSearch(query),
    );
    if (exact) selectStation(exact);
    window.setTimeout(() => setOpen(false), 0);
  }

  return (
    <label className="relative flex flex-col gap-2">
      <span className="flex items-center gap-2 text-sm font-semibold">
        {label}
        <InfoTooltip label={help}>{help}</InfoTooltip>
      </span>
      <div className="relative">
        <Building2
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
        <input
          aria-activedescendant={open && results[activeIndex] ? `${listboxId}-${results[activeIndex].id}` : undefined}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-describedby={error ? errorId : undefined}
          aria-expanded={open}
          aria-invalid={Boolean(error)}
          className="min-h-11 w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          onBlur={handleBlur}
          onChange={(event) => {
            onQueryChange(event.target.value);
            onStationChange(null);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.min(index + 1, Math.max(0, results.length - 1)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.max(0, index - 1));
            } else if (event.key === "Enter" && open && results[activeIndex]) {
              event.preventDefault();
              selectStation(results[activeIndex]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          role="combobox"
          value={query}
        />
        {selectedStation ? (
          <Check aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
        ) : null}
      </div>

      {open && results.length > 0 ? (
        <ul
          className="absolute left-0 right-0 top-full z-[var(--z-popover)] mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-surface-raised p-1 shadow-[var(--shadow-popover)]"
          id={listboxId}
          role="listbox"
        >
          {results.map((station, index) => {
            const active = index === activeIndex;
            const selected = station.id === stationId;
            return (
              <li
                aria-selected={selected}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-sm px-3 py-2 text-sm transition",
                  active ? "bg-surface text-foreground" : "text-foreground hover:bg-surface",
                )}
                id={`${listboxId}-${station.id}`}
                key={station.id}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectStation(station);
                }}
                role="option"
              >
                <span>{station.name}</span>
                {selected ? <Check aria-hidden="true" className="size-4 text-primary" /> : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {error ? (
        <span className="text-sm text-danger" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
