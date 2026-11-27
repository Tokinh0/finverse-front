import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, settingsApi } from "../api";
import Settings from "./Settings";
import { I18nContext } from "../i18n/context";
import { en } from "../i18n/en";
import { inLocale } from "../test/i18n";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());

const saved = { configured: true, masked_key: "sk-ant-…1234", model: "claude-haiku-5-5", default_model: "claude-haiku-5-5", warning: null };

describe("Settings", () => {
  beforeEach(() => {
    vi.mocked(settingsApi.claude).mockResolvedValue({ ...saved, configured: false, masked_key: null });
  });

  it("explains what is sent and that nothing is sent without a key", async () => {
    render(<Settings />);

    expect(await screen.findByText(/No API key saved/)).toBeInTheDocument();
    expect(screen.getByText(/What is sent to Claude/)).toBeInTheDocument();
    expect(screen.getByText(/Without a key, nothing leaves Finverse/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove key" })).not.toBeInTheDocument();
  });

  it("saves a key and model, then shows only the masked key", async () => {
    vi.mocked(settingsApi.updateClaude).mockResolvedValue({ ...saved, model: "claude-sonnet-5-5" });
    render(<Settings />);

    await userEvent.type(await screen.findByLabelText("API key"), "  sk-ant-api03-secret1234 ");
    await userEvent.selectOptions(screen.getByLabelText("Model"), "claude-sonnet-5-5");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(settingsApi.updateClaude).toHaveBeenCalledWith({ api_key: "sk-ant-api03-secret1234", model: "claude-sonnet-5-5" });
    expect(await screen.findByText("Settings saved.")).toBeInTheDocument();
    expect(screen.getByTestId("key-status")).toHaveTextContent("Key saved: sk-ant-…1234");
    expect(screen.getByLabelText("Replace API key")).toHaveValue("");
  });

  it("shows the warning when the key couldn't be checked, and the error when it was rejected", async () => {
    vi.mocked(settingsApi.updateClaude)
      .mockResolvedValueOnce({ ...saved, warning: "Couldn't reach the Claude API." })
      .mockRejectedValueOnce(new ApiError(422, { errors: ["Your Claude API key was rejected."] }));
    render(<Settings />);

    await userEvent.type(await screen.findByLabelText("API key"), "sk-ant-1");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Couldn't reach the Claude API.")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Replace API key"), "sk-ant-2");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Could not save the settings.")).toBeInTheDocument();
  });

  it("removes the key after confirmation", async () => {
    vi.mocked(settingsApi.claude).mockResolvedValue(saved);
    vi.mocked(settingsApi.removeClaudeKey).mockResolvedValue({ ...saved, configured: false, masked_key: null });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Settings />);

    await userEvent.click(await screen.findByRole("button", { name: "Remove key" }));

    expect(settingsApi.removeClaudeKey).toHaveBeenCalled();
    expect(await screen.findByText(/API key removed/)).toBeInTheDocument();
  });

  it("changes the app's language", async () => {
    const setLocale = vi.fn().mockResolvedValue(undefined);
    render(
      <I18nContext.Provider value={{ locale: "en", t: en, setLocale }}>
        <Settings />
      </I18nContext.Provider>
    );

    await userEvent.selectOptions(await screen.findByLabelText("Language"), "pt-BR");

    expect(setLocale).toHaveBeenCalledWith("pt-BR");
  });

  it("is shown in Portuguese when that is the language", async () => {
    render(inLocale("pt-BR", <Settings />));

    expect(await screen.findByRole("heading", { name: "Configurações" })).toBeInTheDocument();
    expect(screen.getByText(/O que é enviado ao Claude/)).toBeInTheDocument();
    expect(screen.getByLabelText("Idioma")).toHaveValue("pt-BR");
  });
});
