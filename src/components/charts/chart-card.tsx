"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/tooltip";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function ChartCard({
  title,
  children,
  help,
  dictionary,
  rangeLabel,
  takeaway,
  caveat,
  shareText,
}: {
  title: string;
  children: React.ReactNode;
  help?: string;
  dictionary: Dictionary;
  rangeLabel?: string;
  takeaway?: string;
  caveat?: string;
  shareText?: string;
}) {
  async function shareModule() {
    const text = shareText ?? [title, rangeLabel, takeaway, caveat, dictionary.common.disclaimer].filter(Boolean).join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success(dictionary.common.shareCopied);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await navigator.clipboard.writeText(text);
      toast.success(dictionary.common.shareCopied);
    }
  }

  return (
    <section className="rounded-md border border-border bg-surface-raised p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">{title}</h2>
            {help ? <InfoTooltip label={title}>{help}</InfoTooltip> : null}
          </div>
          {rangeLabel ? (
            <p className="mt-1 text-xs font-semibold text-muted">
              {dictionary.explore.moduleRange}: {rangeLabel}
            </p>
          ) : null}
        </div>
        <Button aria-label={`${dictionary.common.shareCard}: ${title}`} className="size-9 min-h-0 px-0 py-0" onClick={shareModule} type="button" variant="secondary">
          <Share2 aria-hidden="true" />
        </Button>
      </div>
      {children}
      {takeaway ? <p className="mt-4 text-sm font-semibold leading-5">{takeaway}</p> : null}
      {caveat ? <p className="mt-1 text-xs leading-5 text-muted">{caveat}</p> : null}
      <p className="mt-4 text-[0.72rem] font-semibold text-muted">Termómetro de Madrid · {dictionary.common.disclaimer}</p>
    </section>
  );
}
