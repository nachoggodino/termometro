"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { localeNames, LOCALES } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageRadioGroup({ label, locale, pathname }: { label: string; locale: Locale; pathname: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label={label}>
        {LOCALES.map((candidate) => {
          const selected = candidate === locale;
          return (
            <Link
              aria-checked={selected}
              className={cn(
                "flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                selected ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]" : "border-border bg-surface-raised text-muted hover:bg-surface hover:text-foreground",
              )}
              data-testid={`lang-${candidate}`}
              href={`/${candidate}${pathname}`}
              key={candidate}
              role="radio"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-4 items-center justify-center rounded-full border transition duration-200 ease-out",
                  selected ? "border-[var(--accent-contrast)]" : "border-border",
                )}
              >
                <span className={cn("size-1.5 rounded-full transition duration-200 ease-out", selected ? "bg-[var(--accent-contrast)]" : "bg-transparent")} />
              </span>
              {localeNames[candidate]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
