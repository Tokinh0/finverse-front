import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { marketApi } from "../api";
import Market from "./Market";
import { assetValuation, marketOverview } from "../test/fixtures";
import { inLocale } from "../test/i18n";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());
vi.mock("../components/market/TradingViewMarketQuotes", () => ({ default: () => <div data-testid="global-quotes" /> }));

const renderMarket = () =>
  render(
    <MemoryRouter>
      <Market showTotals />
    </MemoryRouter>
  );

const chartSymbol = (container: HTMLElement) =>
  JSON.parse(container.querySelector(".tradingview-widget-container script")!.innerHTML).symbol;

describe("Market", () => {
  it("shows the indicators by group, the chart, world markets and the assets", async () => {
    vi.mocked(marketApi.overview).mockResolvedValue(marketOverview());
    vi.mocked(marketApi.assets).mockResolvedValue(assetValuation());
    const { container } = renderMarket();

    expect(screen.getByRole("heading", { name: "Market", level: 1 })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Currencies" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Crypto" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Brazil" })).toBeInTheDocument();
    expect(screen.getByTestId("quote-usd")).toHaveTextContent(/R\$\s5,5582/);
    expect(screen.getByTestId("quote-selic")).toHaveTextContent("13.75%");
    expect(screen.getByTestId("global-quotes")).toBeInTheDocument();
    expect(chartSymbol(container)).toBe("BITSTAMP:BTCUSD");
    expect(await screen.findByText("Total of the 1 priced asset")).toBeInTheDocument();
  });

  it("switches the chart to the chosen indicator", async () => {
    vi.mocked(marketApi.overview).mockResolvedValue(marketOverview());
    const { container } = renderMarket();

    await userEvent.click(await screen.findByRole("button", { name: "Show US dollar chart" }));

    expect(chartSymbol(container)).toBe("FX_IDC:USDBRL");
    expect(screen.getByRole("button", { name: "Show US dollar chart" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Show Bitcoin chart" })).toHaveAttribute("aria-pressed", "false");
  });

  it("refreshes the indicators and the asset prices", async () => {
    vi.mocked(marketApi.overview).mockResolvedValue(marketOverview());
    vi.mocked(marketApi.assets).mockResolvedValue(assetValuation());
    renderMarket();
    await screen.findByText("Total of the 1 priced asset");

    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(marketApi.overview).toHaveBeenCalledTimes(2);
    expect(marketApi.assets).toHaveBeenCalledTimes(2);
  });

  it("shows an error when the market data can't be loaded", async () => {
    vi.mocked(marketApi.overview).mockRejectedValue(new Error("down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderMarket();

    expect(await screen.findByText("Could not load the market data.")).toBeInTheDocument();
  });

  it("is shown in Portuguese", async () => {
    vi.mocked(marketApi.overview).mockResolvedValue(marketOverview());
    render(inLocale("pt-BR", <MemoryRouter><Market showTotals={false} /></MemoryRouter>));

    expect(screen.getByRole("heading", { name: "Mercado", level: 1 })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Moedas" })).toBeInTheDocument();
  });
});
