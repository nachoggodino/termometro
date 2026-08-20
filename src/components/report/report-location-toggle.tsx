"use client";

import type { ReportLocationKind } from "@/lib/domain/reports";
import { cn } from "@/lib/utils";

export function ReportLocationToggle({
  label,
  carLabel,
  platformLabel,
  value,
  onChange,
}: {
  label: string;
  carLabel: string;
  platformLabel: string;
  value: ReportLocationKind;
  onChange: (value: ReportLocationKind) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-surface p-1">
        <LocationOption checked={value === "car"} label={carLabel} onChange={() => onChange("car")} value="car" />
        <LocationOption checked={value === "platform"} label={platformLabel} onChange={() => onChange("platform")} value="platform" />
      </div>
    </fieldset>
  );
}

function LocationOption({
  checked,
  label,
  onChange,
  value,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
  value: ReportLocationKind;
}) {
  return (
    <label
      className={cn(
        "selection-flow flex min-h-10 cursor-pointer items-center justify-center rounded-sm px-3 py-2 text-sm font-semibold transition duration-200 ease-out",
        checked ? "bg-surface-raised text-foreground shadow-sm" : "text-muted hover:text-foreground",
      )}
    >
      <input
        checked={checked}
        className="sr-only"
        name="report-location-kind"
        onChange={onChange}
        type="radio"
        value={value}
      />
      {label}
    </label>
  );
}
