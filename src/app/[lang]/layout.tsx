import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { LangAttribute } from "@/components/shell/lang-attribute";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegistration } from "@/components/shell/service-worker";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }];
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dictionary = await getDictionary(lang);

  return (
    <TooltipProvider>
      <LangAttribute locale={lang} />
      <ServiceWorkerRegistration />
      <AppShell dictionary={dictionary} locale={lang}>
        {children}
      </AppShell>
    </TooltipProvider>
  );
}
