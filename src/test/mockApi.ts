import { vi } from "vitest";

// Shared vi.mock factory for "../api": every endpoint is a vi.fn() the test configures.
export const mockApiModule = () => ({
  ApiError: class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(status = 500, body?: unknown) {
      super(`Request failed with status ${status}`);
      this.status = status;
      this.body = body;
    }
  },
  API_BASE_URL: "http://api.test",
  profilesApi: { list: vi.fn(), create: vi.fn(), current: vi.fn(), update: vi.fn() },
  // Tests run signed in unless they say otherwise (see src/test/profile.tsx).
  sessionApi: {
    current: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(async () => {}),
    hasToken: vi.fn(() => false),
  },
  // The transactions page lists statements too; empty unless a test sets some.
  statementsApi: { list: vi.fn(async () => []), upload: vi.fn(), remove: vi.fn() },
  categoriesApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  subcategoriesApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  keywordsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), health: vi.fn(async () => []) },
  assetsApi: { dashboard: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  reportsApi: { monthlyByCategory: vi.fn(), monthlyBySubcategory: vi.fn(), financialHealth: vi.fn(), categorizationProgress: vi.fn() },
  transactionsApi: { list: vi.fn(), recategorize: vi.fn(), markUnknown: vi.fn(), unmarkUnknown: vi.fn() },
  alertsApi: { list: vi.fn(), dismiss: vi.fn(), restore: vi.fn() },
  settingsApi: {
    claude: vi.fn(),
    updateClaude: vi.fn(),
    removeClaudeKey: vi.fn(),
    market: vi.fn(async () => ({ brapi_configured: false, masked_brapi_token: null, brapi_from_env: false })),
    updateMarket: vi.fn(),
    removeBrapiToken: vi.fn(),
    updatePreferences: vi.fn(async ({ locale }: { locale: string }) => ({ locale, available_locales: ["en", "pt-BR"] })),
  },
  // The Market page is the home page: by default its data never arrives, unless a test sets it.
  marketApi: {
    overview: vi.fn(() => new Promise(() => {})),
    assets: vi.fn(() => new Promise(() => {})),
    applyAssetPrices: vi.fn(),
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
