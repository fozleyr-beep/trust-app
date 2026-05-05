import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale } from "@/lib/i18n/routing";

export default getRequestConfig(async ({ locale, requestLocale }) => {
  const requested = locale ?? (await requestLocale);
  const activeLocale = isLocale(requested) ? requested : defaultLocale;

  return {
    locale: activeLocale,
    messages: (await import(`../messages/${activeLocale}.json`)).default,
  };
});
