import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { alertsApi, categoriesApi, transactionsApi } from "../api";
import { category, subcategory, transaction, transactionsPage } from "../test/fixtures";
import type { ChargeAlert } from "../types";
import ChargeAlerts from "./ChargeAlerts";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname + location.search}</span>;
}

const renderPage = (url = "/alerts", showTotals = true) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="*" element={<><ChargeAlerts showTotals={showTotals} /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>
  );

const duplicate: ChargeAlert = {
  kind: "duplicate",
  message: "Same merchant and amount as a charge on 10/07/2025",
  details: { related_transaction_id: 1 },
  dismissed: false,
  transaction: transaction({ id: 2, name: "NETFLIX", amount: 55.9 }),
};
const changed: ChargeAlert = {
  kind: "amount_changed",
  message: "Recurring charge changed from R$ 21,90 to R$ 23,90",
  details: { expected_amount: 21.9 },
  dismissed: false,
  transaction: transaction({ id: 3, name: "SPOTIFY", amount: 23.9 }),
};

describe("ChargeAlerts", () => {
  beforeEach(() => {
    vi.mocked(alertsApi.list).mockResolvedValue({ month: "2025-07", alerts: [duplicate, changed] });
    vi.mocked(transactionsApi.list).mockResolvedValue(transactionsPage([], { months: ["2025-07", "2025-06"] }));
    vi.mocked(categoriesApi.list).mockResolvedValue([category({ subcategories: [subcategory()] })]);
  });

  it("groups alerts by reason with counts", async () => {
    renderPage();

    const duplicates = await screen.findByRole("region", { name: "Possible duplicates" });
    expect(within(duplicates).getByText("NETFLIX")).toBeInTheDocument();
    expect(within(duplicates).getByText("1")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Recurring charge changed" })).toHaveTextContent("R$ 21,90 to R$ 23,90");
    expect(screen.queryByRole("region", { name: "Unusually large" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Month")).toHaveValue("2025-07");
  });

  it("hides amounts and amount-based details when totals are off", async () => {
    renderPage("/alerts", false);

    await screen.findByText("SPOTIFY");
    expect(screen.queryByText(/R\$ 21,90/)).not.toBeInTheDocument();
    expect(screen.getByText("Details hidden (amounts are off)")).toBeInTheDocument();
    expect(screen.getByText("Same merchant and amount as a charge on 10/07/2025")).toBeInTheDocument();
  });

  it("marks an alert as fine and removes it", async () => {
    vi.mocked(alertsApi.dismiss).mockResolvedValue(undefined);
    renderPage();

    const row = (await screen.findByText("NETFLIX")).closest(".list-group-item") as HTMLElement;
    await userEvent.click(within(row).getByRole("button", { name: "Looks fine" }));

    expect(alertsApi.dismiss).toHaveBeenCalledWith(2, "duplicate");
    await waitFor(() => expect(screen.queryByText("NETFLIX")).not.toBeInTheDocument());
  });

  it("shows reviewed alerts with an undo", async () => {
    vi.mocked(alertsApi.list).mockResolvedValue({ month: "2025-07", alerts: [{ ...duplicate, dismissed: true }] });
    vi.mocked(alertsApi.restore).mockResolvedValue(undefined);
    renderPage("/alerts?reviewed=1");

    await waitFor(() => expect(alertsApi.list).toHaveBeenCalledWith({ month: undefined, include_dismissed: true }));
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }));

    expect(alertsApi.restore).toHaveBeenCalledWith(2, "duplicate");
    expect(await screen.findByRole("button", { name: "Looks fine" })).toBeInTheDocument();
  });

  it("changes month through the URL and links to similar transactions", async () => {
    renderPage();
    await screen.findByText("NETFLIX");

    await userEvent.selectOptions(screen.getByLabelText("Month"), "2025-06");
    expect(screen.getByTestId("location")).toHaveTextContent("/alerts?month=2025-06");
    await waitFor(() => expect(alertsApi.list).toHaveBeenLastCalledWith({ month: "2025-06", include_dismissed: undefined }));

    await userEvent.click(screen.getAllByRole("link", { name: "Similar" })[0]);
    expect(screen.getByTestId("location")).toHaveTextContent("/transactions?q=NETFLIX");
  });

  it("re-categorizes from an alert and reloads", async () => {
    vi.mocked(transactionsApi.recategorize).mockResolvedValue({ transaction: transaction(), keyword: null, updated_count: 0 });
    renderPage();

    const row = (await screen.findByText("SPOTIFY")).closest(".list-group-item") as HTMLElement;
    await userEvent.click(within(row).getByRole("button", { name: "Re-categorize" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(transactionsApi.recategorize).toHaveBeenCalledWith(3, expect.objectContaining({ subcategory_id: 99 }));
    await waitFor(() => expect(alertsApi.list).toHaveBeenCalledTimes(2));
  });

  it("says when there is nothing to review", async () => {
    vi.mocked(alertsApi.list).mockResolvedValue({ month: "2025-07", alerts: [] });
    renderPage();

    expect(await screen.findByText("Nothing to review for 07/2025.")).toBeInTheDocument();
  });

  it("handles an empty database", async () => {
    vi.mocked(alertsApi.list).mockResolvedValue({ month: null, alerts: [] });
    renderPage();

    expect(await screen.findByText("No transactions yet. Upload a statement to get started.")).toBeInTheDocument();
  });
});
