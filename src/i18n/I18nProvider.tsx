import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { settingsApi } from "../api";
import { I18nContext } from "./context";
import { MESSAGES, initialLocale, isLocale, rememberLocale, setCurrentLocale, type Locale } from "./locale";

/**
 * Owns the app's language. Starts with the last language used in this browser (so the page
 * doesn't flash in the wrong one), then follows the signed-in profile's language
 * (ProfileProvider calls showLocale), which also decides the language of the API's messages and
 * of the reasons Claude writes. setLocale saves a change for the profile.
 */
export default function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  setCurrentLocale(locale); // keep formatters outside React in step before children render

  const apply = useCallback((next: Locale) => {
    setCurrentLocale(next);
    rememberLocale(next);
    setLocaleState(next);
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    // Only on mount: afterwards apply keeps it in step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback(
    async (next: Locale) => {
      const saved = await settingsApi.updatePreferences({ locale: next });
      apply(isLocale(saved.locale) ? saved.locale : next);
    },
    [apply]
  );

  const value = useMemo(
    () => ({ locale, t: MESSAGES[locale], setLocale, showLocale: apply }),
    [locale, setLocale, apply]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
