import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegistration } from "@/components/shell/service-worker";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }];
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
      <ServiceWorkerRegistration />
      <AppShell dictionary={dictionary} locale={lang}>
        {children}
      </AppShell>
    </TooltipProvider>
  );
}
