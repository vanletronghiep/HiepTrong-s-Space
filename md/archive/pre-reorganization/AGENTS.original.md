# Repository Guidelines

## Project Structure & Module Organization

Hiep Trong Space is a Next.js App Router application for personal task management. Start with Level 1 of [md/PROJECT_DESCRIPTION.md](md/PROJECT_DESCRIPTION.md); consult Level 2 for implementation details and [md/ui_readme.md](md/ui_readme.md) for visual specifications.

- `src/app/`: pages, workspace routes, and JSON API handlers.
- `src/features/`, `src/ui/`, `src/design/`: feature screens, shared components, tokens/fonts/motion.
- `src/client/`: API client, TanStack Query hooks, preferences.
- `src/contracts/`, `src/domain/`: Zod schemas/types and pure business rules.
- `src/services/`, `src/server/`: services, storage adapters, configuration, scheduler.
- `tests/`: mirrors functional areas; `drizzle/`: migrations; `public/`: assets.
- `data/`: ignored runtime SQLite/media storage.

## Build, Test, and Development Commands

Use Node.js 22+ and run commands from the repository root:

- `npm ci`: install locked dependencies.
- `npm run dev`: start local development.
- `npm run build` / `npm start`: build and serve production.
- `npm run check`: run ESLint, TypeScript, and Vitest.
- `npm test` / `npm run test:watch`: run tests once or continuously.
- `npm run format`: apply Prettier to source and tests.
- `npm run db:generate`: generate migrations after schema changes.

## Coding Style & Architecture

Use strict TypeScript, two-space indentation, single quotes, semicolons, trailing commas, and a 100-character print width. Name components `PascalCase.tsx` and domain/service modules `kebab-case.ts`. Use the `@/` source alias.

Preserve UI → client → API → services → storage boundaries. Keep filesystem/database access inside storage adapters. Use design tokens, `TransitionLink`/`useTransitionRouter`, and `PageReady` for new destinations. Daily and Hub share one task record: scheduling changes `scheduledDate`; transfer changes schedule and deadline.

## Mandatory UI/UX Motion & Transition Rules

Every interaction and visual state change must feel exceptionally smooth, fluid, responsive, and professionally polished. 

## Testing Guidelines

Use Vitest and Testing Library; name tests `*.test.ts` or `*.test.tsx` under `tests/`. UI tests opt into jsdom. Storage/service tests use temporary databases and injected clocks. No coverage threshold is configured. Add focused regression tests for changed behavior; run `npm run check`. Review responsive layouts, keyboard access, and reduced motion for UI changes.

## Commit & Pull Request Guidelines

History commonly uses `feat(scope):`, `fix:`, `docs:`, and `chore(scope):`; prefer these descriptive prefixes. PRs should explain behavior changes, link related issues when available, report validation, and include screenshots for visual changes. Identify migration/configuration impacts.

## Security & Configuration

Copy `.env.example` to `.env` if absent. Never commit secrets, databases, media, or backups. Confirm migration targets: runtime paths are configurable, but `drizzle.config.ts` uses the default database. Google Drive remains a stub; the application assumes trusted local use without authentication.
