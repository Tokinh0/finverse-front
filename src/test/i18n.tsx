import type { ReactElement } from "react";
import { I18nContext } from "../i18n/context";
import { MESSAGES, setCurrentLocale, type Locale } from "../i18n/locale";

/**
 * Renders `ui` in another language (tests default to English). Also switches the module-level
 * locale used by formatters; src/test/setup.tsx resets it to English after each test.
 */
export function inLocale(locale: Locale, ui: ReactElement) {
  setCurrentLocale(locale);
  return <I18nContext.Provider value={{ locale, t: MESSAGES[locale], setLocale: async () => {} }}>{ui}</I18nContext.Provider>;
}
