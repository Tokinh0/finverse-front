import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { suggestionsApi } from "../../api";
import { ruleSuggestion } from "../../test/fixtures";
import RuleNudge from "./RuleNudge";

vi.mock("../../api", async () => (await import("../../test/mockApi")).mockApiModule());

const nudge = ruleSuggestion({ id: 9, origin: "local", reason: "You moved 3 transactions from this merchant to Transporte / Uber by hand" });

describe("RuleNudge", () => {
  it("creates the pre-filled rule", async () => {
    vi.mocked(suggestionsApi.acceptRule).mockResolvedValue({ suggestion: nudge, keyword: null, updated_count: 2 });
    const onDone = vi.fn();
    render(<RuleNudge suggestion={nudge} onDone={onDone} />);

    expect(screen.getByTestId("rule-nudge")).toHaveTextContent("Create a rule for this? You moved 3 transactions");
    expect(screen.getByText("UBER TRIP")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Create rule" }));

    expect(suggestionsApi.acceptRule).toHaveBeenCalledWith(9, { reapply: "uncategorized" });
    expect(onDone).toHaveBeenCalledWith('Rule "UBER TRIP" created. 2 more transaction(s) moved.');
  });

  it("declines, remembering the answer", async () => {
    vi.mocked(suggestionsApi.rejectRule).mockResolvedValue({ suggestion: nudge, keyword: null, updated_count: 0 });
    const onDone = vi.fn();
    render(<RuleNudge suggestion={nudge} onDone={onDone} />);

    await userEvent.click(screen.getByRole("button", { name: "No thanks" }));

    expect(suggestionsApi.rejectRule).toHaveBeenCalledWith(9);
    expect(onDone).toHaveBeenCalledWith("OK, no rule for this one.");
  });

  it("shows an error and stays open when saving fails", async () => {
    vi.mocked(suggestionsApi.acceptRule).mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onDone = vi.fn();
    render(<RuleNudge suggestion={nudge} onDone={onDone} />);

    await userEvent.click(screen.getByRole("button", { name: "Create rule" }));

    expect(await screen.findByText("Could not save that. Try again.")).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
