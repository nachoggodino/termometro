"use client";

import * as Popover from "@radix-ui/react-popover";
import { ListTree, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export const METHODOLOGY_SECTIONS = [
  { id: "mission", labelKey: "missionTitle" },
  { id: "score", labelKey: "scoreTitle" },
  { id: "confidence", labelKey: "confidenceTitle" },
  { id: "fleet", labelKey: "fleetTitle" },
] as const;

export function MethodologyNavigation({ dictionary }: { dictionary: Dictionary }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-[80px] z-[var(--z-sticky)] -mx-4 px-4 py-3">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <div className="rounded-lg border border-border bg-[var(--drawer-surface)] px-3 py-2 shadow-[var(--shadow-popover)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[var(--drawer-surface)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted">{dictionary.methodology.navigation.active}</p>
              <p className="truncate text-sm font-semibold">{dictionary.methodology.navigation.summary}</p>
            </div>
            <Popover.Trigger asChild>
              <Button aria-label={dictionary.methodology.navigation.button} className="min-h-10 px-3 py-2" type="button" variant="secondary">
                <ListTree aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">{dictionary.methodology.navigation.button}</span>
              </Button>
            </Popover.Trigger>
          </div>
        </div>
        <Popover.Portal>
          {open ? (
            <div
              aria-modal="true"
              className="centered-popover z-[var(--z-popover)] w-[min(calc(100vw-2rem),20rem)] rounded-lg border border-border bg-surface-raised p-4 shadow-[var(--shadow-popover)]"
              role="dialog"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">{dictionary.methodology.navigation.title}</h2>
                <Popover.Close
                  aria-label={dictionary.common.closeMenu}
                  className="flex size-8 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <X aria-hidden="true" className="size-4" />
                </Popover.Close>
              </div>
              <nav aria-label={dictionary.methodology.navigation.title} className="mt-4 grid gap-2">
                {METHODOLOGY_SECTIONS.map((section) => (
                  <Popover.Close asChild key={section.id}>
                    <a
                      className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm font-semibold transition duration-200 ease-out hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      href={`#${section.id}`}
                    >
                      {dictionary.methodology[section.labelKey]}
                    </a>
                  </Popover.Close>
                ))}
              </nav>
            </div>
          ) : null}
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
