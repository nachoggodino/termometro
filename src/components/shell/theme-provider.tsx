"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";
import { ThemeColorSync } from "./theme-color-sync";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" disableTransitionOnChange enableSystem>
      <ThemeColorSync />
      {children}
    </NextThemesProvider>
  );
}
