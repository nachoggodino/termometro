"use client";

import * as Popover from "@radix-ui/react-popover";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function StickyUtilityBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-[80px] z-[var(--z-sticky)] -mx-4 px-4 py-3">
      <div className="rounded-lg border border-border bg-[var(--drawer-surface)] px-3 py-2 shadow-[var(--shadow-popover)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[var(--drawer-surface)]">
        {children}
      </div>
    </div>
  );
}

export function CenteredPopoverPanel({
  title,
  closeLabel,
  widthClass = "w-[min(calc(100vw-2rem),20rem)]",
  children,
}: {
  title: string;
  closeLabel: string;
  widthClass?: string;
  children: ReactNode;
}) {
  return (
    <div
      aria-modal="true"
      className={`centered-popover z-[var(--z-popover)] ${widthClass} rounded-lg border border-border bg-surface-raised p-4 shadow-[var(--shadow-popover)]`}
      data-state="open"
      role="dialog"
      style={{
        animation: "none",
        left: "50%",
        position: "fixed",
        top: "clamp(8.75rem, 16dvh, 10rem)",
        transform: "translateX(-50%)",
        transformOrigin: "top center",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <Popover.Close
          aria-label={closeLabel}
          className="flex size-8 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <X aria-hidden="true" className="size-4" />
        </Popover.Close>
      </div>
      {children}
    </div>
  );
}
