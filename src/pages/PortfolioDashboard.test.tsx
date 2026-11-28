import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assetsApi } from "../api";
import { asset } from "../test/fixtures";
import { inLocale } from "../test/i18n";
import PortfolioDashboard from "./PortfolioDashboard";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());

const cdb = asset();
const btc = asset({ id: 2, ticker: "BTC", description: "Bitcoin", asset_type: "criptomoedas", current_value: 500, quantity: 0.032, rating: 9 });
const dashboard = (assets = [cdb, btc]) => ({
  assets,
  asset_types: { reserva: "Reserva", criptomoedas: "Criptomoedas" },
});

const renderPage = (showTotals = true, path = "/assets") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <PortfolioDashboard showTotals={showTotals} />
    </MemoryRouter>
  );

describe("PortfolioDashboard", () => {
  beforeEach(() => {
    vi.mocked(assetsApi.dashboard).mockResolvedValue(dashboard());
  });

  it("shows the totals, the allocation and every holding", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Assets" })).toBeInTheDocument();
    expect(screen.getByText("Total invested").nextSibling).toHaveTextContent(/R\$\s?2\.000,00/);
    expect(screen.getByText("Largest type").nextSibling).toHaveTextContent("Emergency reserve 75.0%");
    expect(screen.getByRole("button", { name: /Emergency reserve.*75\.0%/ })).toHaveTextContent(/R\$\s?1\.500,00/);
    const btcRow = screen.getByText("BTC").closest("tr")!;
    expect(btcRow).toHaveTextContent("Crypto");
    expect(btcRow).toHaveTextContent("0.032");
    expect(btcRow).toHaveTextContent("25.0%");
    expect(btcRow).toHaveTextContent("9/10");
  });

  it("hides amounts but keeps shares when totals are hidden", async () => {
    renderPage(false);

    await screen.findByText("CDB");
    expect(screen.queryByText(/R\$\s?1\.500,00/)).not.toBeInTheDocument();
    expect(screen.getByText("Total invested").nextSibling).toHaveTextContent("R$ •••");
    expect(screen.getByText("Amounts are hidden. Use the switch in the menu bar to show them.")).toBeInTheDocument();
    expect(screen.getByText("CDB").closest("tr")).toHaveTextContent("75.0%");
  });

  it("filters by type from the allocation or the pills, and searches", async () => {
    renderPage();
    await screen.findByText("CDB");

    await userEvent.click(screen.getByRole("button", { name: /Crypto.*25\.0%/ }));
    expect(screen.queryByText("CDB")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Crypto/, pressed: true })).toHaveLength(2); // allocation row and filter pill

    await userEvent.click(screen.getByRole("button", { name: /^All/ }));
    await userEvent.type(screen.getByRole("searchbox"), "bitc");
    expect(screen.queryByText("CDB")).not.toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();

    await userEvent.type(screen.getByRole("searchbox"), "zzz");
    await userEvent.click(screen.getByRole("button", { name: "Show all" }));
    expect(screen.getByText("CDB")).toBeInTheDocument();
  });

  it("starts filtered by the type in the URL", async () => {
    renderPage(true, "/assets?type=criptomoedas");
    expect(await screen.findByText("BTC")).toBeInTheDocument();
    expect(screen.queryByText("CDB")).not.toBeInTheDocument();
  });

  it("adds an asset and reloads the allocation", async () => {
    vi.mocked(assetsApi.create).mockResolvedValue(asset({ id: 3 }));
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "+ Add asset" }));

    const dialog = screen.getByRole("dialog", { name: "New asset" });
    await userEvent.selectOptions(within(dialog).getByLabelText("Asset type"), "reserva");
    await userEvent.type(within(dialog).getByLabelText("Description"), "Poupança");
    await userEvent.type(within(dialog).getByLabelText("Current value (total)"), "1.000,00");
    await userEvent.clear(within(dialog).getByLabelText("Quantity"));
    await userEvent.type(within(dialog).getByLabelText("Quantity"), "1");
    vi.mocked(assetsApi.dashboard).mockResolvedValue(dashboard([cdb, btc, asset({ id: 3, ticker: "POUP", current_value: 1000 })]));
    await userEvent.click(within(dialog).getByRole("button", { name: "Add asset" }));

    expect(assetsApi.create).toHaveBeenCalledWith(expect.objectContaining({ asset_type: "reserva", description: "Poupança", current_value: 1000, quantity: 1 }));
    expect(await screen.findByRole("status")).toHaveTextContent("Asset added.");
    expect(screen.getByText("POUP")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("edits an asset", async () => {
    vi.mocked(assetsApi.update).mockResolvedValue(cdb);
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Edit CDB" }));

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(assetsApi.update).toHaveBeenCalledWith(1, expect.objectContaining({ ticker: "CDB", current_value: 1500 }));
    expect(await screen.findByRole("status")).toHaveTextContent("Asset updated.");
  });

  it("deletes an asset after confirming, and not when cancelled", async () => {
    vi.mocked(assetsApi.remove).mockResolvedValue(undefined);
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Delete CDB" }));
    await userEvent.click(within(screen.getByRole("dialog", { name: "Delete CDB?" })).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(assetsApi.remove).not.toHaveBeenCalled();

    vi.mocked(assetsApi.dashboard).mockResolvedValue(dashboard([btc]));
    await userEvent.click(screen.getByRole("button", { name: "Delete CDB" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));

    expect(assetsApi.remove).toHaveBeenCalledWith(1);
    expect(await screen.findByRole("status")).toHaveTextContent("Asset deleted.");
    expect(screen.queryByText("CDB")).not.toBeInTheDocument();
  });

  it("invites to add the first asset", async () => {
    vi.mocked(assetsApi.dashboard).mockResolvedValue(dashboard([]));
    renderPage();
    expect(await screen.findByText("No assets yet. Add your first investment to see your allocation.")).toBeInTheDocument();
  });

  it("shows a retryable error when loading fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(assetsApi.dashboard).mockRejectedValueOnce(new Error("down"));
    renderPage();

    expect(await screen.findByText("Unable to load your assets.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("CDB")).toBeInTheDocument();
  });

  it("speaks Portuguese", async () => {
    render(
      inLocale(
        "pt-BR",
        <MemoryRouter>
          <PortfolioDashboard showTotals />
        </MemoryRouter>
      )
    );
    expect(await screen.findByRole("heading", { name: "Ativos" })).toBeInTheDocument();
    expect(screen.getByText("Total investido")).toBeInTheDocument();
  });
});
