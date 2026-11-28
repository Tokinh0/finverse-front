import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { category, keyword, keywordHealth, subcategory } from "../../test/fixtures";
import { rulesBySubcategory } from "../../utils/categorization";
import CategoryTree from "./CategoryTree";

const categories = [
  category({ id: 1, name: "Ganhos", subcategories: [subcategory({ id: 10, name: "Salario", subcategory_type: "gain" })] }),
  category({ id: 2, name: "Lazer", subcategories: [subcategory({ id: 20, name: "Bar" }), subcategory({ id: 21, name: "Cinema" })] }),
];
const rules = rulesBySubcategory([keyword({ id: 1, subcategory_id: 20 }), keyword({ id: 2, name: "PUB", subcategory_id: 20 })]);
const health = new Map([[1, keywordHealth({ keyword_id: 1, flags: ["unused"] })]]);

const renderTree = (props: Partial<Parameters<typeof CategoryTree>[0]> = {}) => {
  const onSelect = vi.fn();
  const onQuery = vi.fn();
  render(
    <CategoryTree categories={categories} rules={rules} health={health} selection={{ kind: "subcategory", id: 20 }} query="" onQuery={onQuery} onSelect={onSelect} {...props} />
  );
  return { onSelect, onQuery };
};

describe("CategoryTree", () => {
  it("shows each category's kind, rule counts and the rules that need attention", () => {
    renderTree();

    expect(screen.getByRole("button", { name: /Ganhos/ })).toHaveTextContent("Gains · 0 rules");
    expect(screen.getByRole("button", { name: /Lazer/ })).toHaveTextContent("Expenses · 2 rules");
    const bar = screen.getByRole("button", { name: /Bar/ });
    expect(bar).toHaveAttribute("aria-current", "true");
    expect(bar).toHaveTextContent("1 needs attention");
    expect(bar).toHaveTextContent("2 rules");
  });

  it("selects what is clicked and reports the search", async () => {
    const { onSelect, onQuery } = renderTree();

    await userEvent.click(screen.getByRole("button", { name: /Lazer/ }));
    expect(onSelect).toHaveBeenCalledWith({ kind: "category", id: 2 });
    await userEvent.click(screen.getByRole("button", { name: "+ New category" }));
    expect(onSelect).toHaveBeenCalledWith({ kind: "newCategory" });
    await userEvent.type(screen.getByRole("searchbox"), "x");
    expect(onQuery).toHaveBeenCalledWith("x");
  });

  it("filters by the search and says when nothing matches", () => {
    renderTree({ query: "pub" });
    expect(screen.getByRole("button", { name: /Bar/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cinema/ })).not.toBeInTheDocument();
  });

  it("invites to create the first category", () => {
    renderTree({ categories: [] });
    expect(screen.getByText("No categories yet. Create the first one.")).toBeInTheDocument();
  });
});
