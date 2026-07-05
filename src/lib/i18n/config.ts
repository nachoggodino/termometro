export const LOCALES = ["es", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

export const localeNames: Record<Locale, string> = {
  es: "ES",
  en: "EN",
};
