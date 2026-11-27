import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { inLocale } from "../../test/i18n";
import { toSlices } from "../../utils/subcategoryReport";
import SubcategoryDetailsModal from "./SubcategoryDetailsModal";

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

describe("SubcategoryDetailsModal", () => {
  it("renders nothing without a subcategory", () => {
    render(<SubcategoryDetailsModal slice={null} context="" showTotals onHide={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the stats and the transactions oldest first", () => {
    render(<SubcategoryDetailsModal slice={slice} context="Money out · January 2025" showTotals onHide={() => {}} />);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "FOOD" })).toBeInTheDocument();
    expect(within(dialog).getByText("R$ 610,00")).toBeInTheDocument();
    expect(within(dialog).getByText("100.0%")).toBeInTheDocument();
    expect(within(dialog).getByText("R$ 203,33")).toBeInTheDocument(); // average
    expect(bodyRows().map((row) => row.cells[0].textContent)).toEqual(["01/15/2025", "01/18/2025", "01/20/2025"]);
    expect(bodyRows()[1]).toHaveTextContent("PADARIA CENTRAL");
  });

  it("sorts by amount and flags the large ones", async () => {
    render(<SubcategoryDetailsModal slice={slice} context="" showTotals onHide={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: "Amount" }));

    expect(screen.getByRole("button", { name: "Amount" })).toHaveAttribute("aria-pressed", "true");
    expect(bodyRows().map((row) => row.getAttribute("data-tier"))).toEqual(["high", "medium", "normal"]);
  });

  it("hides every amount when totals are hidden", () => {
    render(<SubcategoryDetailsModal slice={slice} context="" showTotals={false} onHide={() => {}} />);

    expect(screen.queryByText(/610/)).not.toBeInTheDocument();
    expect(screen.queryByText(/400,00/)).not.toBeInTheDocument();
    expect(within(bodyRows()[0]).getByText("R$ •••")).toBeInTheDocument();
  });

  it("closes", async () => {
    const onHide = vi.fn();
    render(<SubcategoryDetailsModal slice={slice} context="" showTotals onHide={onHide} />);

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onHide).toHaveBeenCalled();
  });

  it("speaks Portuguese", () => {
    render(inLocale("pt-BR", <SubcategoryDetailsModal slice={slice} context="" showTotals onHide={() => {}} />));

    expect(screen.getByText("Participação")).toBeInTheDocument();
    expect(bodyRows()[0].cells[0]).toHaveTextContent("15/01/2025");
  });
});
