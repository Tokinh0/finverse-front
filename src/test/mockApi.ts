import { vi } from "vitest";

// Shared vi.mock factory for "../api": every endpoint is a vi.fn() the test configures.
export const mockApiModule = () => ({
  ApiError: class ApiError extends Error {},
  API_BASE_URL: "http://api.test",
  statementsApi: { list: vi.fn(), upload: vi.fn(), remove: vi.fn() },
  categoriesApi: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
  subcategoriesApi: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
  keywordsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), health: vi.fn(async () => []) },
  assetsApi: { dashboard: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  reportsApi: { monthlyByCategory: vi.fn(), monthlyBySubcategory: vi.fn(), financialHealth: vi.fn(), categorizationProgress: vi.fn() },
  transactionsApi: { list: vi.fn(), recategorize: vi.fn(), markUnknown: vi.fn(), unmarkUnknown: vi.fn() },
  alertsApi: { list: vi.fn(), dismiss: vi.fn(), restore: vi.fn() },
  settingsApi: {
    claude: vi.fn(),
    updateClaude: vi.fn(),
    removeClaudeKey: vi.fn(),
    preferences: vi.fn(async () => ({ locale: "en", available_locales: ["en", "pt-BR"] })),
    updatePreferences: vi.fn(async ({ locale }: { locale: string }) => ({ locale, available_locales: ["en", "pt-BR"] })),
  },
  suggestionsApi: {
    // Pages that only show the badge get an empty summary unless a test sets one.
    summary: vi.fn(async () => ({
      pending_count: 0,
      pending_category_count: 0,
      pending_rule_count: 0,
      claude_configured: false,
      latest_run: null,
    })),
    startRun: vi.fn(),
    categories: vi.fn(),
    acceptCategory: vi.fn(),
    rejectCategory: vi.fn(),
    dontKnow: vi.fn(),
    bulkAccept: vi.fn(),
    rules: vi.fn(),
    acceptRule: vi.fn(),
    rejectRule: vi.fn(),
  },
  toQuery: (params: object) => `?${new URLSearchParams(params as Record<string, string>)}`,
});
