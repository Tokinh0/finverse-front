import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SuggestionsSummaryContext } from "../hooks/suggestionsSummary";
import { ProfileContext } from "../profile/context";
import { profile, suggestionRun, suggestionsSummary } from "../test/fixtures";
import AppNavbar from "./Navbar";
import { inLocale } from "../test/i18n";

describe("AppNavbar", () => {
  it("links to every page and toggles totals", async () => {
    const setShowTotals = vi.fn();
    render(
      <MemoryRouter initialEntries={["/categorization"]}>
        <AppNavbar showTotals={false} setShowTotals={setShowTotals} />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Categorization" })).toHaveClass("active");
    expect(screen.queryByRole("link", { name: "Keywords" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Statements" })).toHaveAttribute("href", "/statements");
    expect(screen.queryByRole("link", { name: "Goals" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Market" })).toHaveAttribute("href", "/market");

    await userEvent.click(screen.getByRole("checkbox"));
    expect(setShowTotals).toHaveBeenCalledWith(true);
  });

  it("shows how many suggestions wait for review and when they're being generated", () => {
    render(
      <SuggestionsSummaryContext.Provider
        value={{ summary: suggestionsSummary({ pending_count: 4, latest_run: suggestionRun({ status: "running" }) }), refresh: vi.fn() }}
      >
        <MemoryRouter>
          <AppNavbar showTotals={false} setShowTotals={vi.fn()} />
        </MemoryRouter>
      </SuggestionsSummaryContext.Provider>
    );

    expect(screen.getByRole("link", { name: /Suggestions 4 to review/ })).toHaveAttribute("href", "/suggestions");
    expect(screen.getByTitle("Generating suggestions")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
  });

  it("shows no badge when nothing is pending", () => {
    render(
      <MemoryRouter>
        <AppNavbar showTotals={false} setShowTotals={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.queryByTestId("suggestions-badge")).not.toBeInTheDocument();
  });

  it("is shown in Portuguese when that is the language", () => {
    render(
      inLocale(
        "pt-BR",
        <MemoryRouter>
          <AppNavbar showTotals={false} setShowTotals={vi.fn()} />
        </MemoryRouter>
      )
    );

    expect(screen.getByRole("link", { name: "Transações" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configurações" })).toHaveAttribute("href", "/settings");
  });

  it("shows the signed-in profile with a way to switch", async () => {
    const signOut = vi.fn(async () => {});
    render(
      <ProfileContext.Provider value={{ status: "signedIn", profile: profile({ name: "Blake" }), signIn: vi.fn(), signOut, setProfile: vi.fn() }}>
        <MemoryRouter>
          <AppNavbar showTotals={false} setShowTotals={vi.fn()} />
        </MemoryRouter>
      </ProfileContext.Provider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Profile: Blake" }));
    expect(screen.getByRole("link", { name: "Profile settings" })).toHaveAttribute("href", "/settings");

    await userEvent.click(screen.getByRole("button", { name: "Switch profile" }));
    expect(signOut).toHaveBeenCalled();
  });
});
