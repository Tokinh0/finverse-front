import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TradingViewMarketQuotes from "./TradingViewMarketQuotes";
import { inLocale } from "../../test/i18n";

const config = (container: HTMLElement) => JSON.parse(container.querySelector("script")!.innerHTML);

describe("TradingViewMarketQuotes", () => {
  it("embeds the world indices and commodities", () => {
    const { container } = render(<TradingViewMarketQuotes height={300} />);

    const script = container.querySelector("script")!;
    expect(script.src).toContain("embed-widget-market-quotes.js");
    const { symbolsGroups, height, locale } = config(container);
    expect(height).toBe(300);
    expect(locale).toBe("en");
    expect(symbolsGroups.map((g: { name: string }) => g.name)).toEqual(["Indices", "Commodities", "Dollar"]);
    expect(symbolsGroups[0].symbols.map((s: { displayName: string }) => s.displayName)).toContain("Nasdaq 100");
  });

  it("uses the app's language", () => {
    const { container } = render(inLocale("pt-BR", <TradingViewMarketQuotes />));

    expect(config(container)).toMatchObject({ locale: "br" });
    expect(config(container).symbolsGroups[0].name).toBe("Índices");
  });
});
