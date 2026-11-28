import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sessionApi } from "../api";
import { SESSION_EXPIRED_EVENT } from "../api/session";
import { I18nContext } from "../i18n/context";
import { en } from "../i18n/en";
import { profile } from "../test/fixtures";
import { useProfile } from "./context";
import ProfileProvider from "./ProfileProvider";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());

function Probe() {
  const { status, profile: current, signIn, signOut } = useProfile();
  return (
    <>
      <span data-testid="status">{status}</span>
      <span data-testid="name">{current?.name ?? "-"}</span>
      <button onClick={() => signIn(profile({ id: 2, name: "Blake" }), "pw")}>sign in</button>
      <button onClick={() => signOut()}>sign out</button>
    </>
  );
}

const renderProvider = (showLocale = vi.fn()) =>
  render(
    <I18nContext.Provider value={{ locale: "en", t: en, setLocale: vi.fn(), showLocale }}>
      <ProfileProvider>
        <Probe />
      </ProfileProvider>
    </I18nContext.Provider>
  );

describe("ProfileProvider", () => {
  it("starts signed out without a saved session", () => {
    renderProvider();

    expect(screen.getByTestId("status")).toHaveTextContent("signedOut");
    expect(sessionApi.current).not.toHaveBeenCalled();
  });

  it("restores a saved session and follows the profile's language", async () => {
    vi.mocked(sessionApi.hasToken).mockReturnValue(true);
    vi.mocked(sessionApi.current).mockResolvedValue({ profile: profile({ name: "Alex", locale: "pt-BR" }) });
    const showLocale = vi.fn();

    renderProvider(showLocale);

    expect(screen.getByTestId("status")).toHaveTextContent("loading");
    expect(await screen.findByText("Alex")).toBeInTheDocument();
    expect(screen.getByTestId("status")).toHaveTextContent("signedIn");
    expect(showLocale).toHaveBeenCalledWith("pt-BR");
  });

  it("signs in and out", async () => {
    vi.mocked(sessionApi.signIn).mockResolvedValue(profile({ id: 2, name: "Blake" }));
    renderProvider();

    await act(async () => screen.getByRole("button", { name: "sign in" }).click());
    expect(sessionApi.signIn).toHaveBeenCalledWith(2, "pw");
    expect(screen.getByTestId("name")).toHaveTextContent("Blake");

    await act(async () => screen.getByRole("button", { name: "sign out" }).click());
    expect(sessionApi.signOut).toHaveBeenCalled();
    expect(screen.getByTestId("status")).toHaveTextContent("signedOut");
  });

  it("signs out when the API says the session ended", async () => {
    vi.mocked(sessionApi.signIn).mockResolvedValue(profile());
    renderProvider();
    await act(async () => screen.getByRole("button", { name: "sign in" }).click());

    act(() => {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    });

    expect(screen.getByTestId("status")).toHaveTextContent("signedOut");
  });
});
