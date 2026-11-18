# Hiep Trong Space

Local-first personal management web app: Next.js (App Router), React, TypeScript, Tailwind, TanStack Query, Drizzle ORM, SQLite.

## Run

Node.js 22+. Copy `.env.example` to `.env`, then:

```
npm ci
npm run dev        # http://localhost:3000
npm run check      # lint + typecheck + tests
npm run build
npm run clean      # remove build output and scratch
```

## Where things are

| Folder | Contents |
| --- | --- |
| `src/`, `tests/` | Application and its tests (layer rules in `AGENTS.md`) |
| `public/`, `drizzle/` | Runtime assets, database migrations |
| `scripts/` | All tooling scripts |
| `md/` | Specs that agents read (start at `md/readme.md`) |
| `docs/` | Reports, audits, engineering reference (start at `docs/README.md`) |
| `.local/` | Git-ignored: reference media, review evidence, scratch |
| `data/` | Git-ignored runtime data |

Agent rules: `AGENTS.md`.
