"use client";

import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState, useTransition, type CSSProperties } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/tooltip";
import { formatCarCode, normalizeCarCode } from "@/lib/domain/reports";
import type { HeatState } from "@/lib/domain/heat";
import type { MetroLine } from "@/lib/domain/lines";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { HeatSelector } from "./heat-selector";
import { LinePicker } from "./line-picker";

type ApiResponse =
  | { ok: true; report: { id: string }; undoToken: string }
  | { ok: false; reason: "duplicate" | "invalid" | "rate_limited" };

export function ReportForm({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  const router = useRouter();
  const [line, setLine] = useState<MetroLine>("L1");
  const [state, setState] = useState<HeatState>("calor");
  const [car, setCar] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

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

  async function submitReport() {
    if (car && !normalizedCar) {
      toast(dictionary.reportForm.carInvalid);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ line, state, car }),
      });
      const payload = (await response.json()) as ApiResponse;

      if (!payload.ok) {
        const message =
          payload.reason === "duplicate"
            ? dictionary.reportForm.duplicate
            : payload.reason === "rate_limited"
              ? dictionary.reportForm.rateLimited
              : dictionary.reportForm.subtitle;
        toast(message);
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
        duration: 12_000,
      });
      startTransition(() => router.push(`/${locale}/explorar?reported=1`));
    } catch {
      toast(dictionary.reportForm.subtitle);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <LinePicker label={dictionary.reportForm.line} onChange={setLine} value={line} />
      <HeatSelector dictionary={dictionary} label={dictionary.reportForm.heatState} onChange={setState} value={state} />

      <label className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {dictionary.reportForm.car} · {dictionary.common.optional}
          <InfoTooltip label={dictionary.reportForm.carHelp}>{dictionary.reportForm.carHelp}</InfoTooltip>
        </span>
        <input
          className="min-h-11 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          list="car-suggestions"
          onChange={(event) => setCar(event.target.value)}
          placeholder={dictionary.reportForm.carPlaceholder}
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
        onClick={submitReport}
        style={submitStyle(state)}
        type="button"
      >
        {busy ? <span aria-hidden="true" className="report-button-spinner" /> : null}
        <span>{submitLabel}</span>
      </Button>
    </div>
  );
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
