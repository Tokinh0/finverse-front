import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TradingViewWidget from "./TradingViewWidget";

describe("TradingViewWidget", () => {
  it("injects the TradingView embed script with the widget config", () => {
    const { container } = render(<TradingViewWidget symbol="BITSTAMP:BTCUSD" theme="light" />);

    const script = container.querySelector("script")!;
    expect(script.src).toContain("embed-widget-advanced-chart.js");
    expect(JSON.parse(script.innerHTML)).toMatchObject({ symbol: "BITSTAMP:BTCUSD", theme: "light" });
  });
});
