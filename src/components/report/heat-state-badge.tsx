import type { HeatState } from "@/lib/domain/heat";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function HeatStateBadge({ dictionary, state }: { dictionary: Dictionary; state: HeatState }) {
  return (
    <span className={`flex items-center gap-1.5 text-xs font-semibold ${heatStateTextClass(state)}`}>
      <span className={`size-1.5 rounded-full ${heatStateDotClass(state)}`} aria-hidden="true" />
      {dictionary.states[state].label}
    </span>
  );
}

function heatStateTextClass(state: HeatState) {
  if (state === "fresco") return "text-heat-fresco";
  if (state === "calor") return "text-heat-calor";
  return "text-heat-infierno";
}

function heatStateDotClass(state: HeatState) {
  if (state === "fresco") return "bg-heat-fresco";
  if (state === "calor") return "bg-heat-calor";
  return "bg-heat-infierno";
}
