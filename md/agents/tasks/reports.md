# Tasks Epic — Implementation & Verification Reports

`md/agents/tasks/reports.md` records the dated implementation milestones, visual upgrades, and forensic audit snapshots for the **Tasks epic** (`/tasks/daily`, `/tasks/hub`, and the Notification Center). For current requirements and architecture, see [`readme.md`](readme.md).

---

## UI/UX plan implementation — 13 November 2026

- Implemented the owner's approved Daily changes, celestial Hub notes/detail dialog, reliable portaled task menus, sakura Notifications, and shared focus/toast improvements. Existing task identity, deadlines, ordering, reminder generation, and storage rules remain unchanged.
- The owner's subsequent all-epic continuation instruction superseded intermediate review stops. Final owner visual acceptance remains pending; no approval is inferred from verification.
- Final full checks pass: ESLint, TypeScript, 174 tests in 45 files, and production build. Responsive screenshots and controlled task interaction/performance evidence are recorded in the [root review](../../../review.md) and [verification record](../../../review/verification.md).
- Native browser zoom and Windows reduced-motion verification remain manual review items; controlled reduced-motion tests pass. No supplemental Homepage or Daily artwork was integrated.

---

## 1. Phase 1 & 2 Core Tasks, Storage & Notification Engine (2–3 November 2026)

- **Scope:**
  - Implemented SQLite schema (`tasks`, `task_subtasks`, `task_media`, `notifications`) via `better-sqlite3` and Drizzle ORM (`src/server/db/`).
  - Built pure domain rules in `src/domain/tasks/task-rules.ts` (`isTaskOverdue`, `isTaskDueSoon`, `validateTransfer`, `sortTasksCanonical`) and `src/domain/notifications/notification-rules.ts` (`due_24h`, `due_quarter`, `overdue`, `completed` replacement, 7-day purge).
  - Built `TaskService`, `NotificationService`, `MediaService`, `LocalStorageAdapter`, and `DriveStorageAdapter` stub, wired to `/api/tasks/**`, `/api/media/[id]`, and `/api/notifications/**`.
  - Built initial `DailyBoard`, `HubList`, `TaskComposer`, `TaskDetailDrawer`, `TransferDialog`, and `NotificationPopover`.

---

## 2. Daily Task Management V2 ("Celestial Luxury") & Active-Board Carousel Upgrade (4–6 November 2026)

- **Scope:**
  - Upgraded `/tasks/daily` from the initial light/flat 3-column layout to the **Celestial Luxury V2** dark observatory aesthetic (`--daily-*` tokens, `DailySky.tsx`, `DailyDashboard.tsx`, `DailyHeaderDate.tsx`, and 10 SVGs deployed to `public/visuals/daily-v2/`).
  - Replaced the flat 3-column day grid with the interactive **active-board carousel** (`DayCarousel.tsx`) centering `Today` between scaled/dimmed `Yesterday` and `Tomorrow` preview boards.
  - Added DOM-measured `3.5`-card viewport clipping (`ResizeObserver` in `DayTaskList.tsx`) with a custom constellation scrollbar (`celestial-scroll-thumb.svg`).
  - Enhanced `WeekView.tsx` with circular progress rings, priority planet counts, independent `due this day` counters, and day inspection drawers; enhanced `MonthView.tsx` with a 42-cell Monday-first calendar grid and day drawers.
  - Scoped Celestial V2 task card styles (`daily-task-card.module.css`) strictly to `carousel` and `overdue` contexts on `/tasks/daily` so `/tasks/hub` (`context="hub"`) remains clean light lavender.
- **Verification Snapshot (6 Nov 2026):**
  - Added focused feature tests (`tests/features/tasks/daily-v2-upgrade.test.tsx`, `day-carousel.test.tsx`, `week-view.test.tsx`, `month-view.test.tsx`, `task-card.test.tsx`).
  - All 21 Vitest test files (86 tests) passing.

---

## 3. Forensic Architecture & Bug Audit Snapshot (6 November 2026)

- **Scope:** Comprehensive code audit documented in [`../../../docs/audit/`](../../../docs/audit/).
- **Tasks & Notifications Findings (`BUG_INVENTORY.md`):**
  - `C01` (High): `TaskService.createTask` does not invoke `notificationService.evaluateTaskNotifications()`, delaying immediate `due_24h`/`due_quarter`/`overdue` notifications until the next cron tick or `GET /api/notifications`.
  - `C02` (High): `computeEligibleNotifications` uses `task.updatedAt` in reminder window math if `createdAt` is not isolated from routine edits.
  - `C03` (Medium): `GET /api/notifications` executes write side effects (`evaluateTaskNotifications()`).
  - `C04` (High): `TaskService.deleteTask` relies on SQLite `ON DELETE CASCADE` for `task_media` rows without first deleting physical media files via `StorageAdapter.delete()`.
  - `C05` (High): `TaskService.updateTask` uses `patch.scheduledDate ?? existing.scheduledDate`, preventing `PATCH /api/tasks/:id` with `{ scheduledDate: null }` from unscheduling a task back to Hub.
  - `C06`–`C12`, `C14`: Additional validation, timezone, pagination, and `drizzle.config.ts` DB filename (`hieptrong.db` vs `app.db`) findings cataloged with remediation steps in [`../../../docs/audit/STABILIZATION_PLAN.md`](../../../docs/audit/STABILIZATION_PLAN.md).

---

## 4. Documentation Reconstruction & Consolidation (7 November 2026)

- **Scope:** Consolidated all Tasks & Notifications documentation from the legacy `PROJECT_DESCRIPTION.md`, `md/agents/ui_ux.md` (Section 16), `md/agents/DESIGN_SPEC.md`, `md/agents/ASSET_GUIDE.md`, `md/agents/agent_readme.md`, `md/agents/context.md`, and `sources/img/daily-v2-reference/AGENT_PROMPT.md` into [`readme.md`](readme.md) and this report log.
- **Archive & Audit Trail:** See [`../../read/reconstruction.md`](../../read/reconstruction.md) and [`../../archive/pre-reorganization/README.md`](../../archive/pre-reorganization/README.md).

---

## 5. Stabilization Plan Execution (`C01`–`C12`, `C14`, `R01`, `S01`–`S03`, `D01`–`D04`, `D06`, `D11`) (7 November 2026)

- **Scope:** Executed the stabilization sequence from [`../../../docs/audit/STABILIZATION_PLAN.md`](../../../docs/audit/STABILIZATION_PLAN.md):
  - **Form draft sessions (`C01`, `D02`):** Keyed draft initialization in [`TaskForm.tsx`](../../../src/features/tasks/TaskForm.tsx), [`TransferDialog`](../../../src/features/tasks/TransferDialog.tsx), and [`ScheduleDateDialog`](../../../src/features/tasks/TransferDialog.tsx) by open session and target task ID so minute/midnight ticks and task refetches never reset unsaved drafts.
  - **Deadline identity (`C02`):** Preserved canonical `YYYY-MM-DD` dates and unchanged `deadlineAt` instants (including sub-minute precision) in [`date-input.ts`](../../../src/domain/date-input.ts), [`TaskForm.tsx`](../../../src/features/tasks/TaskForm.tsx), and [`TransferDialog.tsx`](../../../src/features/tasks/TransferDialog.tsx).
  - **Request & local boundary hardening (`R01`, `C08`, `D01`):** Bound `next dev` and `next start` to `127.0.0.1` in [`package.json`](../../../package.json) and added `assertSameOriginMutation`, `parseJsonBody`, and `parseUuidParam` in [`api-response.ts`](../../../src/server/api-response.ts).
  - **Atomic partial updates & transactions (`C03`, `C04`, `D03`, `S03`):** Added `patchItem` to [`LocalTaskRepository`](../../../src/services/storage/local/local-task-repository.ts), SQLite savepoint transactions (`runInTransaction`) and migration-failure handle cleanup to [`LocalStorageAdapter`](../../../src/services/storage/local/local-storage-adapter.ts), and transactional task/notification transitions in [`TaskService`](../../../src/services/task-service.ts).
  - **Canonical UTC & calendar validation (`C05`, `C06`, `D11`):** Normalized `isoInstantSchema` to canonical `.toISOString()` and validated real calendar days in `scheduledDateSchema` ([`task.ts`](../../../src/contracts/task.ts)) and [`shiftScheduledDate`](../../../src/domain/time.ts).
  - **Notification reopen cleanup, 7-day query cutoff & tick serialization (`C07`, `C14`, `S02`):** Cleaned up stale `completed` notifications in `uncompleteTask`, enforced the 7-day retention cutoff in `listNotifications`, and added in-flight tick deduplication and post-success `lastTickAt` updates in [`NotificationService`](../../../src/services/notification-service.ts) and [`scheduler.ts`](../../../src/server/scheduler.ts).
  - **Config & CLI alignment (`C09`, `C10`, `D06`):** Validated `APP_TIMEZONE` via `Intl.DateTimeFormat` and shared `resolveDatabasePath` between [`config.ts`](../../../src/server/config.ts) and [`drizzle.config.ts`](../../../drizzle.config.ts).
  - **Optimistic cache & UI accessibility (`S01`, `D04`, `C11`, `C12`):** Scoped optimistic rollbacks per task/notification item and recomputed `reminderAt` in [`tasks.ts`](../../../src/client/queries/tasks.ts) and [`notifications.ts`](../../../src/client/queries/notifications.ts); added keyboard disclosure (`aria-expanded`) and context-scoped DOM IDs in [`TaskCard.tsx`](../../../src/features/tasks/TaskCard.tsx).
- **Verification:** `npm run check` passed across 25 test files (`104` tests).


