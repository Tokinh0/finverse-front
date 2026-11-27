import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { suggestionRun, suggestionsSummary } from "../../test/fixtures";
import type { SuggestionsSummary } from "../../types";
import RunStatus from "./RunStatus";

const renderStatus = (summary: SuggestionsSummary, onSuggestAgain = vi.fn()) =>
  render(
    <MemoryRouter>
      <RunStatus summary={summary} starting={false} onSuggestAgain={onSuggestAgain} />
    </MemoryRouter>
  );

describe("RunStatus", () => {
  it("summarizes the last run and runs again", async () => {
    const onSuggestAgain = vi.fn();
    renderStatus(suggestionsSummary(), onSuggestAgain);

    expect(screen.getByText(/2 from your history, 5 from Claude \(1 request\), 1 rule idea/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Suggest again" }));
    expect(onSuggestAgain).toHaveBeenCalled();
  });

  it("shows progress while running and disables running again", () => {
    renderStatus(suggestionsSummary({ latest_run: suggestionRun({ status: "running", finished_at: null }) }));

    expect(screen.getByTestId("run-active")).toHaveTextContent("Generating suggestions…");
    expect(screen.getByRole("button", { name: "Suggest again" })).toBeDisabled();
  });

  it("explains failures and a missing key", () => {
    renderStatus(
      suggestionsSummary({
        claude_configured: false,
        latest_run: suggestionRun({ status: "failed", error_message: "Your Claude API key was rejected. Update it in Settings." }),
      })
    );

    expect(screen.getByTestId("run-problem")).toHaveTextContent("Your Claude API key was rejected");
    expect(screen.getByRole("link", { name: "Add a Claude API key" })).toHaveAttribute("href", "/settings");
  });
});
