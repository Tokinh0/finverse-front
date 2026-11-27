import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import SubcategoryChart from "./SubcategoryChart";

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

describe("SubcategoryChart", () => {
  it("shows an empty state", () => {
    render(<SubcategoryChart data={[]} showTotals />);
    expect(screen.getByText("No data to display.")).toBeInTheDocument();
  });

  it("switches between chart types and keeps the legend", async () => {
    const { container } = render(<SubcategoryChart data={[food]} showTotals={false} />);
    expect(container.querySelector(".recharts-pie")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Choose chart type:"), "bar");
    expect(container.querySelector(".recharts-bar")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Choose chart type:"), "line");
    expect(container.querySelector(".recharts-line")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "See the transactions of FOOD" })).toBeInTheDocument();
  });

  it("lists subcategories biggest first with share and amount", () => {
    render(<SubcategoryChart data={[fuel, food]} showTotals />);

    const rows = screen.getAllByRole("button", { name: /See the transactions of/ });
    expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual(["See the transactions of FOOD", "See the transactions of FUEL"]);
    expect(rows[0]).toHaveTextContent("82.0%");
    expect(rows[0]).toHaveTextContent("R$ 410,00");
  });

  it("hides amounts in the legend when totals are hidden", () => {
    render(<SubcategoryChart data={[food]} showTotals={false} />);
    expect(screen.getByRole("button", { name: "See the transactions of FOOD" })).toHaveTextContent("R$ •••");
    expect(screen.queryByText(/410/)).not.toBeInTheDocument();
  });

  it("opens the details modal from the legend, in any chart type", async () => {
    render(<SubcategoryChart data={[food, fuel]} showTotals context="Money out · January 2025" />);
    await userEvent.selectOptions(screen.getByLabelText("Choose chart type:"), "bar");

    await userEvent.click(screen.getByRole("button", { name: "See the transactions of FOOD" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "FOOD" })).toBeInTheDocument();
    expect(within(dialog).getByText("Money out · January 2025")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("row")).toHaveLength(3); // header + 2 transactions
  });
});
