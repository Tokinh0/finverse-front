import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { asset } from "../../test/fixtures";
import { allocationByType } from "../../utils/portfolio";
import HoldingsTable from "./HoldingsTable";

const assets = [
  asset({ id: 1, ticker: "CDB", current_value: 1000, rating: 4, percent_by_type: 100 }),
  asset({ id: 2, ticker: "BTC", asset_type: "criptomoedas", current_value: 3000, rating: 9, percent_by_type: 100 }),
];

const renderTable = (props: Partial<Parameters<typeof HoldingsTable>[0]> = {}) => {
  const handlers = { onType: vi.fn(), onQuery: vi.fn(), onSort: vi.fn(), onAdd: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  render(
    <HoldingsTable
      assets={assets}
      allocation={allocationByType(assets)}
      colors={new Map()}
      typeLabel={(t) => t}
      showTotals
      type={null}
      query=""
      sort="value"
      {...handlers}
      {...props}
    />
  );
  return handlers;
};

describe("HoldingsTable", () => {
  it("sorts the holdings and shows each one's share of the total", () => {
    renderTable();
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("BTC");
    expect(rows[0]).toHaveTextContent("75.0%");
    expect(rows[1]).toHaveTextContent("25.0%");
  });

  it("hides quantities and values when totals are hidden", () => {
    renderTable({ showTotals: false });
    expect(screen.getAllByText("R$ •••")).toHaveLength(2);
    expect(screen.queryByText(/R\$\s?3\.000,00/)).not.toBeInTheDocument();
  });

  it("reports filter, search, sort and row actions", async () => {
    const handlers = renderTable();

    await userEvent.click(screen.getByRole("button", { name: /^criptomoedas/ }));
    expect(handlers.onType).toHaveBeenCalledWith("criptomoedas");
    await userEvent.type(screen.getByRole("searchbox"), "b");
    expect(handlers.onQuery).toHaveBeenCalledWith("b");
    await userEvent.selectOptions(screen.getByLabelText("Sort by"), "rating");
    expect(handlers.onSort).toHaveBeenCalledWith("rating");
    await userEvent.click(screen.getByRole("button", { name: "Edit BTC" }));
    expect(handlers.onEdit).toHaveBeenCalledWith(assets[1]);
    await userEvent.click(screen.getByRole("button", { name: "Delete CDB" }));
    expect(handlers.onDelete).toHaveBeenCalledWith(assets[0]);
    await userEvent.click(screen.getByRole("button", { name: "+ Add asset" }));
    expect(handlers.onAdd).toHaveBeenCalled();
  });

  it("offers to clear a filter that matches nothing", async () => {
    const handlers = renderTable({ query: "zzz" });
    await userEvent.click(screen.getByRole("button", { name: "Show all" }));
    expect(handlers.onType).toHaveBeenCalledWith(null);
    expect(handlers.onQuery).toHaveBeenCalledWith("");
  });
});
