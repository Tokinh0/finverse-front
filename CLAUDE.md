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

- **API access** always goes through `src/api`. `apiRequest` (`src/api/client.ts`) prefixes `/api/v1`, sends JSON, parses responses and throws `ApiError` on non-2xx responses. `src/api/index.ts` exports one object per resource (`statementsApi`, `categoriesApi`, `subcategoriesApi`, `keywordsApi`, `assetsApi`, `reportsApi`). Pages never call `fetch` directly. Rails expects params nested under the resource name (`{ keyword: {...} }`), and the resource functions already do that.
- **Types** for API payloads live in `src/types/index.ts` and mirror the Rails presenters (`finverse/app/presenters`). When a presenter changes, update them.
- **Presenters** (`src/presenters/*.ts`) turn the statement and summary-line JSON into camelCase classes. `SummaryLinePresenter` decodes `content`, which the API sends as a JSON-encoded array string.
- **Routing:** every route is defined in `src/App.tsx`, with one page per route in `src/pages/`. `App` owns the global `showTotals` privacy toggle (switched from the Navbar), and the portfolio and subcategory-report pages hide amounts unless it's on.
- **Reports:** `useCreditDebitReport` loads a `{ credit, debit }` report keyed by `YYYY-MM` and returns the months newest first. `CategoryChart` and `SubcategoryChart` (Recharts) each render one month's data as a pie, bar or line chart, and `ChartTypeSelect` switches between them.
- **Transactions** (`/transactions`): its filters live in the URL query (`useSearchParams`), so links and the back button keep them, and the text search is debounced. `RecategorizeModal` moves a transaction and can create a keyword and apply it to matching transactions.
- **Asset types** come from the API (`portfolio_dashboard.asset_types`, enum key → label). Send the keys and show the labels. `Todos` is only a UI filter and never a valid `asset_type`.
- **UI libraries:** react-bootstrap for most pages, MUI (dark theme) for the portfolio page and asset modal. Don't add a third one. Amounts typed by the user go through `parseAmount` (it accepts pt-BR `1.234,56`), and display uses `formatCurrency`.
- Non-component helpers live in `.ts` files (`src/utils`, `assetForm.ts`) rather than being exported from component files, because the react-refresh lint rule rejects mixed exports.

## Tests

Vitest + Testing Library (jsdom), with `*.test.ts(x)` files next to the code they cover. Every component, page, hook, presenter and util has tests, and new ones need them too. To mock the API, use `vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule())` and configure `vi.mocked(keywordsApi.list)`. Builders for test data are in `src/test/fixtures.ts`. `src/test/setup.tsx` gives Recharts' `ResponsiveContainer` a fixed size so charts actually render in jsdom, and you can assert on `.recharts-bar`/`.recharts-pie`.
