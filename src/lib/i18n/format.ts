import type { Locale } from "./config";

export function getIntlLocale(locale: Locale) {
  return locale === "en" ? "en-GB" : "es-ES";
}

export function formatReportTime(date: Date, locale: Locale) {
  return date.toLocaleTimeString(getIntlLocale(locale), { hour: "2-digit", minute: "2-digit" });
}

export function formatReportDateTime(date: Date, locale: Locale) {
  return date.toLocaleDateString(getIntlLocale(locale), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeReportAge(date: Date | null, locale: Locale, emptyLabel: string, now = new Date()) {
  if (!date) return emptyLabel;
  const minutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return locale === "en" ? `${hours}h` : `${hours}h`;
}
