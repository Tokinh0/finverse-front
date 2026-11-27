import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import SubcategoryChart, { SubcategoryTooltip } from "./SubcategoryChart";

const entry = {
  name: "FOOD",
  total: 410,
  color_code: "#f00",
  transactions: [
    { name: "UBER  EATS", transaction_date: "15/01/2025", amount: 10 },
    { name: "IFOOD", transaction_date: "02/02/2025", amount: 400 },
  ],
};

describe("SubcategoryChart", () => {
  it("shows an empty state", () => {
    render(<SubcategoryChart data={[]} showTotals />);
    expect(screen.getByText("No data to display.")).toBeInTheDocument();
  });

  it("switches between chart types", async () => {
    render(<SubcategoryChart data={[entry]} showTotals={false} />);

    await userEvent.selectOptions(screen.getByLabelText("Choose chart type:"), "line");
    expect(screen.getByLabelText("Choose chart type:")).toHaveValue("line");
  });
});

describe("SubcategoryTooltip", () => {
  it("lists transactions oldest first with amounts when totals are shown", () => {
    render(<SubcategoryTooltip active showTotals payload={[{ payload: entry, percent: 0.5 }]} />);

    expect(screen.getByText("FOOD (50.0%)")).toBeInTheDocument();
    expect(screen.getByText("R$ 410.00 - Total")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("01/15/2025 - R$ 10.00 - UBER EATS"); // the API's dd/mm/yyyy, shown month-first in English
    expect(items[1]).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it("hides amounts when totals are hidden", () => {
    render(<SubcategoryTooltip active showTotals={false} payload={[{ payload: entry }]} />);

    expect(screen.queryByText(/Total/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("R$ - -");
  });

  it("renders nothing when inactive", () => {
    const { container } = render(<SubcategoryTooltip active={false} showTotals payload={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
