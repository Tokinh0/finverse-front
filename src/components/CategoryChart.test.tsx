import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import CategoryChart from "./CategoryChart";

const data = {
  CONFORTO: {
    color_code: "#f00",
    subcategories: {
      FOOD: { total: 30, transactions: [{ name: "IFOOD", amount: 30, transaction_date: "2025-01-05 00:00:00 UTC", transaction_type: "debit" }] },
    },
  },
  LAZER: { color_code: "#00f", subcategories: { CINEMA: { total: 10, transactions: [] } } },
};

describe("CategoryChart", () => {
  it("shows an empty state", () => {
    render(<CategoryChart data={{}} showTotals />);
    expect(screen.getByText("No data to display.")).toBeInTheDocument();
  });

  it("switches between chart types without crashing", async () => {
    const { container } = render(<CategoryChart data={data} showTotals />);
    const select = screen.getByLabelText("Choose chart type:");

    expect(container.querySelector(".recharts-pie")).toBeInTheDocument();

    await userEvent.selectOptions(select, "bar");
    expect(container.querySelector(".recharts-bar")).toBeInTheDocument();

    await userEvent.selectOptions(select, "line");
    expect(container.querySelector(".recharts-line")).toBeInTheDocument();
  });

  it("lists categories biggest first and counts them in the donut", () => {
    render(<CategoryChart data={data} showTotals />);

    const rows = screen.getAllByRole("button", { name: /See the transactions of/ });
    expect(rows[0]).toHaveTextContent("CONFORTO75.0%R$ 30,00");
    expect(rows[1]).toHaveTextContent("LAZER25.0%R$ 10,00");
    expect(screen.getByText("2 categories")).toBeInTheDocument();
  });

  it("opens a category's subcategories and transactions", async () => {
    render(<CategoryChart data={data} showTotals context="Money out · January 2025" />);

    await userEvent.click(screen.getByRole("button", { name: "See the transactions of CONFORTO" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "CONFORTO" })).toBeInTheDocument();
    expect(within(dialog).getByRole("region", { name: "By subcategory" })).toHaveTextContent("FOOD");
    expect(within(dialog).getByRole("cell", { name: "IFOOD" })).toBeInTheDocument();
  });

  it("hides amounts when totals are hidden", () => {
    render(<CategoryChart data={data} showTotals={false} />);
    expect(screen.queryByText(/R\$ \d/)).not.toBeInTheDocument();
  });
});
