"use client";

import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, useTransition, type CSSProperties } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/tooltip";
import { FEEDBACK_TOKENS } from "@/lib/design/tokens";
import { formatCarCode, normalizeCarCode } from "@/lib/domain/reports";
import type { HeatState } from "@/lib/domain/heat";
import type { MetroLine } from "@/lib/domain/lines";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { HeatSelector } from "./heat-selector";
import { LinePicker } from "./line-picker";

type ApiErrorReason = "duplicate" | "invalid" | "rate_limited" | "server_error";

type ApiResponse =
  | { ok: true; report: { id: string }; undoToken: string }
  | { ok: false; reason: ApiErrorReason };

export function ReportForm({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  const router = useRouter();
  const [line, setLine] = useState<MetroLine>("L1");
  const [state, setState] = useState<HeatState>("calor");
  const [car, setCar] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const carInputRef = useRef<HTMLInputElement>(null);
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
  const busy = submitting || pending;

  function requestSubmission() {
    if (car && !normalizedCar) {
      toast(dictionary.reportForm.carInvalid);
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
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ line, state, car: normalizedCar }),
      });
      const payload = (await response.json()) as ApiResponse;

      if (!payload.ok) {
        toast(getSubmissionErrorMessage(payload.reason, dictionary));
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
      if (normalizedCar) params.set("coche", normalizedCar);
      const query = params.toString();
      startTransition(() => router.push(`/${locale}/explorar${query ? `?${query}` : ""}`));
    } catch {
      toast(dictionary.reportForm.submitFailed);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <LinePicker label={dictionary.reportForm.line} onChange={setLine} value={line} />
      <HeatSelector dictionary={dictionary} label={dictionary.reportForm.heatState} onChange={setState} value={state} />

      <label className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {dictionary.reportForm.car}
          <InfoTooltip label={dictionary.reportForm.carHelp}>{dictionary.reportForm.carHelp}</InfoTooltip>
        </span>
        <input
          className="min-h-11 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          list="car-suggestions"
          onChange={(event) => setCar(event.target.value)}
          placeholder={dictionary.reportForm.carPlaceholder}
          ref={carInputRef}
          suppressHydrationWarning
          value={car}
        />
        <datalist id="car-suggestions">
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={formatCarCode(suggestion)} />
          ))}
        </datalist>
        {car && !normalizedCar ? <span className="text-sm text-danger">{dictionary.reportForm.carInvalid}</span> : null}
      </label>

      <p className="flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2 text-[0.6875rem] leading-4 text-muted/85">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-muted/85" />
        <span>{dictionary.reportForm.abuseReminder}</span>
      </p>

      <Button
        className="home-report-action report-submit-action relative min-h-12 overflow-hidden"
        data-testid="submit-report"
        disabled={busy || Boolean(car && !normalizedCar)}
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

function getSubmissionErrorMessage(reason: ApiErrorReason, dictionary: Dictionary) {
  if (reason === "duplicate") return dictionary.reportForm.duplicate;
  if (reason === "rate_limited") return dictionary.reportForm.rateLimited;
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
