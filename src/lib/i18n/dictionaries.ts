import "server-only";
import type { Locale } from "./config";

const dictionaries = {
  es: () => import("./messages/es").then((module) => module.messages),
  en: () => import("./messages/en").then((module) => module.messages),
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
