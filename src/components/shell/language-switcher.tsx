"use client";

import Link from "next/link";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Languages } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeNames, LOCALES } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ label, locale, pathname }: { label: string; locale: Locale; pathname: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`${label}: ${localeNames[locale]}`}
        className="inline-flex h-10 items-center justify-center gap-1 rounded-md border border-border bg-surface-raised px-3 text-sm font-semibold leading-none text-foreground transition duration-200 ease-out hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        data-testid="language-menu"
        type="button"
      >
        <Languages aria-hidden="true" className="size-4" />
        <span>{localeNames[locale]}</span>
        <ChevronDown aria-hidden="true" className="size-3.5 text-muted" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          className="z-[var(--z-popover)] w-44 rounded-md border border-border bg-surface-raised p-1 text-sm shadow-[var(--shadow-popover)]"
          sideOffset={8}
        >
          <p className="px-2 py-1.5 text-xs font-semibold text-muted">{label}</p>
          {LOCALES.map((candidate) => (
            <Popover.Close asChild key={candidate}>
              <Link
                aria-current={candidate === locale ? "true" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-sm px-2 py-2 font-semibold transition",
                  candidate === locale ? "bg-foreground text-background" : "text-muted hover:bg-surface hover:text-foreground",
                )}
                data-testid={`lang-${candidate}`}
                href={`/${candidate}${pathname}`}
              >
                {localeNames[candidate]}
                {candidate === locale ? <Check aria-hidden="true" className="size-4" /> : null}
              </Link>
            </Popover.Close>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
