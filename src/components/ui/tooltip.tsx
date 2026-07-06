"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={120}>{children}</TooltipPrimitive.Provider>;
}

export function InfoTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        aria-label={label}
        className="inline-flex size-5 items-center justify-center rounded-full border border-border bg-surface-raised text-[0.72rem] font-bold text-muted transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        type="button"
      >
        ?
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={cn(
            "z-50 max-w-64 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm leading-5 text-foreground shadow-[0_6px_14px_oklch(0.19_0.018_160_/_0.12)]",
          )}
          sideOffset={6}
        >
          {children}
          <PopoverPrimitive.Arrow className="fill-surface-raised" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
