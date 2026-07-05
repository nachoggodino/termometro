import Link from "next/link";
import { ArrowLeft, BarChart3, CircleHelp, Home, Send } from "lucide-react";
import { AppLogo } from "@/components/ui/app-logo";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

export function AppHeader({
  dictionary,
  locale,
  pathname,
  title,
  backHref,
}: {
  dictionary: Dictionary;
  locale: Locale;
  pathname: string;
  title?: string;
  backHref?: string;
}) {
  const navItems = [
    { href: `/${locale}/reportar`, label: dictionary.common.report, icon: Send, path: "/reportar" },
    { href: `/${locale}/explorar`, label: dictionary.common.explore, icon: BarChart3, path: "/explorar" },
    {
      href: `/${locale}/metodologia`,
      label: dictionary.common.methodology,
      shortLabel: dictionary.common.methodologyShort,
      icon: CircleHelp,
      path: "/metodologia",
    },
  ];

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border bg-[var(--nav-surface)] backdrop-blur supports-[backdrop-filter]:bg-[var(--nav-surface)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3">
        <div className="flex items-center gap-3">
          {backHref ? (
            <Button asChild className="size-10 min-h-0 px-0 py-0" variant="secondary">
              <Link aria-label={dictionary.common.home} href={backHref}>
                <ArrowLeft aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Link className="flex items-center gap-2 font-semibold" href={`/${locale}`}>
              <AppLogo />
              <span className="hidden sm:inline">{dictionary.common.shortName}</span>
            </Link>
          )}
          <div className="min-w-0 flex-1">
            {title ? <p className={backHref ? "hidden truncate text-sm font-semibold sm:block" : "truncate text-sm font-semibold"}>{title}</p> : null}
          </div>
          <Button asChild className="size-10 min-h-0 px-0 py-0" variant="secondary">
            <Link aria-label={dictionary.common.home} href={`/${locale}`}>
              <Home aria-hidden="true" />
            </Link>
          </Button>
          <LanguageSwitcher label={dictionary.common.language} locale={locale} pathname={pathname} />
          <ThemeToggle darkLabel={dictionary.common.dark} label={dictionary.common.theme} lightLabel={dictionary.common.light} />
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto rounded-md border border-border bg-surface-raised p-1" aria-label={dictionary.common.shortName}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const current = pathname === item.path;
            return (
              <Link
                aria-current={current ? "page" : undefined}
                className={
                  current
                    ? "flex min-h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm bg-foreground px-2 py-2 text-xs font-semibold text-background sm:gap-2 sm:px-3 sm:text-sm"
                    : "flex min-h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-2 text-xs font-semibold text-muted transition duration-200 ease-out hover:bg-surface hover:text-foreground sm:gap-2 sm:px-3 sm:text-sm"
                }
                href={item.href}
                key={item.path}
              >
                <Icon aria-hidden="true" className="size-4" />
                <span className="sm:hidden">{item.shortLabel ?? item.label}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
