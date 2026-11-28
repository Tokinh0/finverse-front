import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { settingsApi } from "../../api";
import MarketDataSettingsCard from "./MarketDataSettingsCard";

vi.mock("../../api", async () => (await import("../../test/mockApi")).mockApiModule());

const saved = { brapi_configured: true, masked_brapi_token: "…5678", brapi_from_env: false };

describe("MarketDataSettingsCard", () => {
  it("saves a token and then shows only its masked form", async () => {
    vi.mocked(settingsApi.updateMarket).mockResolvedValue(saved);
    render(<MarketDataSettingsCard />);

    expect(await screen.findByTestId("brapi-status")).toHaveTextContent("No token saved.");
    await userEvent.type(screen.getByLabelText("brapi.dev token"), "  abc5678 ");
    await userEvent.click(screen.getByRole("button", { name: "Save token" }));

    expect(settingsApi.updateMarket).toHaveBeenCalledWith({ brapi_token: "abc5678" });
    expect(await screen.findByText("Token saved.")).toBeInTheDocument();
    expect(screen.getByTestId("brapi-status")).toHaveTextContent("Token saved: …5678");
    expect(screen.getByLabelText("Replace brapi.dev token")).toHaveValue("");
  });

  it("removes the token after confirmation", async () => {
    vi.mocked(settingsApi.market).mockResolvedValue(saved);
    vi.mocked(settingsApi.removeBrapiToken).mockResolvedValue({ ...saved, brapi_configured: false, masked_brapi_token: null });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<MarketDataSettingsCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Remove token" }));

    expect(settingsApi.removeBrapiToken).toHaveBeenCalled();
    expect(await screen.findByText("Token removed.")).toBeInTheDocument();
  });

  it("says when the server's environment provides the token", async () => {
    vi.mocked(settingsApi.market).mockResolvedValue({ brapi_configured: false, masked_brapi_token: null, brapi_from_env: true });
    render(<MarketDataSettingsCard />);

    expect(await screen.findByTestId("brapi-status")).toHaveTextContent("Using the BRAPI_TOKEN");
  });

  it("shows an error when saving fails", async () => {
    vi.mocked(settingsApi.updateMarket).mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<MarketDataSettingsCard />);

    await userEvent.type(await screen.findByLabelText("brapi.dev token"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Save token" }));

    expect(await screen.findByText("Could not save the token.")).toBeInTheDocument();
  });
});
