import { defineRouting } from "next-intl/routing";

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "never",
});

export function isLocale(value: string | undefined): value is Locale {
  return locales.some((locale) => locale === value);
}

export function dirForLocale(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
