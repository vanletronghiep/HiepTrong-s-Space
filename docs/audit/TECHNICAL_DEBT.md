# Technical debt

Audited 6 November 2026. This document records maintainability and operational causes behind [BUG_INVENTORY](<D:/Vibe Coding/HiepTrong's Space/docs/audit/BUG_INVENTORY.md>), with priorities based on the current personal/local application. It proposes bounded follow-up work, not an implementation or a general rewrite. The sequence and acceptance gates are in [STABILIZATION_PLAN](<D:/Vibe Coding/HiepTrong's Space/docs/audit/STABILIZATION_PLAN.md>).

**D01 — P2 — Daily and Hub duplicate action orchestration**

[src/features/tasks/DailyBoard.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/DailyBoard.tsx>) is approximately 632 lines and [src/features/tasks/HubList.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/HubList.tsx>) 529 lines. Both compose mutation hooks, selected-task state, create/edit/transfer/schedule drawers, destructive-action handling, pending state, and feedback. Shared TaskCard and TaskForm components already prevent substantial presentation duplication.

The cost is behavioral drift in how the same persisted task is edited from different surfaces. C01 demonstrates that a shared form can still receive problematic lifecycle inputs from either screen. S01 concerns mutation behavior beneath both.

After correctness tests exist, share only the repeated action/dialog coordination whose behavior is genuinely identical. Keep Daily calendar selection and Hub filtering local to their screens. Do not replace them with a configurable universal task-page framework. Size alone does not prove a component needs decomposition.

**D02 — P1 — Date display, input resolution, and edit identity are conflated**

[src/domain/date-input.ts](<D:/Vibe Coding/HiepTrong's Space/src/domain/date-input.ts>) serves several distinct purposes, including shorthand future-date entry, explicit calendar selection, canonical schedule values, display formatting, and deadline construction. [src/features/tasks/TaskForm.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/TaskForm.tsx>) and [src/features/tasks/TransferDialog.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/TransferDialog.tsx>) repeat presets, native-picker bridging, time input, field errors, and initialization logic.

C01 and C02 are concrete consequences. Reusing a shortened date label loses the selected year, and depending on live time for initialization overwrites the draft. C05 and C06 expose a related difference between UI validation and API/storage guarantees.

First fix those invariants with focused tests. Only then extract a small shared date-entry behavior if duplicate fixes remain. Keep the distinction between a calendar date and an instant explicit. Retain the existing domain module and timezone library rather than introducing another date system.

**D03 — P1 — Repository abstraction omits mutation semantics**

[src/services/storage/storage-adapter.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/storage/storage-adapter.ts>) exposes generic `saveItem`, `getItem`, `listItems`, and `deleteItem`. [src/services/storage/local/local-task-repository.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/storage/local/local-task-repository.ts>) implements save as a complete upsert. Services must therefore assemble updated records from earlier reads and coordinate changes across repositories themselves.

C03 demonstrates a lost update, and C04 demonstrates an interrupted completion that retry cannot repair. The abstraction is useful for containing persistence but cannot express the safety guarantees its callers need.

Add the minimum task-specific atomic mutation capability required by tested operations. Keep transaction ownership inside storage. Do not leak Drizzle into services or build a general event-sourcing framework. Drive is a stub, so its hypothetical implementation should not force today's local operations into an unsafe lowest common denominator. Preserve contract tests for the semantics any future adapter must honor.

**D04 — P2 — Optimistic cache transformations duplicate server state rules**

[src/client/queries/tasks.ts](<D:/Vibe Coding/HiepTrong's Space/src/client/queries/tasks.ts>) reconstructs task DTOs during optimistic mutations while services/domain functions also derive status and reminder behavior. Cache updates iterate multiple list keys, snapshot whole lists, and restore those lists on failure. Notification mutations follow a related pattern.

S01 identifies overlapping-mutation and filtered-cache hypotheses. Independently, the repeated lifecycle code makes each new mutation a place to omit invalidation, filtering, or a derived field.

Test the failure/interleaving boundary before introducing a helper. A narrow shared cache update routine can be justified once its invariants are known. For operations whose optimistic result cannot be derived reliably, a pending state followed by the existing refetch may be simpler. Do not add a second global state store.

**D05 — P2 — Custom motion and overlay systems have many interacting lifecycles**

[src/features/transitions/TransitionProvider.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/transitions/TransitionProvider.tsx>) is about 440 lines, [src/features/home/starfield/starfield-engine.ts](<D:/Vibe Coding/HiepTrong's Space/src/features/home/starfield/starfield-engine.ts>) about 605, and [src/features/tasks/DailySky.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/DailySky.tsx>) about 402. Together with Earth rendering, carousel dragging, popover geometry, drawers, and shared scroll roots, the application coordinates timers, RAF, resize/visibility listeners, focus, portals, and reduced-motion state.

These features follow the product's visual direction. Complexity by itself is not grounds for removing them. C13 is an actual preference-transition bug, while S04 and S05 remain browser-validation work.

Keep the current implementation and first document a short state/lifecycle table for each touched subsystem. Add focused tests for startup, preference changes, cancellation, failure, and disposal. Current focus-trap stacking and drawer overflow restoration are improvements to preserve. New abstractions are only useful if they remove a demonstrated repeated lifecycle rule.

**D06 — P2 — Startup, migration, health, and local deployment assumptions are scattered**

[src/server/config.ts](<D:/Vibe Coding/HiepTrong's Space/src/server/config.ts>), [src/server/container.ts](<D:/Vibe Coding/HiepTrong's Space/src/server/container.ts>), [src/server/scheduler.ts](<D:/Vibe Coding/HiepTrong's Space/src/server/scheduler.ts>), [drizzle.config.ts](<D:/Vibe Coding/HiepTrong's Space/drizzle.config.ts>), and [README.md](<D:/Vibe Coding/HiepTrong's Space/README.md>) each describe part of runtime operation. C09 and C10 show configuration divergence. R01 raises the priority of verifying network exposure before any shared preview.

Health confirms initialized configuration rather than fresh database access or successful scheduler progress. The scheduler has no durable delivery state, no explicit shutdown coordination, and no cross-process lease. That can be acceptable for one local process, but deployment expectations and failure reporting must match it. There is no basis for claiming reminders are delivered when the app is stopped.

Define a supported single-process launch, consistent resolved paths, startup validation, and a backup/restore procedure. Validate snapshots in a disposable directory with SQLite's WAL behavior accounted for. Add lightweight progress/error information only if needed to distinguish a stalled scheduler from a healthy process. Do not introduce an external job service unless persistence requirements change.

**D07 — P3 — Reference documents disagree with the current application**

| Reference | Observed drift | Maintenance action |
| --- | --- | --- |
| [AGENTS.md](<D:/Vibe Coding/HiepTrong's Space/AGENTS.md>) | Points at nonexistent `md/PROJECT_DESCRIPTION.md` | Correct the reference to the actual root file |
| [PROJECT_DESCRIPTION.md](<D:/Vibe Coding/HiepTrong's Space/PROJECT_DESCRIPTION.md>) | Contains earlier instruction status, 62-test baseline, and risks superseded by focus/keyboard fixes | Mark historical observations and update the current behavior/risk index |
| [README.md](<D:/Vibe Coding/HiepTrong's Space/README.md>) | Retains older homepage/hero and presentation descriptions | Describe the current HomeJourney and supported local operating procedure |
| [md/ui_readme.md](<D:/Vibe Coding/HiepTrong's Space/md/ui_readme.md>) | Includes earlier Earth and Explore/Pause expectations that conflict with later product directions | Separate durable requirements from superseded design notes |
| [md/ASSET_GUIDE.md](<D:/Vibe Coding/HiepTrong's Space/md/ASSET_GUIDE.md>) | Asset counts and descriptions differ from current generated/inline assets | Reconcile asset inventory with actual files and inline decoration |
| Daily statistics placeholder | Says completion history is recorded, while reopening clears the sole `completedAt` field | Correct the claim or defer it until event history is an approved feature |

Do not implement obsolete specifications merely to make source match every historical note. Record the current product decision and update the authoritative reference. The static forecast and current clock label were intentionally not treated as defects.

**D08 — P3 — Asset review tooling is not reproducible verification**

[scripts/phase01/capture-review.mjs](<D:/Vibe Coding/HiepTrong's Space/scripts/phase01/capture-review.mjs>) imports `sharp`, loads Playwright directly or from an override, captures screenshots, writes Earth poster assets, and rewrites the asset manifest. `sharp` is available transitively, Playwright is not a declared project dependency, and the phase-specific review page is not part of the tracked application source.

The script's name can suggest a check, but running it can change production assets. No such generation script was run during this audit. [scripts/phase01/serve-review.mjs](<D:/Vibe Coding/HiepTrong's Space/scripts/phase01/serve-review.mjs>) already binds loopback and checks its allowed paths, so it was not classified as an exposed arbitrary file server.

Document generation separately from verification. If the workflow is retained, declare the dependencies and include the required fixture. Otherwise mark it historical and use the application itself for review. Do not add a new asset pipeline solely to preserve an obsolete phase script.

**D09 — P2 — Test coverage emphasizes normal paths and textual guardrails**

The 22 files and 69 tests pass. Existing coverage includes pure rules, configuration, storage contracts, service happy paths, component actions, feature registry, carousel navigation, and mocked transitions. Tests use temporary storage and injected clocks, which are strong foundations.

Missing high-value evidence includes form rerenders while editing, actual route input handling, hook-level optimistic rollback, independent concurrent service writes, failures between task and notification writes, scheduler/mutation interleavings, custom migration paths, and browser focus/overlay/rendering integration. These omissions explain how C01–C08 coexist with a green suite.

[tests/design/craft-and-architecture-guardrails.test.ts](<D:/Vibe Coding/HiepTrong's Space/tests/design/craft-and-architecture-guardrails.test.ts>) and [tests/design/tokens-guardrail.test.ts](<D:/Vibe Coding/HiepTrong's Space/tests/design/tokens-guardrail.test.ts>) use source-text assertions. They catch selected style/import regressions but cannot establish runtime accessibility or complete architectural separation. The jsdom canvas warning should be resolved with an appropriate test double when touching that test, without treating a mock as visual verification.

There is no checked-in `.github` CI directory in the inspected tree. This audit does not establish whether checks run through an external system. Add the targeted regression tests first, then enforce the existing commands in the project's chosen automation. No arbitrary coverage percentage is necessary.

**D10 — P2 — Capacity behavior is unspecified**

Task screens fetch all tasks, list searching happens after SQL reads, notification rendering joins complete task and notification collections, and scheduler ticks scan active tasks. The storage API returns promises around synchronous SQLite work, so expensive work still runs on the server thread.

This is a capacity risk, not a measured slowdown. S06 defines the required experiment. Establish a representative personal dataset and a larger stress fixture before changing indexes or pagination. Optimize the measured bottleneck while retaining canonical task sorting and calendar counts. Do not switch databases on the basis of source size or hypothetical scale.

**D11 — P2 — Runtime compatibility and data boundaries are partly implicit**

[package.json](<D:/Vibe Coding/HiepTrong's Space/package.json>) does not pin an engine/package-manager policy even though better-sqlite3 is native, AGENTS allows Node 22+, and the audit used Node 26.13.0 with Node 22 type definitions. Passing here does not prove clean installation on every supported version.

Successful responses in [src/client/api-client.ts](<D:/Vibe Coding/HiepTrong's Space/src/client/api-client.ts>) rely on a type cast. SQL reads similarly assume valid stored records. This is a reasonable starting point for a same-repository local app, but corrupted/legacy data or future external adapters will not be caught at every boundary. Zod checks at request, service, and storage-write boundaries are deliberate defensive layers, not automatically wasteful duplication.

Choose and verify a supported runtime using a clean locked install in an isolated environment. Add parsing only at trust boundaries with a concrete failure policy. For timestamp/calendar repairs, explicitly validate legacy rows rather than assuming new-input validation repairs existing data.

**D12 — P3 — Future capabilities exceed current supported behavior**

The feature registry, Drive adapter, media interface, and statistics placeholder reserve room for future features. [src/services/storage/local/local-media-storage.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/storage/local/local-media-storage.ts>) writes metadata and binary content separately and returns a URL with no application serving route. No active upload feature was found, so MIME/size limits and atomic media persistence are prerequisites for future exposure rather than a confirmed current upload vulnerability.

Do not complete placeholder destinations, implement Drive, add completion event history, or build media routes as part of stabilization. Keep them visibly unsupported and out of operational claims. Existing unused capability can remain until an approved feature needs it. Removing it would be an unrelated scope expansion.

**What to preserve**

The service/domain/storage separation, injected clocks, single task identity across views, shared task components, SQLite constraints/indexes, explicit notification dedupe, and responsive/reduced-motion intent are useful foundations. The recovery plan should improve the invariants these structures express. It should not replace them with a new framework, database, cache, or rendering system.
