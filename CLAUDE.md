# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About Finverse

Finverse is a personal finance app built and used by a single person (the repo owner). It is not a
multi-user product: there is no authentication, tenancy or public deployment to design for.

The goal is one place for the owner's whole financial life ("financial universe"):

**Today**
- **Spending:** import Sicredi bank statements (checking account and credit card, PDF/CSV), categorize
  every transaction automatically by keyword, and build monthly reports showing where the money goes.
  The reports are also used to spot unexpected or mistaken charges.
- **Portfolio:** track investment holdings by asset type and see the allocation.

**Planned (not built yet)**
- **Investing strategy:** help decide where to invest so savings grow safely, beyond just tracking holdings.
- **Tax control:** track taxes paid as *pessoa física* (individual) and *pessoa jurídica* (the owner's company).

Data is the owner's real banking data, in BRL and Portuguese. Never commit statements or other personal
financial data, and keep test fixtures synthetic.

Finverse frontend: React 19 + TypeScript + Vite. It's the UI for the Finverse Rails API (a separate repo, `../finverse`), covering statement upload, category/keyword management, monthly reports and an investment portfolio. The UI text mixes English and Portuguese, and money is BRL.

## Commands

```bash
npm install
npm run dev          # Vite on :5173 (or: docker compose up)
npm test             # Vitest, single run
npm run test:watch
npx vitest run src/pages/KeywordsCrud.test.tsx      # one file
npx vitest run -t "creates a keyword"                # one test by name
npm run lint         # ESLint (typescript-eslint, react-hooks)
npm run typecheck    # tsc --noEmit (strict, noUnusedLocals)
npm run build        # typecheck + production build
```
The API base URL comes from `VITE_FINVERSE_API_URL` (set in `.env` and `docker-compose.yml`) and falls back to `http://localhost:3000`.

## Architecture

- **Language (i18n):** English and Brazilian Portuguese, without an i18n library. `src/i18n/en.ts` holds every UI string (functions for interpolation and plurals) and `pt.ts` is typed as `Messages`, so a missing translation fails the build; `i18n.test.tsx` also compares their shapes. Components use `const { t } = useI18n()`; code outside React (formatters, presenters, validation, `utils/suggestions.ts`) uses `messages()` / `getLocale()` from `src/i18n/locale.ts`. `I18nProvider` (mounted in `App`) starts from the browser's last choice (localStorage) or `navigator.language`, then follows `GET /settings/preferences`; Settings changes it with `PUT`. Dates follow the language (`formatIsoDate`: MM/DD/YYYY in English, DD/MM/YYYY in Portuguese; `monthNames()`), money is always BRL. Never translate the owner's data (names of transactions, categories, keywords). Tests render in English by default; use `inLocale("pt-BR", ui)` from `src/test/i18n.tsx` for Portuguese (setup resets the locale after each test). When a page's loop variable is a transaction named `t`, the messages are bound as `i18n`.
- **API access** always goes through `src/api`. `apiRequest` (`src/api/client.ts`) prefixes `/api/v1`, sends JSON, parses responses and throws `ApiError` on non-2xx responses. `src/api/index.ts` exports one object per resource (`statementsApi`, `categoriesApi`, `subcategoriesApi`, `keywordsApi`, `assetsApi`, `reportsApi`, `transactionsApi`, `alertsApi`, `settingsApi`, `suggestionsApi`). Pages never call `fetch` directly. Rails expects params nested under the resource name (`{ keyword: {...} }`), and the resource functions already do that.
- **Types** for API payloads live in `src/types/index.ts` and mirror the Rails presenters (`finverse/app/presenters`). When a presenter changes, update them.
- **Presenters** (`src/presenters/*.ts`) turn the statement and summary-line JSON into camelCase classes. `SummaryLinePresenter` decodes `content`, which the API sends as a JSON-encoded array string.
- **Routing:** every route is defined in `src/App.tsx`, with one page per route in `src/pages/`. `App` owns the global `showTotals` privacy toggle (switched from the Navbar), and the portfolio and subcategory-report pages hide amounts unless it's on.
- **Reports:** `useCreditDebitReport` loads a `{ credit, debit }` report keyed by `YYYY-MM` and returns the months newest first. `CategoryChart` and `SubcategoryChart` (Recharts) each render one month's data as a pie, bar or line chart, and `ChartTypeSelect` switches between them.
- **Transactions** (`/transactions`): its filters live in the URL query (`useSearchParams`), so links and the back button keep them, and the text search is debounced. `RecategorizeModal` moves a transaction and can create a keyword and apply it to matching transactions. Its optional "Why?" field is sent as `reason`; the API keeps it with the correction and uses it as context for suggestions. The show/hide-amounts switch (`showTotals`) is stored in localStorage by `usePersistentToggle` and only the Navbar switch changes it.
- **Review charges** (`/alerts`, `ChargeAlerts`) lists the month's `GET /alerts` results grouped by kind. "Looks fine" dismisses an alert (with Undo when "Show reviewed" is on), "Re-categorize" reuses `RecategorizeModal`, and "Similar" opens `/transactions?q=<name>`. When `showTotals` is off, the messages that contain amounts are hidden too.
- **Financial health** (`/reports/financial-health`, `FinancialHealth` + `src/components/health/`) is one screen built from `GET /reports/financial_health`: summary tiles, categories ranked by spending, 12-month category trends and a year summary. Period (1/3/6/12 months), ending month and year live in the URL. Charts follow the dataviz rules: categories get colors from the validated palette in `src/utils/health.ts`, assigned by category id (never by rank), and keep them across the page. Every chart has a legend and a table. Changes show an arrow and text, never color alone.
- **Suggestions** (`/suggestions`, `Suggestions` + `src/components/suggestions/`): the inbox for everything the API suggests (it never changes data on its own). A "Rules" tab with `RuleSuggestionCard` (rule, reason, confidence, live preview of affected transactions, accept / edit & accept with a re-apply scope / reject) and a "Transactions" tab with `CategorySuggestionGroups` (one card per merchant, bulk accept by confidence or merchant). `CategorizationProgressChart` (100% stacked bars per month; colors come from `SOURCE_COLORS`/`STACK_ORDER` in `src/utils/suggestions.ts`, a CVD-validated order, so keep it) and `RunStatus` sit on top. `App` owns the polled `GET /suggestions/summary` through `useSuggestionsSummaryState` and shares it with `SuggestionsSummaryContext`; the Navbar badge reads it, and pages call `refresh()` after a decision. Pending suggestions also show inline on `/transactions` (`SuggestionChip`, dashed so they never look confirmed), `RuleNudge` appears after a manual fix when the PATCH response has a `rule_nudge`, "No idea" (chip "?", merchant-card button, and a link in `RecategorizeModal` for uncategorized transactions) marks a transaction the owner can't remember (badge "Can't remember" with Undo and an "Only transactions I can't remember" filter on `/transactions`), "New category / subcategory" (`NewSubcategoryModal`, also the "+ New subcategory…" option of `SubcategorySelect`) creates one without leaving the page, and `/keywords` shows rule health from `GET /keywords/health`.
- **Amount ranges on keyword rules:** a keyword can apply only to amounts in a range (`min_amount`/`max_amount`). `AmountRangeFields` edits it (Keywords dialog, "Create a keyword" in `RecategorizeModal`, "Edit & accept" on rule suggestions), `parseAmountRange`/`amountRangeLabel` in `src/utils/amountRange.ts` parse pt-BR input and describe it.
- **Color themes** (`/categories&subcategories`, `ColorThemePicker` + `src/utils/colorThemes.ts`): one click recolors every category and subcategory. `COLOR_THEMES` (at least three) defines base colors per kind; a category's kind is what most of its subcategories are (`gain`/`investment`/`transfer`, anything else is `expense`), gains are always a green family, and expense colors go by category id. Subcategories get shades of their category's color (`shadesOf`, dark to light). Applying asks first, then saves only the colors that differ through the normal category/subcategory `PATCH`es (a few at a time) and reports any that failed. The theme isn't stored anywhere: `currentTheme` recognizes it from the colors, so editing one color by hand makes it "custom". Financial health keeps its own validated palette.
- **Settings** (`/settings`): the Claude API key (only the masked form ever comes back), the model, and what data is sent to Claude.
- **Asset types** come from the API (`portfolio_dashboard.asset_types`, enum key → label). Send the keys and show the labels. `Todos` is only a UI filter and never a valid `asset_type`.
- **UI libraries:** react-bootstrap for most pages, MUI (dark theme) for the portfolio page and asset modal. Don't add a third one. Amounts typed by the user go through `parseAmount` (it accepts pt-BR `1.234,56`), and display uses `formatCurrency`.
- Non-component helpers live in `.ts` files (`src/utils`, `assetForm.ts`) rather than being exported from component files, because the react-refresh lint rule rejects mixed exports.

## Tests

Vitest + Testing Library (jsdom), with `*.test.ts(x)` files next to the code they cover. Every component, page, hook, presenter and util has tests, and new ones need them too. To mock the API, use `vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule())` and configure `vi.mocked(keywordsApi.list)`. `setup.tsx` calls `vi.restoreAllMocks()` after each test, so a mock default that must survive between tests is written as `vi.fn(async () => ...)` (as `suggestionsApi.summary` and `keywordsApi.health` are), not with `mockResolvedValue`. Pages that use `useSuggestionsSummary` can be wrapped in `SuggestionsSummaryContext.Provider` with a fixture summary. Builders for test data are in `src/test/fixtures.ts`. `src/test/setup.tsx` gives Recharts' `ResponsiveContainer` a fixed size so charts actually render in jsdom, and you can assert on `.recharts-bar`/`.recharts-pie`.
