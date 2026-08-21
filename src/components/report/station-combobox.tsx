"use client";

import { Building2 } from "lucide-react";
import { useId, useMemo } from "react";
import { SearchCombobox } from "@/components/ui/search-combobox";
import type { MetroLine } from "@/lib/domain/lines";
import { searchStations } from "@/lib/domain/stations";
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
  const errorId = useId();
  const options = useMemo(
    () =>
      searchStations(line, query).map((station) => ({
        id: station.id,
        label: station.name,
        station,
      })),
    [line, query],
  );

  return (
    <label className="relative flex flex-col gap-2">
      <span className="flex items-center gap-2 text-sm font-semibold">
        {label}
        <InfoTooltip label={help}>{help}</InfoTooltip>
      </span>
      <SearchCombobox
        ariaDescribedBy={error ? errorId : undefined}
        ariaInvalid={Boolean(error)}
        leadingIcon={
          <Building2
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
        }
        onQueryChange={onQueryChange}
        onQueryEdited={() => onStationChange(null)}
        onSelect={(option) => onStationChange(option.station.id, option.station.name)}
        options={options}
        placeholder={placeholder}
        query={query}
        selectedId={stationId}
      />
      {error ? (
        <span className="text-sm text-danger" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
