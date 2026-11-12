# Engineering remediation checkpoint

10 November 2026. Scope: critical defects before broad UI redesign. Implemented and locally verified by Codex; this is not independent review. The owner approved a separate existing-feature baseline commit (`a1485fd74f935ae2ad528a11a04b5f6a660a11b0`) and a subsequent fixes commit. No push, deployment, database migration, personal-data rewrite or broad redesign was performed.

## Finding disposition

| Finding | Engineering result | Remaining acceptance criteria |
|---|---|---|
| F01 | Resolved: atomic JSON replacement, cross-instance/process lock, locked read-modify-write, no mutable cache, last-valid backup, corrupt/invalid file preservation, configured DATA_DIR, legacy-path refusal | Backups are one previous valid version, not a version-history system. A crash can leave a lock requiring the recovery procedure below. |
| F02 | Resolved: relative-path and realpath containment reject sibling prefixes and junction escapes; directory traversal skips links | Read-only archive access retained. |
| F03 | Resolved: mutation origin/content/body guards, date and numeric validation, chronology checks, missing-record errors, shared error handling | Existing optional product fields remain backward compatible; no schema migration. |
| F04 | Resolved: all eleven new workspace routes signal PageReady | Navigation styling/motion refinement remains in M01/M02. |
| F05 | Resolved: undefined static tokens and unregistered utilities repaired; guardrail tests added | Full visual contrast review remains separate. |
| F06 | Partial: shared portal/focus-trapped dialogs, form labels, keyboard article/week cards, skip link | Full nested-overlay and assistive-technology matrix remains M01/M11. |
| F07 | Resolved: failed loads have Retry; failed writes retain form input; affected async handlers contain rejection and guard duplicate submissions; dialogs close after successful writes | Product-specific validation presentation can be refined with each UI milestone. |
| F08 | Partial: events render only on the correct local weekday, exclude adjacent weeks, use actual calendar-week statistics; week cards keyboard accessible | Month/navigation, recurrence expansion and occurrence editing remain functional work in M04. |
| F09 | Partial: events, projects, milestones and enabled achievement dates feed shared notifications with stable links; dedupe/read retention and live reschedule/delete/completion/mute suppression | Recurring occurrences and configurable per-source reminder timing remain M03/M04. Current non-task alert window is 24 hours and overdue. |
| F10 | Partial: wall-clock timing, real focus/break/pause accounting, actual five-minute break, real start/end timestamps/streaks; Skip notes logs the session; failed save retains reflection | Active, unsaved sessions remain component-local and do not survive page reload/navigation. Persisted completed sessions survive reload. Recovery is still functional work in M07. |
| F11 | Partial: local-day dates, consecutive streaks, bounded last-seven-day statistics, truthful zero-data values; removed guaranteed-energy claim | Interactive planning calculator and trend UI remain M07. |
| F12 | Partial: explicit Save draft, draft labels, reload/resume/edit using the same ID, local publish, original-source capture, unsaved close/reload warning, failed-write retention | Rich-text tools/rendering, full sources editor and optional music remain M08. Explicit Save draft is durable; there is no automatic draft autosave. |
| F13 | Resolved for new profiles: no automatic personal-history seeds or fabricated sync claims | Existing mixed seed/user files deliberately preserved. Any provenance review or removal requires a separate backed-up, reviewable operation. |
| F15 | Partial: closing emphasis resolves to defined cosmos tokens | Atmospheric/home phase design remains M02. |
| F17 | Resolved for audited clipping defects: wrapping filters, bounded exam/event grids and stacked narrow week agenda | Future redesigned layouts still require 320px checks. |
| F19 | Partial: removed fabricated missing-library fallback; failures are explicit/retryable; file boundary secured under F02 | Root-selection UX, scanning performance and ocean design remain M06. |
| F20 | Partial: honest local-note/saved wording and truthful empty selection | Actual import/refresh and roadmap stage consistency remain M09. |
| F21 | Partial: finite review completion, empty-deck guard, duplicate-write protection, removed unsupported spaced-repetition claim | Complete shortcut/review UX verification in M09; no speculative SRS added. |
| F24 | Resolved: branded service errors survive bundle/prototype boundaries; past deadlines return 400 and deadlineAt guidance in production | Existing task identity/deadline semantics retained. |

F14/F16/F18/F22/F23 remain assigned to their original product/UI milestones except the shared repairs above. Compound findings are not declared fully closed merely because their engineering subset passes.

## Modified components

- Persistence: JsonFileStore; atomic mutations in event/project/milestone/blog/achievement/learning/tracking/AI/flashcard/entertainment services; APCS path access.
- Boundaries: API handlers for the new feature families, contracts, branded AppError handling, server container.
- Business logic: event calendar domain, local activity-day calculations, focus session accounting, timed-source projection and notification DTO/service.
- Interaction: eleven workspace pages/views and feature styles, shared WorkspaceShell skip link, item deep-link focus helper, token aliases. Writing uses the existing create/update API rather than a new persistence system.
- Tests: JSON preservation/concurrency/failure, APCS containment, route boundaries, domain dates/calendar, timer accounting/failure, draft resume/failure, notifications and token registration.

## Verification evidence

`npm run check`: **passed**, ESLint + TypeScript + **33 test files / 130 tests**. `npm run build`: **passed**, production Next.js 15.5.28, Node v26.13.0. Builds/runtime use an isolated copy and synthetic data (`DATA_DIR=./data`, `DATABASE_FILE=engineering.db`), never the personal database.

Local evidence directory: [engineering-2026-11-10](review/quality-remediation/engineering-2026-11-10/). It is intentionally Git-ignored. Includes check/build logs, executable browser probes, screenshots, result JSON and source hash manifest. A clean clone does not contain local screenshots.

- Production: past task deadline → 400 with field guidance; invalid event timestamp → 400; cross-site mutation → 400.
- Event dialog: desktop 1440 and phone 390 captures; 14 Tab presses stayed inside; Escape closed; one fixture event appeared once in its week.
- Normal-motion Universe-to-Events navigation completed in approximately 3.4 seconds, below the former 11-second failsafe.
- Writing: save draft → reload → resume → edit → local publish retained original source and one record identity. Component regression also rejects failed-write loss and allows canceling unsaved close.
- Four timed-source fixtures: four alerts, correct destinations; all obsolete alerts suppressed after reschedule/completion/delete/mute. Service tests cover dedupe/read-state behavior and retention.
- Eleven routes checked at 320px with no document horizontal overflow. Screenshots additionally reviewed for internal clipping; Events exam-grid minimum width was corrected after that review.
- Failed GET injection checks distinguish error/retry from empty data across the eleven feature views.
- Synthetic filesystem tests cover 20 independent concurrent creates, 20 singleton read-modify-write updates, a transient Windows lock-delete error, failed replacement, corrupt bytes, malformed records and previous-valid backup.

No claim is made that these targeted checks constitute a new full-site audit or complete visual acceptance. The original audit remains the baseline. Build artifacts precede whitespace-only cleanup; runtime source semantics match the checkpoint.

## Data recovery and compatibility

1. Stop all app processes before recovery. Copy the affected JSON, `.bak`, any `.tmp` and `.lock` files to a separate backup directory before changing anything.
2. A malformed existing JSON produces an error; reads/writes do not replace it with defaults. Inspect the preserved original and previous-valid `.bak`. Restore only a verified backup after reviewing which records it contains; it may predate the latest successful write.
3. Writers wait up to five seconds for the exclusive lock. After a crash, confirm no writer is running before manually removing a stale `.lock`. Do not delete locks from a running application.
4. If DATA_DIR points elsewhere while legacy `./data/<file>` exists, the store refuses to create a replacement silently. Restore the prior configuration or explicitly copy a verified backup to the intended directory. No automatic data migration occurs.
5. Existing persisted records remain. New personal stores start empty. API shapes and notification SQL schema remain compatible; new notification source data uses optional payload fields. The JSON store has structural validation, not a general automatic repair tool.

Protected `md/user/user_desc.md` and `md/user/user_notes.md` SHA-256 values match the initial snapshot. Unrelated Home/Daily/registry/UniverseMenu/blueprint/source-list changes remain outside this checkpoint.

## Flash handoff

Use the updated [remediation ledger](REMEDIATION_PLAN.md) and [design guide](DESIGN_SYSTEM_GUIDE.md), retaining these regression tests. M02 establishes the polished Home/Daily/Hub reference; M04–M10 own each feature theme and the explicitly listed remaining functional criteria. M01 still needs full visual/accessibility review; M11 remains final cross-product acceptance. Do not remove existing mixed data or claim recurrence, recovery, rich text, import or editing features are complete based on this checkpoint.
