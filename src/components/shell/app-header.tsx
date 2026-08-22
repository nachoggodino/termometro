"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CircleHelp, Home } from "lucide-react";
import { AppLogo } from "@/components/ui/app-logo";
import { ExploreActionIcon, ReportActionIcon } from "@/components/ui/action-icons";
import { LanguageRadioGroup } from "./language-switcher";
import { ThemeSegmentedSwitch } from "./theme-toggle";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const HEADER_OFFSET_PX = 72;
const HEADER_ALWAYS_VISIBLE_UNTIL_PX = 96;
const HEADER_HIDE_DISTANCE_PX = 28;
const HEADER_SHOW_DISTANCE_PX = 12;
const MOBILE_HEADER_QUERY = "(max-width: 639px)";

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
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);
  const drawerBodyRef = useRef<HTMLDivElement>(null);
  const topRowRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);
  const downwardDistanceRef = useRef(0);
  const upwardDistanceRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const headerHidden = isHeaderHidden && !isOpen;
  const navItems = [
    { href: `/${locale}`, label: dictionary.common.home, icon: Home, path: "" },
    { href: `/${locale}/reportar`, label: dictionary.common.report, icon: ReportActionIcon, path: "/reportar", iconClassName: "text-heat-infierno" },
    { href: `/${locale}/explorar`, label: dictionary.common.explore, icon: ExploreActionIcon, path: "/explorar", iconClassName: "h-4 w-5 scale-[0.67]" },
    {
      href: `/${locale}/metodologia`,
      label: dictionary.common.methodology,
      icon: CircleHelp,
      path: "/metodologia",
    },
  ];
  const currentPageLabel =
    pathname === ""
      ? dictionary.common.appName
      : navItems.find((item) => item.path === pathname)?.label ?? dictionary.common.appName;

  const closeMenu = () => {
    setIsHeaderHidden(false);
    setIsOpen(false);
  };

  useLayoutEffect(() => {
    const topHeight = topRowRef.current?.offsetHeight ?? 64;
    const drawerHeight = drawerBodyRef.current?.scrollHeight ?? 0;
    setPanelHeight(isOpen ? topHeight + drawerHeight + 12 : topHeight);
  }, [isOpen, locale, pathname]);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      "--app-header-offset",
      headerHidden ? "0px" : `${HEADER_OFFSET_PX}px`,
    );
  }, [headerHidden]);

  useEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_HEADER_QUERY);

    const resetScrollTracking = () => {
      lastScrollYRef.current = Math.max(0, window.scrollY);
      downwardDistanceRef.current = 0;
      upwardDistanceRef.current = 0;
    };

    const updateHeaderVisibility = () => {
      frameRef.current = null;
      const scrollY = Math.max(0, window.scrollY);
      const delta = scrollY - lastScrollYRef.current;
      lastScrollYRef.current = scrollY;

      if (!mobileQuery.matches || isOpen || scrollY <= HEADER_ALWAYS_VISIBLE_UNTIL_PX) {
        downwardDistanceRef.current = 0;
        upwardDistanceRef.current = 0;
        if (isHeaderHidden) setIsHeaderHidden(false);
        return;
      }

      if (delta > 0) {
        downwardDistanceRef.current += delta;
        upwardDistanceRef.current = 0;
        if (downwardDistanceRef.current >= HEADER_HIDE_DISTANCE_PX) {
          setIsHeaderHidden(true);
          downwardDistanceRef.current = 0;
        }
        return;
      }

      if (delta < 0) {
        upwardDistanceRef.current += -delta;
        downwardDistanceRef.current = 0;
        if (upwardDistanceRef.current >= HEADER_SHOW_DISTANCE_PX) {
          setIsHeaderHidden(false);
          upwardDistanceRef.current = 0;
        }
      }
    };

    const handleScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(updateHeaderVisibility);
    };

    const handleViewportChange = () => {
      resetScrollTracking();
      setIsHeaderHidden(false);
    };

    resetScrollTracking();
    window.addEventListener("scroll", handleScroll, { passive: true });
    mobileQuery.addEventListener("change", handleViewportChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      mobileQuery.removeEventListener("change", handleViewportChange);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [isHeaderHidden, isOpen, pathname]);

  return (
    <header
      className="sticky z-[var(--z-modal)] px-4 pt-4 transition-[top] duration-200 ease-out motion-reduce:transition-none"
      data-hidden={headerHidden ? "true" : "false"}
      data-testid="app-header"
      onFocusCapture={() => setIsHeaderHidden(false)}
      style={{ top: headerHidden ? `-${HEADER_OFFSET_PX}px` : "0px" }}
    >
      <div
        className={cn(
          "fixed inset-0 transition duration-[var(--duration-drawer)] ease-out",
          isOpen ? "pointer-events-auto bg-background/70 opacity-100 backdrop-blur-sm" : "pointer-events-none bg-transparent opacity-0 backdrop-blur-0",
        )}
        aria-hidden={!isOpen}
        data-testid="app-navigation-backdrop"
        onClick={closeMenu}
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
              className="click-wave flex size-10 shrink-0 items-center justify-center rounded-md outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              href={`/${locale}`}
              onClick={closeMenu}
            >
              <AppLogo />
            </Link>
            <span className="min-w-0 flex-1 truncate text-base font-semibold leading-5 sm:text-lg">
              {currentPageLabel}
            </span>
            <button
              aria-controls="app-navigation-drawer"
              aria-expanded={isOpen}
              aria-label={isOpen ? dictionary.common.closeMenu : dictionary.common.menu}
              className="click-wave group relative flex size-10 shrink-0 items-center justify-center rounded-md text-foreground transition duration-[var(--duration-drawer)] ease-out hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => {
                setIsHeaderHidden(false);
                setIsOpen((current) => !current);
              }}
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
                  onClick={closeMenu}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center">
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "size-4",
                        "iconClassName" in item && item.iconClassName,
                        current && item.path === "/reportar" ? "text-[var(--accent-contrast)]" : null,
                      )}
                    />
                  </span>
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
