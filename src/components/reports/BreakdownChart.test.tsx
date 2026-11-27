import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { toCategorySlices, toSlices } from "../../utils/reportSlices";
import { BreakdownTooltip } from "./BreakdownChart";

const food = {
  name: "FOOD",
  total: 410,
  color_code: "#f00",
  transactions: [
    { name: "UBER  EATS", transaction_date: "15/01/2025", amount: 10 },
    { name: "IFOOD", transaction_date: "02/02/2025", amount: 400 },
  ],
};
const fuel = { name: "FUEL", total: 90, color_code: null, transactions: [{ name: "POSTO_SHELL", transaction_date: "03/01/2025", amount: 90 }] };

describe("BreakdownTooltip", () => {
  const [slice] = toSlices([food, fuel]);

  it("previews the share, count and largest transactions", () => {
    render(<BreakdownTooltip active showTotals payload={[{ payload: slice }]} />);

    expect(screen.getByText("FOOD")).toBeInTheDocument();
    expect(screen.getByText("82.0% of the total")).toBeInTheDocument();
    expect(screen.getByText("2 transactions")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("IFOODR$ 400,00"); // largest first
    expect(items[1]).toHaveTextContent("UBER EATS");
    expect(screen.getByText("Click to see all transactions")).toBeInTheDocument();
  });

  it("hides amounts when totals are hidden", () => {
    render(<BreakdownTooltip active showTotals={false} payload={[{ payload: slice }]} />);

    expect(screen.queryByText("R$ 410,00")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("R$ •••");
  });

  it("renders nothing when inactive", () => {
    const { container } = render(<BreakdownTooltip active={false} showTotals payload={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("previews a category by its biggest subcategories", () => {
    const [category] = toCategorySlices({
      CONFORTO: {
        color_code: "#00f",
        subcategories: {
          UBER: { total: 20, transactions: [{ name: "UBER", amount: 20, transaction_date: "2025-01-02 00:00:00 UTC", transaction_type: "debit" }] },
          FOOD: { total: 80, transactions: [{ name: "IFOOD", amount: 80, transaction_date: "2025-01-03 00:00:00 UTC", transaction_type: "debit" }] },
        },
      },
    });
    render(<BreakdownTooltip active showTotals payload={[{ payload: category }]} />);

    expect(screen.getByText("By subcategory")).toBeInTheDocument();
    const [first, second] = screen.getAllByRole("listitem");
    expect(first).toHaveTextContent("FOODR$ 80,00");
    expect(second).toHaveTextContent("UBERR$ 20,00");
  });
});
