"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeSegmentedSwitch({ label, lightLabel, darkLabel }: { label: string; lightLabel: string; darkLabel: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <div className="mt-2 grid grid-cols-2 rounded-md border border-border bg-surface p-1" data-testid="theme-toggle">
        <button
          aria-pressed={!isDark}
          className={cn(
            "click-wave flex min-h-9 items-center justify-center gap-2 rounded-sm px-3 text-sm font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            !isDark ? "bg-[var(--accent)] text-[var(--accent-contrast)]" : "text-muted hover:text-foreground",
          )}
          onClick={() => setTheme("light")}
          type="button"
        >
          <Sun aria-hidden="true" className="size-4" />
          {lightLabel}
        </button>
        <button
          aria-pressed={isDark}
          className={cn(
            "click-wave flex min-h-9 items-center justify-center gap-2 rounded-sm px-3 text-sm font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            isDark ? "bg-[var(--accent)] text-[var(--accent-contrast)]" : "text-muted hover:text-foreground",
          )}
          onClick={() => setTheme("dark")}
          type="button"
        >
          <Moon aria-hidden="true" className="size-4" />
          {darkLabel}
        </button>
      </div>
    </div>
  );
}
