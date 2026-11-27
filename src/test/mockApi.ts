import { vi } from "vitest";

// Shared vi.mock factory for "../api": every endpoint is a vi.fn() the test configures.
export const mockApiModule = () => ({
  ApiError: class ApiError extends Error {},
  API_BASE_URL: "http://api.test",
  statementsApi: { list: vi.fn(), upload: vi.fn(), remove: vi.fn() },
  categoriesApi: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
  subcategoriesApi: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
  keywordsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  assetsApi: { dashboard: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  reportsApi: { monthlyByCategory: vi.fn(), monthlyBySubcategory: vi.fn() },
  transactionsApi: { list: vi.fn(), recategorize: vi.fn() },
  alertsApi: { list: vi.fn(), dismiss: vi.fn(), restore: vi.fn() },
  toQuery: (params: object) => `?${new URLSearchParams(params as Record<string, string>)}`,
});
