import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reportsApi } from "../../api";
import { healthReport } from "../../test/healthFixture";
import FinancialHealth from "./FinancialHealth";

vi.mock("../../api", async () => (await import("../../test/mockApi")).mockApiModule());

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname + location.search}</span>;
}

const renderPage = (url = "/reports/financial-health", showTotals = true) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="*" element={<><FinancialHealth showTotals={showTotals} /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>
  );

describe("FinancialHealth", () => {
  beforeEach(() => {
    vi.mocked(reportsApi.financialHealth).mockResolvedValue(healthReport());
  });

  it("shows the summary with the savings rate and changes vs the previous period", async () => {
    renderPage();

    const summary = await screen.findByRole("region", { name: "Summary" });
    expect(within(summary).getByText("75%")).toBeInTheDocument();
    expect(within(summary).getByText(/R\$\s?2\.000,00/)).toBeInTheDocument();
    // income up is good, spending up is bad: arrow + text, not color alone
    expect(within(summary).getByLabelText("up 100%")).toHaveStyle({ color: "rgb(0, 108, 16)" });
    expect(within(summary).getByLabelText("up 400%")).toHaveStyle({ color: "rgb(180, 35, 36)" });
    expect(within(summary).getAllByText("vs Apr–Jun 25").length).toBeGreaterThan(0);
  });

  it("ranks categories and nudges to review uncategorized spending", async () => {
    renderPage();

    const section = await screen.findByRole("region", { name: "Where the money went" });
    const rows = within(section).getAllByTestId("category-row");
    expect(rows.map((r) => r.textContent)).toEqual([expect.stringContaining("Outros"), expect.stringContaining("Conforto")]);
    expect(within(rows[1]).getByText("New")).toBeInTheDocument();
    expect(within(rows[1]).getByText(/Food R\$\s?150,00 · Uber/)).toBeInTheDocument();
    expect(within(section).getByRole("img")).toHaveAccessibleName("Share of spending: Outros 60%, Conforto 40%");
    expect(within(section).getByRole("link", { name: "Review those transactions" })).toHaveAttribute("href", "/transactions?category_id=2");
  });

  it("keeps one color per category everywhere, assigned by id", async () => {
    renderPage();

    const section = await screen.findByRole("region", { name: "Where the money went" });
    const [outros, conforto] = within(section).getAllByTestId("category-row").map((r) => r.querySelector(".health-swatch") as HTMLElement);
    expect(conforto).toHaveStyle({ background: "#257de0" }); // id 1 -> slot 1
    expect(outros).toHaveStyle({ background: "#f47230" }); // id 2 -> slot 2
  });

  it("renders the trend chart and its table", async () => {
    const { container } = renderPage();

    const trends = await screen.findByRole("region", { name: "Category trends" });
    expect(container.querySelectorAll(".recharts-bar").length).toBe(2);
    const conforto = within(trends).getByRole("row", { name: /Conforto/ });
    expect(conforto).toHaveTextContent(/R\$\s?200,00/);
    expect(within(conforto).getByLabelText("up 100%")).toBeInTheDocument();
    expect(within(trends).getByRole("row", { name: /All spending/ })).toHaveTextContent(/R\$\s?500,00/);
  });

  it("summarizes the year against the same months of last year", async () => {
    renderPage();

    const year = await screen.findByRole("region", { name: "2025 summary" });
    expect(within(year).getAllByText("vs Jan–Sep 2024").length).toBe(2);
    expect(within(year).getByText("Best month").closest(".health-tile")).toHaveTextContent("Sep");
    expect(within(year).getByText("Worst month").closest(".health-tile")).toHaveTextContent("Aug");
    expect(within(year).getByRole("row", { name: /IFOOD 123/ })).toHaveTextContent(/2\s*R\$\s?300,00/);
    expect(within(year).getByText("2025 spending")).toBeInTheDocument();
  });

  it("hides amounts but keeps ratios when totals are off", async () => {
    renderPage(undefined, false);

    const summary = await screen.findByRole("region", { name: "Summary" });
    expect(screen.queryByText(/R\$\s?2\.000,00/)).not.toBeInTheDocument();
    expect(screen.getAllByText("R$ •••").length).toBeGreaterThan(5);
    expect(within(summary).getByText("75%")).toBeInTheDocument();
  });

  it("drives period, month and year through the URL", async () => {
    renderPage();
    await screen.findByRole("region", { name: "Summary" });

    await userEvent.click(screen.getByRole("button", { name: "12 months" }));
    expect(screen.getByTestId("location")).toHaveTextContent("?period=12");
    await waitFor(() => expect(reportsApi.financialHealth).toHaveBeenLastCalledWith({ period: 12, as_of: undefined, year: undefined }));

    await userEvent.selectOptions(screen.getByLabelText("Ending month"), "2025-08");
    await userEvent.selectOptions(screen.getByLabelText("Year"), "2024");
    await waitFor(() => expect(reportsApi.financialHealth).toHaveBeenLastCalledWith({ period: 12, as_of: "2025-08", year: 2024 }));
  });

  it("explains an empty database", async () => {
    vi.mocked(reportsApi.financialHealth).mockResolvedValue({ as_of: null, period_months: 3, months_available: [], years_available: [] });
    renderPage();

    expect(await screen.findByText("No transactions yet. Upload a statement to see your report.")).toBeInTheDocument();
  });
});
