import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { sessionApi } from "../api";
import { SESSION_EXPIRED_EVENT } from "../api/session";
import { useI18n } from "../i18n/context";
import { isLocale } from "../i18n/locale";
import type { Profile } from "../types";
import { ProfileContext, type ProfileStatus } from "./context";

/**
 * Owns who is using the app. With a saved session token it asks the API which profile it
 * belongs to; without one (or when the API says the session ended) the profile picker shows.
 * The UI follows the signed-in profile's language.
 */
export default function ProfileProvider({ children }: { children: ReactNode }) {
  const { showLocale } = useI18n();
  const [status, setStatus] = useState<ProfileStatus>(() => (sessionApi.hasToken() ? "loading" : "signedOut"));
  const [profile, setProfileState] = useState<Profile | null>(null);

  const setProfile = useCallback(
    (next: Profile) => {
      setProfileState(next);
      setStatus("signedIn");
      if (isLocale(next.locale)) showLocale(next.locale);
    },
    [showLocale]
  );

  const forget = useCallback(() => {
    setProfileState(null);
    setStatus("signedOut");
  }, []);

  useEffect(() => {
    if (!sessionApi.hasToken()) return;
    sessionApi
      .current()
      .then((session) => setProfile(session.profile))
      .catch((err) => {
        console.error(err);
        forget();
      });
    // Only on mount: afterwards signIn/signOut change it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, forget);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, forget);
  }, [forget]);

  const signIn = useCallback(
    async (picked: Profile, password?: string) => setProfile(await sessionApi.signIn(picked.id, password)),
    [setProfile]
  );

  const signOut = useCallback(async () => {
    try {
      await sessionApi.signOut();
    } catch (err) {
      console.error(err); // the token is dropped anyway
    }
    forget();
  }, [forget]);

  const value = useMemo(
    () => ({ status, profile, signIn, signOut, setProfile }),
    [status, profile, signIn, signOut, setProfile]
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
