import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { categoriesApi, reportsApi, suggestionsApi } from "../api";
import { SuggestionsSummaryContext } from "../hooks/suggestionsSummary";
import { category, categorySuggestion, progressMonth, ruleSuggestion, subcategory, suggestionsSummary } from "../test/fixtures";
import Suggestions from "./Suggestions";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());

const refresh = vi.fn().mockResolvedValue(undefined);

const renderPage = (url = "/suggestions") =>
  render(
    <SuggestionsSummaryContext.Provider value={{ summary: suggestionsSummary(), refresh }}>
      <MemoryRouter initialEntries={[url]}>
        <Suggestions showTotals />
      </MemoryRouter>
    </SuggestionsSummaryContext.Provider>
  );

describe("Suggestions", () => {
  beforeEach(() => {
    vi.mocked(suggestionsApi.categories).mockResolvedValue([categorySuggestion()]);
    vi.mocked(suggestionsApi.rules).mockResolvedValue([ruleSuggestion()]);
    vi.mocked(reportsApi.categorizationProgress).mockResolvedValue([progressMonth("2025-03", { keyword: 8, uncategorized: 2 })]);
    vi.mocked(categoriesApi.list).mockResolvedValue([category({ subcategories: [subcategory({ id: 20, name: "Uber" })] })]);
  });

  it("shows progress, the last run and rule suggestions first", async () => {
    renderPage();

    expect(await screen.findByText("80% of Mar 25's transactions were categorized by your rules")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rules (1)" })).toHaveClass("active");
    expect(screen.getByTestId("rule-suggestion")).toHaveTextContent("UBER TRIP");
  });

  it("accepts a rule and reloads everything", async () => {
    vi.mocked(suggestionsApi.acceptRule).mockResolvedValue({ suggestion: ruleSuggestion(), keyword: null, updated_count: 2 });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Accept (moves 2)" }));

    expect(suggestionsApi.acceptRule).toHaveBeenCalledWith(800, { reapply: "uncategorized" });
    expect(await screen.findByText("Rule saved. 2 transactions moved.")).toBeInTheDocument();
    expect(suggestionsApi.rules).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalled();
  });

  it("reviews transaction suggestions by merchant", async () => {
    vi.mocked(suggestionsApi.bulkAccept).mockResolvedValue({ accepted_count: 1 });
    renderPage("/suggestions?tab=transactions");

    const group = await screen.findByTestId("merchant-group");
    await userEvent.click(within(group).getByRole("button", { name: "Accept" }));

    expect(suggestionsApi.bulkAccept).toHaveBeenCalledWith({ merchant_key: "LANCHONETE_EXEMPLO" });
    expect(await screen.findByText("1 transaction categorized.")).toBeInTheDocument();
  });

  it("rejects every suggestion of a merchant", async () => {
    vi.mocked(suggestionsApi.rejectCategory).mockResolvedValue(categorySuggestion({ status: "rejected" }));
    renderPage("/suggestions?tab=transactions");

    await userEvent.click(within(await screen.findByTestId("merchant-group")).getByRole("button", { name: "Reject" }));

    expect(suggestionsApi.rejectCategory).toHaveBeenCalledWith(500);
  });

  it("starts a new run and reports errors", async () => {
    vi.mocked(suggestionsApi.startRun).mockRejectedValue(new Error("busy"));
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Suggest again" }));

    expect(await screen.findByText("That didn't work. Try again.")).toBeInTheDocument();
  });

  it("switches tabs through the URL", async () => {
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Transactions (1)" }));

    expect(screen.getByTestId("merchant-group")).toBeInTheDocument();
  });

  it("opens the page guide", async () => {
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "How this page works" }));

    expect(screen.getByRole("dialog", { name: "How the Suggestions page works" })).toBeInTheDocument();
  });
});
