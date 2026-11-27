import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { categoriesApi, subcategoriesApi } from "../../api";
import { category, subcategory } from "../../test/fixtures";
import NewSubcategoryModal from "./NewSubcategoryModal";

vi.mock("../../api", async () => (await import("../../test/mockApi")).mockApiModule());

const categories = [category({ id: 1, name: "Conforto" }), category({ id: 2, name: "Transporte" })];

const renderModal = (onCreated = vi.fn()) => {
  render(<NewSubcategoryModal show categories={categories} onHide={vi.fn()} onCreated={onCreated} />);
  return onCreated;
};

describe("NewSubcategoryModal", () => {
  it("creates a subcategory in an existing category", async () => {
    const created = subcategory({ id: 30, name: "Pets" });
    vi.mocked(subcategoriesApi.create).mockResolvedValue(created);
    const onCreated = renderModal();

    await userEvent.selectOptions(screen.getByLabelText("Category"), "2");
    await userEvent.type(screen.getByLabelText("Subcategory name"), " Pets ");
    await userEvent.selectOptions(screen.getByLabelText("Type"), "other");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(categoriesApi.create).not.toHaveBeenCalled();
    expect(subcategoriesApi.create).toHaveBeenCalledWith({ name: "Pets", color_code: "#257de0", subcategory_type: "other", category_id: 2 });
    expect(onCreated).toHaveBeenCalledWith(created);
  });

  it("creates a new category first when asked", async () => {
    vi.mocked(categoriesApi.create).mockResolvedValue(category({ id: 7, name: "Casa", subcategories: [] }));
    vi.mocked(subcategoriesApi.create).mockResolvedValue(subcategory({ id: 31, name: "Aluguel" }));
    const onCreated = renderModal();

    await userEvent.selectOptions(screen.getByLabelText("Category"), "__new__");
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("New category name"), "Casa");
    await userEvent.type(screen.getByLabelText("Subcategory name"), "Aluguel");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(categoriesApi.create).toHaveBeenCalledWith({ name: "Casa", color_code: "#6c757d" });
    expect(subcategoriesApi.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Aluguel", category_id: 7, subcategory_type: "expense" }));
    expect(onCreated).toHaveBeenCalled();
  });

  it("shows the error and does not create the new category twice on retry", async () => {
    vi.mocked(categoriesApi.create).mockResolvedValue(category({ id: 7, name: "Casa", subcategories: [] }));
    vi.mocked(subcategoriesApi.create).mockRejectedValueOnce(new Error("taken")).mockResolvedValueOnce(subcategory({ id: 31 }));
    renderModal();

    await userEvent.selectOptions(screen.getByLabelText("Category"), "__new__");
    await userEvent.type(screen.getByLabelText("New category name"), "Casa");
    await userEvent.type(screen.getByLabelText("Subcategory name"), "Aluguel");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("Could not create it. Try again.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(categoriesApi.create).toHaveBeenCalledTimes(1);
    expect(subcategoriesApi.create).toHaveBeenLastCalledWith(expect.objectContaining({ category_id: 7 }));
  });
});
