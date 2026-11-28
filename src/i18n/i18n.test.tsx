import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { settingsApi } from "../api";
import { useI18n } from "./context";
import { en } from "./en";
import I18nProvider from "./I18nProvider";
import { getLocale, initialLocale } from "./locale";
import { pt } from "./pt";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());

/** Every key path, with arrays of objects compared by their `target`s (guide steps). */
function shape(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, i) =>
      typeof item === "object" && item !== null ? shape(item, `${path}[${(item as { target?: string }).target ?? i}]`) : [`${path}[]`]
    );
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, child]) => shape(child, path ? `${path}.${key}` : key));
  }
  return [`${path}:${typeof value}`];
}

function Probe() {
  const { t, locale, setLocale, showLocale } = useI18n();
  return (
    <>
      <span data-testid="locale">{locale}</span>
      <span>{t.nav.transactions}</span>
      <button onClick={() => setLocale(locale === "en" ? "pt-BR" : "en")}>switch</button>
      <button onClick={() => showLocale("pt-BR")}>show</button>
    </>
  );
}

describe("i18n", () => {
  afterEach(() => window.localStorage.clear());

  it("has the same keys, value kinds and guide steps in English and Portuguese", () => {
    expect(shape(pt).sort()).toEqual(shape(en).sort());
    expect(pt.months).toHaveLength(12);
  });

  it("starts with the language last used in this browser, else the browser's", () => {
    expect(initialLocale()).toBe("en"); // jsdom's navigator is en-US
    window.localStorage.setItem("finverse.locale", "pt-BR");
    expect(initialLocale()).toBe("pt-BR");
    window.localStorage.setItem("finverse.locale", "fr");
    expect(initialLocale()).toBe("en");
  });

  it("shows another language without saving it (the signed-in profile's) and remembers it", async () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );

    await act(async () => screen.getByRole("button", { name: "show" }).click());

    expect(screen.getByText("Transações")).toBeInTheDocument();
    expect(settingsApi.updatePreferences).not.toHaveBeenCalled();
    expect(getLocale()).toBe("pt-BR");
    expect(window.localStorage.getItem("finverse.locale")).toBe("pt-BR");
    expect(document.documentElement.lang).toBe("pt-BR");
  });

  it("saves a change on the API before switching", async () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );

    await act(async () => screen.getByRole("button", { name: "switch" }).click());

    expect(settingsApi.updatePreferences).toHaveBeenCalledWith({ locale: "pt-BR" });
    expect(screen.getByTestId("locale")).toHaveTextContent("pt-BR");
    expect(screen.getByText("Transações")).toBeInTheDocument();
  });
});
