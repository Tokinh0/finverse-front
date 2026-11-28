import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { categoriesApi, subcategoriesApi } from "../../api";
import { category, keyword, subcategory } from "../../test/fixtures";
import { rulesBySubcategory } from "../../utils/categorization";
import CategoryPanel from "./CategoryPanel";

vi.mock("../../api", async () => (await import("../../test/mockApi")).mockApiModule());

const ganhos = category({
  id: 1,
  name: "Ganhos",
  color_code: "#1e9e5a",
  subcategories: [subcategory({ id: 10, name: "Salario", subcategory_type: "gain" }), subcategory({ id: 11, name: "Pix", subcategory_type: "gain" })],
});

const renderPanel = (cat: typeof ganhos | null = ganhos) => {
  const handlers = { onSaved: vi.fn(), onDeleted: vi.fn(), onSubcategoryCreated: vi.fn(), onSelect: vi.fn() };
  render(
    <MemoryRouter>
      <CategoryPanel category={cat} rules={rulesBySubcategory([keyword({ subcategory_id: 10 })])} {...handlers} />
    </MemoryRouter>
  );
  return handlers;
};

describe("CategoryPanel", () => {
  it("lists the subcategories with their type and rules, and opens one", async () => {
    const { onSelect } = renderPanel();

    expect(screen.getByRole("heading", { name: "Ganhos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See transactions →" })).toHaveAttribute("href", "/transactions?category_id=1");
    expect(screen.getByRole("button", { name: /Salario/ })).toHaveTextContent("Gain · 1 rule");
    await userEvent.click(screen.getByRole("button", { name: /Pix/ }));
    expect(onSelect).toHaveBeenCalledWith({ kind: "subcategory", id: 11 });
  });

  it("only saves when something changed, and says so", async () => {
    vi.mocked(categoriesApi.update).mockResolvedValue({ ...ganhos, color_code: "#000000" });
    const { onSaved } = renderPanel();

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Category name"), "!");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(categoriesApi.update).toHaveBeenCalledWith(1, { name: "Ganhos!", color_code: "#1e9e5a" });
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: 1, subcategories: ganhos.subcategories }));
    expect(await screen.findByRole("status")).toHaveTextContent("Saved.");
  });

  it("adds a subcategory with the category's usual type and the next shade", async () => {
    const created = subcategory({ id: 12, name: "Bonus" });
    vi.mocked(subcategoriesApi.create).mockResolvedValue(created);
    const { onSubcategoryCreated } = renderPanel();

    expect(screen.getByLabelText("Subcategory type")).toHaveValue("gain");
    await userEvent.type(screen.getByLabelText("New subcategory"), "Bonus");
    await userEvent.click(screen.getByRole("button", { name: "Add subcategory" }));

    expect(subcategoriesApi.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Bonus", subcategory_type: "gain", category_id: 1 }));
    expect(onSubcategoryCreated).toHaveBeenCalledWith(created, 1);
  });

  it("needs a name for a new category", async () => {
    renderPanel(null);

    await userEvent.click(screen.getByRole("button", { name: "Create category" }));
    expect(screen.getByRole("status")).toHaveTextContent("Give it a name first.");
    expect(categoriesApi.create).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Delete category" })).not.toBeInTheDocument();
  });

  it("deletes the category after asking", async () => {
    vi.mocked(categoriesApi.remove).mockResolvedValue(undefined);
    const { onDeleted } = renderPanel();

    await userEvent.click(screen.getByRole("button", { name: "Delete category" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Its 2 subcategories and their rules are deleted too");
    await userEvent.click(screen.getAllByRole("button", { name: "Delete category" }).at(-1)!);

    expect(categoriesApi.remove).toHaveBeenCalledWith(1);
    expect(onDeleted).toHaveBeenCalledWith(ganhos);
  });
});
