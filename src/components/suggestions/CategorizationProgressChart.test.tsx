import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { progressMonth } from "../../test/fixtures";
import CategorizationProgressChart from "./CategorizationProgressChart";

const months = [progressMonth("2025-02", { keyword: 7, manual: 3 }), progressMonth("2025-03", { keyword: 82, ai_accepted: 9, manual: 6, uncategorized: 3 })];

describe("CategorizationProgressChart", () => {
  it("shows the headline, a legend, the stacked bars and a table", async () => {
    const { container } = render(<CategorizationProgressChart months={months} />);

    expect(screen.getByText("82% of Mar 25's transactions were categorized by your rules")).toBeInTheDocument();
    expect(screen.getByText(/↑ 12 points vs Feb 25/)).toBeInTheDocument();
    const legend = screen.getByLabelText("Legend");
    ["Your rules", "Manual", "Accepted suggestions", "Not categorized yet"].forEach((label) => expect(legend).toHaveTextContent(label));
    expect(container.querySelectorAll(".recharts-bar").length).toBe(4);

    await userEvent.click(screen.getByText("Show as a table"));
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows[2]).toHaveTextContent("Mar 2582 (82%)6 (6%)9 (9%)3 (3%)100");
  });

  it("renders nothing without data", () => {
    const { container } = render(<CategorizationProgressChart months={[progressMonth("2025-03")]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
