# Stabilization plan

This is a proposed implementation sequence following the 6 November 2026 audit. No changes in this plan have been implemented. Findings and evidence limits are in [BUG_INVENTORY](<D:/Vibe Coding/HiepTrong's Space/docs/audit/BUG_INVENTORY.md>), with architectural context in [ARCHITECTURE_AUDIT](<D:/Vibe Coding/HiepTrong's Space/docs/audit/ARCHITECTURE_AUDIT.md>) and maintenance causes in [TECHNICAL_DEBT](<D:/Vibe Coding/HiepTrong's Space/docs/audit/TECHNICAL_DEBT.md>).

**Success criteria**

A user can create, edit, schedule, transfer, complete, and reopen the same task from Daily and Hub without silently losing draft fields, changing an untouched deadline, losing independent persisted updates, or leaving a task/notification transition partially applied. Calendar and timezone rules agree across layers. The documented local launch and migration paths are verifiable. Existing features, visual intent, and layer boundaries remain intact.

No framework replacement, database migration to another product, Drive implementation, placeholder feature completion, or general UI rewrite is warranted. Keep work in small reviewable changes with tests tied to the affected invariant.

**Recommended first implementation task**

Fix C01 in [src/features/tasks/TaskForm.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/TaskForm.tsx>) and both dialogs in [src/features/tasks/TransferDialog.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/TransferDialog.tsx>). First add focused rerender tests that reproduce minute-tick draft loss. Then make initialization depend on opening the form or intentionally switching the edited task, while retaining live time for display and validation.

Acceptance requires all typed fields to survive minute and midnight ticks, as well as a refreshed object for the same task. Closing/reopening should initialize from the current task/defaults. Deliberately switching tasks must initialize the new task. The displayed task and submitted task ID must remain consistent. Transfer and schedule-only drafts need the same guarantees. Validation errors should not disappear merely because the clock changed.

Run the affected component tests, then lint, typecheck, and the full existing suite. Perform a short browser check from both Daily and Hub. Do not combine this change with a broad form abstraction, deadline-format fix, or persistence redesign. It is a contained P1 fix with no schema or deployment dependency.

**Prioritized work and dependencies**

| Step | Priority | Findings | Depends on | Result |
| --- | --- | --- | --- | --- |
| 1 | P1 | C01, D02 | Audit baseline | Form session preserves draft edits |
| 2 | P1 | C02 | Step 1 makes edit tests reliable | Unchanged deadlines round-trip exactly |
| 3 | P1 | R01, R02 | Baseline, before any network exposure | Local binding verified and dependency risks triaged |
| 4 | P1 | C03, C04, D03 | Deterministic service failure/interleaving tests | Task writes preserve independent changes and commit transitions atomically |
| 5 | P2 | C05, C06, D11 | Data-fixture assessment, coordinate with step 4 | Canonical instants and real date-only values |
| 6 | P2 | C07, C14, S02 | Step 4, explicit notification policy | Consistent completion/reopen/retention behavior |
| 7 | P2 | C08, C09, C10, S03, D06 | Baseline, coordinate timezone cases with step 5 | Reliable request/configuration/startup boundaries |
| 8 | P2 | S01, D04 | Stable task and notification semantics from steps 4–6 | Correct optimistic results under failures and overlap |
| 9 | P2/P3 | C11, C12, C13, S04, S05, D05 | Relevant behavior tests | Keyboard, overlay, and animation lifecycle correctness |
| 10 | P2/P3 | S06, D01, D07–D12 | Correctness gates green | Measured capacity, accurate docs, and limited deduplication |

The numbering is a review sequence, not a requirement to postpone security investigation. Local binding and advisory triage can start alongside the form work and must precede exposing a server beyond its intended local scope. The conditional reachability findings are not grounds for a speculative platform rewrite.

**Step 2 — Preserve deadline identity**

Add a regression that edits only a title on a task with a same-year past deadline. Assert that the update omits an unchanged deadline or preserves its exact instant, including seconds/milliseconds. Keep an explicit canonical date when an edit or native picker selects a past date. Preserve the existing shorthand rule for intentional yearless new-task entry.

Acceptance includes same-year past dates, explicit years, year rollover, leap days, same-minute precision, and supported timezone boundaries. Ordinary edits must still allow past deadlines. Creation and transfer must still reject non-future deadlines. Scheduling alone must not alter the deadline. Run domain and TaskForm tests plus a Daily/Hub browser edit check.

**Step 3 — Verify exposure and remediate dependency chains**

For R01, retain the documented local-only scope unless a shared deployment is explicitly required. Make the supported launch bind loopback and verify the actual listener using a disposable instance. Test mutation requests with the intended and an unwanted browser origin, as well as incorrect content types. Select the smallest request-boundary policy consistent with the local UI. Do not assume a firewall or CORS response header establishes authorization.

For R02, rerun the registry scan, inventory each affected nested version, and record prerequisites for runtime versus tooling exposure. Choose the smallest compatible corrected package set for one chain at a time. Review framework, ORM, validator, and test-runner changes independently. Do not accept an initial advisory's fixed release without checking follow-up advisories. Do not run a blanket forced fix.

Acceptance requires each advisory to be resolved or explicitly documented with remaining version, exposure conditions, reason for deferral, and a review trigger. Validate with a clean locked install in an isolated directory, the existing checks, and tests for the changed subsystem. Framework/CSS changes need a production build and asset/layout smoke check. ORM changes need temporary SQLite migration and task-transition tests. No clean-install or build result is claimed by this audit.

**Step 4 — Establish safe persistence operations**

Start by retaining the C03 concurrent independent-patch reproduction and C04 injected completion failure as tests. Define expected outcomes for two changes to different fields, competing changes to the same field, completion versus editing, and deletion versus updating. Use controlled barriers where timing matters rather than arbitrary sleeps.

Keep SQL and transaction ownership inside the local storage adapter. A small intent-specific operation can apply a patch atomically and coordinate task/notification writes. A revision-checked approach is also possible if explicit conflicts are preferable. Choose one coherent design from the tests. Do not add both elaborate retry infrastructure and versioning by default, and do not put Drizzle calls in services.

Acceptance requires independent title/pin changes to survive or an explicit conflict to be returned. Each complete, reopen, transfer, deadline-update, and delete transition must either commit its defined state or leave the previous state intact. Repeated requests after a fault must converge without stale alerts or duplicate notifications. Test failure at every write boundary and persistence after reopening the temporary database. Preserve the adapter contract for any future implementation.

**Step 5 — Normalize time and validate dates without silently rewriting user intent**

Normalize accepted instant inputs and range bounds to one UTC representation and precision before text range comparisons or dedupe-key construction. Apply calendar validation to scheduled dates and date-only ranges. Preserve null scheduling and schedule/deadline independence.

Before changing legacy data, use fixtures containing offset timestamps, equivalent instants with different strings, invalid dates, existing alerts, and potential dedupe collisions. Specify how repairs are reported. Invalid calendar dates must not silently become another day. Updating only input validation is insufficient for existing rows.

Acceptance requires C05's offset task to appear in its actual UTC range, equivalent timestamps to behave identically, and impossible dates to fail predictably. Run a migration/repair dry run on a copied fixture, inspect changes, restore it, and rerun the scenario. If a schema or data migration is necessary, take a verified backup of the resolved target before any user-data operation. Rollback must account for normalized keys and records, not just an older executable.

**Step 6 — Define the notification lifecycle and enforce it**

Write a short transition table covering active, due soon, overdue, completed, reopened, rescheduled, deleted, and expired. Resolve two policy questions before implementing their dependent behavior: whether completion notices represent current state or immutable history, and whether an unchanged overdue task should alert again after retention removes its prior notice.

For the present-tense feed, reopening must not leave a false “is complete” message. Completion should replace applicable alerts consistently, and repeated completion must have explicit dedupe/read-state semantics. Enforce the seven-day visibility cutoff in list results as well as deletion.

Use controlled-clock and barrier tests for tick versus complete/transfer/delete. A failed tick must not mark delivery as successfully fresh. If overlapping ticks are possible in the supported process model, serialize them or make their writes safe. Acceptance includes cutoff boundaries, startup catch-up, scheduler delay, failed retry, reopen cycles, and the agreed recurrence policy. No external queue is required for the current always-open local-process assumption.

**Step 7 — Repair request, timezone, migration, and initialization boundaries**

Handle JSON parsing errors at the API boundary and return a stable 400 response. Preserve 500 responses for actual service/storage failures. Add actual route tests for create, update, and transfer, using injected or temporary storage where successful requests require a container.

Validate timezone identifiers during configuration parsing. Either support the documented configurable zone throughout the UI or explicitly narrow the setting's scope. The recommended existing-scope behavior is to provide one validated public timezone to task views, forms, dashboard, and notifications. Test the same instant around midnight in two zones and include daylight-saving transitions where the selected zone has them.

Make runtime and CLI resolve the same database target. Test custom directory and filename configurations entirely in temporary storage, confirming the default database is untouched. Document independent media placement. Force an initialization/migration failure and prove retry/close releases resources. Extend health/progress reporting only as needed to detect the supported failure modes.

Acceptance is evidence from route tests, custom-path integration tests, startup failure tests, and a browser timezone check. A successful static config parse alone is insufficient.

**Step 8 — Test and simplify optimistic cache behavior**

Build hook tests with controlled deferred requests for success/failure interleavings, duplicate actions, different tasks, and filtered query keys. Compare final task and notification caches to canonical service responses. Cover reminder fields after deadline changes, transfer, complete, and reopen.

If snapshot rollback erases later work, use a narrowly scoped rollback strategy or serialize the affected entity's mutations. Re-evaluate membership when a cached list has filters. Use refetch/pending state where reconstructing server-derived fields creates more complexity than benefit. Acceptance requires no stale overwrite after all requests settle, correct loading/error feedback, and no duplicate feedback between Daily and Hub.

This step validates S01. Do not label every predicted cache race a reproduced defect before the tests establish it.

**Step 9 — Verify keyboard, overlay, and motion boundaries**

Implement a semantic disclosure control for TaskCard and make duplicate rendered task IDs unique or unnecessary. Fix reduced-motion startup/resume state independently of the broader animation system.

Acceptance requires keyboard expansion/collapse, sensible focus order, no accidental expansion from checkbox/menu actions, and accessible full descriptions. Test one task appearing in both Daily and overdue views. Test reduced motion enabled at startup, both preference changes, visibility changes, pause, and disposal.

Use a real browser for popover placement after asynchronous content, viewport edges, transformed ancestors, mobile dimensions, zoom, stacked drawers, Escape, focus return, and scroll restoration. Exercise back/forward and slow destinations during route transitions. S04 and S05 remain hypotheses until reproduced. Preserve current portal/focus-stack behavior and visual design.

**Step 10 — Reduce only demonstrated maintenance cost**

Measure current all-task fetches, notification joins, synchronous storage work, and UI rendering with representative and stress fixtures. Record dataset sizes and timings before deciding on pagination or indexes. Avoid performance changes based solely on code inspection.

After behavior is protected, extract only repeated Daily/Hub action coordination or date-entry behavior that reduces real duplication. Update stale references, supported runtime/launch instructions, migration/backup paths, and feature-status claims. Separate asset generation from review verification. Keep Drive, media exposure, analytics history, and blank routes deferred.

Acceptance requires an explainable small diff, unchanged domain/UI behavior, and a documented before/after measure for any performance work. An abstraction without a demonstrated repeated responsibility is not an acceptance goal.

**Validation and release gates**

| Gate | Required evidence |
| --- | --- |
| Per behavior change | A focused regression that fails before the fix and passes after it, without asserting implementation details |
| Static and existing regression suite | Lint, TypeScript, and all existing tests pass. New tests cover the changed invariant |
| Storage/configuration change | Temporary database tests, legacy fixtures where relevant, fault/retry evidence, verified target path, and restore rehearsal |
| Dependency/framework change | Clean locked install, new advisory scan, appropriate integration tests, production build, and browser smoke checks |
| UI change | Real keyboard, responsive, and reduced-motion checks for affected paths, in addition to jsdom |
| Release candidate | Daily and Hub create/edit/schedule/transfer/complete/reopen/delete, notification lifecycle, restart/catch-up, and custom configuration smoke checks |

The audit baseline is green for lint, TypeScript, and 69 existing tests. Browser, production-build, clean-install, load, deployment-binding, and backup-restore validation are future gates, not completed audit results. Keep dependency and data-format changes separate enough to identify and roll back a regression. Do not repeat the entire test suite without a new change or unresolved failure, and do not claim a successful test suite proves the suspected races absent.
