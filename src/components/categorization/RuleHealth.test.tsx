import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { keywordHealth } from "../../test/fixtures";
import RuleHealth from "./RuleHealth";

describe("RuleHealth", () => {
  it("shows matches, flags with hints and a suggested fix", () => {
    render(
      <MemoryRouter>
        <RuleHealth health={keywordHealth({ matches: 3, overrides: 2, flags: ["overridden", "unused"], pending_suggestion_ids: [1] })} />
      </MemoryRouter>
    );

    expect(screen.getByText("3 matches")).toBeInTheDocument();
    expect(screen.getByText("Overridden 2×")).toHaveAttribute("title", "You often move transactions this rule matched to another subcategory.");
    expect(screen.getByText("Never matches")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Suggested fix →" })).toHaveAttribute("href", "/suggestions?tab=rules");
  });

  it("shows nothing without health", () => {
    const { container } = render(<RuleHealth />);
    expect(container).toBeEmptyDOMElement();
  });
});
