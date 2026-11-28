import type { Profile } from "../types";

// Avatar colors for profiles without their own: dark enough for white initials (WCAG AA).
const AVATAR_COLORS = ["#1f6f8b", "#7b3f99", "#2e7d32", "#b23c17", "#37474f", "#8d5a00"];

export const avatarColor = (profile: Pick<Profile, "id" | "color_code">) =>
  profile.color_code || AVATAR_COLORS[Math.abs(profile.id) % AVATAR_COLORS.length];

/** Up to two initials: "Blake" → "B", "Alex Rae" → "AR". */
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/** The first message the API sent, or the fallback. */
export function apiErrorText(body: unknown, fallback: string) {
  const errors = (body as { errors?: unknown } | undefined)?.errors;
  return Array.isArray(errors) && errors.length > 0 ? errors.join(", ") : fallback;
}
