import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AppNavbar from "./Navbar";

describe("AppNavbar", () => {
  it("links to every page and toggles totals", async () => {
    const setShowTotals = vi.fn();
    render(
      <MemoryRouter initialEntries={["/keywords"]}>
        <AppNavbar showTotals={false} setShowTotals={setShowTotals} />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Keywords" })).toHaveClass("active");
    expect(screen.getByRole("link", { name: "Statements" })).toHaveAttribute("href", "/statements");
    expect(screen.queryByRole("link", { name: "Goals" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox"));
    expect(setShowTotals).toHaveBeenCalledWith(true);
  });
});
