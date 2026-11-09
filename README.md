# Hiep Trong Space

**Hiep Trong Space** is a local-first, single-user personal management web application for organizing daily tasks, deadlines, reminders, learning, projects, and long-term ambitions. Built for Windows with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS 4** design tokens, **Motion**, **Three.js**, **TanStack Query**, **Drizzle ORM**, and **SQLite** (`better-sqlite3`).

---

## Quick Start (Windows)

### Prerequisites

- **Node.js 22+** (required by native `better-sqlite3` engine constraints) and **npm**
- **Git**

### 1. Configure environment

If `.env` does not exist yet, copy `.env.example` to `.env`:

```powershell
if (-not (Test-Path -LiteralPath '.env')) {
  Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
```

### 2. Install locked dependencies

Use `npm ci` so dependency versions match `package-lock.json` exactly:

```powershell
npm ci
```

### 3. Start the local server

```powershell
npm run dev
```

Open **http://localhost:3000** in your browser (or run `npm run dev -- -p 3001` if port `3000` is in use).

- **Automatic database initialization:** Starting the server automatically creates `data/` (if absent) and applies SQLite migrations from `drizzle/` to the configured runtime database.
- **Local-only network note:** Next.js defaults to binding `0.0.0.0` when started without `--hostname`. The application has no authentication layer and assumes trusted local single-user operation; to bind strictly to loopback, run `npm run dev -- --hostname 127.0.0.1`.

---

## Available Scripts

| Command | Purpose |
|---|---|
| `npm ci` | Install locked dependencies from `package-lock.json` |
| `npm run dev` | Start the local Next.js development server (`http://localhost:3000`) |
| `npm run build` | Build the production bundle (uses `next/font/google` for `Cormorant Garamond` and `Inter`) |
| `npm start` | Start the production server after `npm run build` |
| `npm run check` | Run ESLint + TypeScript typecheck + Vitest test suite sequentially |
| `npm run lint` | Run ESLint (including architectural layer-boundary checks) across `src/` and `tests/` |
| `npm run typecheck` | Run `tsc --noEmit` (`strict: true`, `noUncheckedIndexedAccess: true`) |
| `npm test` | Run the deterministic Vitest suite once |
| `npm run test:watch` | Run Vitest in interactive watch mode |
| `npm run format` | Format `src/` and `tests/` with Prettier |
| `npm run db:generate` | Generate Drizzle SQL migrations under `drizzle/` from `src/services/storage/local/schema.ts` |
| `npm run db:migrate` | Apply Drizzle SQL migrations via `drizzle-kit` (see path caveat below) |

> **Database migration path caveat (`npm run db:migrate`):** Runtime storage resolves `DATA_DIR` and `DATABASE_FILE` from `.env`, whereas [`drizzle.config.ts`](drizzle.config.ts) uses the hardcoded path `./data/hiep-trong-space.db`. If you customize `DATA_DIR` or `DATABASE_FILE`, verify the migration target before running `npm run db:migrate` (automatic startup migrations inside the app container always use the resolved runtime path).

---

## Environment Variables (`.env`)

| Variable | Default | Description |
|---|---|---|
| `APP_TIMEZONE` | `Asia/Saigon` | Timezone passed to server notification formatting (task UI views currently default to `Asia/Saigon`; see [OD-05](PROJECT_DESCRIPTION.md#8-open-decisions-register)) |
| `STORAGE_DRIVER` | `local` | Active storage adapter (`local` SQLite + filesystem; `drive` is an unimplemented stub that returns HTTP `501`) |
| `DATA_DIR` | `./data` | Local runtime data directory (git-ignored) |
| `DATABASE_FILE` | `hiep-trong-space.db` | SQLite database filename inside `DATA_DIR` |
| `MEDIA_DIR` | `./data/media` | Media storage folder (resolved independently of `DATA_DIR`) |
| `GOOGLE_DRIVE_FOLDER_ID` | *(empty)* | Reserved for a future Google Drive `StorageAdapter` |
| `SCHEDULER_TICK_SECONDS` | `30` | Interval in seconds (runtime minimum `5s`) for in-app Due soon / Overdue reminder checks |

---

## Architecture & Built Surfaces

The codebase enforces one-way dependencies via [`eslint.config.mjs`](eslint.config.mjs):

```text
UI (src/features, src/ui, src/app pages)
  ↓
Client (src/client — typed fetch wrapper, TanStack Query hooks, localStorage UI preferences)
  ↓ HTTP JSON
API routes (src/app/api/** — Zod input validation → service call → DTO response)
  ↓
Services (src/services — TaskService, NotificationService)
  ↓ StorageAdapter interface only
Storage (src/services/storage — local SQLite/filesystem adapter + Google Drive stub)
```

Shared pure foundations live in `src/contracts/` (Zod schemas and DTO types), `src/domain/` (timezone, date resolution, sorting, urgency, and reminder rules), and `src/design/` (closed-palette CSS variables in `tokens.css`, `Cormorant Garamond` and `Inter` font definitions in `fonts.ts`, and motion tokens in `motion.ts`). Note that `next/font/google` downloads font files at build/dev compilation time and serves them locally at runtime; the homepage vector wordmark (`/brand/wordmark.svg`) is standalone SVG artwork.

### Implemented surfaces

- **Homepage (`/`):** Dark cosmos experience (`HomeJourney`) combining a Canvas 2D 3D-perspective starfield, the reconstructed vector `HIEP TRONG / SPACE` wordmark, an interactive Three.js night-Earth scene with 4K/2K WebP textures and poster fallbacks, the **Feature Collection** (`Explore my space` heading with pinned desktop Horizontal gallery and 2-column Vertical grid), Earth imagery credits footer, and notification bell.
- **Daily Task Management (`/tasks/daily`):** Luminous lavender Celestial V2 workspace featuring the **Cosmic forecast**, **Progress**, and **Day arc** observatory panels; an interactive three-day **DayCarousel** (`Yesterday`, `Today`, `Tomorrow`) with measured 3.5-card scrollable lists and constellation scrollbars; **Week view** summary cards with a day-tasks drawer; **Month view** 6-week calendar grid with a day-tasks drawer; the **Overdue** lane with modal **Transfer** dialog; and an **Observatory / Statistics** placeholder drawer.
- **Tasks Hub (`/tasks/hub`):** Full-collection task view grouped into **Overdue**, **Due soon**, and **Later** (plus optional **Completed**), with instant search, priority filter, deadline/priority sort, Daily scheduling chips, and `?task=<id>` notification highlight — sharing one `tasks` table, `TaskCard`, and `TaskForm` with Daily Task Management.
- **Notification Center:** Floating workspace-themed popover anchored to the top-right bell on `/` and inside `WorkspaceShell` (`Ctrl+K` Universe menu), backed by a 30-second server scheduler, 15-second `GET /api/notifications` fallback tick, startup catch-up, live task joins, and 7-day retention purge.
- **Cosmic Launch:** ~3-second 4-phase spacecraft route transition coordinated with destination `<PageReady />` signals (`<= 300ms` crossfade for `prefers-reduced-motion` and browser Back/Forward).
- **11 Planned Feature Shells (`BlankPage`):** `/events`, `/ai-engineering`, `/blogs`, `/apcs`, `/flashcards`, `/entertainment`, `/tracking`, `/projects`, `/milestones`, `/learning-room`, `/achievements`.

---

## Documentation Map

- **Agent rules & workflow:** [`AGENTS.md`](AGENTS.md)
- **Documentation guide & reading paths:** [`md/readme.md`](md/readme.md)
- **Engineering reference & open decisions:** [`PROJECT_DESCRIPTION.md`](PROJECT_DESCRIPTION.md)
- **Shared UI/UX system:** [`md/agents/shared/uiux.md`](md/agents/shared/uiux.md)
- **Homepage epic spec & reports:** [`md/agents/homepage/readme.md`](md/agents/homepage/readme.md) · [`md/agents/homepage/reports.md`](md/agents/homepage/reports.md)
- **Tasks epic spec & reports:** [`md/agents/tasks/readme.md`](md/agents/tasks/readme.md) · [`md/agents/tasks/reports.md`](md/agents/tasks/reports.md)
- **Engineering audit reports (6 Nov 2026):** [`docs/audit/ARCHITECTURE_AUDIT.md`](docs/audit/ARCHITECTURE_AUDIT.md) · [`docs/audit/BUG_INVENTORY.md`](docs/audit/BUG_INVENTORY.md) · [`docs/audit/TECHNICAL_DEBT.md`](docs/audit/TECHNICAL_DEBT.md) · [`docs/audit/STABILIZATION_PLAN.md`](docs/audit/STABILIZATION_PLAN.md)
- **Asset attributions:** [`public/earth/ATTRIBUTION.md`](public/earth/ATTRIBUTION.md)

---

## Backup & Restore (`data/`)

By default, runtime data lives in `data/hiep-trong-space.db` (plus `-wal` and `-shm` files while SQLite runs) and `data/media/`. If you override `DATA_DIR`, `DATABASE_FILE`, or `MEDIA_DIR` in `.env`, back up and restore your custom paths instead.

### Backup

1. Stop the running server (`Ctrl+C`) so SQLite flushes its write-ahead log cleanly.
2. Copy the data folder to a timestamped backup directory:

```powershell
$stamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
New-Item -ItemType Directory -Path '.\backups' -Force | Out-Null
Copy-Item -LiteralPath '.\data' -Destination ".\backups\data_$stamp" -Recurse
```

### Restore

1. Stop the running server (`Ctrl+C`) and keep a safety copy of the current `data/` folder.
2. Replace `.\data` with your chosen backup copy (including any companion files and `media/`) and restart with `npm run dev`.
