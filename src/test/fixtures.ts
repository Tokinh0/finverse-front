import type { Asset, Category, Keyword, Subcategory } from "../types";

export const subcategory = (overrides: Partial<Subcategory> = {}): Subcategory => ({
  id: 10,
  name: "Food",
  color_code: "#ff0000",
  subcategory_type: "expense",
  category: { id: 1, name: "Conforto" },
  ...overrides,
});

export const category = (overrides: Partial<Category> = {}): Category => ({
  id: 1,
  name: "Conforto",
  color_code: "#000000",
  subcategories: [subcategory({ category: undefined })],
  ...overrides,
});

export const keyword = (overrides: Partial<Keyword> = {}): Keyword => ({
  id: 100,
  name: "IFOOD",
  subcategory_id: 10,
  subcategory: subcategory(),
  ...overrides,
});

export const asset = (overrides: Partial<Asset> = {}): Asset => ({
  id: 1,
  asset_type: "reserva",
  ticker: "CDB",
  description: "Reserva de emergência",
  current_value: 1500,
  rating: 5,
  quantity: 1,
  percent_by_type: 100,
  color_code: "#00ff00",
  ...overrides,
});
