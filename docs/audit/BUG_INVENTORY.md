# Bug inventory

Audited 6 November 2026 against baseline `2955b454f713a38a66c29cab3f0a7b3f84852bf8`. See [ARCHITECTURE_AUDIT](<D:/Vibe Coding/HiepTrong's Space/docs/audit/ARCHITECTURE_AUDIT.md>) for scope, commands, environment, and validation limits. This inventory contains no implemented fixes.

**Severity and evidence**

P0 means a demonstrated critical failure requiring immediate containment. P1 means a high-impact correctness or exposure issue. P2 means a material functional, reliability, or accessibility issue. P3 means a limited defect or lower-impact inconsistency. No P0 issue was established.

“Reproduced” means executed against current source in an isolated service, route, DOM, or engine harness. It does not imply a production incident. “Confirmed source/configuration” means the implementation directly establishes the stated mismatch without a live-runtime claim. “Suspected” means a plausible failure still requires its proposed experiment. Security advisory severity and application priority are separate.

**Confirmed findings**

| ID | Priority | Finding | Evidence |
| --- | --- | --- | --- |
| C01 | P1 | Open forms discard edits when the minute changes | Actual components in jsdom |
| C02 | P1 | Editing only a title can move a past deadline into next year | Actual TaskForm submission in jsdom |
| C03 | P1 | Concurrent independent service patches lose one change | TaskService and fresh native SQLite |
| C04 | P1 | Failed completion cleanup persists across a successful retry | TaskService and SQLite with injected cleanup failure |
| C05 | P2 | Offset timestamps are incorrectly filtered by deadline ranges | TaskService and SQLite |
| C06 | P2 | An impossible calendar date is accepted and stored | Contract, service, and SQLite |
| C07 | P2 | Reopening retains a notification saying the task is complete | TaskService and NotificationService |
| C08 | P2 | Malformed JSON is reported as an internal server error | Direct execution of the actual POST route |
| C09 | P2 | Timezone configuration diverges from task UI and accepts invalid zones | Config/helper execution plus UI source |
| C10 | P2 | Runtime and CLI migration targets diverge with custom paths | Confirmed configuration |
| C11 | P2 | TaskCard expansion cannot be operated from the keyboard | Actual DOM and dispatched input |
| C12 | P3 | Multiple views of one task produce duplicate DOM IDs | Two actual TaskCard instances |
| C13 | P3 | Starfield does not resume after initially reduced motion is disabled | Actual engine with mocked canvas/RAF |
| C14 | P2 | Notification lists include expired entries until a purge occurs | Service clock probe and scheduler source |

**C01 — P1 — Drafts reset on the minute tick**

Affected code is [src/features/tasks/TaskForm.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/TaskForm.tsx:75>), [src/features/tasks/TransferDialog.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/TransferDialog.tsx:45>), the schedule-only dialog in [src/features/tasks/TransferDialog.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/TransferDialog.tsx:269>), and [src/client/use-minute-ticker.ts](<D:/Vibe Coding/HiepTrong's Space/src/client/use-minute-ticker.ts>). Daily and Hub pass the live minute clock into these forms.

Reproduction used an open form at `2026-11-06T03:00:00.000Z`, entered unsaved values, then rerendered it with `now` advanced one minute. TaskForm restored the original title. Transfer changed the entered time from `15:15` to `23:59`. ScheduleDateDialog changed the entered `20/11/2026` back to the task's original `05/11`.

Initialization effects depend on `now`, and some also depend on the entire task object. They reset draft state while the same editing session remains open. Loss on the minute change is reproduced. A reset caused specifically by query refetch/object replacement is a source-supported additional trigger that still deserves its own regression case.

Expected behavior is to retain draft fields during time updates while validation continues using current time. Initialize on opening or intentionally changing the edited task. This is the safest first implementation task because it can be fixed and verified without persistence changes.

**C02 — P1 — An unchanged deadline is rewritten during title editing**

Affected code is [src/domain/date-input.ts](<D:/Vibe Coding/HiepTrong's Space/src/domain/date-input.ts:137>), [src/domain/date-input.ts](<D:/Vibe Coding/HiepTrong's Space/src/domain/date-input.ts:112>), and [src/features/tasks/TaskForm.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/TaskForm.tsx:127>).

At `2026-11-06T03:00:00.000Z`, open a task with deadline `2026-11-05T16:59:12.123Z` in Asia/Saigon. Change only its title and submit. The captured update payload contains `2027-11-05T16:59:00.000Z`. The existing date becomes `05/11` for display, then the create-oriented shorthand parser selects its next occurrence. Rebuilding from `HH:mm` also removes seconds and milliseconds.

The probe captured the actual component's update callback, not a live HTTP save. The service accepts the supplied replacement deadline, so the payload is consequential. Ordinary edits intentionally allow past deadlines. Rejecting past dates would not fix this bug.

Preserve the exact existing instant when deadline inputs have not changed. Keep the selected canonical date separate from shortened display text, including explicit past dates chosen through the native picker. Add same-year, cross-year, leap-day, timezone, and precision cases.

**C03 — P1 — Whole-record saves lose an independent concurrent update**

Affected code is [src/services/task-service.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/task-service.ts:76>) and [src/services/storage/local/local-task-repository.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/storage/local/local-task-repository.ts:33>).

Create a task titled `original` with `pinned: false`. Against one real temporary SQLite adapter, run:

```ts
await Promise.all([
  service.updateTask(id, { title: 'edited' }),
  service.updateTask(id, { pinned: true }),
]);
```

Both operations resolve. The final task is titled `original` and pinned. Each call reads the same record, and the later full-row upsert overwrites the other call's title change.

This confirms a concurrency defect at the service boundary. It does not establish the timing of two real HTTP requests or tabs, which was not exercised. SQLite's synchronous statement execution does not make the separated service reads and writes atomic.

Independent patches must both survive, or one must receive an explicit conflict. Use narrowly scoped atomic repository operations or an adapter-owned transaction/revision mechanism. Define competing status/deadline operations separately. A UI pending flag alone cannot establish this invariant.

**C04 — P1 — Completion failure leaves a state that retry cannot repair**

Affected code is [src/services/task-service.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/task-service.ts:119>) and [src/services/storage/storage-adapter.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/storage/storage-adapter.ts>).

With an injected clock, create a task, advance past its deadline, and run the reminder tick to create an overdue alert. Make `notifications.deleteWhere` throw once, then call `completeTask`. It rejects after saving the task as completed. Restore cleanup and retry. The retry resolves through the already-completed early return, leaving the overdue notification and no completed replacement.

This is an executed fault-injection reproduction, not an observed disk or production failure. It demonstrates that the retry is not a recovery mechanism for a partially completed transition.

Completion should commit its task and notification changes together, or finish an interrupted transition on retry. Include failures after each write and repeated calls in acceptance tests. Update/transfer/delete also contain multiple steps, but their exact failure outcomes were not separately reproduced. Keep those as validation work rather than claiming identical incidents.

**C05 — P2 — Text comparison misorders offset timestamps**

Affected code is [src/contracts/task.ts](<D:/Vibe Coding/HiepTrong's Space/src/contracts/task.ts:13>), [src/services/task-service.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/task-service.ts:47>), and [src/services/storage/local/local-task-repository.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/storage/local/local-task-repository.ts:102>).

Create a task with deadline `2026-11-07T00:30:00+07:00`, which is `2026-11-06T17:30:00.000Z`. List tasks between `2026-11-06T17:00:00.000Z` and `2026-11-06T18:00:00.000Z`. The actual SQLite-backed service returns zero tasks.

The contract permits offsets and creation stores the input string. SQL range predicates compare text, not instants. Normalize incoming deadlines and range bounds to one UTC precision. Existing records require a deliberate migration/repair strategy. Equivalent instant strings also affect notification dedupe keys, so changing storage format without addressing those keys can introduce duplicates or collisions.

**C06 — P2 — Invalid calendar dates survive validation**

Affected code is [src/contracts/task.ts](<D:/Vibe Coding/HiepTrong's Space/src/contracts/task.ts:9>) and [src/services/task-service.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/task-service.ts:47>).

Creating a valid future-deadline task with `scheduledDate: '2026-02-30'` succeeds, and reading it returns that same value. The date contract checks the string's shape but not the calendar. A normal calendar cannot select that date, though Hub can still show the task.

Apply real calendar validation to all date-only contract fields, including range boundaries and transfer input. Preserve null scheduling and the independence of schedule and deadline. Test leap years, impossible days, and year boundaries. Identify existing invalid records without silently rolling them into another day. The UI's stricter parser alone does not protect direct API inputs.

**C07 — P2 — Reopening leaves a false completion message**

Affected code is [src/services/task-service.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/task-service.ts:168>) and [src/domain/notification-rules.ts](<D:/Vibe Coding/HiepTrong's Space/src/domain/notification-rules.ts:105>).

Create an overdue alert, complete the task so the alert is replaced with a completion notification, then reopen it. The stored task becomes active, while `listNotifications` still returns a message that the task “is complete.” This was reproduced against real temporary storage.

Reopening does not remove or reconcile completed notifications, and the DTO builder projects that kind without checking active status. Define the intended reopen lifecycle and implement it with the task transition. For a current-state feed, remove or suppress stale completion notices. If historical notices are intended, the wording and retained event data must make that explicit. Repeat-completion dedupe behavior also needs a test because the key contains the deadline but not a completion cycle.

**C08 — P2 — Malformed JSON becomes HTTP 500**

Affected code is [src/app/api/tasks/route.ts](<D:/Vibe Coding/HiepTrong's Space/src/app/api/tasks/route.ts:46>) and [src/server/api-response.ts](<D:/Vibe Coding/HiepTrong's Space/src/server/api-response.ts:47>).

Invoke the actual POST handler with a `NextRequest`, `Content-Type: application/json`, and body `{`. It returns status 500 with `INTERNAL_ERROR`. Parsing fails before container initialization, so this reproduction did not access application data.

Malformed client JSON should receive a consistent 400 response. Handle parsing failure at the request-body boundary. Do not classify every `SyntaxError` from arbitrary service/storage code as a client error. PATCH and transfer contain analogous request parsing, but only POST was executed in this probe. Add focused route cases for invalid JSON, invalid fields, missing resources, and genuine internal failures.

**C09 — P2 — Configured and displayed timezones differ**

Affected code is [src/server/config.ts](<D:/Vibe Coding/HiepTrong's Space/src/server/config.ts:7>), [src/server/container.ts](<D:/Vibe Coding/HiepTrong's Space/src/server/container.ts:43>), [src/features/tasks/DailyBoard.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/DailyBoard.tsx:108>), [src/features/tasks/HubList.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/HubList.tsx:62>), and [src/features/tasks/DailyDashboard.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/DailyDashboard.tsx:22>).

At `2026-11-06T01:00:00.000Z`, the current time helper yields `2026-11-05` in America/New_York and `2026-11-06` in the UI's default Asia/Saigon zone. Server configuration supplies its chosen zone to notifications, while task screens use the default constant. Config parsing also accepts an invalid nonempty zone, which subsequently makes an Intl formatter throw `RangeError`.

The helper/config behavior is executed evidence. No live application with a custom timezone was launched, and the default configuration does not exhibit this split. Choose one supported timezone policy, validate it at startup, and provide the same public value to calendar, forms, dashboard, and notification formatting. No need to expose other server settings.

**C10 — P2 — CLI migrations target a different database under custom configuration**

Affected code is [drizzle.config.ts](<D:/Vibe Coding/HiepTrong's Space/drizzle.config.ts:8>) and [src/server/config.ts](<D:/Vibe Coding/HiepTrong's Space/src/server/config.ts:38>).

Runtime builds its path from `DATA_DIR` and `DATABASE_FILE`. The CLI configuration always points to `./data/hiep-trong-space.db`. With either runtime setting changed, the two paths differ. This is a confirmed configuration divergence, not a claim that the user's database was migrated incorrectly.

Share the relevant path resolution or explicitly require the CLI to resolve and display the intended target. Validate using a temporary custom data directory and filename. Prove runtime and CLI affect the same fixture while the default database is untouched. Update backup guidance to include resolved paths and the independent `MEDIA_DIR` setting.

**C11 — P2 — Card expansion lacks a keyboard equivalent**

Affected code is [src/features/tasks/TaskCard.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/TaskCard.tsx:109>).

Render a collapsed Hub task card. Its article has no tab index or semantic expansion control. Dispatching Enter does not reveal the expanded scheduling actions, while clicking the article does. The actual component DOM and click behavior were tested.

The issue affects disclosure of content and the expanded action row. The menu provides alternatives for some actions, so this is not a claim that every scheduling operation is inaccessible. Add a correctly labeled keyboard-operable disclosure control with expanded state and focus behavior, avoiding a button wrapped around nested controls. Verify Enter/Space, focus order, checkbox/menu isolation, and full-description access in a browser.

**C12 — P3 — Shared task IDs are reused as DOM IDs**

Affected code is [src/features/tasks/TaskCard.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/TaskCard.tsx:109>) and the day/overdue composition in [src/features/tasks/DailyBoard.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/DailyBoard.tsx:410>) and [src/features/tasks/DailyBoard.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/DailyBoard.tsx:539>).

Render the same task in daily-carousel and overdue contexts. Both actual elements receive `task-card-<task-id>`. A scheduled overdue task can legitimately appear in both views.

Duplicate IDs are confirmed. A wrong action or scroll destination was not reproduced, and some navigation uses element refs. Remove unnecessary IDs or make them unique per rendered instance while retaining a separate task identity for data lookup. Test the legitimate duplicate-view case.

**C13 — P3 — Animation stays stopped after an initial reduced-motion preference changes**

Affected code is [src/features/home/starfield/starfield-engine.ts](<D:/Vibe Coding/HiepTrong's Space/src/features/home/starfield/starfield-engine.ts:170>), [src/features/home/starfield/starfield-engine.ts](<D:/Vibe Coding/HiepTrong's Space/src/features/home/starfield/starfield-engine.ts:193>), and [src/features/home/starfield/Starfield.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/home/starfield/Starfield.tsx>).

Start the actual engine with reduced motion enabled, then call `setReducedMotion(false)`. The isolated canvas/RAF harness records zero requested animation frames. Calling `start()` explicitly then requests one.

Reduced startup sets `running` false, but disabling the preference only schedules frames when `running` is already true. The component updates the preference without restarting its startup effect. Respect desired lifecycle state independently from reduced-motion suppression. Test both preference directions, visibility changes, pause/stop, and disposal. This is scheduling evidence, not a real GPU rendering measurement.

**C14 — P2 — Retention deletion does not enforce retention visibility**

Affected code is [src/services/notification-service.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/notification-service.ts:78>), [src/services/notification-service.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/notification-service.ts:86>), [src/server/scheduler.ts](<D:/Vibe Coding/HiepTrong's Space/src/server/scheduler.ts:58>), and the list requirement in [md/ui_readme.md](<D:/Vibe Coding/HiepTrong's Space/md/ui_readme.md:613>).

Create a notification, advance the service clock eight days without running purge, and list notifications. The old entry is returned. An explicit purge removes it. The list has no retention predicate, while the healthy scheduler purges only hourly. Thus normal operation can show entries past the cutoff until its next purge. The eight-day fixture demonstrates the missing predicate, not eight days of observed scheduler failure.

Apply the cutoff at the list/query boundary and keep background deletion for storage cleanup. The same probe observed that ticking after purge creates a new overdue alert for the unchanged task. That recurrence is an observed behavior with an unresolved product policy, not automatically a second confirmed bug. Decide whether expiry forgets delivery history before changing dedupe storage.

**Security and dependency findings**

| ID | Priority | Evidence status | Finding |
| --- | --- | --- | --- |
| R01 | P1 | Confirmed defaults, conditional exposure | Unauthenticated local app starts without an explicit loopback bind |
| R02 | P1 | Confirmed advisory matches, reachability-qualified | Dependency tree contains affected runtime and tooling versions |

**R01 — Local trust assumption is not enforced by launch defaults**

[package.json](<D:/Vibe Coding/HiepTrong's Space/package.json>) invokes `next dev` and `next start` without a hostname. The installed [Next CLI](<D:/Vibe Coding/HiepTrong's Space/node_modules/next/dist/bin/next:92>) documents `0.0.0.0` as the default. API routes have no authentication/authorization layer or explicit mutation-origin/content-type policy. The app therefore depends on launch overrides and host/network controls to remain local.

Actual interfaces, firewall accessibility, and browser cross-origin mutation behavior were not probed. No remote attack was demonstrated. Before network previews or shared deployment, establish the intended exposure. For the documented single-user local scope, bind loopback and verify it. Test unwanted-origin mutations independently because loopback binding alone is not a browser request policy. Only add user authentication if a shared-access requirement is approved.

**R02 — Dependency advisory matches require conditional triage**

`npm audit --ignore-scripts --json` returned 17 affected package entries, comprising 12 moderate, 3 high, and 2 critical. These include propagated parent-package effects and multiple advisories per package. They are not a count of distinct reachable application vulnerabilities.

| Chain | Relevant installed versions | Reported risk and reachability assessment |
| --- | --- | --- |
| Drizzle ORM | 0.39.3 | Identifier escaping flaw. Current schema and queries use static identifiers, with no found attacker-controlled alias/identifier construction. Affected version confirmed, SQL injection through current task input not demonstrated. [Maintainer advisory](https://github.com/drizzle-team/drizzle-orm/security/advisories/GHSA-gpj5-g38j-94v9) |
| Next → PostCSS | Next 15.5.28 contains PostCSS 8.4.31, root copy is 8.5.32 | Scan includes source-map file-read and related CSS-processing advisories. The cited file-read issue requires processing attacker-controlled CSS. No task endpoint accepts CSS for compilation. [Maintainer advisory](https://github.com/postcss/postcss/security/advisories/GHSA-6g55-p6wh-862q) |
| Vitest → tinypool | Vitest 3.2.7, tinypool 1.1.1 | Critical tooling-chain match. Worker-option exploitation depends on prototype pollution being available. No application path providing that prerequisite was found. The scan includes a follow-up advisory, so the first advisory's initial fixed release alone is not a complete remediation criterion. [Maintainer advisory](https://github.com/tinylibs/tinypool/security/advisories/GHSA-5gmw-xhrv-c9v3) |
| Vitest mock tooling | @vitest/mocker 3.2.7 | Scan reports mock redirect file-read and mock registration injection issues, GHSA-82fw-gwwq-j7x9 and GHSA-qxg6-89mg-rqv8. Development/mock-server configuration affects reachability. No exposed mock server was exercised |
| Zod | 3.25.76 | Oversized collection validation can amplify memory use. Public task request schemas are flat objects, so the relevant attacker-controlled collection path was not established. General JSON body limits are a separate input-boundary consideration. [Advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), [maintainer fix](https://github.com/colinhacks/zod/pull/6652) |
| drizzle-kit / esbuild tooling | drizzle-kit 0.30.6, esbuild 0.19.12 and 0.18.20 | Development-server cross-origin advisory GHSA-67mh-4wv8-2f99. No exposed esbuild server was observed |
| TypeScript ESLint chain | Nested minimatch 10.2.6 | Glob amplification advisory GHSA-g3hv-75wg-m249. Relevant to tooling inputs, with no public task-to-glob path identified |

The complete affected package-entry set was `@esbuild-kit/core-utils`, `@esbuild-kit/esm-loader`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `@typescript-eslint/type-utils`, `@typescript-eslint/typescript-estree`, `@typescript-eslint/utils`, `@vitest/mocker`, `drizzle-kit`, `drizzle-orm`, `esbuild`, `minimatch`, `next`, `postcss`, `tinypool`, `vitest`, and `zod`.

Reproduce the registry scan at remediation time because advisory data changes. Choose compatible fixes against every advisory in each chain, inspect the lockfile for remaining nested copies, and validate affected runtime/tooling paths. Audit suggestions included upgrades outside current requested ranges. Do not apply a blanket forced upgrade. No dependencies were changed during this audit.

**Suspected issues requiring targeted experiments**

| ID | Priority | Affected code and source evidence | Experiment needed before claiming a runtime defect |
| --- | --- | --- | --- |
| S01 | P2 | [src/client/queries/tasks.ts](<D:/Vibe Coding/HiepTrong's Space/src/client/queries/tasks.ts:56>) snapshots and rolls back whole lists. Some optimistic transforms preserve stale reminder fields and do not re-evaluate query membership. [src/client/queries/notifications.ts](<D:/Vibe Coding/HiepTrong's Space/src/client/queries/notifications.ts>) has similar snapshots | Hook tests with deferred requests. Interleave successful and failed mutations on one and different tasks. Seed filtered query keys and compare final cache to server state. Current Daily/Hub use unfiltered requests, limiting immediate filter-membership exposure |
| S02 | P2 | [src/services/notification-service.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/notification-service.ts:28>) reads task snapshots, writes later, and advances lastTickAt before success. [src/server/scheduler.ts](<D:/Vibe Coding/HiepTrong's Space/src/server/scheduler.ts:53>) lacks an in-flight guard | Barrier-controlled tick versus complete, transfer, deadline update, and delete. Fail a tick and verify immediate recovery. Check both one-process overlap and any intended multi-process deployment |
| S03 | P2 | [src/services/storage/local/local-storage-adapter.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/storage/local/local-storage-adapter.ts:50>) opens SQLite before migration and only assigns the handle afterward | Force migration failure using a temporary fixture, then test close/retry and handle release. Normal container initialization is serialized, so do not infer a common startup race |
| S04 | P2 | [src/ui/Popover.tsx](<D:/Vibe Coding/HiepTrong's Space/src/ui/Popover.tsx:43>) defaults to inline rendering with fixed positioning and measures content without observing every later size change | Real browser at viewport edges, transformed ancestors, loaded/error content, scrolling, and zoom. Some current callers already request a portal, so an across-the-board missing-portal claim is false |
| S05 | P2 | [src/features/transitions/TransitionProvider.tsx](<D:/Vibe Coding/HiepTrong's Space/src/features/transitions/TransitionProvider.tsx>) coordinates scroll locking, route readiness, popstate, and timed overlays | Real back/forward navigation, slow destination, rapid attempts, existing scroll styles, open drawer, keyboard focus, and reduced-motion tests. Existing mocked transition tests do not establish browser correctness |
| S06 | P2 | [src/services/notification-service.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/notification-service.ts:86>) joins full collections. [src/services/storage/local/local-task-repository.ts](<D:/Vibe Coding/HiepTrong's Space/src/services/storage/local/local-task-repository.ts:113>) loads then searches in memory. UI polls all tasks | Measure realistic and large fixtures before adding pagination or indexes. Record event-loop blocking, query time, payload size, and render cost. No measured performance regression is claimed |

**Claims deliberately excluded**

Existing tests and source support stacked focus handling, preserved body overflow for drawers, carousel arrow navigation, and the current measured day-list viewport. Older reports of their absence were not copied into the confirmed backlog. Static forecast copy and removed homepage Explore/Pause controls follow later product instructions. Intentional blank routes, Drive stub, and statistics placeholder are scope/debt items, not newly discovered runtime failures. The current minute-only clock label is explicitly tested while arc motion advances each second.
