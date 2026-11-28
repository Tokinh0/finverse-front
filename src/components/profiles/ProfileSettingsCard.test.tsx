import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError, profilesApi } from "../../api";
import { ProfileContext } from "../../profile/context";
import { profile } from "../../test/fixtures";
import type { Profile } from "../../types";
import ProfileSettingsCard from "./ProfileSettingsCard";

vi.mock("../../api", async () => (await import("../../test/mockApi")).mockApiModule());

function renderCard(current: Profile) {
  const setProfile = vi.fn();
  render(
    <ProfileContext.Provider value={{ status: "signedIn", profile: current, signIn: vi.fn(), signOut: vi.fn(), setProfile }}>
      <ProfileSettingsCard />
    </ProfileContext.Provider>
  );
  return setProfile;
}

describe("ProfileSettingsCard", () => {
  it("renames the profile", async () => {
    const renamed = profile({ name: "Alex Rae" });
    vi.mocked(profilesApi.update).mockResolvedValue(renamed);
    const setProfile = renderCard(profile());

    expect(screen.getByRole("button", { name: "Save name" })).toBeDisabled();
    await userEvent.clear(screen.getByLabelText("Name"));
    await userEvent.type(screen.getByLabelText("Name"), "Alex Rae");
    await userEvent.click(screen.getByRole("button", { name: "Save name" }));

    expect(profilesApi.update).toHaveBeenCalledWith({ name: "Alex Rae" });
    expect(setProfile).toHaveBeenCalledWith(renamed);
    expect(await screen.findByText("Name saved.")).toBeInTheDocument();
  });

  it("sets a password on a profile without one", async () => {
    vi.mocked(profilesApi.update).mockResolvedValue(profile({ password_protected: true }));
    renderCard(profile());

    expect(screen.getByText(/Anyone using this browser/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("New password"), "secret1");
    await userEvent.click(screen.getByRole("button", { name: "Set password" }));

    expect(profilesApi.update).toHaveBeenCalledWith({ password: "secret1" });
    expect(await screen.findByText(/Password saved/)).toBeInTheDocument();
  });

  it("changes or removes a password with the current one", async () => {
    vi.mocked(profilesApi.update).mockRejectedValueOnce(new ApiError(422, { errors: ["Current password is wrong"] }));
    vi.mocked(profilesApi.update).mockResolvedValueOnce(profile({ password_protected: false }));
    renderCard(profile({ password_protected: true }));

    expect(screen.getByRole("button", { name: "Remove password" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Current password"), "wrong");
    await userEvent.type(screen.getByLabelText("New password"), "newpass");
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(profilesApi.update).toHaveBeenCalledWith({ password: "newpass", current_password: "wrong" });
    expect(await screen.findByText("Current password is wrong")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove password" }));
    expect(profilesApi.update).toHaveBeenLastCalledWith({ remove_password: true, current_password: "wrong" });
    expect(await screen.findByText("Password removed.")).toBeInTheDocument();
  });
});
