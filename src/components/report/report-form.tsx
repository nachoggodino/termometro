"use client";

import { useRouter } from "next/navigation";
import { TrainFront, TriangleAlert } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, useTransition, type CSSProperties } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/tooltip";
import { FEEDBACK_TOKENS } from "@/lib/design/tokens";
import { isCarAllowedOnLine } from "@/lib/domain/cars";
import type { HeatState } from "@/lib/domain/heat";
import type { MetroLine } from "@/lib/domain/lines";
import {
  CAR_NOT_ON_LINE_REASON,
  STATION_NOT_ON_LINE_REASON,
  formatCarCode,
  normalizeCarCode,
  type ReportCreateFailureReason,
  type ReportLocationKind,
} from "@/lib/domain/reports";
import { getStationById } from "@/lib/domain/stations";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { getPlatformMessages } from "@/lib/i18n/platform-messages";
import { HeatSelector } from "./heat-selector";
import { LinePicker } from "./line-picker";
import { ReportLocationToggle } from "./report-location-toggle";
import { StationCombobox } from "./station-combobox";

type ApiErrorReason = ReportCreateFailureReason | "server_error";

type ApiResponse =
  | { ok: true; report: { id: string }; undoToken: string }
  | { ok: false; reason: ApiErrorReason };

export function ReportForm({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  const router = useRouter();
  const platformMessages = getPlatformMessages(locale);
  const [line, setLine] = useState<MetroLine>("L1");
  const [state, setState] = useState<HeatState>("calor");
  const [locationKind, setLocationKind] = useState<ReportLocationKind>("car");
  const [car, setCar] = useState("");
  const [stationId, setStationId] = useState<string | null>(null);
  const [stationQuery, setStationQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const carInputRef = useRef<HTMLInputElement>(null);
  const carErrorId = useId();
  const missingCarDialogRef = useRef<HTMLDialogElement>(null);
  const missingCarTitleId = useId();
  const missingCarDescriptionId = useId();

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/cars?line=${line}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { suggestions?: string[] }) => setSuggestions(data.suggestions ?? []))
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSuggestions([]);
      });

    return () => controller.abort();
  }, [line]);

  const submitLabel = dictionary.reportForm.submit[state];
  const normalizedCar = useMemo(() => normalizeCarCode(car), [car]);
  const carError = car
    ? !normalizedCar
      ? dictionary.reportForm.carInvalid
      : !isCarAllowedOnLine(normalizedCar, line)
        ? dictionary.reportForm.carNotOnLine
        : null
    : null;
  const stationError =
    locationKind === "platform" && stationQuery && !stationId
      ? platformMessages.reportForm.stationNotOnLine
      : null;
  const busy = submitting || pending;
  const invalidLocation =
    locationKind === "car" ? Boolean(carError) : Boolean(stationError);

  function handleLineChange(nextLine: MetroLine) {
    setLine(nextLine);
    if (!stationId) return;
    const stationOnNextLine = getStationById(nextLine, stationId);
    if (stationOnNextLine) {
      setStationQuery(stationOnNextLine.name);
      return;
    }
    setStationId(null);
    setStationQuery("");
  }

  function requestSubmission() {
    if (locationKind === "platform") {
      if (!stationId) {
        toast(platformMessages.reportForm.stationRequired.replace("{line}", line));
        return;
      }
      void submitReport();
      return;
    }

    if (carError) {
      toast(carError);
      return;
    }

    if (!normalizedCar) {
      openDialog(missingCarDialogRef.current);
      return;
    }

    void submitReport();
  }

  async function submitReport() {
    setSubmitting(true);

    try {
      const body =
        locationKind === "platform"
          ? { line, state, locationKind: "platform" as const, stationId }
          : { line, state, car: normalizedCar };

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as ApiResponse;

      if (!payload.ok) {
        toast(getSubmissionErrorMessage(payload.reason, dictionary, locale));
        setSubmitting(false);
        return;
      }

      toast.success(dictionary.reportForm.success, {
        action: {
          label: dictionary.reportForm.undo,
          onClick: () => {
            fetch(`/api/reports/${payload.report.id}`, {
              method: "DELETE",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ undoToken: payload.undoToken }),
            }).catch(() => undefined);
          },
        },
        duration: FEEDBACK_TOKENS.undoToastDurationMs,
      });

      const params = new URLSearchParams();
      if (locationKind === "platform") {
        params.set("linea", line);
        params.set("tipo", "anden");
        if (stationId) params.set("anden", stationId);
      } else if (normalizedCar) {
        params.set("coche", normalizedCar);
      }
      const query = params.toString();
      startTransition(() => router.push(`/${locale}/explorar${query ? `?${query}` : ""}`));
    } catch {
      toast(dictionary.reportForm.submitFailed);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <LinePicker label={dictionary.reportForm.line} onChange={handleLineChange} value={line} />

      <ReportLocationToggle
        carLabel={platformMessages.reportForm.carMode}
        label={platformMessages.reportForm.locationType}
        onChange={setLocationKind}
        platformLabel={platformMessages.reportForm.platformMode}
        value={locationKind}
      />

      <HeatSelector dictionary={dictionary} label={dictionary.reportForm.heatState} onChange={setState} value={state} />

      {locationKind === "car" ? (
        <label className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold">
            {dictionary.reportForm.car}
            <InfoTooltip label={dictionary.reportForm.carHelp}>{dictionary.reportForm.carHelp}</InfoTooltip>
          </span>
          <div className="relative">
            <TrainFront
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            />
            <input
              aria-describedby={carError ? carErrorId : undefined}
              aria-invalid={Boolean(carError)}
              className="min-h-11 w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              list="car-suggestions"
              onChange={(event) => setCar(event.target.value)}
              placeholder={dictionary.reportForm.carPlaceholder}
              ref={carInputRef}
              suppressHydrationWarning
              value={car}
            />
          </div>
          <datalist id="car-suggestions">
            {suggestions.map((suggestion) => (
              <option key={suggestion} value={formatCarCode(suggestion)} />
            ))}
          </datalist>
          {carError ? (
            <span className="text-sm text-danger" id={carErrorId}>
              {carError}
            </span>
          ) : null}
        </label>
      ) : (
        <StationCombobox
          error={stationError}
          help={platformMessages.reportForm.stationHelp}
          label={platformMessages.reportForm.station}
          line={line}
          onQueryChange={setStationQuery}
          onStationChange={(nextStationId, stationName) => {
            setStationId(nextStationId);
            if (stationName) setStationQuery(stationName);
          }}
          placeholder={platformMessages.reportForm.stationPlaceholder}
          query={stationQuery}
          stationId={stationId}
        />
      )}

      <p className="flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2 text-[0.6875rem] leading-4 text-muted/85">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-muted/85" />
        <span>{dictionary.reportForm.abuseReminder}</span>
      </p>

      <Button
        className="home-report-action report-submit-action relative min-h-12 overflow-hidden"
        data-testid="submit-report"
        disabled={busy || invalidLocation}
        onClick={requestSubmission}
        style={submitStyle(state)}
        type="button"
      >
        {busy ? <span aria-hidden="true" className="report-button-spinner" /> : null}
        <span>{submitLabel}</span>
      </Button>

      <dialog
        aria-describedby={missingCarDescriptionId}
        aria-labelledby={missingCarTitleId}
        className="fixed left-1/2 top-1/2 z-[var(--z-modal)] max-h-[calc(100dvh-2rem)] w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-surface-raised p-0 text-foreground shadow-[var(--shadow-popover)] backdrop:bg-foreground/30"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog(missingCarDialogRef.current);
        }}
        ref={missingCarDialogRef}
      >
        <div className="p-4 sm:p-5">
          <h2 className="text-base font-semibold" id={missingCarTitleId}>{dictionary.reportForm.missingCar.title}</h2>
          <p className="mt-2 text-sm leading-5 text-muted" id={missingCarDescriptionId}>{dictionary.reportForm.missingCar.description}</p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              onClick={() => {
                closeDialog(missingCarDialogRef.current);
                void submitReport();
              }}
              type="button"
              variant="secondary"
            >
              {dictionary.reportForm.missingCar.confirm}
            </Button>
            <Button
              autoFocus
              onClick={() => {
                closeDialog(missingCarDialogRef.current);
                requestAnimationFrame(() => carInputRef.current?.focus());
              }}
              type="button"
            >
              {dictionary.reportForm.missingCar.addCar}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

function openDialog(dialog: HTMLDialogElement | null) {
  if (!dialog || dialog.open) return;
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }
  dialog.setAttribute("open", "");
}

function closeDialog(dialog: HTMLDialogElement | null) {
  if (!dialog?.open) return;
  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }
  dialog.removeAttribute("open");
}

function getSubmissionErrorMessage(reason: ApiErrorReason, dictionary: Dictionary, locale: Locale) {
  if (reason === "duplicate") return dictionary.reportForm.duplicate;
  if (reason === "rate_limited") return dictionary.reportForm.rateLimited;
  if (reason === CAR_NOT_ON_LINE_REASON) return dictionary.reportForm.carNotOnLine;
  if (reason === STATION_NOT_ON_LINE_REASON) return getPlatformMessages(locale).reportForm.stationNotOnLine;
  if (reason === "invalid") return dictionary.reportForm.invalid;
  return dictionary.reportForm.submitFailed;
}

function submitStyle(state: HeatState): CSSProperties {
  const heatColor = state === "fresco" ? "var(--heat-fresco)" : state === "infierno" ? "var(--heat-infierno)" : "var(--heat-calor)";
  return {
    "--report-button": heatColor,
    "--action-report-border": `color-mix(in oklch, ${heatColor}, var(--border) 24%)`,
    "--report-particle": state === "fresco" ? "var(--report-particle-fresco)" : state === "infierno" ? "var(--report-particle-infierno)" : "var(--report-particle-calor)",
    "--report-active-blur": `color-mix(in oklch, ${heatColor}, transparent 52%)`,
    color: state === "calor" ? "var(--foreground)" : "white",
  } as CSSProperties;
}
