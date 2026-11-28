import { createContext, useContext } from "react";
import type { Profile } from "../types";

export type ProfileStatus = "loading" | "signedIn" | "signedOut";

export interface ProfileState {
  status: ProfileStatus;
  /** the signed-in profile, null otherwise */
  profile: Profile | null;
  /** signs in (password only for protected profiles); rejects with ApiError on a wrong password */
  signIn: (profile: Profile, password?: string) => Promise<void>;
  /** signs out; the picker shows again */
  signOut: () => Promise<void>;
  /** keeps the app in step after the profile is changed in Settings */
  setProfile: (profile: Profile) => void;
}

// Without a provider (component tests) the app is signed in as a placeholder profile.
export const ProfileContext = createContext<ProfileState>({
  status: "signedIn",
  profile: { id: 1, name: "Test", color_code: null, locale: "en", password_protected: false },
  signIn: async () => {},
  signOut: async () => {},
  setProfile: () => {},
});

export const useProfile = () => useContext(ProfileContext);
