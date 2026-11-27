import { createContext, useContext } from "react";
import { en, type Messages } from "./en";
import type { Locale } from "./locale";

export interface I18nState {
  locale: Locale;
  /** the messages in the current language */
  t: Messages;
  /** saves the language in Settings (the API) and switches the UI */
  setLocale: (locale: Locale) => Promise<void>;
}

// Without a provider (e.g. in component tests) everything is English.
export const I18nContext = createContext<I18nState>({ locale: "en", t: en, setLocale: async () => {} });

export const useI18n = () => useContext(I18nContext);
