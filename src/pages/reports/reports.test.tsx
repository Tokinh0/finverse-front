import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reportsApi } from "../../api";
import MonthlyByCategory from "./MonthlyByCategory";
import MonthlyBySubcategory from "./MonthlyBySubcategory";

vi.mock("../../api", async () => (await import("../../test/mockApi")).mockApiModule());

const month = (overrides = {}) => ({
  subcategories: [{ name: "FOOD", total: 50, transactions: [] }],
  total: 50,
  total_invested: 0,
  total_transfered: 0,
  total_expended: 50,
  total_received: 0,
  ...overrides,
});

describe("MonthlyByCategory", () => {
  it("renders a card per month with credit and debit charts", async () => {
    vi.mocked(reportsApi.monthlyByCategory).mockResolvedValue({
      credit: {},
      debit: { "2025-01": { CONFORTO: { color_code: "#f00", subcategories: { FOOD: { total: 10, transactions: [] } } } } },
    });

    render(<MonthlyByCategory />);

    expect(await screen.findByRole("heading", { name: "2025-01" })).toBeInTheDocument();
    expect(screen.getByText("No data to display.")).toBeInTheDocument(); // no credits that month
  });

  it("shows an error when the report fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(reportsApi.monthlyByCategory).mockRejectedValue(new Error("x"));

    render(<MonthlyByCategory />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load the report");
  });
});

describe("MonthlyBySubcategory", () => {
  beforeEach(() => {
    vi.mocked(reportsApi.monthlyBySubcategory).mockResolvedValue({
      credit: { "2025-02": month({ total: 1000, total_received: 1000, total_expended: 0 }) },
      debit: { "2025-02": month(), "2025-01": month() },
    });
  });

  it("orders months newest first and hides totals by default", async () => {
    render(<MonthlyBySubcategory showTotals={false} />);

    const headings = await screen.findAllByRole("heading", { level: 4 });
    expect(headings.map((h) => h.textContent)).toEqual(["2025-02", "2025-01"]);
    expect(screen.queryByText(/Total:/)).not.toBeInTheDocument();
  });

  it("shows only the non-zero totals when enabled", async () => {
    render(<MonthlyBySubcategory showTotals />);

    expect(await screen.findByText("Total Received: R$ 1000.00")).toBeInTheDocument();
    expect(screen.getAllByText("Total Expended: R$ 50.00")).toHaveLength(2);
    expect(screen.queryByText(/Total Invested/)).not.toBeInTheDocument();
  });

  it("keeps the chart type per chart", async () => {
    render(<MonthlyBySubcategory showTotals={false} />);
    const [first, second] = await screen.findAllByLabelText("Choose chart type:");

    await userEvent.selectOptions(first, "bar");

    expect(first).toHaveValue("bar");
    expect(second).toHaveValue("pie");
  });
});
