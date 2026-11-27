import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AmountRangeFields from "./AmountRangeFields";

describe("AmountRangeFields", () => {
  it("edits the minimum and maximum", async () => {
    const onChange = vi.fn();
    render(<AmountRangeFields idPrefix="t" min="" max="80" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText("Minimum amount"), "5");

    expect(onChange).toHaveBeenLastCalledWith("5", "80");
    expect(screen.getByLabelText("Maximum amount")).toHaveValue("80");
    expect(screen.getByText(/AMAZON up to R\$ 99,99/)).toBeInTheDocument();
  });
});
