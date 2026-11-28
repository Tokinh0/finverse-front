import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { keywordsApi, subcategoriesApi } from "../../api";
import { category, keyword, keywordHealth, subcategory } from "../../test/fixtures";
import SubcategoryPanel from "./SubcategoryPanel";

vi.mock("../../api", async () => (await import("../../test/mockApi")).mockApiModule());

const food = subcategory({ id: 10, name: "Food", color_code: "#f00" });
const conforto = category({ id: 1, name: "Conforto", subcategories: [food] });
const lazer = category({ id: 2, name: "Lazer", subcategories: [] });
const rules = [keyword({ id: 1, name: "IFOOD", max_amount: 80 }), keyword({ id: 2, name: "RAPPI" })];

const renderPanel = (ruleList = rules) => {
  const handlers = { onSaved: vi.fn(), onDeleted: vi.fn(), onEditRule: vi.fn(), onRuleDeleted: vi.fn(), onSelect: vi.fn() };
  render(
    <MemoryRouter>
      <SubcategoryPanel
        category={conforto}
        subcategory={food}
        categories={[conforto, lazer]}
        rules={ruleList}
        health={new Map([[2, keywordHealth({ keyword_id: 2, flags: ["unused"] })]])}
        {...handlers}
      />
    </MemoryRouter>
  );
  return handlers;
};

describe("SubcategoryPanel", () => {
  it("shows the rules with their amounts and health, and goes back to the category", async () => {
    const { onSelect } = renderPanel();

    const [ifood, rappi] = screen.getAllByRole("listitem");
    expect(ifood).toHaveTextContent(/IFOODup to R\$\s?80,00/);
    expect(rappi).toHaveTextContent("Never matches");
    expect(screen.getByText(/1 needs attention/)).toBeInTheDocument();
    expect(screen.getByLabelText("Subcategory color")).toHaveValue("#ff0000"); // short hex expanded for the input

    await userEvent.click(screen.getByRole("button", { name: "Conforto" }));
    expect(onSelect).toHaveBeenCalledWith({ kind: "category", id: 1 });
  });

  it("saves a rename and reports a failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(subcategoriesApi.update).mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce(food);
    const { onSaved } = renderPanel();

    await userEvent.type(screen.getByLabelText("Subcategory name"), " & drinks");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Could not save. Try again.");
    expect(onSaved).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: 10, name: "Food & drinks" }), 1);
  });

  it("opens the rule dialog to add or edit, and deletes a rule after asking", async () => {
    vi.mocked(keywordsApi.remove).mockResolvedValue(undefined);
    const { onEditRule, onRuleDeleted } = renderPanel();

    await userEvent.click(screen.getByRole("button", { name: "+ Add rule" }));
    expect(onEditRule).toHaveBeenCalledWith(null);
    await userEvent.click(screen.getByRole("button", { name: "Edit IFOOD" }));
    expect(onEditRule).toHaveBeenCalledWith(rules[0]);

    await userEvent.click(screen.getByRole("button", { name: "Delete RAPPI" }));
    await userEvent.click(within(screen.getByRole("dialog", { name: "Delete RAPPI?" })).getByRole("button", { name: "Delete" }));
    expect(keywordsApi.remove).toHaveBeenCalledWith(2);
    expect(onRuleDeleted).toHaveBeenCalledWith(rules[1]);
  });

  it("explains what happens without rules", () => {
    renderPanel([]);
    expect(screen.getByText("No rules yet, so transactions only land here when you move them by hand.")).toBeInTheDocument();
  });
});
