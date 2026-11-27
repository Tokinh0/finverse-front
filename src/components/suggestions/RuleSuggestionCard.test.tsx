import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { category, ruleSuggestion, subcategory } from "../../test/fixtures";
import type { RuleSuggestion } from "../../types";
import RuleSuggestionCard from "./RuleSuggestionCard";

const categories = [category({ subcategories: [subcategory({ id: 10, name: "Food" }), subcategory({ id: 20, name: "Uber" })] })];

const renderCard = (suggestion: RuleSuggestion = ruleSuggestion(), showTotals = true) => {
  const onAccept = vi.fn().mockResolvedValue(undefined);
  const onReject = vi.fn().mockResolvedValue(undefined);
  render(<RuleSuggestionCard suggestion={suggestion} categories={categories} showTotals={showTotals} onAccept={onAccept} onReject={onReject} />);
  return { onAccept, onReject };
};

describe("RuleSuggestionCard", () => {
  it("shows the rule, reason, confidence and impact", () => {
    renderCard();

    const card = screen.getByTestId("rule-suggestion");
    expect(card).toHaveTextContent("New rule");
    expect(card).toHaveTextContent("Descriptions containing UBER TRIP → Transporte / Uber");
    expect(card).toHaveTextContent("93%");
    expect(card).toHaveTextContent("Matches 12 transactions you put in Transport");
    expect(screen.getByTestId("rule-impact")).toHaveTextContent(
      "Matches 4 transactions: 2 uncategorized, 1 from other rules, 1 you categorized yourself (kept as they are)."
    );
  });

  it("previews the affected transactions, marking the ones it keeps", async () => {
    renderCard(ruleSuggestion(), false);

    await userEvent.click(screen.getByRole("button", { name: "Show affected transactions" }));
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("02/03/2025UBER TRIP SPOutros / OutrosTransporte / Uber");
    expect(rows[2]).toHaveTextContent("Kept (your choice)");
    expect(screen.queryByText(/25,50/)).not.toBeInTheDocument();
  });

  it("accepts with the chosen re-apply scope", async () => {
    const { onAccept } = renderCard();

    expect(screen.getByRole("button", { name: "Accept (moves 2)" })).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Also transactions other rules matched"));
    await userEvent.click(screen.getByRole("button", { name: "Accept (moves 3)" }));

    expect(onAccept).toHaveBeenCalledWith({ reapply: "all" });
  });

  it("edits the rule before accepting", async () => {
    const { onAccept } = renderCard();

    await userEvent.click(screen.getByRole("button", { name: "Edit & accept" }));
    await userEvent.clear(screen.getByLabelText("Keyword"));
    await userEvent.type(screen.getByLabelText("Keyword"), "UBER");
    await userEvent.selectOptions(screen.getByLabelText("Rule subcategory"), "10");
    await userEvent.click(screen.getByRole("button", { name: "Save & accept" }));

    expect(onAccept).toHaveBeenCalledWith({ name: "UBER", subcategory_id: 10, reapply: "uncategorized" });
  });

  it("describes removals without re-apply options, and rejects", async () => {
    const { onReject } = renderCard(
      ruleSuggestion({ action: "delete", proposed: null, keyword: { id: 3, name: "PIX", subcategory: { id: 10, name: "Food", category: "Conforto" } } })
    );

    expect(screen.getByTestId("rule-suggestion")).toHaveTextContent("Remove PIX (Conforto / Food)");
    expect(screen.queryByText("Apply to:")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(onReject).toHaveBeenCalled();
  });
});
