import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ApiError, profilesApi } from "../api";
import { ProfileContext, type ProfileState } from "../profile/context";
import { profile } from "../test/fixtures";
import { inLocale } from "../test/i18n";
import ProfilePicker from "./ProfilePicker";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());

const alex = profile({ id: 1, name: "Alex", password_protected: true });
const blake = profile({ id: 2, name: "Blake" });

function renderPicker(signIn: ProfileState["signIn"] = vi.fn(async () => {}), state?: { from: string }) {
  const value: ProfileState = { status: "signedOut", profile: null, signIn, signOut: vi.fn(), setProfile: vi.fn() };
  render(
    <ProfileContext.Provider value={value}>
      <MemoryRouter initialEntries={[{ pathname: "/", state }]}>
        <Routes>
          <Route path="/" element={<ProfilePicker />} />
          <Route path="/market" element={<p>market page</p>} />
          <Route path="/alerts" element={<p>alerts page</p>} />
        </Routes>
      </MemoryRouter>
    </ProfileContext.Provider>
  );
  return signIn;
}

describe("ProfilePicker", () => {
  it("lists the profiles without a password label", async () => {
    vi.mocked(profilesApi.list).mockResolvedValue([alex, blake]);
    renderPicker();

    expect(await screen.findByRole("button", { name: "Enter as Alex" })).not.toHaveTextContent(/password/i);
    expect(screen.getByRole("button", { name: "Add profile" })).toBeInTheDocument();
  });

  it("enters a profile without a password right away and opens the Market page", async () => {
    vi.mocked(profilesApi.list).mockResolvedValue([alex, blake]);
    const signIn = renderPicker();

    await userEvent.click(await screen.findByRole("button", { name: "Enter as Blake" }));

    expect(signIn).toHaveBeenCalledWith(blake, undefined);
    expect(await screen.findByText("market page")).toBeInTheDocument();
  });

  it("asks for the password of a protected profile and shows a wrong one", async () => {
    vi.mocked(profilesApi.list).mockResolvedValue([alex]);
    const signIn = vi.fn(async (_p: unknown, password?: string) => {
      if (password !== "letmein42") throw new ApiError(401, { errors: ["Wrong password"] });
    });
    renderPicker(signIn, { from: "/alerts" });

    await userEvent.click(await screen.findByRole("button", { name: "Enter as Alex" }));
    expect(screen.getByRole("dialog", { name: "Alex's password" })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Password"), "nope");
    await userEvent.click(screen.getByRole("button", { name: "Enter" }));
    expect(await screen.findByText("Wrong password")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveValue("");

    await userEvent.type(screen.getByLabelText("Password"), "letmein42");
    await userEvent.click(screen.getByRole("button", { name: "Enter" }));
    expect(await screen.findByText("alerts page")).toBeInTheDocument();
  });

  it("adds a profile and enters it", async () => {
    vi.mocked(profilesApi.list).mockResolvedValue([alex]);
    const created = profile({ id: 3, name: "Lia", password_protected: true });
    vi.mocked(profilesApi.create).mockResolvedValue(created);
    const signIn = renderPicker();

    await userEvent.click(await screen.findByRole("button", { name: "Add profile" }));
    await userEvent.type(screen.getByLabelText("Name"), " Lia ");
    await userEvent.type(screen.getByLabelText("Password (optional)"), "secret1");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(profilesApi.create).toHaveBeenCalledWith({ name: "Lia", locale: "en", password: "secret1" });
    expect(signIn).toHaveBeenCalledWith(created, "secret1");
    expect(await screen.findByText("market page")).toBeInTheDocument();
  });

  it("shows why a profile couldn't be created", async () => {
    vi.mocked(profilesApi.list).mockResolvedValue([alex]);
    vi.mocked(profilesApi.create).mockRejectedValue(new ApiError(422, { errors: ["Name has already been taken"] }));
    renderPicker();

    await userEvent.click(await screen.findByRole("button", { name: "Add profile" }));
    await userEvent.type(screen.getByLabelText("Name"), "Alex");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Name has already been taken")).toBeInTheDocument();
  });

  it("says when the profiles can't be loaded", async () => {
    vi.mocked(profilesApi.list).mockRejectedValue(new Error("down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderPicker();

    expect(await screen.findByText(/Could not load the profiles/)).toBeInTheDocument();
  });

  it("is shown in Portuguese", async () => {
    vi.mocked(profilesApi.list).mockResolvedValue([blake]);
    render(
      inLocale(
        "pt-BR",
        <MemoryRouter>
          <ProfilePicker />
        </MemoryRouter>
      )
    );

    expect(await screen.findByRole("heading", { name: "Quem está usando o Finverse?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar como Blake" })).toBeInTheDocument();
  });
});
