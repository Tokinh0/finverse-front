import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { categoriesApi, statementsApi, suggestionsApi, transactionsApi } from "../api";
import { SuggestionsSummaryContext } from "../hooks/suggestionsSummary";
import { category, categorySuggestion, ruleSuggestion, subcategory, suggestionsSummary, transaction, transactionsPage } from "../test/fixtures";
import Transactions from "./Transactions";
import { inLocale } from "../test/i18n";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());

function LocationProbe() {
  return <span data-testid="location">{useLocation().search}</span>;
}

const refreshSummary = vi.fn().mockResolvedValue(undefined);

const renderPage = (url = "/transactions", showTotals = true, summary = suggestionsSummary({ pending_category_count: 0 })) =>
  render(
    <SuggestionsSummaryContext.Provider value={{ summary, refresh: refreshSummary }}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/transactions" element={<><Transactions showTotals={showTotals} /><LocationProbe /></>} />
        </Routes>
      </MemoryRouter>
    </SuggestionsSummaryContext.Provider>
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
    expect(within(row).getByText("03/02/2025")).toBeInTheDocument();
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

    // an old ?month= link is read as that month's range
    await waitFor(() =>
      expect(transactionsApi.list).toHaveBeenCalledWith({ from: "2025-03-01", to: "2025-03-31", page: 2, per_page: 50 })
    );
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

  describe("suggestions", () => {
    const withSuggestion = transaction({ pending_suggestion: categorySuggestion({ transaction: undefined }) });

    beforeEach(() => {
      vi.mocked(transactionsApi.list).mockResolvedValue(transactionsPage([withSuggestion]));
    });

    it("shows a pending suggestion apart from the confirmed category and accepts it", async () => {
      vi.mocked(suggestionsApi.acceptCategory).mockResolvedValue(categorySuggestion({ status: "accepted" }));
      renderPage();

      const row = (await screen.findByText("LANCHONETE EXEMPLO")).closest("tr")!;
      expect(within(row).getByText("Outros / Outros")).toBeInTheDocument();
      expect(within(row).getByTestId("suggestion-chip")).toHaveTextContent("Suggested: Conforto / Food · 87%");
      await userEvent.click(within(row).getByRole("button", { name: "Accept Conforto / Food" }));

      expect(suggestionsApi.acceptCategory).toHaveBeenCalledWith(500);
      expect(await screen.findByText("Suggestion accepted.")).toBeInTheDocument();
      expect(refreshSummary).toHaveBeenCalled();
    });

    it("opens the re-categorize dialog pre-filled to change a suggestion", async () => {
      renderPage();

      const row = (await screen.findByText("LANCHONETE EXEMPLO")).closest("tr")!;
      await userEvent.click(within(row).getByRole("button", { name: "Pick another subcategory" }));

      expect(screen.getByLabelText("Subcategory", { selector: "#recategorize-subcategory" })).toHaveValue("10");
    });

    it("offers bulk acceptance and the inbox when suggestions are pending", async () => {
      vi.mocked(suggestionsApi.bulkAccept).mockResolvedValue({ accepted_count: 3 });
      renderPage("/transactions", true, suggestionsSummary({ pending_category_count: 5 }));

      const bar = await screen.findByTestId("suggestions-bar");
      await screen.findByText("LANCHONETE EXEMPLO");
      expect(bar).toHaveTextContent("1 on this page · 5 transaction suggestions to review");
      expect(within(bar).getByRole("link", { name: "Review by merchant →" })).toHaveAttribute("href", "/suggestions?tab=transactions");
      await userEvent.click(within(bar).getByRole("button", { name: "Accept all ≥ 90%" }));

      expect(suggestionsApi.bulkAccept).toHaveBeenCalledWith({ min_confidence: 0.9 });
    });

    it("nudges to create a rule after a repeated manual fix", async () => {
      vi.mocked(transactionsApi.recategorize).mockResolvedValue({
        transaction: transaction(),
        keyword: null,
        updated_count: 0,
        rule_nudge: ruleSuggestion({ origin: "local", reason: "You moved 3 transactions from this merchant to Transporte / Uber by hand" }),
      });
      renderPage();

      const row = (await screen.findByText("LANCHONETE EXEMPLO")).closest("tr")!;
      await userEvent.click(within(row).getByRole("button", { name: "Re-categorize" }));
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(await screen.findByTestId("rule-nudge")).toHaveTextContent("Create a rule for this?");
    });
  });

  describe("can't remember", () => {
    it("answers a suggestion with 'no idea'", async () => {
      vi.mocked(transactionsApi.list).mockResolvedValue(transactionsPage([transaction({ pending_suggestion: categorySuggestion({ transaction: undefined }) })]));
      vi.mocked(suggestionsApi.dontKnow).mockResolvedValue(categorySuggestion({ status: "dismissed" }));
      renderPage();

      const row = (await screen.findByText("LANCHONETE EXEMPLO")).closest("tr")!;
      await userEvent.click(within(row).getByRole("button", { name: "No idea what this is" }));

      expect(suggestionsApi.dontKnow).toHaveBeenCalledWith(500);
      expect(await screen.findByText(/Marked as "can't remember"/)).toBeInTheDocument();
    });

    it("shows the mark with an undo, and filters by it", async () => {
      vi.mocked(transactionsApi.list).mockResolvedValue(transactionsPage([transaction({ unknown_marked: true })]));
      vi.mocked(transactionsApi.unmarkUnknown).mockResolvedValue(transaction());
      renderPage();

      const mark = await screen.findByTestId("unknown-mark");
      expect(mark).toHaveTextContent("Can't remember");
      await userEvent.click(within(mark).getByRole("button", { name: "Undo" }));
      expect(transactionsApi.unmarkUnknown).toHaveBeenCalledWith(1000);

      await userEvent.click(screen.getByLabelText("Only transactions I can't remember"));
      expect(screen.getByTestId("location")).toHaveTextContent("?unknown=true");
      await waitFor(() => expect(transactionsApi.list).toHaveBeenLastCalledWith({ unknown: "true", page: 1, per_page: 50 }));
    });
  });

  it("is shown in Portuguese, with day-first dates, when that is the language", async () => {
    render(
      inLocale(
        "pt-BR",
        <SuggestionsSummaryContext.Provider value={{ summary: suggestionsSummary({ pending_category_count: 0 }), refresh: refreshSummary }}>
          <MemoryRouter initialEntries={["/transactions"]}>
            <Transactions showTotals />
          </MemoryRouter>
        </SuggestionsSummaryContext.Provider>
      )
    );

    const row = (await screen.findByText("LANCHONETE EXEMPLO")).closest("tr")!;
    expect(within(row).getByText("02/03/2025")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Recategorizar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Transações" })).toBeInTheDocument();
    expect(screen.getByTestId("transactions-summary")).toHaveTextContent(/2 transações/);
  });

  describe("dates, sorting and statements", () => {
    it("filters by a date range and keeps it in the URL", async () => {
      renderPage();
      await screen.findByText("LANCHONETE EXEMPLO");

      await userEvent.selectOptions(screen.getByLabelText("Quick date range"), "03/2025");

      expect(screen.getByTestId("location")).toHaveTextContent("?from=2025-03-01&to=2025-03-31");
      await waitFor(() =>
        expect(transactionsApi.list).toHaveBeenLastCalledWith({ from: "2025-03-01", to: "2025-03-31", page: 1, per_page: 50 })
      );

      fireEvent.change(screen.getByLabelText("From"), { target: { value: "2025-03-10" } });
      expect(screen.getByTestId("location")).toHaveTextContent("?from=2025-03-10&to=2025-03-31");
      expect(screen.getByLabelText("Quick date range")).toHaveValue("custom");
    });

    it("drops an old month link once the range changes", async () => {
      renderPage("/transactions?month=2025-03");
      await screen.findByText("LANCHONETE EXEMPLO");

      expect(screen.getByLabelText("From")).toHaveValue("2025-03-01");
      await userEvent.selectOptions(screen.getByLabelText("Quick date range"), "All dates");

      expect(screen.getByTestId("location")).toHaveTextContent(/^$/);
    });

    it("sorts from the menu and from the column headers", async () => {
      renderPage();
      await screen.findByText("LANCHONETE EXEMPLO");

      expect(screen.getByRole("columnheader", { name: /Date/ })).toHaveAttribute("aria-sort", "descending");
      await userEvent.selectOptions(screen.getByLabelText("Sort by"), "amount_desc");
      expect(screen.getByTestId("location")).toHaveTextContent("?sort=amount_desc");
      await waitFor(() => expect(transactionsApi.list).toHaveBeenLastCalledWith({ sort: "amount_desc", page: 1, per_page: 50 }));
      expect(screen.getByRole("columnheader", { name: /Amount/ })).toHaveAttribute("aria-sort", "descending");

      await userEvent.click(screen.getByRole("button", { name: /^Amount/ }));
      expect(screen.getByTestId("location")).toHaveTextContent("?sort=amount_asc");

      await userEvent.click(screen.getByRole("button", { name: /^Name/ }));
      expect(screen.getByTestId("location")).toHaveTextContent("?sort=name_asc");

      // back to the default order: no sort in the URL
      await userEvent.click(screen.getByRole("button", { name: /^Date/ }));
      expect(screen.getByTestId("location")).toHaveTextContent(/^$/);
    });

    it("ignores an unknown sort in the URL", async () => {
      renderPage("/transactions?sort=bogus");

      await waitFor(() => expect(transactionsApi.list).toHaveBeenCalledWith({ page: 1, per_page: 50 }));
    });

    it("lists one statement's transactions from the statements panel, and clears it", async () => {
      vi.mocked(statementsApi.list).mockResolvedValue([
        { id: 7, filename: "fatura-07.csv", created_at: "2025-03-01", first_transaction_date: "2025-02-01", last_transaction_date: "2025-02-28", status: "processed", transactions_count: 2 },
      ]);
      renderPage("/transactions?statements=open&from=2025-01-01");
      await screen.findByText("LANCHONETE EXEMPLO");

      await userEvent.click(await screen.findByRole("button", { name: "Show the transactions of fatura-07.csv" }));

      expect(screen.getByTestId("location")).toHaveTextContent("?statements=open&monthly_statement_id=7");
      await waitFor(() => expect(transactionsApi.list).toHaveBeenLastCalledWith({ monthly_statement_id: "7", page: 1, per_page: 50 }));
      expect(screen.getByTestId("statement-filter")).toHaveTextContent("Statement: fatura-07.csv");

      await userEvent.click(screen.getByRole("button", { name: "Show every statement" }));
      expect(screen.getByTestId("location")).toHaveTextContent("?statements=open");
    });

    it("reloads statements and transactions after an import", async () => {
      vi.mocked(statementsApi.upload).mockResolvedValue({ statement: { id: 8 }, summary_lines: [] });
      renderPage("/transactions?statements=open");
      await screen.findByText("LANCHONETE EXEMPLO");
      const loads = vi.mocked(transactionsApi.list).mock.calls.length;

      await userEvent.upload(screen.getByLabelText("Statement file"), new File(["x"], "march.csv", { type: "text/csv" }));
      await userEvent.click(screen.getByRole("button", { name: "Import" }));

      await waitFor(() => expect(statementsApi.list).toHaveBeenCalledTimes(2));
      expect(vi.mocked(transactionsApi.list).mock.calls.length).toBeGreaterThan(loads);
    });

    it("clears every filter but keeps the sort", async () => {
      renderPage("/transactions?from=2025-03-01&category_id=1&q=uber&sort=name_asc");
      await screen.findByText("LANCHONETE EXEMPLO");

      await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));

      expect(screen.getByTestId("location")).toHaveTextContent("?sort=name_asc");
      expect(screen.getByLabelText("Search")).toHaveValue("");
    });
  });
});
