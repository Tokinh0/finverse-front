import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { categoriesApi, subcategoriesApi } from "../api";
import { category, subcategory } from "../test/fixtures";
import CategorySubcategoryManager from "./CategorySubcategoryManager";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());

describe("CategorySubcategoryManager", () => {
  beforeEach(() => {
    vi.mocked(categoriesApi.list).mockResolvedValue([category()]);
  });

  it("updates an existing category on blur", async () => {
    vi.mocked(categoriesApi.update).mockResolvedValue(category({ name: "Lazer" }));
    render(<CategorySubcategoryManager />);

    const name = await screen.findByDisplayValue("Conforto");
    await userEvent.clear(name);
    await userEvent.type(name, "Lazer");
    await userEvent.tab();

    expect(categoriesApi.update).toHaveBeenCalledWith(1, { name: "Lazer", color_code: "#000000" });
  });

  it("creates a new category and swaps in the saved record", async () => {
    vi.mocked(categoriesApi.create).mockResolvedValue(category({ id: 2, name: "Viagem", subcategories: [] }));
    render(<CategorySubcategoryManager />);
    await screen.findByDisplayValue("Conforto");

    await userEvent.click(screen.getByRole("button", { name: "+ Add Category" }));
    const [, newName] = screen.getAllByLabelText("Category name");
    const [, newAddSub] = screen.getAllByRole("button", { name: "+ Subcategory" });
    expect(newAddSub).toBeDisabled(); // can't add subcategories before the category exists
    await userEvent.type(newName, "Viagem");
    await userEvent.tab();

    expect(categoriesApi.create).toHaveBeenCalledWith({ name: "Viagem", color_code: "#000000" });
    expect(screen.getAllByRole("button", { name: "+ Subcategory" })[1]).toBeEnabled();
  });

  it("creates and updates subcategories", async () => {
    vi.mocked(subcategoriesApi.create).mockResolvedValue(subcategory({ id: 11, name: "Uber" }));
    vi.mocked(subcategoriesApi.update).mockResolvedValue(subcategory());
    render(<CategorySubcategoryManager />);
    await screen.findByDisplayValue("Food");

    await userEvent.selectOptions(screen.getByLabelText("Subcategory type"), "investment");
    await userEvent.tab();
    expect(subcategoriesApi.update).toHaveBeenCalledWith(10, expect.objectContaining({ subcategory_type: "investment", category_id: 1 }));

    await userEvent.click(screen.getByRole("button", { name: "+ Subcategory" }));
    const [, newName] = screen.getAllByLabelText("Subcategory name");
    await userEvent.type(newName, "Uber");
    await userEvent.tab();
    expect(subcategoriesApi.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Uber", category_id: 1 }));
  });
});
