import { z } from "zod";
import { isHeatState, type HeatState } from "./heat";
import { isMetroLine, type MetroLine } from "./lines";

export type Report = {
  id: string;
  line: MetroLine;
  car: string | null;
  state: HeatState;
  createdAt: Date;
  hiddenAt?: Date | null;
};

export const reportInputSchema = z.object({
  line: z.string().refine(isMetroLine),
  state: z.string().refine(isHeatState),
  car: z
    .string()
    .trim()
    .max(12)
    .optional()
    .transform((value) => normalizeCarCode(value ?? "")),
});

export type ReportInput = z.infer<typeof reportInputSchema>;

const CAR_CODE_PATTERN = /^(?:[MR]-?)?\d{3,5}$/i;

export function normalizeCarCode(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.toUpperCase().replace(/\s+/g, "");
  if (!CAR_CODE_PATTERN.test(normalized)) return null;
  if (/^[MR]\d/.test(normalized)) {
    return `${normalized[0]}-${normalized.slice(1)}`;
  }
  return normalized;
}

export function parseReportInput(input: unknown) {
  return reportInputSchema.safeParse(input);
}

export function isDuplicateCandidate(
  current: ReportInput,
  previous: Report,
  now = new Date(),
  windowMinutes = 12,
) {
  const ageMs = now.getTime() - previous.createdAt.getTime();
  return (
    previous.line === current.line &&
    previous.state === current.state &&
    (previous.car ?? null) === (current.car ?? null) &&
    ageMs >= 0 &&
    ageMs <= windowMinutes * 60_000
  );
}
