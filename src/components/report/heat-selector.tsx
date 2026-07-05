"use client";

import { Snowflake, SunMedium, ThermometerSun } from "lucide-react";
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
  infierno: ThermometerSun,
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
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="grid grid-cols-3 gap-2">
        {HEAT_STATES.map((state) => {
          const Icon = icons[state];
          const selected = state === value;
          return (
            <button
              aria-pressed={selected}
              className={cn(
                "flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border bg-surface-raised px-2 py-3 text-sm font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                selected ? stateClass[state] : "border-border hover:bg-surface",
              )}
              data-testid={`heat-${state}`}
              key={state}
              onClick={() => onChange(state)}
              type="button"
            >
              <Icon aria-hidden="true" />
              {dictionary.states[state].label}
            </button>
          );
        })}
      </div>
      <div
        className={cn(
          "relative overflow-hidden rounded-md border p-3 text-sm leading-5",
          stateClass[value],
          value === "infierno" && "heat-shimmer",
        )}
      >
        {selectedCopy.description}
      </div>
    </fieldset>
  );
}
