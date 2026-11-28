import type { Category, Subcategory } from "../types";

/** What a category is mostly made of; decides which color family it gets. */
export type CategoryKind = "gain" | "investment" | "transfer" | "expense";

export type ColorThemeId = "vivid" | "pastel" | "ocean" | "earth";

/**
 * A theme is a set of base colors per kind. Gains are always a green family, so money coming in reads
 * the same in every theme. Each category gets one base color (its kind's list, in id order, wrapping
 * around); its subcategories get lighter and darker shades of it.
 */
export interface ColorTheme {
  id: ColorThemeId;
  families: Record<CategoryKind, string[]>;
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: "vivid",
    families: {
      gain: ["#1e9e5a", "#3cb371"],
      investment: ["#2563eb", "#4f46e5"],
      transfer: ["#64748b"],
      expense: ["#e0483e", "#f08c2e", "#c99700", "#c2378a", "#8b5cf6", "#0e9fb3", "#a0612a", "#5b6ee1"],
    },
  },
  {
    id: "pastel",
    families: {
      gain: ["#7cc79c", "#a3d9a5"],
      investment: ["#8fb3e8", "#aba6e8"],
      transfer: ["#b3b9c4"],
      expense: ["#f09e9e", "#f5c08a", "#ecd57f", "#e7a4cb", "#c5b1ef", "#93d3dc", "#d8bc9c", "#a9bdf0"],
    },
  },
  {
    id: "ocean",
    families: {
      gain: ["#2a9d6f", "#43b58a"],
      investment: ["#1d4e89", "#3d5a98"],
      transfer: ["#6c7a89"],
      expense: ["#0077b6", "#5e60ce", "#0096a8", "#7b2cbf", "#3a86c8", "#4361ee", "#5a4fcf", "#2c7da0"],
    },
  },
  {
    id: "earth",
    families: {
      gain: ["#5a8f3c", "#7aa33f"],
      investment: ["#4a6fa5", "#6b5b95"],
      transfer: ["#8d8478"],
      expense: ["#b5523b", "#cc8a3a", "#a0522d", "#b8941f", "#8c4a6b", "#6f7d3c", "#b9744f", "#7b5e3b"],
    },
  },
];

const KIND_ORDER: CategoryKind[] = ["expense", "gain", "investment", "transfer"]; // ties resolve to expense

/** The kind most of a category's subcategories have ("other" and untyped count as expense). */
export function categoryKind(category: Pick<Category, "subcategories">): CategoryKind {
  const counts: Record<CategoryKind, number> = { expense: 0, gain: 0, investment: 0, transfer: 0 };
  for (const sub of category.subcategories) {
    const type = sub.subcategory_type;
    counts[type === "gain" || type === "investment" || type === "transfer" ? type : "expense"] += 1;
  }
  return KIND_ORDER.reduce((best, kind) => (counts[kind] > counts[best] ? kind : best), KIND_ORDER[0]);
}

// --- color math (hex <-> HSL) ---

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const value = light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/**
 * `count` shades of `base`, from darker to lighter, spread around its lightness so siblings stay
 * distinguishable while clearly belonging to the same family.
 */
export function shadesOf(base: string, count: number): string[] {
  if (count <= 0) return [];
  const [h, s, l] = hexToHsl(base);
  if (count === 1) return [hslToHex(h, s, Math.min(l + 14, 88))];
  const darkest = Math.max(l - 20, 16);
  const lightest = Math.min(l + 30, 90);
  const step = (lightest - darkest) / (count - 1);
  return Array.from({ length: count }, (_, i) => hslToHex(h, s, darkest + step * i));
}

// --- plans ---

/** The color every category and subcategory gets under a theme. */
export interface ColorPlan {
  categories: Map<number, string>;
  subcategories: Map<number, string>;
}

export function planTheme(theme: ColorTheme, categories: Category[]): ColorPlan {
  const plan: ColorPlan = { categories: new Map(), subcategories: new Map() };
  const used: Record<CategoryKind, number> = { expense: 0, gain: 0, investment: 0, transfer: 0 };

  for (const category of [...categories].sort((a, b) => a.id - b.id)) {
    const kind = categoryKind(category);
    const family = theme.families[kind];
    const base = family[used[kind]++ % family.length];
    plan.categories.set(category.id, base);

    const subs = [...category.subcategories].sort((a, b) => a.id - b.id);
    shadesOf(base, subs.length).forEach((shade, i) => plan.subcategories.set(subs[i].id, shade));
  }
  return plan;
}

const same = (a: string | null | undefined, b: string) => (a ?? "").toLowerCase() === b.toLowerCase();

/** The theme the current colors come from, or null when they were picked by hand. */
export function currentTheme(categories: Category[]): ColorThemeId | null {
  if (!categories.length) return null;
  const match = COLOR_THEMES.find((theme) => pendingChanges(planTheme(theme, categories), categories).length === 0);
  return match?.id ?? null;
}

export type ColorChange =
  | { kind: "category"; record: Category; color: string }
  | { kind: "subcategory"; record: Subcategory; categoryId: number; color: string };

/** Only the records whose color differs from the plan, so applying a theme twice changes nothing. */
export function pendingChanges(plan: ColorPlan, categories: Category[]): ColorChange[] {
  const changes: ColorChange[] = [];
  for (const category of categories) {
    const color = plan.categories.get(category.id);
    if (color && !same(category.color_code, color)) changes.push({ kind: "category", record: category, color });
    for (const sub of category.subcategories) {
      const subColor = plan.subcategories.get(sub.id);
      if (subColor && !same(sub.color_code, subColor)) changes.push({ kind: "subcategory", record: sub, categoryId: category.id, color: subColor });
    }
  }
  return changes;
}

/** The categories with the plan's colors, to show right after applying. */
export function withPlanColors(plan: ColorPlan, categories: Category[]): Category[] {
  return categories.map((category) => ({
    ...category,
    color_code: plan.categories.get(category.id) ?? category.color_code,
    subcategories: category.subcategories.map((sub) => ({ ...sub, color_code: plan.subcategories.get(sub.id) ?? sub.color_code })),
  }));
}
