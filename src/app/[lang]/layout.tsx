import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { LangAttribute } from "@/components/shell/lang-attribute";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegistration } from "@/components/shell/service-worker";
import { SOCIAL_IMAGE_TOKENS } from "@/lib/design/tokens";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }];
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dictionary = await getDictionary(lang);
  const routePath = `/${lang}`;
  const socialImagePath = `/api/og?lang=${lang}`;
  const alternateLocale = lang === "es" ? "en_US" : "es_ES";

  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description,
    alternates: {
      canonical: routePath,
      languages: {
        es: "/es",
        en: "/en",
      },
    },
    openGraph: {
      title: dictionary.meta.socialTitle,
      description: dictionary.meta.socialDescription,
      url: routePath,
      siteName: dictionary.common.appName,
      images: [
        {
          url: socialImagePath,
          width: SOCIAL_IMAGE_TOKENS.width,
          height: SOCIAL_IMAGE_TOKENS.height,
          alt: dictionary.meta.socialImageAlt,
        },
      ],
      locale: lang === "es" ? "es_ES" : "en_US",
      alternateLocale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.meta.socialTitle,
      description: dictionary.meta.socialDescription,
      images: [
        {
          url: socialImagePath,
          alt: dictionary.meta.socialImageAlt,
        },
      ],
    },
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
