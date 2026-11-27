import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { RULES_STEPS, TRANSACTIONS_STEPS } from "../../utils/suggestionsGuide";
import SuggestionsGuideModal from "./SuggestionsGuideModal";

const renderGuide = () =>
  render(
    <MemoryRouter>
      <SuggestionsGuideModal show onHide={vi.fn()} />
    </MemoryRouter>
  );

describe("SuggestionsGuideModal", () => {
  it("explains every part of the page with numbered steps on example data", async () => {
    renderGuide();

    const dialog = screen.getByRole("dialog", { name: "How the Suggestions page works" });
    expect(dialog).toHaveTextContent("made-up data");
    const steps = within(dialog).getAllByRole("listitem").filter((li) => li.closest("ol"));
    expect(steps.map((li) => li.querySelector(".fw-semibold")?.textContent)).toEqual(RULES_STEPS.map((s) => s.title));
    // one marker per step whose target exists in the example
    expect(within(dialog).getAllByTestId("guide-marker")).toHaveLength(RULES_STEPS.length);

    await userEvent.click(within(dialog).getByRole("button", { name: "Transaction suggestions" }));
    expect(within(dialog).getAllByTestId("guide-marker")).toHaveLength(TRANSACTIONS_STEPS.length);
    expect(dialog).toHaveTextContent("PADARIA EXEMPLO");
  });

  it("every step points at something in the example", async () => {
    renderGuide();
    const dialog = screen.getByRole("dialog");

    RULES_STEPS.forEach((step) => expect(dialog.querySelector(`[data-guide="${step.target}"]`)).not.toBeNull());
    await userEvent.click(within(dialog).getByRole("button", { name: "Transaction suggestions" }));
    TRANSACTIONS_STEPS.forEach((step) => expect(dialog.querySelector(`[data-guide="${step.target}"]`)).not.toBeNull());
  });
});
