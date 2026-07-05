"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ label, lightLabel, darkLabel }: { label: string; lightLabel: string; darkLabel: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  const nextThemeLabel = nextTheme === "dark" ? darkLabel : lightLabel;

  return (
    <Button
      aria-label={`${label}: ${nextThemeLabel}`}
      className="size-10 min-h-0 px-0 py-0"
      data-testid="theme-toggle"
      onClick={() => setTheme(nextTheme)}
      type="button"
      variant="secondary"
    >
      {resolvedTheme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
