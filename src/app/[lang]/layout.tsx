import { notFound } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegistration } from "@/components/shell/service-worker";
import { isLocale } from "@/lib/i18n/config";

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

  return (
    <TooltipProvider>
      <ServiceWorkerRegistration />
      {children}
    </TooltipProvider>
  );
}
