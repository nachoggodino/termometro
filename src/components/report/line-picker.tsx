"use client";

import { LINE_COLORS, METRO_LINES, type MetroLine } from "@/lib/domain/lines";
import { cn } from "@/lib/utils";

export function LinePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: MetroLine;
  onChange: (line: MetroLine) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="grid grid-cols-4 gap-px overflow-hidden rounded-md border border-border bg-border">
        {METRO_LINES.map((line) => {
          const selected = line === value;
          const color = LINE_COLORS[line];
          return (
            <button
              aria-pressed={selected}
              className={cn(
                "selection-flow flex min-h-9 items-center justify-center gap-1.5 bg-surface-raised px-1.5 text-sm font-bold transition duration-200 ease-out focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary",
                selected ? "border-transparent" : "text-foreground hover:bg-surface",
              )}
              key={line}
              onClick={() => onChange(line)}
              style={
                selected
                  ? {
                      background: color.fill,
                      color: color.textOnFill === "white" ? "white" : "black",
                      outlineColor: color.ring,
                    }
                  : undefined
              }
              type="button"
            >
              <span
                aria-hidden="true"
                className={cn("rounded-full transition duration-200 ease-out", selected ? "size-2.5 bg-white" : "size-2")}
                style={!selected ? { background: color.fill } : undefined}
              />
              {line}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
