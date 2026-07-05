"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/tooltip";
import { normalizeCarCode } from "@/lib/domain/reports";
import type { HeatState } from "@/lib/domain/heat";
import type { MetroLine } from "@/lib/domain/lines";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { HeatSelector } from "./heat-selector";
import { LinePicker } from "./line-picker";

type ApiResponse =
  | { ok: true; report: { id: string } }
  | { ok: false; reason: "duplicate" | "invalid" };

export function ReportForm({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  const router = useRouter();
  const [line, setLine] = useState<MetroLine>("L1");
  const [state, setState] = useState<HeatState>("calor");
  const [car, setCar] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetch(`/api/cars?line=${line}`)
      .then((response) => response.json())
      .then((data: { suggestions?: string[] }) => setSuggestions(data.suggestions ?? []))
      .catch(() => setSuggestions([]));
  }, [line]);

  const submitLabel = dictionary.reportForm.submit[state];
  const normalizedCar = useMemo(() => normalizeCarCode(car), [car]);

  function submitReport() {
    startTransition(async () => {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ line, state, car }),
      });
      const payload = (await response.json()) as ApiResponse;

      if (!payload.ok) {
        toast(payload.reason === "duplicate" ? dictionary.reportForm.duplicate : dictionary.reportForm.subtitle);
        return;
      }

      toast.success(dictionary.reportForm.success, {
        action: {
          label: dictionary.reportForm.undo,
          onClick: () => {
            fetch(`/api/reports/${payload.report.id}`, { method: "DELETE" }).catch(() => undefined);
          },
        },
        duration: 12_000,
      });
      router.push(`/${locale}/explorar?linea=${line}&reported=1`);
    });
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
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
        {car && !normalizedCar ? <span className="text-sm text-danger">{dictionary.reportForm.carInvalid}</span> : null}
      </label>

      <p className="rounded-md border border-border bg-surface p-3 text-sm text-muted">{dictionary.reportForm.abuseReminder}</p>

      <Button
        className="relative min-h-12 overflow-hidden"
        data-testid="submit-report"
        disabled={pending}
        onClick={submitReport}
        style={{
          background:
            state === "fresco"
              ? "var(--heat-fresco)"
              : state === "infierno"
                ? "var(--heat-infierno)"
                : "var(--heat-calor)",
          color: state === "calor" ? "var(--foreground)" : "white",
        }}
        type="button"
      >
        {pending ? dictionary.common.report : submitLabel}
      </Button>
    </div>
  );
}
