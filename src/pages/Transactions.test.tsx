import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { categoriesApi, transactionsApi } from "../api";
import { category, subcategory, transaction, transactionsPage } from "../test/fixtures";
import Transactions from "./Transactions";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());

function LocationProbe() {
  return <span data-testid="location">{useLocation().search}</span>;
}

const renderPage = (url = "/transactions", showTotals = true) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/transactions" element={<><Transactions showTotals={showTotals} /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>
  );

describe("Transactions", () => {
  beforeEach(() => {
    vi.mocked(categoriesApi.list).mockResolvedValue([
      category({ id: 9, name: "Outros", subcategories: [subcategory({ id: 99, name: "Outros" })] }),
      category({ id: 1, name: "Conforto", subcategories: [subcategory({ id: 10, name: "Food" })] }),
    ]);
    vi.mocked(transactionsApi.list).mockResolvedValue(
      transactionsPage([transaction(), transaction({ id: 1001, name: "SALARIO", transaction_type: "credit", amount: 5000 })], { total_amount: 5060.28 })
    );
  });

  it("lists transactions with a summary", async () => {
    renderPage();

    const row = (await screen.findByText("LANCHONETE EXEMPLO")).closest("tr")!;
    expect(within(row).getByText("02/03/2025")).toBeInTheDocument();
    expect(within(row).getByText("Outros / Outros")).toBeInTheDocument();
    expect(within(row).getByText(/60,28/)).toBeInTheDocument();
    expect(screen.getByTestId("transactions-summary")).toHaveTextContent(/2 transactions · R\$\s?5\.060,28/);
  });

  it("hides amounts when totals are hidden", async () => {
    renderPage("/transactions", false);

    await screen.findByText("LANCHONETE EXEMPLO");
    expect(screen.queryByText(/60,28/)).not.toBeInTheDocument();
    expect(screen.getAllByText("R$ •••").length).toBeGreaterThan(0);
  });

  it("reads filters from the URL and writes changes back", async () => {
    renderPage("/transactions?month=2025-03&page=2");

    await waitFor(() => expect(transactionsApi.list).toHaveBeenCalledWith({ month: "2025-03", page: 2, per_page: 50 }));
    await screen.findByText("LANCHONETE EXEMPLO");

    await userEvent.selectOptions(screen.getByLabelText("Category"), "1");

    // changing a filter goes back to page 1 and scopes the subcategory list
    expect(screen.getByTestId("location")).toHaveTextContent("?month=2025-03&category_id=1");
    expect(within(screen.getByLabelText("Subcategory")).getAllByRole("option").map((o) => o.textContent)).toEqual(["All subcategories", "Food"]);
  });

  it("debounces the text search", async () => {
    renderPage();
    await screen.findByText("LANCHONETE EXEMPLO");

    await userEvent.type(screen.getByLabelText("Search"), "uber");

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("?q=uber"));
    expect(transactionsApi.list).toHaveBeenLastCalledWith({ q: "uber", page: 1, per_page: 50 });
  });

  it("paginates", async () => {
    vi.mocked(transactionsApi.list).mockResolvedValue(transactionsPage([transaction()], { total_count: 120 }));
    renderPage();

    expect(await screen.findByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByTestId("location")).toHaveTextContent("?page=2");
  });

  it("re-categorizes and reloads the list", async () => {
    vi.mocked(transactionsApi.recategorize).mockResolvedValue({
      transaction: transaction(),
      keyword: { id: 1, name: "IFD", subcategory_id: 10 },
      updated_count: 4,
    });
    renderPage();

    const row = (await screen.findByText("LANCHONETE EXEMPLO")).closest("tr")!;
    await userEvent.click(within(row).getByRole("button", { name: "Re-categorize" }));
    await userEvent.selectOptions(screen.getByLabelText("Subcategory", { selector: "#recategorize-subcategory" }), "10");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText('Transaction updated. Keyword "IFD" saved. 4 other transaction(s) moved.')).toBeInTheDocument();
    expect(transactionsApi.list).toHaveBeenCalledTimes(2);
  });

  it("explains an empty result", async () => {
    vi.mocked(transactionsApi.list).mockResolvedValue(transactionsPage([], { total_count: 0 }));
    renderPage("/transactions?q=zzz");

    expect(await screen.findByText("No transactions match these filters.")).toBeInTheDocument();
  });
});
