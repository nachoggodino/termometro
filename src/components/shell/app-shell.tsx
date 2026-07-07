"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/shell/app-header";
import { CreatorCredit } from "@/components/shell/creator-credit";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function AppShell({
  children,
  dictionary,
  locale,
}: {
  children: ReactNode;
  dictionary: Dictionary;
  locale: Locale;
}) {
  const pathname = usePathname();
  const localePrefix = `/${locale}`;
  const localPathname = pathname === localePrefix ? "" : pathname.startsWith(`${localePrefix}/`) ? pathname.slice(localePrefix.length) : "";

  return (
    <>
      <AppHeader dictionary={dictionary} locale={locale} pathname={localPathname} />
      {children}
      <CreatorCredit dictionary={dictionary} />
    </>
  );
}
