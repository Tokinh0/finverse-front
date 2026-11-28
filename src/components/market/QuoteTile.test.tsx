import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import QuoteTile from "./QuoteTile";
import { inLocale } from "../../test/i18n";
import type { MarketQuote } from "../../types";

const btc: MarketQuote = {
  key: "btc", price: 330000, currency: "BRL", change_pct: -4.5, as_of: "2026-11-28T05:16:24Z",
  source: "CoinGecko", unit: "currency", price_usd: 60000,
};

const renderTile = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("QuoteTile", () => {
  it("shows the price, the change with an arrow and sign, the USD price and the source", () => {
    renderTile(<QuoteTile quote={btc} />);

    const tile = screen.getByTestId("quote-btc");
    expect(tile).toHaveTextContent("Bitcoin");
    expect(tile).toHaveTextContent(/R\$\s330\.000,00/);
    expect(screen.getByText("▼ −4.50%")).toHaveClass("text-danger");
    expect(tile).toHaveTextContent("24h");
    expect(tile).toHaveTextContent(/US\$\s60\.000,00\sin\sUS\sdollars/);
    expect(tile).toHaveTextContent("CoinGecko");
  });

  it("shows rates as a percentage a year, without a change", () => {
    renderTile(<QuoteTile quote={{ key: "selic", price: 13.75, unit: "percent", as_of: "2026-11-26", source: "Banco Central" }} />);

    expect(screen.getByTestId("quote-selic")).toHaveTextContent("13.75% a year");
    expect(screen.queryByText(/▲|▼/)).not.toBeInTheDocument();
  });

  it("shows the Ibovespa in points", () => {
    renderTile(<QuoteTile quote={{ key: "ibovespa", price: 128456, currency: "BRL", change_pct: 0.4, unit: "currency" }} />);

    expect(screen.getByTestId("quote-ibovespa")).toHaveTextContent("128,456 points");
    expect(screen.getByText("▲ +0.40%")).toHaveClass("text-success");
  });

  it("says when a quote is unavailable or needs a token", () => {
    renderTile(
      <>
        <QuoteTile quote={{ key: "eur", error: "unavailable" }} />
        <QuoteTile quote={{ key: "ibovespa", error: "needs_token" }} onShowChart={vi.fn()} />
      </>
    );

    expect(screen.getByTestId("quote-eur")).toHaveTextContent("Couldn't load right now.");
    expect(screen.getByRole("link", { name: "Add it in Settings" })).toHaveAttribute("href", "/settings");
    expect(screen.queryByRole("button", { name: /chart/ })).not.toBeInTheDocument();
  });

  it("shows its chart on request", async () => {
    const onShowChart = vi.fn();
    renderTile(<QuoteTile quote={btc} onShowChart={onShowChart} chartSelected={false} />);

    const button = screen.getByRole("button", { name: "Show Bitcoin chart" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);

    expect(onShowChart).toHaveBeenCalled();
  });

  it("is shown in Portuguese", () => {
    renderTile(inLocale("pt-BR", <QuoteTile quote={{ key: "usd", price: 5.5582, currency: "BRL", change_pct: 1, unit: "currency" }} />));

    expect(screen.getByTestId("quote-usd")).toHaveTextContent("Dólar");
    expect(screen.getByTestId("quote-usd")).toHaveTextContent(/R\$\s5,5582/);
    expect(screen.getByTestId("quote-usd")).toHaveTextContent("hoje");
  });
});
