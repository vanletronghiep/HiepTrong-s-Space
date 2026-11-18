# Repository Guidelines (`AGENTS.md`)

**Hiep Trong Space** is a local-first personal management web application built with Next.js App Router, React, TypeScript, Tailwind CSS design tokens, TanStack Query, Drizzle ORM, and SQLite.

---

## 1. Documentation Reading Map

Read selectively based on your assigned scope rather than loading every file:

- **Documentation hub & reading rules:** [`md/readme.md`](md/readme.md) — authority labels, document ownership, maintenance rules, and conflict handling.
- **Engineering reference:** [`PROJECT_DESCRIPTION.md`](docs/engineering/PROJECT_DESCRIPTION.md) — system architecture, layer boundaries, shared data models, route/feature catalog, standardized terminology, and the canonical [Open decisions register](docs/engineering/PROJECT_DESCRIPTION.md#8-open-decisions-register).
- **Shared UI/UX foundation:** [`md/agents/shared/uiux.md`](md/agents/shared/uiux.md) — design tokens, typography, motion curves, accessibility, responsive breakpoints, shared components, Cosmic Launch, Workspace shell, and scoped visual exceptions.
- **Homepage epic:** [`md/agents/homepage/readme.md`](md/agents/homepage/readme.md) (specification) and [`md/agents/homepage/reports.md`](md/agents/homepage/reports.md) (work log).
- **Tasks epic (Daily Task Management, Tasks Hub, Notifications):** [`md/agents/tasks/readme.md`](md/agents/tasks/readme.md) (specification) and [`md/agents/tasks/reports.md`](md/agents/tasks/reports.md) (work log).
- **Current assigned task:** [`md/task.md`](md/task.md) — **active only when the owner explicitly directs you to execute it.**
- **Historical & audit records:** [`docs/audit/ARCHITECTURE_AUDIT.md`](docs/audit/ARCHITECTURE_AUDIT.md), [`docs/audit/BUG_INVENTORY.md`](docs/audit/BUG_INVENTORY.md), [`docs/audit/TECHNICAL_DEBT.md`](docs/audit/TECHNICAL_DEBT.md), [`docs/audit/STABILIZATION_PLAN.md`](docs/audit/STABILIZATION_PLAN.md), [`docs/audit/codebase-detox/`](docs/audit/codebase-detox/), [`.local/review/phase01/README.md`](.local/review/phase01/README.md) (local-only), and [`md/read/reconstruction.md`](md/read/reconstruction.md).

---

## 2. Task Activation & Ownership Protections

1. **Explicit task activation:** [`md/task.md`](md/task.md) becomes active **only** when the owner explicitly instructs an agent to follow it. Its presence in the repository does not authorize autonomous execution.
2. **Archived prompts are inactive:** Files under [`md/archive/pre-reorganization/`](md/archive/pre-reorganization/README.md) and [`docs/audit/STABILIZATION_PLAN.md`](docs/audit/STABILIZATION_PLAN.md) are historical or proposed records and never authorize implementation on their own.
3. **Read-only user files:** Never edit, move, or reformat [`md/user/user_desc.md`](md/user/user_desc.md) or [`md/user/user_notes.md`](md/user/user_notes.md). Treat `user_notes.md` as personal context; confirm new ideas with the owner before promoting them to product requirements.
4. **Clarification over silent invention:** Distinguish **Confirmed requirement**, **Observed implementation**, and **Open decision**. Agents may update confirmed documentation and observed implementation facts during authorized work, but must ask the owner (showing competing sources, practical impact, and a recommendation) before introducing or changing product rules.
5. **Local-only reference media:** Everything under `.local/` (`.local/sources/`, `.local/review/`, `.local/scratch/`) is ignored by Git and may be absent in a fresh clone. Do not modify `.gitignore` to publish them. If an assigned task depends on a missing reference asset, explain the dependency, ask the owner, and continue independent work.

---

## 3. Architecture & Coding Rules

- **Strict layer boundaries (enforced by `eslint.config.mjs`):**
  `UI (src/features, src/ui, src/app pages) → Client (src/client) → HTTP API (src/app/api) → Services (src/services) → StorageAdapter (src/services/storage)`.
  - Keep `src/contracts/` and `src/domain/` pure and framework-free.
  - Keep SQLite and filesystem access strictly inside `src/services/storage/`.
  - Read `process.env` only in `src/server/config.ts` (plus the `NEXT_RUNTIME` guard in `src/instrumentation.ts`).
  - Access `window.localStorage` only in `src/client/preferences.ts`.
  - Use `TransitionLink`, `useTransitionRouter`, and `PageReady` from `src/features/transitions/` for internal route navigation.
- **Shared task identity:** Daily Task Management and Tasks Hub operate on one `tasks` table and share `TaskCard` and `TaskForm`. Changing `scheduledDate` schedules a task on the Daily calendar without altering `deadlineAt`; Overdue Transfer updates both `scheduledDate` and `deadlineAt`.
- **Code style:** Strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`), 2-space indentation, single quotes, semicolons, trailing commas, 100-character print width, `@/` import alias, `PascalCase.tsx` for components, `kebab-case.ts` for domain/service modules.
- **UI/UX & motion:** Follow [`md/agents/shared/uiux.md`](md/agents/shared/uiux.md) for closed-palette tokens (`src/design/tokens.css`), sentence-case typography (with the homepage vector wordmark as the sole uppercase exception), allowed motion curves/timings (`src/design/motion.ts`), `prefers-reduced-motion` support, and scoped visual exceptions for Homepage and Daily Task Management V2. Never use raw hex/rgb colors outside `tokens.css`, `100vw`, monospace fonts, or `transition: all`.

---

## 4. Commands, Verification & Git Policy

Run commands from the repository root with **Node.js 22+**:

- `npm ci` — install locked dependencies reproducibly.
- `npm run dev` — start the local development server (`http://localhost:3000`).
- `npm run check` — run ESLint (`npm run lint`), TypeScript (`npm run typecheck`), and Vitest (`npm test`).
- `npm run build` / `npm start` — build and run the production bundle.
- `npm run format` — format `src/` and `tests/` with Prettier.
- `npm run db:generate` / `npm run db:migrate` — generate or apply Drizzle migrations. **Warning:** `drizzle.config.ts` targets `./data/hiep-trong-space.db` while runtime resolves `DATA_DIR` and `DATABASE_FILE` from `.env`; always verify migration targets before running CLI migrations.

### Change-appropriate verification

- **Documentation-only changes:** Verify file/anchor links, markdown structure, requirement coverage, and SHA-256 preservation of protected files. Do not run application builds or test suites solely to validate Markdown edits.
- **Code changes:** Add or update focused regression tests (`tests/**/*.test.ts` / `.test.tsx`) and run `npm run check`. Review keyboard access, responsive viewports (`320px`–`1440px`), and `prefers-reduced-motion` for UI changes.
- **Routing, bundling, asset, dependency, or release changes:** Also run `npm run build`.

### Git & commit policy

- **Explicit commit authorization:** Create local Git commits **only** when explicitly requested by the owner or authorized by an explicitly activated assignment in [`md/task.md`](md/task.md). Never push to a remote, rewrite history, or discard uncommitted user changes without permission.
- When authorized to commit, use prefixes such as `feat(scope):`, `fix:`, `docs:`, or `chore(scope):`, and never stage `.env`, databases, media, or backups.

---

## 5. Communication & Output Rules

- **Relative paths only:** Never give full/absolute directory paths unless explicitly requested by the user. Always use clean relative paths from the workspace root (e.g., `src/ui/Button.tsx`, `md/readme.md`, `docs/reports/2026-11-18-example.pdf`).
- **Conditional report updates:** Only write or update reports (`docs/reports/`, `docs/notes/report-*.md`) when explicitly instructed by the user; never update them automatically for standard responses.

---

## 6. Where Files Go

Keep the repository root limited to configuration files and the top-level folders below. Do not create new top-level folders.

| If it is… | It goes to… |
| --- | --- |
| Instructions an agent must follow | `md/` |
| A report, audit, or note a person reads | `docs/` (reports named `YYYY-MM-DD-topic`, one `.tex` and one `.pdf`) |
| Evidence, screenshots, reference media | `.local/` (never committed) |
| A copy, experiment, or measurement | `.local/scratch/`, deleted when done |
| A script | `scripts/<purpose>/` |
| Build output | `.next/` (preview builds: `.next-preview/`) |

`npm run clean` removes build output and scratch files.
