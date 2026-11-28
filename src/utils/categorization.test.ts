import { describe, expect, it } from "vitest";
import { ApiError } from "../api/client";
import { category, keyword, keywordHealth, subcategory } from "../test/fixtures";
import {
  colorInputValue,
  errorText,
  filterCategories,
  findSubcategory,
  needsAttention,
  nextSubcategoryColor,
  normalize,
  readSelection,
  readTab,
  rulesBySubcategory,
} from "./categorization";
import { shadesOf } from "./colorThemes";

const categories = [
  category({ id: 1, name: "Conforto", subcategories: [subcategory({ id: 10, name: "Food" }), subcategory({ id: 11, name: "Uber" })] }),
  category({ id: 2, name: "Lazer", subcategories: [subcategory({ id: 20, name: "Cinema" })] }),
];

describe("categorization utils", () => {
  it("reads the tab and the selection from the URL", () => {
    expect(readTab(new URLSearchParams("tab=rules"))).toBe("rules");
    expect(readTab(new URLSearchParams("tab=nope"))).toBe("organize");
    expect(readSelection(new URLSearchParams("s=10&c=1"))).toEqual({ kind: "subcategory", id: 10 });
    expect(readSelection(new URLSearchParams("c=1"))).toEqual({ kind: "category", id: 1 });
    expect(readSelection(new URLSearchParams("new=category"))).toEqual({ kind: "newCategory" });
    expect(readSelection(new URLSearchParams(""))).toEqual({ kind: "none" });
  });

  it("groups rules by subcategory, sorted by name", () => {
    const rules = rulesBySubcategory([keyword({ id: 1, name: "UBER", subcategory_id: 11 }), keyword({ id: 2, name: "IFOOD" }), keyword({ id: 3, name: "BURGER" })]);
    expect(rules.get(10)!.map((rule) => rule.name)).toEqual(["BURGER", "IFOOD"]);
    expect(rules.get(11)!.map((rule) => rule.name)).toEqual(["UBER"]);
  });

  it("searches categories, subcategories and rules, ignoring case and accents", () => {
    const rules = rulesBySubcategory([keyword({ name: "IFOOD", subcategory_id: 10 })]);
    expect(normalize(" ÁGUA ")).toBe("agua");
    expect(filterCategories(categories, rules, "")).toBe(categories);
    expect(filterCategories(categories, rules, "lazer")[0].subcategories).toHaveLength(1); // a category keeps all its subcategories
    expect(filterCategories(categories, rules, "ifo")).toEqual([{ ...categories[0], subcategories: [categories[0].subcategories[0]] }]);
    expect(filterCategories(categories, rules, "übér")[0].subcategories.map((s) => s.name)).toEqual(["Uber"]);
    expect(filterCategories(categories, rules, "zzz")).toEqual([]);
  });

  it("finds a subcategory with its category", () => {
    expect(findSubcategory(categories, 20)?.category.name).toBe("Lazer");
    expect(findSubcategory(categories, 99)).toBeNull();
  });

  it("knows which rules need attention", () => {
    const health = new Map([[100, keywordHealth({ flags: ["unused"] })]]);
    expect(needsAttention(keyword(), health)).toBe(true);
    expect(needsAttention(keyword({ id: 5 }), health)).toBe(false);
  });

  it("gives a new subcategory the next shade of its category's color", () => {
    expect(nextSubcategoryColor(category({ color_code: "#2563eb", subcategories: [subcategory()] }))).toBe(shadesOf("#2563eb", 2)[1]);
  });

  it("turns colors into values a color input accepts", () => {
    expect(colorInputValue("#ABCDEF")).toBe("#abcdef");
    expect(colorInputValue("#abc")).toBe("#aabbcc");
    expect(colorInputValue(null)).toBe("#cccccc");
    expect(colorInputValue("red", "#000000")).toBe("#000000");
  });

  it("shows the API's validation messages", () => {
    expect(errorText(new ApiError(422, { errors: ["Can't delete Outros"] }), "fallback")).toBe("Can't delete Outros");
    expect(errorText(new ApiError(422, { name: ["has already been taken"] }), "fallback")).toBe("name has already been taken");
    expect(errorText(new ApiError(500, undefined), "fallback")).toBe("fallback");
    expect(errorText(new Error("boom"), "fallback")).toBe("fallback");
  });
});
