import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { savingsReport } from "../../test/healthFixture";
import { inLocale } from "../../test/i18n";
import type { SavingsReport } from "../../types";
import SavingsOpportunities from "./SavingsOpportunities";

const renderSavings = (savings: SavingsReport = savingsReport(), showTotals = true) =>
  render(
    <MemoryRouter>
      <SavingsOpportunities savings={savings} showTotals={showTotals} />
    </MemoryRouter>
  );

const card = (title: string) => screen.getByRole("heading", { name: title, level: 3 }).closest("li")!;

describe("SavingsOpportunities", () => {
  it("sums what could be saved and compares spending with the usual level", () => {
    renderSavings();

    expect(screen.getByText("You could save about").parentElement).toHaveTextContent(/R\$\s?344,17\/month/);
    expect(screen.getByText(/R\$\s?4\.130,04 a year/)).toBeInTheDocument();
    expect(screen.getByText("Spending per month now").parentElement).toHaveTextContent(/↑ 33%.*usual R\$\s?1\.500,00/);
    expect(screen.getByText("Your lowest month").parentElement).toHaveTextContent("Oct 24");
  });

  it("explains a growing merchant with orders and ticket then and now, its history and where to look", () => {
    renderSavings();

    const ifood = card("IFOOD *RESTAURANTE");
    expect(ifood).toHaveTextContent("Growing");
    expect(ifood).toHaveTextContent("+313% vs usual");
    expect(ifood).toHaveTextContent("Conforto › Food · Since Sep 24");
    expect(ifood).toHaveTextContent(/R\$\s?330,00\/month now, R\$\s?80,00 before\. 6 charges a month \(was 2\), about R\$\s?55,00 each \(was R\$\s?40,00\)\./);
    expect(ifood).toHaveTextContent(/Save ~R\$\s?250,00\/month/);
    expect(within(ifood).getByRole("img", { name: "IFOOD *RESTAURANTE, last 12 months" })).toBeInTheDocument();
    expect(ifood.querySelectorAll("rect")).toHaveLength(12);
    expect(within(ifood).getByRole("link", { name: "See transactions →" })).toHaveAttribute("href", "/transactions?q=IFOOD%20*RESTAURANTE");
  });

  it("describes small purchases, a subcategory above usual and fees", () => {
    renderSavings();

    expect(card("CAFE DA ESQUINA")).toHaveTextContent(/8 charges a month at about R\$\s?15,00 each add up to R\$\s?120,00\/month/);
    const market = card("Mercado");
    expect(market).toHaveTextContent("Mostly at SUPERMERCADO A, MERCADINHO B.");
    expect(within(market).getByRole("link")).toHaveAttribute("href", "/transactions?subcategory_id=11");
    const fees = card("Bank fees and interest");
    expect(fees).toHaveTextContent("Avoidable");
    expect(fees).toHaveTextContent(/TARIFA PACOTE\s*R\$\s?30,00/);
  });

  it("lists subscriptions with price increases, outside the total", () => {
    renderSavings();

    const subs = screen.getByRole("region", { name: "Subscriptions and recurring charges" });
    expect(subs).toHaveTextContent(/R\$\s?66,80\/month, R\$\s?801,60 a year/);
    expect(within(subs).getByText("STREAMFLIX").closest("li")).toHaveTextContent(/Price up: R\$\s?39,90 → R\$\s?44,90/);
    expect(within(subs).getByText("MUSICA APP").closest("li")).not.toHaveTextContent("Price up");
  });

  it("hides amounts but keeps the growth when totals are off", () => {
    renderSavings(savingsReport(), false);

    expect(screen.queryByText(/R\$\s?\d/)).not.toBeInTheDocument();
    expect(card("IFOOD *RESTAURANTE")).toHaveTextContent("+313% vs usual");
  });

  it("says when nothing stands out, and when there's not enough history", () => {
    renderSavings(savingsReport({ opportunities: [], baseline_months: 1, subscriptions: { monthly: 0, yearly: 0, items: [] } }));

    expect(screen.getByText("Nothing stands out: your spending is at or below its usual level.")).toBeInTheDocument();
    expect(screen.getByText(/need at least 3 months of statements/)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Subscriptions and recurring charges" })).not.toBeInTheDocument();
  });

  it("speaks Portuguese, with counts in its number format", () => {
    render(inLocale("pt-BR", <MemoryRouter><SavingsOpportunities savings={savingsReport()} showTotals /></MemoryRouter>));

    expect(screen.getByText("Você poderia economizar cerca de")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tarifas bancárias e juros" }).closest("li")).toHaveTextContent("0,7 cobranças por mês");
  });
});
