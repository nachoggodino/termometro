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
    { href: `/${locale}/metodologia`, label: dictionary.common.methodology, icon: CircleHelp, path: "/metodologia" },
    { href: `/${locale}`, label: dictionary.common.home, icon: Home, path: "" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/96 backdrop-blur supports-[backdrop-filter]:bg-background/86">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
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
        <nav className="hidden items-center gap-1 rounded-md border border-border bg-surface-raised p-1 sm:flex" aria-label={dictionary.common.shortName}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const current = pathname === item.path;
            return (
              <Link
                aria-current={current ? "page" : undefined}
                className={
                  current
                    ? "flex items-center gap-2 rounded-sm bg-foreground px-3 py-2 text-sm font-semibold text-background"
                    : "flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold text-muted hover:text-foreground"
                }
                href={item.href}
                key={item.path || "home"}
              >
                <Icon aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button asChild className="size-10 min-h-0 px-0 py-0 sm:hidden" variant="secondary">
          <Link aria-label={dictionary.common.methodology} href={`/${locale}/metodologia`}>
            <CircleHelp aria-hidden="true" />
          </Link>
        </Button>
        <LanguageSwitcher label={dictionary.common.language} locale={locale} pathname={pathname} />
        <ThemeToggle darkLabel={dictionary.common.dark} label={dictionary.common.theme} lightLabel={dictionary.common.light} />
      </div>
    </header>
  );
}
