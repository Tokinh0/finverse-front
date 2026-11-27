import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { category, categorySuggestion, subcategory, transaction } from "../../test/fixtures";
import CategorySuggestionGroups from "./CategorySuggestionGroups";

const suggestions = [
  categorySuggestion({ id: 1, confidence: 0.95, transaction: transaction({ id: 1, amount: 10 }) }),
  categorySuggestion({ id: 2, confidence: 0.95, transaction: transaction({ id: 2, amount: 15 }) }),
  categorySuggestion({ id: 3, confidence: 0.6, merchant_key: "MERCADO", origin: "history", transaction: transaction({ id: 3, name: "MERCADO LUA" }) }),
];

const renderGroups = (showTotals = true) => {
  const handlers = {
    acceptAll: vi.fn().mockResolvedValue(undefined),
    acceptMerchant: vi.fn().mockResolvedValue(undefined),
    acceptAs: vi.fn().mockResolvedValue(undefined),
    reject: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <CategorySuggestionGroups
      suggestions={suggestions}
      categories={[category({ subcategories: [subcategory({ id: 10, name: "Food" }), subcategory({ id: 11, name: "Casa" })] })]}
      showTotals={showTotals}
      {...handlers}
    />
  );
  return handlers;
};

describe("CategorySuggestionGroups", () => {
  it("shows one card per merchant with its total, source and reason", () => {
    renderGroups();

    const [first, second] = screen.getAllByTestId("merchant-group");
    expect(first).toHaveTextContent("LANCHONETE EXEMPLO");
    expect(first).toHaveTextContent(/2 transactions · R\$\s?25,00/);
    expect(first).toHaveTextContent("Claude");
    expect(second).toHaveTextContent("Your history");
  });

  it("bulk accepts above a confidence", async () => {
    const { acceptAll } = renderGroups();

    await userEvent.selectOptions(screen.getByLabelText("Minimum confidence"), "0.95");
    await userEvent.click(within(screen.getByTestId("bulk-bar")).getByRole("button", { name: "Accept 2" }));

    expect(acceptAll).toHaveBeenCalledWith(0.95);
  });

  it("accepts, changes or rejects a whole merchant", async () => {
    const { acceptMerchant, acceptAs, reject } = renderGroups(false);
    const first = screen.getAllByTestId("merchant-group")[0];
    expect(first).not.toHaveTextContent("R$");

    await userEvent.click(within(first).getByRole("button", { name: "Accept all 2" }));
    expect(acceptMerchant).toHaveBeenCalledWith("LANCHONETE_EXEMPLO");

    await userEvent.click(within(first).getByRole("button", { name: "Change…" }));
    await userEvent.selectOptions(within(first).getByLabelText("Move to"), "11");
    await userEvent.click(within(first).getByRole("button", { name: "Move 2" }));
    expect(acceptAs).toHaveBeenCalledWith(suggestions.slice(0, 2), 11);

    await userEvent.click(within(screen.getAllByTestId("merchant-group")[1]).getByRole("button", { name: "Reject" }));
    expect(reject).toHaveBeenCalledWith([suggestions[2]]);
  });

  it("says when there is nothing to review", () => {
    render(<CategorySuggestionGroups suggestions={[]} categories={[]} showTotals acceptAll={vi.fn()} acceptMerchant={vi.fn()} acceptAs={vi.fn()} reject={vi.fn()} />);

    expect(screen.getByText("No transaction suggestions to review.")).toBeInTheDocument();
  });
});
