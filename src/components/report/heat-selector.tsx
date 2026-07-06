"use client";

import { Flame, Info, Snowflake, SunMedium } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { HEAT_STATES, type HeatState } from "@/lib/domain/heat";
import { cn } from "@/lib/utils";

const stateClass: Record<HeatState, string> = {
  fresco: "border-heat-fresco bg-heat-fresco-soft",
  calor: "border-heat-calor bg-heat-calor-soft",
  infierno: "border-heat-infierno bg-heat-infierno-soft",
};

const icons = {
  fresco: Snowflake,
  calor: SunMedium,
  infierno: Flame,
};

export function HeatSelector({
  dictionary,
  label,
  value,
  onChange,
}: {
  dictionary: Dictionary;
  label: string;
  value: HeatState;
  onChange: (state: HeatState) => void;
}) {
  const selectedCopy = dictionary.states[value];

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border">
        {HEAT_STATES.map((state) => {
          const Icon = icons[state];
          const selected = state === value;
          return (
            <button
              aria-pressed={selected}
              className={cn(
                "selection-flow flex min-h-14 flex-col items-center justify-center gap-1 bg-surface-raised px-1.5 py-2 text-sm font-semibold transition duration-200 ease-out focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary",
                selected ? `${stateClass[state]} text-[var(--heat-soft-foreground)]` : "text-foreground hover:bg-surface",
              )}
              data-testid={`heat-${state}`}
              key={state}
              onClick={() => onChange(state)}
              type="button"
            >
              <Icon aria-hidden="true" className="size-5" />
              {dictionary.states[state].label}
            </button>
          );
        })}
      </div>
      <div
        className={cn(
          "selection-panel-flow relative flex items-start gap-2 overflow-hidden rounded-md border px-3 py-2 text-[0.6875rem] leading-4 text-[var(--heat-helper-foreground)]",
          stateClass[value],
          value === "infierno" && "heat-shimmer",
        )}
        key={value}
      >
        <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-[var(--heat-helper-foreground)]" />
        <span>{selectedCopy.description}</span>
      </div>
    </fieldset>
  );
}
