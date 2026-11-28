import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { marketApi } from "../../api";
import AssetPrices from "./AssetPrices";
import { assetValuation, valuationRow } from "../../test/fixtures";

vi.mock("../../api", async () => (await import("../../test/mockApi")).mockApiModule());

const renderPrices = (showTotals = true) =>
  render(
    <MemoryRouter>
      <AssetPrices showTotals={showTotals} refreshKey={0} />
    </MemoryRouter>
  );

describe("AssetPrices", () => {
  it("lists each asset at today's price next to its saved value", async () => {
    vi.mocked(marketApi.assets).mockResolvedValue(assetValuation());
    renderPrices();

    const btc = (await screen.findByRole("cell", { name: /^BTC/ })).closest("tr")!;
    expect(btc).toHaveTextContent(/R\$\s300\.000,00/);
    expect(btc).toHaveTextContent(/R\$\s100\.000,00/);
    expect(btc).toHaveTextContent(/R\$\s150\.000,00/);
    expect(within(btc).getByText("▲ +50.00%")).toBeInTheDocument();

    const ltn = screen.getByRole("cell", { name: /^LTN/ }).closest("tr")!;
    expect(ltn).toHaveTextContent("No market price (fixed income or manual)");
    expect(screen.getByText("Total of the 1 priced asset").closest("tr")).toHaveTextContent(/R\$\s150\.000,00/);
  });

  it("hides quantities and values when amounts are off, but keeps prices", async () => {
    vi.mocked(marketApi.assets).mockResolvedValue(assetValuation());
    renderPrices(false);

    const btc = (await screen.findByRole("cell", { name: /^BTC/ })).closest("tr")!;
    expect(btc).toHaveTextContent(/R\$\s300\.000,00/);
    expect(btc).not.toHaveTextContent(/R\$\s150\.000,00/);
    expect(btc).toHaveTextContent(/R\$\s•••/);
    expect(btc).toHaveTextContent("•••");
  });

  it("saves today's prices after confirming", async () => {
    vi.mocked(marketApi.assets).mockResolvedValue(assetValuation());
    vi.mocked(marketApi.applyAssetPrices).mockResolvedValue({
      ...assetValuation({ assets: [valuationRow({ saved_value: 150000, saved_unit_price: 300000 })] }),
      updated_count: 1,
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPrices();

    await userEvent.click(await screen.findByRole("button", { name: "Save today's prices (1)" }));

    expect(window.confirm).toHaveBeenCalledWith("Replace the saved price and value of 1 asset with today's?");
    expect(marketApi.applyAssetPrices).toHaveBeenCalledWith([1]);
    expect(await screen.findByText("Updated 1 asset.")).toBeInTheDocument();
  });

  it("saves nothing when the confirmation is cancelled", async () => {
    vi.mocked(marketApi.assets).mockResolvedValue(assetValuation());
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderPrices();

    await userEvent.click(await screen.findByRole("button", { name: "Save today's prices (1)" }));

    expect(marketApi.applyAssetPrices).not.toHaveBeenCalled();
  });

  it("points to Settings when B3 assets need a brapi token", async () => {
    vi.mocked(marketApi.assets).mockResolvedValue(
      assetValuation({ assets: [valuationRow({ id: 3, ticker: "WEGE3", status: "needs_token", unit_price: null, live_value: null })] })
    );
    renderPrices();

    expect(await screen.findByText(/need a free brapi.dev token/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add it in Settings" })).toHaveAttribute("href", "/settings");
    expect(screen.queryByRole("button", { name: /Save today's prices/ })).not.toBeInTheDocument();
  });

  it("shows an error when prices can't be looked up", async () => {
    vi.mocked(marketApi.assets).mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderPrices();

    expect(await screen.findByText("Could not look up your assets' prices.")).toBeInTheDocument();
  });

  it("says when there are no assets", async () => {
    vi.mocked(marketApi.assets).mockResolvedValue(assetValuation({ assets: [], totals: { priced_count: 0, saved_value: 0, live_value: 0 } }));
    renderPrices();

    expect(await screen.findByRole("link", { name: "Assets" })).toHaveAttribute("href", "/assets");
  });
});
