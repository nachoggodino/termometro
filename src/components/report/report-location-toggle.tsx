"use client";

import { Building2, TrainFront } from "lucide-react";
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
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
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
  const Icon = value === "car" ? TrainFront : Building2;

  return (
    <label
      className={cn(
        "selection-flow flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 bg-surface-raised px-2 py-2 text-sm font-semibold transition duration-200 ease-out",
        checked ? "bg-surface text-foreground shadow-sm" : "text-muted hover:bg-surface hover:text-foreground",
      )}
      style={
        checked
          ? {
              animation:
                "selection-settle var(--duration-base) var(--ease-out), selection-pulse 360ms var(--ease-out)",
            }
          : undefined
      }
    >
      <input
        checked={checked}
        className="sr-only"
        name="report-location-kind"
        onChange={onChange}
        type="radio"
        value={value}
      />
      <Icon aria-hidden="true" className="size-5" />
      {label}
    </label>
  );
}
