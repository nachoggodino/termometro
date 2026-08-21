import "server-only";
import type { Locale } from "./config";
import { getPlatformMessages } from "./platform-messages";

const dictionaries = {
  es: () =>
    import("./messages/es").then((module) => ({
      ...module.messages,
      platform: getPlatformMessages("es"),
    })),
  en: () =>
    import("./messages/en").then((module) => ({
      ...module.messages,
      platform: getPlatformMessages("en"),
    })),
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
