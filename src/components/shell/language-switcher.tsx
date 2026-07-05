import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { localeNames, LOCALES } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ label, locale, pathname }: { label: string; locale: Locale; pathname: string }) {
  return (
    <div aria-label={label} className="flex rounded-md border border-border bg-surface-raised p-1" role="group">
      {LOCALES.map((candidate) => (
        <Link
          aria-current={candidate === locale ? "true" : undefined}
          className={cn(
            "rounded-sm px-2 py-1 text-xs font-semibold transition",
            candidate === locale ? "bg-foreground text-background" : "text-muted hover:text-foreground",
          )}
          data-testid={`lang-${candidate}`}
          href={`/${candidate}${pathname}`}
          key={candidate}
        >
          {localeNames[candidate]}
        </Link>
      ))}
    </div>
  );
}
