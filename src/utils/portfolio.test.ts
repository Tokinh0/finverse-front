import { describe, expect, it } from "vitest";
import { asset } from "../test/fixtures";
import { allocationByType, filterAssets, formatQuantity, sortAssets, typeColors } from "./portfolio";
import { OTHER_COLOR, SERIES_COLORS } from "./health";

const assets = [
  asset({ id: 1, ticker: "CDB", asset_type: "reserva", current_value: 1000, rating: 5 }),
  asset({ id: 2, ticker: "BTC", description: "Bitcoin", asset_type: "criptomoedas", current_value: 2000, rating: 3 }),
  asset({ id: 3, ticker: "ETH", description: "Ethereum", asset_type: "criptomoedas", current_value: 1000, rating: 9 }),
];

describe("portfolio utils", () => {
  it("sums the allocation by type, largest first", () => {
    expect(allocationByType(assets)).toEqual([
      { type: "criptomoedas", value: 3000, share: 0.75, count: 2 },
      { type: "reserva", value: 1000, share: 0.25, count: 1 },
    ]);
    expect(allocationByType([])).toEqual([]);
    expect(allocationByType([asset({ current_value: 0 })])[0].share).toBe(0);
  });

  it("colors types by the API's type order, not by size, and grays out the rest", () => {
    const order = ["renda_variavel", "criptomoedas", "reserva"];
    const colors = typeColors(["reserva", "criptomoedas"], order);
    expect(colors.get("criptomoedas")).toBe(SERIES_COLORS[0]);
    expect(colors.get("reserva")).toBe(SERIES_COLORS[1]);

    const many = typeColors(["a", "b", "c", "d", "e", "f", "g"], []);
    expect(many.get("g")).toBe(OTHER_COLOR);
  });

  it("filters by type and by ticker or description, ignoring accents", () => {
    expect(filterAssets(assets, "criptomoedas", "").map((a) => a.id)).toEqual([2, 3]);
    expect(filterAssets(assets, null, "ethéreum").map((a) => a.id)).toEqual([3]);
    expect(filterAssets(assets, "reserva", "btc")).toEqual([]);
  });

  it("sorts by value, name or rating", () => {
    expect(sortAssets(assets, "value").map((a) => a.ticker)).toEqual(["BTC", "CDB", "ETH"]);
    expect(sortAssets(assets, "name").map((a) => a.ticker)).toEqual(["BTC", "CDB", "ETH"]);
    expect(sortAssets(assets, "rating").map((a) => a.ticker)).toEqual(["ETH", "CDB", "BTC"]);
  });

  it("shows fractional quantities without trailing zeros", () => {
    expect(formatQuantity(0.032, "pt-BR")).toBe("0,032");
    expect(formatQuantity(1500, "en-US")).toBe("1,500");
  });
});
