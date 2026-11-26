import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import CategoryChart from "./CategoryChart";

const data = { CONFORTO: { color_code: "#f00", subcategories: { FOOD: { total: 30, transactions: [] } } } };

describe("CategoryChart", () => {
  it("shows an empty state", () => {
    render(<CategoryChart data={{}} />);
    expect(screen.getByText("No data to display.")).toBeInTheDocument();
  });

  it("switches between chart types without crashing", async () => {
    const { container } = render(<CategoryChart data={data} />);
    const select = screen.getByLabelText("Choose chart type:");

    expect(container.querySelector(".recharts-pie")).toBeInTheDocument();

    await userEvent.selectOptions(select, "bar");
    expect(container.querySelector(".recharts-bar")).toBeInTheDocument();

    await userEvent.selectOptions(select, "line");
    expect(container.querySelector(".recharts-line")).toBeInTheDocument();
  });
});
