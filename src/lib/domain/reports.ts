import { z } from "zod";
import { isCarAllowedOnLine, normalizeCarCode } from "./cars";
import { isHeatState, type HeatState } from "./heat";
import { isMetroLine, type MetroLine } from "./lines";

export { formatCarCode, normalizeCarCode } from "./cars";

export type Report = {
  id: string;
  line: MetroLine;
  car: string | null;
  state: HeatState;
  createdAt: Date;
  hiddenAt?: Date | null;
};

export const DUPLICATE_WINDOW_MINUTES = 12;
export const NO_CAR_ORIGIN_WINDOW_MINUTES = 30;
export const RATE_LIMIT_WINDOW_MINUTES = 10;
export const RATE_LIMIT_MAX_REPORTS = 4;
export const UNDO_WINDOW_SECONDS = 90;
export const CAR_NOT_ON_LINE_REASON = "car_not_on_line";

export type ReportCreateFailureReason = "duplicate" | "invalid" | "rate_limited" | typeof CAR_NOT_ON_LINE_REASON;

export const reportInputSchema = z
  .object({
    line: z.string().refine(isMetroLine),
    state: z.string().refine(isHeatState),
    car: z
      .union([z.string().trim().max(12), z.null()])
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
  })
  .superRefine((input, context) => {
    if (input.car && !isCarAllowedOnLine(input.car, input.line)) {
      context.addIssue({
        code: "custom",
        message: CAR_NOT_ON_LINE_REASON,
        path: ["car"],
      });
    }
  });

export function getReportInputErrorReason(error: z.ZodError): ReportCreateFailureReason {
  return error.issues.some((issue) => issue.message === CAR_NOT_ON_LINE_REASON) ? CAR_NOT_ON_LINE_REASON : "invalid";
}

export type ReportInput = z.infer<typeof reportInputSchema>;

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
  const isWithinWindow = ageMs >= 0 && ageMs <= windowMinutes * 60_000;
  if (!isWithinWindow || previous.line !== current.line) return false;

  if (!current.car) {
    return previous.car === null;
  }

  return previous.state === current.state && previous.car === current.car;
}
