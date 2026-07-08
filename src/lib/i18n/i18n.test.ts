import { describe, expect, it } from "vitest";
import { defaultAppCopy } from "./app-copy";
import { DEFAULT_LOCALE, isLocale, LOCALES, localeNames } from "./config";
import { formatNumber, formatRelativeReportAge, formatReportTime, getIntlLocale } from "./format";
import { messages as enMessages } from "./messages/en";
import { messages as esMessages } from "./messages/es";

describe("i18n configuration", () => {
  it("keeps Spanish as the default locale and supports English", () => {
    expect(DEFAULT_LOCALE).toBe("es");
    expect(LOCALES).toEqual(["es", "en"]);
    expect(isLocale("es")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(localeNames).toEqual({ es: "Español", en: "Inglés" });
  });

  it("keeps core copy available in both dictionaries", () => {
    expect(esMessages.common.disclaimer).toContain("no afiliado");
    expect(enMessages.common.disclaimer).toContain("not affiliated");
    expect(Object.keys(esMessages.reportForm.submit)).toEqual(Object.keys(enMessages.reportForm.submit));
    expect(Object.keys(esMessages.explore.ranges)).toEqual(Object.keys(enMessages.explore.ranges));
  });

  it("uses default app copy from the Spanish dictionary", () => {
    expect(defaultAppCopy.title).toBe(esMessages.meta.title);
    expect(defaultAppCopy.description).toBe(esMessages.meta.description);
    expect(defaultAppCopy.shortName).toBe(esMessages.common.shortName);
  });

  it("formats report times with locale-specific Intl locales", () => {
    const date = new Date("2026-07-05T10:30:00Z");

    expect(getIntlLocale("es")).toBe("es-ES");
    expect(getIntlLocale("en")).toBe("en-GB");
    expect(formatReportTime(date, "es")).toMatch(/\d{2}:\d{2}/);
    expect(formatReportTime(date, "en")).toMatch(/\d{2}:\d{2}/);
  });

  it("formats compact relative report ages", () => {
    const now = new Date("2026-07-05T12:30:00Z");

    expect(formatRelativeReportAge(null, "es", "Sin reportes", now)).toBe("Sin reportes");
    expect(formatRelativeReportAge(new Date("2026-07-05T12:05:00Z"), "es", "Sin reportes", now)).toBe("25m");
    expect(formatRelativeReportAge(new Date("2026-07-05T10:30:00Z"), "en", "No reports", now)).toBe("2h");
  });

  it("formats decimals with locale-specific separators", () => {
    expect(formatNumber(12.34, "es")).toBe("12,34");
    expect(formatNumber(12.34, "en")).toBe("12.34");
  });
});
