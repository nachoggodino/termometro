"use client";

import { Share2 } from "lucide-react";
import { useRef, type ReactNode } from "react";
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
  id,
}: {
  title: string;
  children: ReactNode;
  help?: string;
  dictionary: Dictionary;
  rangeLabel?: string;
  takeaway?: string;
  caveat?: string;
  shareText?: string;
  id?: string;
}) {
  const cardRef = useRef<HTMLElement>(null);

  async function shareModule() {
    const text = shareText ?? [title, rangeLabel, takeaway, caveat, dictionary.common.disclaimer].filter(Boolean).join("\n");
    try {
      const blob = await renderElementAsPng(cardRef.current);
      if (!blob) throw new Error("Image export failed");
      const file = new File([blob], `${slugify(title)}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text, files: [file] });
        return;
      }

      if (window.ClipboardItem && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        toast.success(dictionary.common.shareImageCopied);
        return;
      }

      downloadBlob(blob, file.name);
      toast.success(dictionary.common.shareImageDownloaded);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(text);
        toast.success(dictionary.common.shareCopied);
      } catch {
        toast.error(dictionary.common.shareImageUnavailable);
      }
    }
  }

  return (
    <section className="scroll-mt-[13rem] rounded-md border border-border bg-surface-raised p-4" id={id} ref={cardRef}>
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
        <Button
          aria-label={`${dictionary.common.shareCard}: ${title}`}
          className="size-9 min-h-0 px-0 py-0"
          data-share-exclude="true"
          onClick={shareModule}
          type="button"
          variant="secondary"
        >
          <Share2 aria-hidden="true" />
        </Button>
      </div>
      {children}
      {takeaway ? <p className="mt-4 text-xs font-semibold leading-4 text-muted">{takeaway}</p> : null}
      {caveat ? <p className="mt-1 text-xs leading-5 text-muted">{caveat}</p> : null}
      <p className="mt-4 truncate whitespace-nowrap text-[0.66rem] font-semibold leading-4 text-muted sm:text-[0.7rem]">
        {dictionary.common.attribution}
      </p>
    </section>
  );
}

async function renderElementAsPng(element: HTMLElement | null) {
  if (!element) return null;
  if (typeof XMLSerializer === "undefined" || typeof Image === "undefined") return null;
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-share-exclude]").forEach((node) => node.remove());
  inlineComputedStyles(element, clone);

  const rect = element.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  if (width <= 0 || height <= 0 || width > 2400 || height > 3200) return null;
  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">${serialized}</div>
      </foreignObject>
    </svg>
  `;
  const image = new Image();
  image.decoding = "async";
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await withTimeout(image.decode(), 3000);

  const canvas = document.createElement("canvas");
  const scale = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.scale(scale, scale);
  context.fillStyle = getComputedStyle(element).backgroundColor;
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Image export timed out")), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function inlineComputedStyles(source: Element, target: Element) {
  const computed = getComputedStyle(source);
  const targetElement = target as HTMLElement | SVGElement;
  targetElement.setAttribute("style", Array.from(computed).map((property) => `${property}:${computed.getPropertyValue(property)}`).join(";"));

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  for (let index = 0; index < sourceChildren.length; index += 1) {
    if (targetChildren[index]) inlineComputedStyles(sourceChildren[index], targetChildren[index]);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
