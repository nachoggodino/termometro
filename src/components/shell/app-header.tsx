"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { CircleHelp, Home } from "lucide-react";
import { AppLogo } from "@/components/ui/app-logo";
import { ExploreActionIcon, ReportActionIcon } from "@/components/ui/action-icons";
import { LanguageRadioGroup } from "./language-switcher";
import { ThemeSegmentedSwitch } from "./theme-toggle";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function AppHeader({
  dictionary,
  locale,
  pathname,
}: {
  dictionary: Dictionary;
  locale: Locale;
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);
  const drawerBodyRef = useRef<HTMLDivElement>(null);
  const topRowRef = useRef<HTMLDivElement>(null);
  const navItems = [
    { href: `/${locale}`, label: dictionary.common.home, icon: Home, path: "" },
    { href: `/${locale}/reportar`, label: dictionary.common.report, icon: ReportActionIcon, path: "/reportar", iconClassName: "text-heat-infierno" },
    { href: `/${locale}/explorar`, label: dictionary.common.explore, icon: ExploreActionIcon, path: "/explorar", iconClassName: "h-4 w-5" },
    {
      href: `/${locale}/metodologia`,
      label: dictionary.common.methodology,
      icon: CircleHelp,
      path: "/metodologia",
    },
  ];

  useLayoutEffect(() => {
    const topHeight = topRowRef.current?.offsetHeight ?? 64;
    const drawerHeight = drawerBodyRef.current?.scrollHeight ?? 0;
    setPanelHeight(isOpen ? topHeight + drawerHeight + 12 : topHeight);
  }, [isOpen, locale, pathname]);

  return (
    <header className="sticky top-0 z-[var(--z-modal)] px-4 pt-4">
      <div
        className={cn(
          "fixed inset-0 transition duration-[var(--duration-drawer)] ease-out",
          isOpen ? "pointer-events-auto bg-background/70 opacity-100 backdrop-blur-sm" : "pointer-events-none bg-transparent opacity-0 backdrop-blur-0",
        )}
        aria-hidden={!isOpen}
        onClick={() => setIsOpen(false)}
      >
        <span className="sr-only">{dictionary.common.closeMenu}</span>
      </div>

      <div
        className="relative mx-auto max-h-[calc(100dvh-2rem)] max-w-5xl overflow-hidden rounded-lg border border-border bg-[var(--drawer-surface)] shadow-[var(--shadow-popover)] backdrop-blur-2xl transition-[height,background-color] duration-[var(--duration-drawer)] ease-out supports-[backdrop-filter]:bg-[var(--drawer-surface)]"
        style={panelHeight === null ? undefined : { height: `${panelHeight}px` }}
      >
        <div className="px-3 py-2" ref={topRowRef}>
          <div className="flex items-center gap-3">
            <Link
              aria-label={dictionary.common.home}
              className="click-wave flex min-w-0 flex-1 items-center gap-2 rounded-md outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              href={`/${locale}`}
              onClick={() => setIsOpen(false)}
            >
              <AppLogo />
              <span className="min-w-0 truncate text-base font-semibold leading-5 sm:text-lg">{dictionary.common.appName}</span>
            </Link>
            <button
              aria-controls="app-navigation-drawer"
              aria-expanded={isOpen}
              aria-label={isOpen ? dictionary.common.closeMenu : dictionary.common.menu}
              className="click-wave group relative flex size-10 shrink-0 items-center justify-center rounded-md text-foreground transition duration-[var(--duration-drawer)] ease-out hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => setIsOpen((current) => !current)}
              type="button"
            >
              <span className="sr-only">{isOpen ? dictionary.common.closeMenu : dictionary.common.menu}</span>
              <span
                className={cn(
                  "absolute h-0.5 w-5 rounded-full bg-current transition duration-[var(--duration-drawer)] ease-out",
                  isOpen ? "translate-y-0 rotate-45" : "-translate-y-1.5 rotate-0",
                )}
              />
              <span
                className={cn(
                  "absolute h-0.5 w-5 rounded-full bg-current transition duration-[var(--duration-drawer)] ease-out",
                  isOpen ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100 delay-75",
                )}
              />
              <span
                className={cn(
                  "absolute h-0.5 w-5 rounded-full bg-current transition duration-[var(--duration-drawer)] ease-out",
                  isOpen ? "translate-y-0 -rotate-45" : "translate-y-1.5 rotate-0",
                )}
              />
            </button>
          </div>
        </div>
        <div
          className="max-h-[calc(100dvh-6.5rem)] overflow-y-auto px-3 pb-4"
          id="app-navigation-drawer"
          inert={!isOpen}
          ref={drawerBodyRef}
        >
          <nav className="mt-8 flex flex-col gap-1 px-1" aria-label={dictionary.common.appName}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const current = pathname === item.path;
              return (
                <Link
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "click-wave flex min-h-11 items-center gap-3 rounded-md px-2.5 py-2 text-sm font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    current ? "bg-[var(--accent)] text-[var(--accent-contrast)]" : "text-muted hover:bg-surface hover:text-foreground",
                  )}
                  href={item.href}
                  key={item.path}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-4",
                      "iconClassName" in item && item.iconClassName,
                      current && item.path === "/reportar" ? "text-[var(--accent-contrast)]" : null,
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mx-1 mt-8 border-t border-border pt-5">
            <LanguageRadioGroup label={dictionary.common.language} locale={locale} pathname={pathname} />
            <div className="mt-5">
              <ThemeSegmentedSwitch darkLabel={dictionary.common.dark} label={dictionary.common.theme} lightLabel={dictionary.common.light} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
