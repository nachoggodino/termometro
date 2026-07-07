import type { Locale } from "./config";

export function getIntlLocale(locale: Locale) {
  return locale === "en" ? "en-GB" : "es-ES";
}

export function formatReportTime(date: Date, locale: Locale) {
  return date.toLocaleTimeString(getIntlLocale(locale), { hour: "2-digit", minute: "2-digit" });
}
