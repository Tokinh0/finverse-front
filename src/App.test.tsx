import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { keywordsApi, profilesApi, sessionApi, subcategoriesApi } from "./api";
import App from "./App";
import { profile } from "./test/fixtures";

vi.mock("./api", async () => (await import("./test/mockApi")).mockApiModule());
// The Market page embeds TradingView, which jsdom can't run.
vi.mock("./components/TradingViewWidget", () => ({ default: () => null }));
vi.mock("./components/market/TradingViewMarketQuotes", () => ({ default: () => null }));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

const signedInAs = (who = profile()) => {
  vi.mocked(sessionApi.hasToken).mockReturnValue(true);
  vi.mocked(sessionApi.current).mockResolvedValue({ profile: who });
};

describe("App", () => {
  it("routes to the requested page when a profile is signed in", async () => {
    signedInAs();
    vi.mocked(keywordsApi.list).mockResolvedValue([]);
    vi.mocked(subcategoriesApi.list).mockResolvedValue([]);

    renderAt("/keywords");

    expect(await screen.findByRole("heading", { name: "Keywords Management" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Profile: Alex" })).toBeInTheDocument();
  });

  it("opens the Market page right away from home when already signed in", async () => {
    signedInAs();

    renderAt("/");

    expect(await screen.findByRole("heading", { name: "Market", level: 1 })).toBeInTheDocument();
    expect(profilesApi.list).not.toHaveBeenCalled();
  });

  it("sends the old painel link to the Market page", async () => {
    signedInAs();

    renderAt("/painel");

    expect(await screen.findByRole("heading", { name: "Market", level: 1 })).toBeInTheDocument();
  });

  it("shows the profile picker when nobody is signed in, then returns to the requested page", async () => {
    vi.mocked(profilesApi.list).mockResolvedValue([profile({ id: 2, name: "Blake" })]);
    vi.mocked(sessionApi.signIn).mockResolvedValue(profile({ id: 2, name: "Blake" }));
    vi.mocked(keywordsApi.list).mockResolvedValue([]);
    vi.mocked(subcategoriesApi.list).mockResolvedValue([]);

    renderAt("/keywords");

    expect(await screen.findByRole("heading", { name: "Who's using Finverse?" })).toBeInTheDocument();
    expect(keywordsApi.list).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Enter as Blake" }));

    expect(await screen.findByRole("heading", { name: "Keywords Management" })).toBeInTheDocument();
    expect(sessionApi.signIn).toHaveBeenCalledWith(2, undefined);
  });

  it("goes back to the picker when the session can't be restored", async () => {
    vi.mocked(sessionApi.hasToken).mockReturnValue(true);
    vi.mocked(sessionApi.current).mockRejectedValue(new Error("401"));
    vi.mocked(profilesApi.list).mockResolvedValue([]);
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderAt("/transactions");

    expect(await screen.findByRole("heading", { name: "Who's using Finverse?" })).toBeInTheDocument();
  });

  it("switches profile from the navbar", async () => {
    signedInAs();
    vi.mocked(profilesApi.list).mockResolvedValue([profile(), profile({ id: 2, name: "Blake" })]);

    renderAt("/market");
    await userEvent.click(await screen.findByRole("button", { name: "Profile: Alex" }));
    await userEvent.click(screen.getByRole("button", { name: "Switch profile" }));

    expect(sessionApi.signOut).toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: "Enter as Blake" })).toBeInTheDocument();
  });
});
