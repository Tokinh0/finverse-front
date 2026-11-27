import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { inLocale } from "../../test/i18n";
import { toCategorySlices, toSlices } from "../../utils/reportSlices";
import ReportDetailsModal from "./ReportDetailsModal";

const [slice] = toSlices([
  {
    name: "FOOD",
    total: 610,
    color_code: "#f00",
    transactions: [
      { name: "IFOOD", transaction_date: "20/01/2025", amount: 400 },
      { name: "UBER  EATS", transaction_date: "15/01/2025", amount: 10 },
      { name: "PADARIA_CENTRAL", transaction_date: "18/01/2025", amount: 200 },
    ],
  },
]);

const bodyRows = () => within(screen.getByRole("dialog")).getAllByRole("row").slice(1) as HTMLTableRowElement[];

describe("ReportDetailsModal", () => {
  it("renders nothing without a subcategory", () => {
    render(<ReportDetailsModal slice={null} context="" showTotals onHide={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the stats and the transactions oldest first", () => {
    render(<ReportDetailsModal slice={slice} context="Money out · January 2025" showTotals onHide={() => {}} />);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "FOOD" })).toBeInTheDocument();
    expect(within(dialog).getByText("R$ 610,00")).toBeInTheDocument();
    expect(within(dialog).getByText("100.0%")).toBeInTheDocument();
    expect(within(dialog).getByText("R$ 203,33")).toBeInTheDocument(); // average
    expect(bodyRows().map((row) => row.cells[0].textContent)).toEqual(["01/15/2025", "01/18/2025", "01/20/2025"]);
    expect(bodyRows()[1]).toHaveTextContent("PADARIA CENTRAL");
  });

  it("sorts by amount and flags the large ones", async () => {
    render(<ReportDetailsModal slice={slice} context="" showTotals onHide={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: "Amount" }));

    expect(screen.getByRole("button", { name: "Amount" })).toHaveAttribute("aria-pressed", "true");
    expect(bodyRows().map((row) => row.getAttribute("data-tier"))).toEqual(["high", "medium", "normal"]);
  });

  it("hides every amount when totals are hidden", () => {
    render(<ReportDetailsModal slice={slice} context="" showTotals={false} onHide={() => {}} />);

    expect(screen.queryByText(/610/)).not.toBeInTheDocument();
    expect(screen.queryByText(/400,00/)).not.toBeInTheDocument();
    expect(within(bodyRows()[0]).getByText("R$ •••")).toBeInTheDocument();
  });

  it("closes", async () => {
    const onHide = vi.fn();
    render(<ReportDetailsModal slice={slice} context="" showTotals onHide={onHide} />);

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onHide).toHaveBeenCalled();
  });

  it("speaks Portuguese", () => {
    render(inLocale("pt-BR", <ReportDetailsModal slice={slice} context="" showTotals onHide={() => {}} />));

    expect(screen.getByText("Participação")).toBeInTheDocument();
    expect(bodyRows()[0].cells[0]).toHaveTextContent("15/01/2025");
  });

  it("breaks a category down by subcategory and shows each transaction's subcategory", () => {
    const [category] = toCategorySlices({
      CONFORTO: {
        color_code: "#00f",
        subcategories: {
          UBER: { total: 25, transactions: [{ name: "UBER_TRIP", amount: "25.00" as unknown as number, transaction_date: "2025-01-09 00:00:00 UTC", transaction_type: "debit" }] },
          FOOD: { total: 75, transactions: [{ name: "IFOOD", amount: 75, transaction_date: "2025-01-02 00:00:00 UTC", transaction_type: "debit" }] },
        },
      },
    });
    render(<ReportDetailsModal slice={category} context="" showTotals onHide={() => {}} />);

    const parts = within(screen.getByRole("region", { name: "By subcategory" })).getAllByRole("listitem");
    expect(parts[0]).toHaveTextContent("FOOD75.0%R$ 75,00");
    expect(parts[1]).toHaveTextContent("UBER25.0%R$ 25,00");
    expect(screen.getByRole("columnheader", { name: "Subcategory" })).toBeInTheDocument();
    expect(bodyRows().map((row) => [row.cells[0].textContent, row.cells[2].textContent])).toEqual([
      ["01/02/2025", "FOOD"],
      ["01/09/2025", "UBER"],
    ]);
  });

  it("has no subcategory column for a subcategory", () => {
    render(<ReportDetailsModal slice={slice} context="" showTotals onHide={() => {}} />);
    expect(screen.queryByRole("columnheader", { name: "Subcategory" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "By subcategory" })).not.toBeInTheDocument();
  });
});
