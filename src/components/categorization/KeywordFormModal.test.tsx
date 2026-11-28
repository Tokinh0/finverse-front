import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError, keywordsApi } from "../../api";
import { category, keyword, subcategory } from "../../test/fixtures";
import KeywordFormModal from "./KeywordFormModal";

vi.mock("../../api", async () => (await import("../../test/mockApi")).mockApiModule());

const categories = [
  category({ id: 1, name: "Conforto", subcategories: [subcategory({ id: 10, name: "Food" })] }),
  category({ id: 2, name: "Lazer", subcategories: [subcategory({ id: 20, name: "Bar" })] }),
];

describe("KeywordFormModal", () => {
  it("groups subcategories by category and starts from the given one", () => {
    render(<KeywordFormModal keyword={null} categories={categories} subcategoryId={20} onHide={() => {}} onSaved={() => {}} />);

    expect(screen.getByRole("dialog", { name: "New keyword rule" })).toBeInTheDocument();
    expect(screen.getByLabelText("Subcategory")).toHaveValue("20");
    expect(screen.getByRole("group", { name: "Lazer" })).toContainElement(screen.getByRole("option", { name: "Bar" }));
  });

  it("edits a rule", async () => {
    const saved = keyword({ name: "IFOOD SP" });
    vi.mocked(keywordsApi.update).mockResolvedValue(saved);
    const onSaved = vi.fn();
    render(<KeywordFormModal keyword={keyword({ max_amount: 50 })} categories={categories} onHide={() => {}} onSaved={onSaved} />);

    expect(screen.getByLabelText("Maximum amount")).toHaveValue("50,00");
    await userEvent.type(screen.getByLabelText("Keyword"), " SP");
    await userEvent.click(screen.getByRole("button", { name: "Save rule" }));

    expect(keywordsApi.update).toHaveBeenCalledWith(100, { name: "IFOOD SP", subcategory_id: 10, min_amount: null, max_amount: 50 });
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it("asks for the word and the subcategory, and shows API errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(keywordsApi.create).mockRejectedValue(new ApiError(422, { name: ["has already been taken"] }));
    render(<KeywordFormModal keyword={null} categories={categories} onHide={() => {}} onSaved={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: "Add rule" }));
    expect(screen.getByText("Please fill in all fields")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Keyword"), "IFOOD");
    await userEvent.selectOptions(screen.getByLabelText("Subcategory"), "10");
    await userEvent.click(screen.getByRole("button", { name: "Add rule" }));
    expect(await screen.findByText("name has already been taken")).toBeInTheDocument();
  });
});
