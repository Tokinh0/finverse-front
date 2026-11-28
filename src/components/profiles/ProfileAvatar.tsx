import type { Profile } from "../../types";
import { avatarColor, initials } from "../../utils/profiles";

/** A profile's initials on its color. Decorative: the name is always shown next to it. */
export default function ProfileAvatar({ profile, size = 96 }: { profile: Profile; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="profile-avatar"
      style={{ background: avatarColor(profile), width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials(profile.name)}
    </span>
  );
}
