# Finverse Front

React + TypeScript UI for the [Finverse API](https://github.com/Tokinh0/finverse): upload bank statements, manage categories and keywords, browse monthly reports and track an investment portfolio.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
```

The API URL is read from `VITE_FINVERSE_API_URL` (defaults to `http://localhost:3000`).

## Scripts

| Command | What it does |
| --- | --- |
| `npm test` | Run the Vitest suite once (`npm run test:watch` to watch) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run build` | Type check and build for production |

See `CLAUDE.md` for an overview of the architecture.
