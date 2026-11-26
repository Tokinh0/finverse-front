import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assetsApi } from "../api";
import { asset } from "../test/fixtures";
import PortfolioDashboard from "./PortfolioDashboard";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());

describe("PortfolioDashboard", () => {
  beforeEach(() => {
    vi.mocked(assetsApi.dashboard).mockResolvedValue({
      assets: [asset(), asset({ id: 2, ticker: "BTC", asset_type: "criptomoedas", current_value: 500 })],
      asset_types: { reserva: "Reserva", criptomoedas: "Criptomoedas" },
      portfolioData: [
        { name: "reserva", value: 1500, percentage: "75.0%", color: "#0f0" },
        { name: "criptomoedas", value: 500, percentage: "25.0%", color: "#f90" },
      ],
    });
  });

  it("lists assets with type labels and hides values unless totals are shown", async () => {
    const { rerender } = render(<PortfolioDashboard showTotals={false} />);

    expect(await screen.findByText("CDB")).toBeInTheDocument();
    expect(screen.getAllByText("Criptomoedas").length).toBeGreaterThan(0);
    expect(screen.queryByText(/R\$\s?1\.500,00/)).not.toBeInTheDocument();

    rerender(<PortfolioDashboard showTotals />);
    expect(screen.getByText(/R\$\s?1\.500,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?2\.000,00/)).toBeInTheDocument(); // portfolio total
  });

  it("filters by asset type", async () => {
    render(<PortfolioDashboard showTotals={false} />);
    await screen.findByText("CDB");

    await userEvent.click(screen.getAllByText("Criptomoedas")[0]);

    expect(screen.queryByText("CDB")).not.toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
  });

  it("does not delete when the confirm dialog is dismissed", async () => {
    render(<PortfolioDashboard showTotals={false} />);
    await userEvent.click(await screen.findByRole("button", { name: "Excluir CDB" }));

    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByText("Confirmar Exclusão")).not.toBeInTheDocument());
    expect(assetsApi.remove).not.toHaveBeenCalled();
  });

  it("deletes an asset after confirming", async () => {
    vi.mocked(assetsApi.remove).mockResolvedValue(undefined);
    render(<PortfolioDashboard showTotals={false} />);
    await userEvent.click(await screen.findByRole("button", { name: "Excluir CDB" }));

    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Excluir" }));

    expect(assetsApi.remove).toHaveBeenCalledWith(1);
    await waitFor(() => expect(screen.queryByText("CDB")).not.toBeInTheDocument());
  });

  it("updates an edited asset in place", async () => {
    vi.mocked(assetsApi.update).mockResolvedValue(asset({ ticker: "CDB2" }));
    render(<PortfolioDashboard showTotals={false} />);
    await userEvent.click(await screen.findByRole("button", { name: "Editar CDB" }));

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(assetsApi.update).toHaveBeenCalledWith(1, expect.objectContaining({ ticker: "CDB", current_value: 1500 }));
    expect(await screen.findByText("CDB2")).toBeInTheDocument();
  });
});
