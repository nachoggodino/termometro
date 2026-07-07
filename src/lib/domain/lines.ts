export const METRO_LINES = [
  "L1",
  "L2",
  "L3",
  "L4",
  "L5",
  "L6",
  "L7",
  "L8",
  "L9",
  "L10",
  "L11",
  "L12",
] as const;

export type MetroLine = (typeof METRO_LINES)[number];

export type LineColor = {
  fill: string;
  textOnFill: "black" | "white";
  ring: string;
};

export const LINE_COLORS: Record<MetroLine, LineColor> = {
  L1: { fill: "oklch(0.66 0.14 240)", textOnFill: "white", ring: "oklch(0.86 0.05 240)" },
  L2: { fill: "oklch(0.56 0.21 28)", textOnFill: "white", ring: "oklch(0.86 0.05 28)" },
  L3: { fill: "oklch(0.86 0.16 95)", textOnFill: "black", ring: "oklch(0.92 0.08 95)" },
  L4: { fill: "oklch(0.42 0.09 55)", textOnFill: "white", ring: "oklch(0.78 0.05 55)" },
  L5: { fill: "oklch(0.54 0.16 145)", textOnFill: "white", ring: "oklch(0.84 0.06 145)" },
  L6: { fill: "oklch(0.62 0 0)", textOnFill: "black", ring: "oklch(0.86 0 0)" },
  L7: { fill: "oklch(0.68 0.18 55)", textOnFill: "black", ring: "oklch(0.9 0.08 55)" },
  L8: { fill: "oklch(0.68 0.16 345)", textOnFill: "white", ring: "oklch(0.88 0.06 345)" },
  L9: { fill: "oklch(0.48 0.16 300)", textOnFill: "white", ring: "oklch(0.82 0.06 300)" },
  L10: { fill: "oklch(0.42 0.14 255)", textOnFill: "white", ring: "oklch(0.78 0.06 255)" },
  L11: { fill: "oklch(0.56 0.13 178)", textOnFill: "white", ring: "oklch(0.84 0.06 178)" },
  L12: { fill: "oklch(0.58 0.11 120)", textOnFill: "white", ring: "oklch(0.84 0.05 120)" },
};

export function isMetroLine(value: unknown): value is MetroLine {
  return typeof value === "string" && METRO_LINES.includes(value as MetroLine);
}
