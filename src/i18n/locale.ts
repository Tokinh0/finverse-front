import { en, type Messages } from "./en";
import { pt } from "./pt";

export type Locale = "en" | "pt-BR";

export const LOCALES: Locale[] = ["en", "pt-BR"];

export const MESSAGES: Record<Locale, Messages> = { en, "pt-BR": pt };

const STORAGE_KEY = "finverse.locale";

// The current language for code outside React (formatters, presenters). The provider keeps it
// in sync with its state and re-renders the app when it changes.
let current: Locale = "en";

export const getLocale = () => current;
export const setCurrentLocale = (locale: Locale) => {
  current = locale;
};
/** Messages in the current language, for helpers that can't use the hook. */
export const messages = () => MESSAGES[current];

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

/** The language to start with: the last one used in this browser, else the browser's own. */
export function initialLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // storage unavailable
  }
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
}

export function rememberLocale(locale: Locale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // storage unavailable: the API still has the setting
  }
}
