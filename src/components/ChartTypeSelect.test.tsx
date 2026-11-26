import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ChartTypeSelect from "./ChartTypeSelect";

describe("ChartTypeSelect", () => {
  it("reports the selected chart type", async () => {
    const onChange = vi.fn();
    render(<ChartTypeSelect id="chart" value="pie" onChange={onChange} />);

    await userEvent.selectOptions(screen.getByLabelText("Choose chart type:"), "bar");

    expect(onChange).toHaveBeenCalledWith("bar");
  });
});
