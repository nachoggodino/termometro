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

export const DUPLICATE_WINDOW_MINUTES = 12;
export const RATE_LIMIT_WINDOW_MINUTES = 10;
export const RATE_LIMIT_MAX_REPORTS = 8;
export const UNDO_WINDOW_SECONDS = 90;

export const reportInputSchema = z.object({
  line: z.string().refine(isMetroLine),
  state: z.string().refine(isHeatState),
  car: z
    .string()
    .trim()
    .max(12)
    .optional()
    .transform((value, context) => {
      const raw = value ?? "";
      if (!raw.trim()) return null;

      const normalized = normalizeCarCode(raw);
      if (!normalized) {
        context.addIssue({
          code: "custom",
          message: "Invalid car code",
        });
        return z.NEVER;
      }

      return normalized;
    }),
});

export type ReportInput = z.infer<typeof reportInputSchema>;

const CAR_CODE_PATTERN = /^[a-z]-?\d{4,5}$/i;

export function normalizeCarCode(value: string) {
  const trimmed = value.trim().replace(/\s+/g, "");
  if (!trimmed) return null;
  const normalized = trimmed.toUpperCase().replace("-", "");
  if (!CAR_CODE_PATTERN.test(normalized)) return null;
  return normalized;
}

export function formatCarCode(value: string) {
  const normalized = normalizeCarCode(value);
  if (!normalized) return value;
  return `${normalized[0]}-${normalized.slice(1)}`;
}

export function parseReportInput(input: unknown) {
  return reportInputSchema.safeParse(input);
}

export function isDuplicateCandidate(
  current: ReportInput,
  previous: Report,
  now = new Date(),
  windowMinutes = DUPLICATE_WINDOW_MINUTES,
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
