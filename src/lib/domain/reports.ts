import { z } from "zod";
import { isCarAllowedOnLine, normalizeCarCode } from "./cars";
import { isHeatState, type HeatState } from "./heat";
import { isMetroLine, type MetroLine } from "./lines";
import { isStationOnLine } from "./stations";

export { formatCarCode, normalizeCarCode } from "./cars";

export type ReportLocationKind = "car" | "platform";

export type Report = {
  id: string;
  line: MetroLine;
  car: string | null;
  locationKind?: ReportLocationKind;
  stationId?: string | null;
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
export const STATION_NOT_ON_LINE_REASON = "station_not_on_line";

export type ReportCreateFailureReason =
  | "duplicate"
  | "invalid"
  | "rate_limited"
  | typeof CAR_NOT_ON_LINE_REASON
  | typeof STATION_NOT_ON_LINE_REASON;

export const reportInputSchema = z
  .object({
    line: z.string().refine(isMetroLine),
    state: z.string().refine(isHeatState),
    locationKind: z.enum(["car", "platform"]).optional().default("car"),
    stationId: z
      .union([z.string().trim().max(80), z.null()])
      .optional()
      .transform((value) => value?.trim() || null),
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
    if (input.locationKind === "platform") {
      if (input.car) {
        context.addIssue({
          code: "custom",
          message: "Platform reports cannot include a car",
          path: ["car"],
        });
      }
      if (!input.stationId || !isStationOnLine(input.stationId, input.line)) {
        context.addIssue({
          code: "custom",
          message: STATION_NOT_ON_LINE_REASON,
          path: ["stationId"],
        });
      }
      return;
    }

    if (input.stationId) {
      context.addIssue({
        code: "custom",
        message: "Car reports cannot include a station",
        path: ["stationId"],
      });
    }
    if (input.car && !isCarAllowedOnLine(input.car, input.line)) {
      context.addIssue({
        code: "custom",
        message: CAR_NOT_ON_LINE_REASON,
        path: ["car"],
      });
    }
  });

export function getReportInputErrorReason(error: z.ZodError): ReportCreateFailureReason {
  if (error.issues.some((issue) => issue.message === STATION_NOT_ON_LINE_REASON)) return STATION_NOT_ON_LINE_REASON;
  if (error.issues.some((issue) => issue.message === CAR_NOT_ON_LINE_REASON)) return CAR_NOT_ON_LINE_REASON;
  return "invalid";
}

export type ReportInput = z.infer<typeof reportInputSchema>;

export function parseReportInput(input: unknown) {
  return reportInputSchema.safeParse(input);
}

export function getReportLocationKind(report: Pick<Report, "locationKind">): ReportLocationKind {
  return report.locationKind ?? "car";
}

type DuplicateInput = {
  line: MetroLine;
  state: HeatState;
  car?: string | null;
  locationKind?: ReportLocationKind;
  stationId?: string | null;
};

export function isDuplicateCandidate(
  current: DuplicateInput,
  previous: Report,
  now = new Date(),
  windowMinutes = DUPLICATE_WINDOW_MINUTES,
) {
  const ageMs = now.getTime() - previous.createdAt.getTime();
  const isWithinWindow = ageMs >= 0 && ageMs <= windowMinutes * 60_000;
  if (!isWithinWindow || previous.line !== current.line) return false;

  const currentKind = current.locationKind ?? "car";
  const previousKind = getReportLocationKind(previous);
  if (currentKind !== previousKind) return false;

  if (currentKind === "platform") {
    return Boolean(current.stationId) && previous.state === current.state && previous.stationId === current.stationId;
  }

  if (!current.car) {
    return previous.car === null;
  }

  return previous.state === current.state && previous.car === current.car;
}
