"use client";

import { Check } from "lucide-react";
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
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="grid grid-cols-4 gap-2">
        {METRO_LINES.map((line) => {
          const selected = line === value;
          const color = LINE_COLORS[line];
          return (
            <button
              aria-pressed={selected}
              className={cn(
                "flex min-h-11 items-center justify-center gap-1 rounded-md border px-2 text-sm font-bold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                selected ? "border-transparent" : "border-border bg-surface-raised text-foreground hover:bg-surface",
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
              {!selected ? <span className="size-2 rounded-full" style={{ background: color.fill }} /> : <Check aria-hidden="true" />}
              {line}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
