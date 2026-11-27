import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { categorySuggestion } from "../../test/fixtures";
import SuggestionChip from "./SuggestionChip";

describe("SuggestionChip", () => {
  it("shows the suggestion as suggested, with accept / change / reject", async () => {
    const handlers = { onAccept: vi.fn(), onChange: vi.fn(), onReject: vi.fn() };
    render(<SuggestionChip suggestion={categorySuggestion()} {...handlers} />);

    expect(screen.getByTestId("suggestion-chip")).toHaveTextContent("Suggested: Conforto / Food · 87%");
    expect(screen.getByTitle("Suggested by Claude: Looks like a bakery")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Accept Conforto / Food" }));
    await userEvent.click(screen.getByRole("button", { name: "Pick another subcategory" }));
    await userEvent.click(screen.getByRole("button", { name: "Reject Conforto / Food" }));
    expect(handlers.onAccept).toHaveBeenCalledTimes(1);
    expect(handlers.onChange).toHaveBeenCalledTimes(1);
    expect(handlers.onReject).toHaveBeenCalledTimes(1);
  });

  it("disables its buttons while busy", () => {
    render(<SuggestionChip suggestion={categorySuggestion()} busy onAccept={vi.fn()} onChange={vi.fn()} onReject={vi.fn()} />);

    screen.getAllByRole("button").forEach((button) => expect(button).toBeDisabled());
  });
});
