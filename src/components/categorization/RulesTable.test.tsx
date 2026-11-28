import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { category, keyword, keywordHealth, subcategory } from "../../test/fixtures";
import RulesTable from "./RulesTable";

vi.mock("../../api", async () => (await import("../../test/mockApi")).mockApiModule());

const categories = [category({ id: 1, name: "Conforto", subcategories: [subcategory({ id: 10, name: "Food" })] })];
const keywords = [keyword({ id: 1, name: "RAPPI" }), keyword({ id: 2, name: "IFOOD" }), keyword({ id: 3, name: "ORPHAN", subcategory_id: 99, subcategory: null })];

const renderTable = (props: Partial<Parameters<typeof RulesTable>[0]> = {}) => {
  const handlers = { onAttentionOnly: vi.fn(), onEditRule: vi.fn(), onRuleDeleted: vi.fn(), onSelect: vi.fn() };
  render(
    <MemoryRouter>
      <RulesTable categories={categories} keywords={keywords} health={new Map()} attentionOnly={false} {...handlers} {...props} />
    </MemoryRouter>
  );
  return handlers;
};

describe("RulesTable", () => {
  it("lists rules by name with where they send transactions", () => {
    renderTable();

    const rows = screen.getAllByRole("row").slice(1) as HTMLTableRowElement[];
    expect(rows.map((row) => row.cells[0].textContent)).toEqual(["IFOOD", "ORPHAN", "RAPPI"]);
    expect(rows[0]).toHaveTextContent("Conforto › Food");
    expect(rows[1]).toHaveTextContent("Unknown");
  });

  it("searches by rule, subcategory or category", async () => {
    renderTable();

    await userEvent.type(screen.getByRole("searchbox"), "confort");
    expect(screen.getAllByRole("row")).toHaveLength(3);
    await userEvent.clear(screen.getByRole("searchbox"));
    await userEvent.type(screen.getByRole("searchbox"), "zzz");
    expect(screen.getByText("No rule matches this search.")).toBeInTheDocument();
  });

  it("shows only the rules that need attention when asked", async () => {
    const health = new Map([[1, keywordHealth({ keyword_id: 1, flags: ["unused"] })]]);
    const { onAttentionOnly } = renderTable({ health, attentionOnly: true });

    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("RAPPI")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Only rules that need attention (1)"));
    expect(onAttentionOnly).toHaveBeenCalledWith(false);
  });

  it("opens a rule's subcategory and the rule dialog", async () => {
    const { onSelect, onEditRule } = renderTable();

    await userEvent.click(screen.getAllByRole("button", { name: "Open Food" })[0]);
    expect(onSelect).toHaveBeenCalledWith({ kind: "subcategory", id: 10 });
    await userEvent.click(screen.getByRole("button", { name: "+ Add rule" }));
    expect(onEditRule).toHaveBeenCalledWith(null);
  });

  it("invites to add the first rule", () => {
    renderTable({ keywords: [] });
    expect(screen.getByText("No rules yet. Add one to start sorting transactions automatically.")).toBeInTheDocument();
  });
});
