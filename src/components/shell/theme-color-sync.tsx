"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { THEME_COLORS } from "@/lib/design/tokens";

export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;

    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeColor) return;

    themeColor.content = resolvedTheme === "dark" ? THEME_COLORS.darkBackground : THEME_COLORS.lightBackground;
  }, [resolvedTheme]);

  return null;
}
