"use client";

import * as Popover from "@radix-ui/react-popover";
import { ListTree } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CenteredPopoverPanel, StickyUtilityBar } from "@/components/ui/popover-shell";
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
    <Popover.Root open={open} onOpenChange={setOpen}>
      <StickyUtilityBar>
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
      </StickyUtilityBar>
      <Popover.Portal>
        {open ? (
          <CenteredPopoverPanel closeLabel={dictionary.common.closeMenu} title={dictionary.methodology.navigation.title}>
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
          </CenteredPopoverPanel>
        ) : null}
      </Popover.Portal>
    </Popover.Root>
  );
}
