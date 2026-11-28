import { describe, expect, it } from "vitest";
import { category, subcategory } from "../test/fixtures";
import type { SubcategoryType } from "../types";
import { categoryKind, COLOR_THEMES, currentTheme, pendingChanges, planTheme, shadesOf, withPlanColors } from "./colorThemes";

const sub = (id: number, type: SubcategoryType | "" = "expense") => subcategory({ id, subcategory_type: type, category: undefined });
const vivid = COLOR_THEMES.find((theme) => theme.id === "vivid")!;

const lightness = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
};

describe("color themes", () => {
  it("offers at least three themes, each with a green family for gains", () => {
    expect(COLOR_THEMES.length).toBeGreaterThanOrEqual(3);
    for (const theme of COLOR_THEMES) {
      for (const hex of theme.families.gain) {
        const n = parseInt(hex.slice(1), 16);
        const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        expect(g).toBeGreaterThan(r);
        expect(g).toBeGreaterThan(b);
      }
    }
  });

  it("classifies a category by most of its subcategories, ties and unknowns as expense", () => {
    expect(categoryKind(category({ subcategories: [sub(1, "gain"), sub(2, "gain"), sub(3)] }))).toBe("gain");
    expect(categoryKind(category({ subcategories: [sub(1, "investment"), sub(2)] }))).toBe("expense");
    expect(categoryKind(category({ subcategories: [sub(1, "other"), sub(2, "")] }))).toBe("expense");
    expect(categoryKind(category({ subcategories: [sub(1, "transfer")] }))).toBe("transfer");
    expect(categoryKind(category({ subcategories: [] }))).toBe("expense");
  });

  it("makes distinct shades from dark to light", () => {
    const shades = shadesOf("#1e9e5a", 4);
    expect(new Set(shades).size).toBe(4);
    const values = shades.map(lightness);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
    expect(shadesOf("#1e9e5a", 0)).toEqual([]);
    expect(lightness(shadesOf("#1e9e5a", 1)[0])).toBeGreaterThan(lightness("#1e9e5a"));
  });

  it("gives each category a base color by kind and its subcategories shades of it", () => {
    const categories = [
      category({ id: 3, subcategories: [sub(31), sub(30)] }),
      category({ id: 1, subcategories: [sub(10, "gain"), sub(11, "gain")] }),
      category({ id: 2, subcategories: [sub(20)] }),
    ];
    const plan = planTheme(vivid, categories);

    expect(plan.categories.get(1)).toBe(vivid.families.gain[0]);
    expect(plan.categories.get(2)).toBe(vivid.families.expense[0]); // expense colors go by id
    expect(plan.categories.get(3)).toBe(vivid.families.expense[1]);
    expect([plan.subcategories.get(30), plan.subcategories.get(31)]).toEqual(shadesOf(vivid.families.expense[1], 2));
    expect(plan.subcategories.get(20)).toBe(shadesOf(vivid.families.expense[0], 1)[0]);
  });

  it("wraps around a family when there are more categories than colors", () => {
    const transfers = [1, 2].map((id) => category({ id, subcategories: [sub(id * 10, "transfer")] }));
    const plan = planTheme(vivid, transfers);
    expect(plan.categories.get(1)).toBe(plan.categories.get(2));
  });

  it("lists only the colors that change and recognizes the theme in use", () => {
    const categories = [category({ id: 1, subcategories: [sub(10), sub(11)] })];
    const plan = planTheme(vivid, categories);

    expect(pendingChanges(plan, categories)).toHaveLength(3);
    expect(currentTheme(categories)).toBeNull();

    const themed = withPlanColors(plan, categories);
    expect(pendingChanges(plan, themed)).toEqual([]);
    expect(currentTheme(themed)).toBe("vivid");

    const upper = [{ ...themed[0], color_code: themed[0].color_code!.toUpperCase() }];
    expect(currentTheme(upper)).toBe("vivid"); // case doesn't matter
    expect(currentTheme([])).toBeNull();
  });
});
