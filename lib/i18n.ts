import en from "@/locales/en.json";
import no from "@/locales/no.json";

export const dictionaries = {
  en,
  no
} as const;

export type Locale = keyof typeof dictionaries;
export type TranslationKey = keyof typeof en;

const defaultLocale: Locale = "en";

export function getLocale(): Locale {
  return defaultLocale;
}

export function t(key: TranslationKey, locale: Locale = getLocale()) {
  const dictionary = dictionaries[locale] as Record<TranslationKey, string>;
  const fallback = dictionaries[defaultLocale] as Record<TranslationKey, string>;

  return dictionary[key] ?? fallback[key] ?? key;
}
