# Project context

Last updated: 2026-11-12 (Asia/Saigon).
Git HEAD: `a1485fd74f935ae2ad528a11a04b5f6a660a11b0`.

Evidence labels: **VERIFIED** = source/config inspected or command executed;
**INFERRED** = conclusion from that evidence, without runtime reproduction;
**UNKNOWN** = not established. Source inspection does not establish end-to-end correctness.

## Start here and preserve the working tree

- **VERIFIED:** No previous root `PROJECT_CONTEXT.md` existed. This was full discovery.
- **VERIFIED:** Discovery began on `main` with 124 Git status entries, including staged,
  unstaged, partially staged, and untracked work. HEAD alone does not describe this baseline.
  No checkout, staging, commit, cleanup, dependency installation, or source edit was performed.
- **VERIFIED:** The only authored project file is this document. Verification generated
  compiler/build caches. Application startup, real-data migrations, seeds and deployment were
  not run. The authorized follow-up ran migrations only on disposable test databases.
- **VERIFIED:** Read root `AGENTS.md`, `.agents/AGENTS.md`, and `md/readme.md` for workflow.
  `md/task.md` is inactive unless explicitly activated. Archived prompts/plans authorize no work.
  Never edit `md/user/user_desc.md` or `md/user/user_notes.md`.
- Standing owner rules: named-file scope; smallest behavior-preserving cleanup; no bug fixes
  during cleanup; prove deletions unused; no package/data/config changes without authorization.
  Ask before behavior/UI/data/route changes, unclear new failures, dangerous findings, or work
  exceeding roughly 10 files/300 changed lines. Use a branch for subsequent implementation;
  commits still require explicit authorization under root `AGENTS.md`. Never push implicitly.
- Future tasks: compare checks with this baseline, update this document when facts change,
  and report files changed, deletions/evidence, checks, bugs, assumptions, and manual verification.
- **VERIFIED:** `BUGS_FOUND.md` is absent. Discovery permits only this document to be authored,
  so findings below were not added to a separate bug log. Existing audit inventories are dated
  evidence, not proof that their bugs remain present.

## Purpose

**VERIFIED:** Hiep Trong Space is a single-user, local-first personal management website.
It combines a cosmic homepage/Earth journey with workspaces for tasks, events, writing,
university materials, learning, habits, projects, milestones, achievements, and leisure.
The intended trust model is a personal local process, without login or multi-user isolation
(`README.md`, `PROJECT_DESCRIPTION.md`, `src/features/registry.ts`, workspace route files).

## Stack and exact commands

**VERIFIED:** `package.json`, lockfile version 3 in `package-lock.json`, and configs establish:

| Area | Locked version / implementation |
|---|---|
| Runtime observed | Node v26.13.0, npm 11.20.0; README requires Node 22+ |
| App | Next.js 15.5.28 App Router, React/React DOM 19.3.1, TypeScript 5.9.3 |
| Styling/motion | Tailwind CSS 4.3.3, CSS modules, CSS variables, Motion 12.43.0 |
| Rendering | Three.js 0.187.0, Canvas 2D starfield, local SVG/WebP assets |
| Client data | TanStack Query 5.105.0, shared typed `apiRequest` |
| Validation/dates | Zod 3.25.76, date-fns and @date-fns/tz |
| Persistence | Drizzle ORM 0.39.3 + better-sqlite3 13.0.3; additional JSON files |
| Checks | ESLint 9.39.5, Vitest 3.2.7, Testing Library/jsdom, Prettier |

**VERIFIED:** Scripts below are literal `package.json` values; run from repository root.

| Command | Script / purpose |
|---|---|
| `npm run dev` | `next dev -H 127.0.0.1` |
| `npm run build` | `next build` |
| `npm start` | `next start -H 127.0.0.1` |
| `npm run lint` | `eslint src tests` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | `vitest run` |
| `npm run test:watch` | `vitest` |
| `npm run check` | `npm run lint && npm run typecheck && npm test` |
| `npm run format` | Prettier writes source/tests; do not run broadly during discovery |
| `npm ci` | Locked installation; not run during discovery |
| `npm run db:generate` / `npm run db:migrate` | Drizzle generation/migration; not discovery checks |

**VERIFIED:** `next.config.ts` externalizes better-sqlite3 and selects `.next` or `build`
through `HOME_PREVIEW_BUILD`. `tsconfig.json` includes both generated type directories.
`src/design/fonts.ts` uses `next/font/google`; building can require Google Fonts access.
`.env.example` documents APP_TIMEZONE, STORAGE_DRIVER, DATA_DIR, DATABASE_FILE, MEDIA_DIR,
GOOGLE_DRIVE_FOLDER_ID, and SCHEDULER_TICK_SECONDS. Real `.env` was not opened or printed;
Next reported automatically loading it during the build. No variable values were inspected.

**VERIFIED:** No repository CI workflow or hosting/deployment manifest was found in the
enumerated source tree. **UNKNOWN:** actual hosting, running processes, firewall/exposure,
backup reliability, real environment settings, and external services used outside this repo.

## Folder map and architecture

**VERIFIED:** Root folders, excluding dependency/build/VCS output:
`.agents`, `data`, `docs`, `drizzle`, `md`, `public`, `review`, `scripts`, `sources`, `src`, `tests`.
Dependency/build folders present: `node_modules`, `.next`, `build`; Git metadata: `.git`.
Runtime data and reference-media contents were not read.

```text
src/app/                 Root layout/providers, homepage, error/not-found, preview/home-motion
  (workspace)/           Shared layout + 13 feature destinations (tasks/daily and tasks/hub)
  api/                   tasks, notifications, health, events, projects, milestones, blogs,
                         achievements, learning-room, tracking, ai-engineering, flashcards,
                         entertainment, apcs (including file/search)
src/features/            One directory per feature; home, tasks, notifications, transitions,
                         plus blank/BlankPage.tsx (legacy candidate)
src/client/queries/      TanStack Query hooks; client also owns apiRequest/preferences/ticker
src/contracts/           Zod input/record/DTO schemas and inferred TypeScript types
src/domain/              Pure date, task, event, project, milestone, reminder/activity logic
src/services/            Task/notification services and services for eleven newer spaces
src/services/storage/    Adapter interfaces/factory, JSON store, APCS filesystem reader
  local/                 SQLite schema/repos/adapter and local media storage
  drive/                 Google Drive adapter stub (throws 501 NotImplementedError)
src/server/              Config, container, API error/mutation helpers, scheduler, logger
src/ui/                  Shell, menu, buttons, dialogs/drawers/popovers, focus/anchor helpers
src/design/              tokens.css, fonts.ts, motion.ts
drizzle/                 One SQL migration and metadata; read only during discovery
tests/                   client, design, domain, features, server, services/storage
public/                  brand, earth textures/attribution, daily-v2 artwork, icon
scripts/phase01/         Asset preparation, review capture and review server; not run
md/                      Documentation hub, agents/{shared,homepage,tasks}, read, user,
                         archive/pre-reorganization, inactive task and progress files
docs/audit/              Historical architecture, bug, debt and stabilization reports
sources/, review/        Git-ignored local references/evidence; not portable clone inputs
data/                    Git-ignored personal runtime storage; never use as test fixtures
```

**VERIFIED data flow:** Route pages compose feature views; `src/app/providers.tsx` supplies
Query/Toast/Transition providers; `(workspace)/layout.tsx` wraps `WorkspaceShell`.
Features -> `src/client/queries/*` -> `src/client/api-client.ts` -> `src/app/api/**/route.ts`
-> services -> storage. Contracts/domain/design supply shared foundations.
`eslint.config.mjs` uses `no-restricted-imports`/properties to enforce important boundaries.

- **VERIFIED:** Task/notification routes use lazy `src/server/container.ts`, injected Clock,
  and StorageAdapter. SQLite has tasks + notifications, indexes, dedupe uniqueness, FK cascade,
  WAL, transactions/savepoints (`storage/local/schema.ts`, adapter, `drizzle/*.sql`).
- **VERIFIED:** Newer services mostly use module-level singletons and `JsonFileStore` directly;
  some collections contain one record with nested arrays. They bypass the configurable Drive
  adapter. APCS reads a hardcoded `D:\APCS\University\Year I` archive synchronously.
- **VERIFIED:** JSON transactions use exclusive lock files, temporary replacement, fsync and
  one previous-version `.bak`; load validation checks arrays, unique IDs and basic record shape.
  It does not validate every feature's nested schema (`storage/json-store.ts`).
- **VERIFIED:** Runtime startup calls scheduler -> container -> storage.init -> automatic SQLite
  migration, then notification purge/tick (`src/instrumentation.ts`, server scheduler/container).
  Do not start dev/production merely to inspect UI against personal storage.
- **VERIFIED:** Installed Next's instrumentation loader returns during phase-production-build
  (`node_modules/next/dist/server/lib/router-utils/instrumentation-globals.external.js`), which
  was checked before attempting the build. No server was started.
- **VERIFIED:** Tasks share one table, TaskCard and TaskForm. Changing scheduledDate differs
  from Transfer, which changes scheduledDate and deadlineAt (`services/task-service.ts`).
- **VERIFIED:** Notifications include timed event/project/milestone/achievement projections
  (`services/timed-sources.ts`), scheduler ticks, and a GET fallback tick (not a read-only probe).

## Feature inventory

Status scope: **works** means covered flows passed this session's tests, not complete product
acceptance. **unclear** means implementation exists but live behavior/persistence was not run.
All main file paths below are repository relative; source existence is VERIFIED.

| Feature / route | Main files | Status | Evidence |
|---|---|---|---|
| Homepage `/` | `src/features/home/HomeJourney.tsx`, `earth-scene.ts`, starfield/, feature-collection/ | works (tested subset) | Home journey, engine and gallery tests pass; WebGL/visuals UNKNOWN |
| Daily `/tasks/daily` | `src/features/tasks/DailyBoard.tsx`, DayCarousel, WeekView, MonthView, TaskForm | works (tested subset) | Calendar, draft, deadline identity tests pass; Statistics remains placeholder |
| Tasks Hub `/tasks/hub` | `src/features/tasks/HubList.tsx`, TaskCard, TaskForm, `src/client/queries/tasks.ts` | works (tested subset) | Hub/form/optimistic hook tests pass; full SQLite suite excluded |
| Notifications | `src/features/notifications/*`, `src/services/notification-service.ts` | works (tested subset) | Popover tests pass; service/scheduler persistence not executed |
| Navigation/shell | `src/features/transitions/*`, `src/ui/WorkspaceShell.tsx`, UniverseMenu | works (tested subset) | Transition and 13-feature route coverage tests pass |
| Events `/events` | `src/features/events/EventsView.tsx`, `src/services/event-service.ts`, `src/domain/event-domain.ts` | unclear | List/week, creation/deletion, exams; calendar helper test passes; no recurrence expansion found |
| Projects `/projects` | `src/features/projects/ProjectsView.tsx`, `src/services/project-service.ts` | unclear | Create, progress +/-5, status/next-step/blocker edits, delete; creation omits dates/links |
| Milestones `/milestones` | `src/features/milestones/MilestonesView.tsx`, `src/services/milestone-service.ts` | unclear | Create, landmark toggle, delete; creation sets targetDate null and project links empty |
| Writing `/blogs` | `src/features/blogs/WritingRoomView.tsx`, `src/services/blog-service.ts` | works (tested subset); risk below | Draft save/resume/failure tests pass; edit-ID carryover remains INFERRED |
| APCS `/apcs` | `src/features/apcs/ApcsView.tsx`, `src/services/storage/apcs-storage.ts` | unclear | Browse/search/preview/download + containment checks in source; archive access UNKNOWN |
| Learning `/learning-room` | `src/features/learning-room/LearningRoomView.tsx`, `src/services/learning-room-service.ts` | works (tested subset) | 3 timer/accounting/failure tests pass; active session recovery absent |
| Tracking `/tracking` | `src/features/tracking/TrackingView.tsx`, `src/services/tracking-service.ts` | unclear | Habits, sleep/screen logs and stats; pure activity-day tests pass, no live round trip |
| AI `/ai-engineering` | `src/features/ai-engineering/AiEngineeringView.tsx`, `src/services/ai-engineering-service.ts` | looks broken for new roadmap setup (INFERRED) | Empty roadmap default; UI reads/toggles only; API has toggle/note actions, no roadmap creation |
| Flashcards `/flashcards` | `src/features/flashcards/FlashcardsView.tsx`, `src/services/flashcard-service.ts` | unclear | Deck/card creation, finite confidence review in source; no dedicated feature regression suite |
| Achievements `/achievements` | `src/features/achievements/AchievementsView.tsx`, `src/services/achievement-service.ts` | unclear | Era filter, create/delete, future reminder; Edit mode does not edit existing record fields |
| Leisure `/entertainment` | `src/features/entertainment/EntertainmentView.tsx`, `src/services/entertainment-service.ts` | unclear | Books/progress, game creation, music display; limited maintenance flows |
| Motion preview `/preview/home-motion` | `src/app/preview/home-motion/page.tsx` | unclear | Separate preview route; not treated as accepted production UI |

## Health, consistency and cleanup candidates

- **INFERRED overall:** A structured core with uneven feature completeness, rather than an
  unstructured rewrite candidate. Preserve task identity, domain helpers, native storage,
  transitions, shared controls, and their regression tests while making bounded improvements.
- **VERIFIED:** Strict TypeScript/noUncheckedIndexedAccess, @/ imports, Zod API validation,
  shared origin/JSON/error guards, centralized localStorage, query caching, error boundaries,
  console-based server logger, focus traps and reduced-motion primitives are present.
- **VERIFIED:** UI tokens and shared primitives exist (`src/design/*`, `src/ui/*`), but newer
  views repeat headers, forms, retry/error markup, SVG icons, write-lock Sets and CSS classes.
  Some use shared Button/WorkspacePageHeader; others use native buttons/local module styling.
  Feature CSS duplicates modalOverlay/modalContent rules although shared Dialog is now used.
- **VERIFIED:** Task/notification API success envelopes use items/item; newer APIs also use
  success/data. Request errors are centralized; successful responses are mostly TypeScript casts.
  Task services inject clocks; newer services call new Date/crypto directly and validate unevenly.
  UI formatting mixes domain timezone helpers and browser-default toLocaleDateString.
- **VERIFIED:** WorkspaceShell imports Daily feature components/CSS; shared presentation knows
  feature details. DailyBoard/HubList repeat action/dialog coordination; avoid speculative merging.
- **VERIFIED hotspots (physical lines):** WritingRoomView 698; DailyBoard 631; LearningRoomView
  627; EventsView and TrackingView 612 each; starfield-engine 604; TransitionProvider 440.
  **INFERRED:** These mix state, interactions and presentation, increasing regression risk;
  file size by itself does not justify splitting or removing bespoke visual behavior.
- **INFERRED dead-code candidates, high confidence in scanned code:** BlankPage and
  getFeatureByHref have definitions but no consumers in src/tests/scripts/config searches.
  useCreateAiNote/useUpdateAchievement/useUpdateMilestone are exported without UI consumers.
  JsonFileStore retains ignored `_defaultSeed`. Modal CSS may be orphaned after Dialog adoption.
  Documentation and future API intent still reference some capabilities; dynamic/all-repo
  deletion evidence is incomplete. Nothing is approved for deletion; ask before removing.

## Known bugs, gaps and risks (not fixed)

No stored data was used to reproduce findings. Line numbers refer to this working-tree snapshot.

| ID / severity | Finding and how noticed | Evidence / confidence |
|---|---|---|
| B01 / breaks-something | Close an existing article editor, return to overview, then Write new piece: old editingId/draft fields survive; a later save can PATCH the previous article. Found by tracing open/close/save state. | `src/features/blogs/WritingRoomView.tsx:65`, :68, :71, :141, :376; INFERRED data-integrity risk, not runtime reproduced |
| B02 / annoying | A completed/backlog item can appear as Currently reading/playing when no item has that active status. Found comparing fallback selection with UI labels. | `src/services/entertainment-service.ts:37`, :38; `src/features/entertainment/EntertainmentView.tsx:168`, :187; VERIFIED source mismatch |
| B03 / annoying | Active Learning Room timer/reflection state is component-local and lost on reload/navigation before save. Found state/ref lifecycle; also acknowledged by prior remediation report. | `src/features/learning-room/LearningRoomView.tsx:35`, :51, :152; INFERRED impact; product recovery requirements need confirmation |
| B04 / annoying | Milestone delete closes its dialog immediately instead of waiting for success; failure loses selected dialog context although a page-level error exists. Found mutate/close sequence. | `src/features/milestones/MilestonesView.tsx:282`; VERIFIED sequence, INFERRED failure UX |
| Gap | AI has no new-profile roadmap setup; checkbox changes don't update stage.status. Whether stage status should be manual or derived is UNKNOWN. | `src/services/ai-engineering-service.ts:24`, :60; `src/features/ai-engineering/AiEngineeringView.tsx:143` |

- **VERIFIED risk:** JSON lock files can outlive a crashed writer; later writes time out after
  five seconds. Backups retain only one version; feature schemas are not comprehensively checked
  on read. Recovery must be reviewed/backed up, never performed automatically (`json-store.ts`).
- **VERIFIED:** No authentication by design; scripts bind loopback. Mutation origin/content
  guards and APCS lexical/realpath containment exist. **UNKNOWN:** safety of a shared/public
  deployment, actual process binding, and a complete security review. No exposed credential was
  observed in inspected files; this was not a comprehensive secret scan. Only `.env.example`
  matched the tracked environment/key/secret filename inventory.
- **VERIFIED:** Media adapter returns `/api/media/<id>`, but no media route exists. UI only
  accepts media URLs; this is unused/incomplete capability, not an observed upload regression
  (`storage/local/local-media-storage.ts`, TaskForm, route inventory).
- **VERIFIED documentation drift:** README/PROJECT_DESCRIPTION still say eleven BlankPage
  routes and hardcoded migration path; current pages have real views and drizzle.config.ts
  calls shared resolveDatabasePath. README's default 0.0.0.0 warning differs from loopback scripts.
  PROJECT_DESCRIPTION names eslint-plugin-boundaries, but config uses restricted imports.
  CODEBASE_DETOX_REPORT's TypeScript 5.8 differs from locked 5.9.3; its full green build/test
  claims are previous claims, not this baseline. Only this context document was corrected.
- **VERIFIED history:** Main has three broad checkpoints: initial 2026-11-06, d73ff8c on Nov 9
  (76 files, +6324/-2211), a1485fd on Nov 10 (91 files, +15296/-25). Other branch history has
  Nov 9 Daily cleanup commits bd735b2 (DailySky/test) and e1e937f (Daily CSS/test), not ancestors
  of main's log. **INFERRED:** Broad snapshots and extensive pending work complicate attribution.

## Baseline verification — 2026-11-12

| Check | Actual result |
|---|---|
| `npm run lint` | VERIFIED PASS, exit 0; 0 errors, 0 warnings reported |
| `npm run typecheck` | VERIFIED PASS, exit 0; 0 diagnostics |
| Safe test subset below | VERIFIED PASS, exit 0; 28 files / 99 tests passed, 0 failed; 20.32 seconds |
| `npm run build` | VERIFIED FAIL, exit 1; webpack reported EPERM mkdir `.next/static/chunks/app/api/health`; no successful build |
| Full `npm test` / `npm run check` | Not run as one full command; all 34 files exercised across two runs; follow-up results below |
| Browser/visual/accessibility/runtime checks | UNKNOWN; not run against personal application data |

Executed subset (arguments forwarded to the existing Vitest script):

```powershell
npm test -- tests/domain tests/client tests/features tests/design tests/server/config.test.ts tests/server/api-response.test.ts tests/server/engineering-validation.test.ts tests/services/storage/drive-storage-adapter.test.ts
```

**VERIFIED initial exclusions:** task-service, notification-service, local-storage-adapter use
temporary SQLite migrations; json-store/apcs-boundary write fixtures; engineering-routes uses
configured projects storage. These six files were initially excluded; see authorized follow-up.
Build failure cause below EPERM (sandbox permissions, ACL, locking, etc.) is UNKNOWN; no permission
change, cache deletion, dependency repair, or retry with modified config was attempted.

### Authorized persistence-test follow-up — 2026-11-12

Owner allows disposable OS-temp/dedicated-folder fixtures, including test migrations; never
read/write/migrate real SQLite/JSON data. Explain destinations before running; clean all outputs
and recheck protected hashes. Stop if isolation needs production changes.
**VERIFIED:** Ran `npm test --` with the six initially excluded files explicitly listed and
`--no-cache`: **4 files passed, 2 failed; 31 tests passed, 6 failed; exit 1; 3.62 seconds**.
Passing: task-service (9), notification-service (8), local-storage-adapter (6), engineering-routes (5).
JSON-store: 3 passed/5 failed at `json-store.ts:81` rename with EPERM. APCS: 1 failed at
`apcs-boundary.test.ts:17` junction creation with EPERM. Underlying cause is UNKNOWN; no fix/retry.
TEMP/TMP and DATA_DIR/MEDIA_DIR/DATABASE_FILE were overridden only in the child test environment,
under one unique OS-temp root. Precreated `projects.json` contained `[]`, avoiding legacy-path
fallback; it remained empty. Explicit fixture paths isolated SQLite/JSON/APCS operations.
Test hooks left 1 fixture entry; outer finally removed the entire validated temp root and
confirmed absence. Both protected SHA-256 hashes below match before/after. No source/test edits.
Combined runs account for 136 tests: 130 passed, 6 failed; this is not a single full-suite pass.

## Recommended next decisions

1. **INFERRED priority:** Establish a safe reproducible build/full-suite baseline and identify
   ownership of existing staged/unstaged changes before cleanup; do not discard them.
2. **INFERRED priority:** Review B01 in a separately authorized bug task with mocked/synthetic
   data. Confirm preservation of identity and canceled-editor behavior before changing code.
3. **INFERRED priority:** Reconcile feature-status documentation; then address new-profile and
   missing maintenance flows as product decisions, separately from behavior-preserving cleanup.
4. **INFERRED priority:** Cleanup only proven orphaned local code/CSS or identical duplication
   in explicitly named files; preserve storage safeguards and existing regression coverage.

**UNKNOWN / questions for owner:** What causes the EPERM build/fixture failures, and should a
separate investigation be assigned? Which pending changes belong to active work? Is deployment
intended to remain local-only? What should Write new piece do
with a canceled existing edit, and which currently incomplete feature flows are intended scope?

**VERIFIED integrity:** Protected-file SHA-256 at discovery start:
`md/user/user_desc.md` = `9DF2CD18CFE768C412FB58A540F8CB02BA25FA6D7C695697A4A1EF12AC0340E3`;
`md/user/user_notes.md` = `6803BD1AE2E9031C902785334A1087FA7E92E5C9A1EEC9F0FCD9AB417D0B82C4`.
Both hashes were rechecked after verification and match their starting values.
