import type { Asset } from "../types";
import { normalize } from "./categorization";
import { OTHER_COLOR, SERIES_COLORS } from "./health";

export interface TypeAllocation {
  type: string;
  value: number;
  /** 0..1 of the portfolio total */
  share: number;
  count: number;
}

export type AssetSort = "value" | "name" | "rating";
export const ASSET_SORTS: AssetSort[] = ["value", "name", "rating"];

/** Totals per asset type, largest first. Computed from the assets so it always matches the list. */
export function allocationByType(assets: Asset[]): TypeAllocation[] {
  const total = assets.reduce((sum, asset) => sum + (asset.current_value || 0), 0);
  const byType = new Map<string, TypeAllocation>();
  for (const asset of assets) {
    const entry = byType.get(asset.asset_type) ?? { type: asset.asset_type, value: 0, share: 0, count: 0 };
    entry.value += asset.current_value || 0;
    entry.count += 1;
    byType.set(asset.asset_type, entry);
  }
  return [...byType.values()]
    .map((entry) => ({ ...entry, share: total > 0 ? entry.value / total : 0 }))
    .sort((a, b) => b.value - a.value || a.type.localeCompare(b.type));
}

/**
 * Colors follow the asset type, never its rank: the types you hold take the validated palette's
 * slots in the API's fixed type order, so a type keeps its color when values change. Past the
 * palette, types share gray (the list and table always name them).
 */
export function typeColors(heldTypes: string[], typeOrder: string[]) {
  const position = (type: string) => {
    const index = typeOrder.indexOf(type);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  const ordered = [...new Set(heldTypes)].sort((a, b) => position(a) - position(b) || a.localeCompare(b));
  return new Map(ordered.map((type, index) => [type, SERIES_COLORS[index] ?? OTHER_COLOR]));
}

export function filterAssets(assets: Asset[], type: string | null, query: string) {
  const q = normalize(query);
  return assets.filter(
    (asset) =>
      (!type || asset.asset_type === type) &&
      (!q || normalize(asset.ticker ?? "").includes(q) || normalize(asset.description ?? "").includes(q))
  );
}

export function sortAssets(assets: Asset[], sort: AssetSort) {
  const byName = (a: Asset, b: Asset) => (a.ticker || a.description).localeCompare(b.ticker || b.description);
  return [...assets].sort((a, b) => {
    if (sort === "name") return byName(a, b);
    if (sort === "rating") return b.rating - a.rating || byName(a, b);
    return b.current_value - a.current_value || byName(a, b);
  });
}

/** Quantities can be fractional (crypto): show up to 8 decimals, no trailing zeros. */
export const formatQuantity = (quantity: number, locale: string) =>
  quantity.toLocaleString(locale, { maximumFractionDigits: 8 });
