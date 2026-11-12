# Codebase engineering audit

Date: 12 November 2026, Asia/Saigon. Scope: the current working tree, including pre-existing staged, unstaged, and untracked implementation work. This is an engineering assessment, not production certification. Existing documentation was left unchanged; proposed corrections are in DOCUMENTATION_AUDIT.md.

## Assessment and method

Before: a layered application with a passing unrestricted baseline (136 tests), substantial pending work, inconsistent documentation, and defects outside existing coverage. After: four bounded fixes with regressions, 149 passing tests, and a passing production build. Dependency advisories, feature gaps, and broader concurrency concerns remain. The repository is safer, but should not be described as fully production-ready.

Inspection covered the repository inventory, every API handler and contract, service/storage implementations, domain logic, configurations, import relationships, major feature flows, shared UI/motion primitives, test suites, migration SQL, asset references, and documentation ecosystem. Source/test/config inventories and focused reads were used; this does not claim exhaustive execution of every branch or visual acceptance of every page. Generated directories, dependency internals, personal stores/secrets, and binary reference media were excluded from content auditing. No personal database migration, secret edit, commit, push, reset, or deletion of existing untracked files was performed.

Only the root AGENTS.md applies to edited files. The ignored .agents/AGENTS.md repeats general behavioral guidance within that directory. md/task.md was inspected only as inactive documentation, never executed. Historical plans and prior reports were treated as evidence to recheck, not assignments.

## Observed architecture

- Next.js App Router, React, strict TypeScript, Tailwind 4 tokens, Motion, Three.js, TanStack Query, Zod, Drizzle ORM, better-sqlite3. Observed toolchain: Node 26.13.0, npm 11.20.0, Next 15.5.28, Vitest 3.2.7. Package ranges are not exact installed versions.
- Pages compose feature views inside AppProviders and WorkspaceShell. Feature hooks call the central apiRequest wrapper, then HTTP routes validate input and invoke services. All runtime DB/filesystem access inspected is inside services/storage.
- Tasks/notifications use the lazy container, injected Clock, StorageAdapter, SQLite repositories, and one SQL migration. Task status is active/completed; deadlineAt is required; reminderAt is persisted. Scheduling changes scheduledDate alone; transfer changes both schedule and deadline.
- Newer features generally instantiate JsonFileStore directly, including nested singleton documents. This is an observed second persistence path: STORAGE_DRIVER does not switch these stores to Drive. APCS uses a synchronous, hardcoded local archive reader. The Drive adapter remains a deliberate 501 stub.
- Startup instrumentation starts an in-process scheduler. Defaults: 30-second tick (minimum 5 seconds), hourly purge, startup catch-up. Notification GET additionally runs a tick when older than 15 seconds. Timed sources include events, active projects, unachieved milestones, and enabled achievement dates.
- JSON writes use an exclusive lock, reload under lock, fsynced temporary file, previous-version backup, and rename. Reads reject malformed arrays/IDs. These safeguards existed before this task and were retained.
- The import graph scan found no static import/export/dynamic-literal cycles. Every direct runtime dependency had a source import. This does not establish complete symbol liveness or runtime cycle absence.

## Responsibilities and disposition

| Area | Responsibility / assessment | Disposition |
|---|---|---|
| src/app pages/layouts/error boundaries | Route composition, PageReady, shell, fallback UI | KEEP; no route redesign |
| src/app/api | Validated HTTP boundary and structured errors; mixed success envelopes supported by clients | MODIFY three DELETE handlers; keep other handlers |
| src/client | Serialization, preferences, query caching, optimistic task/notification updates | KEEP; existing normalization work is not attributed to this task |
| src/contracts, src/domain | Pure validation, date/status/reminder/sort rules | KEEP; documentation differs from actual contracts |
| src/server | Config/container/scheduler/error mapping/logging | KEEP; future isolation/performance work proposed below |
| services/task-service.ts | Shared task state transitions and notification cleanup | KEEP; concurrency review proposed |
| services/notification-service.ts | Task and timed-source alert creation/join/retention | MODIFY conflict handling only |
| services/storage/local | SQLite schema/repositories, transactions, media interface | MODIFY queue release on savepoint failure |
| services/storage/json-store.ts | Atomic JSON file transactions and corruption protection | KEEP; recovery/schema risks remain |
| services/storage/apcs-storage.ts | Read-only local library scan and contained file access | KEEP; boundary test passes; scanning/root configuration remain concerns |
| Other feature services | CRUD, singleton collections, statistics | KEEP; no forced consolidation into SQLite |
| features/blogs/WritingRoomView.tsx | Article reader/editor state | MODIFY new-piece initialization after owner decision |
| Other feature views/CSS | Bespoke workspaces, local forms/state and styling | KEEP; size alone is insufficient justification for decomposition |
| features/home, transitions, tasks | Scroll/WebGL, readiness transitions, shared task interactions | KEEP; targeted existing tests pass |
| src/ui, src/design | Shared primitives, focus stack, tokens, motion/fonts | KEEP; no visual redesign |
| drizzle | Existing migration and metadata | KEEP unchanged |
| public | Runtime SVGs/textures and required attribution | KEEP unchanged |
| scripts/phase01 | Historical review/asset tooling | KEEP; tool portability issue below |
| tests | Behavioral coverage, storage contracts, architecture/design checks | MODIFY two service suites and Writing Room suite; ADD DELETE guard suite |
| Config/package files | Build/tooling/layer checks | KEEP; dependency upgrades proposed separately |
| sources, review | Ignored local reference/evidence collections | KEEP unchanged; do not publish through .gitignore |

## Findings and root causes

### E01 — High: new-piece flow could overwrite an existing article — FIXED

Evidence: WritingRoomView's closeWriting closed the dialog without clearing editingId. Write new piece only set isWriting=true, while handleSaveDraft chose PATCH when editingId was present. Reproduction: open an existing article, edit, close, return to overview, select Write new piece. The supposedly new editor retained the old identity and fields.

Correction: startNewPiece resets identity and all editor fields to their initial defaults. Owner explicitly selected a blank new editor in this chat. Regression fails on the old implementation and passes after the fix; existing draft resume/update and failed-save retention tests remain green. Browser verification created two synthetic drafts, reloaded, and observed both records. No persisted articles were migrated or rewritten.

### E02 — High: inconsistent DELETE origin enforcement — FIXED

Evidence: DELETE in src/app/api/events/[id]/route.ts, projects/[id]/route.ts, and milestones/[id]/route.ts omitted assertSameOriginMutation. Blog, achievement, task, and notification mutations already used the shared boundary. Regressions showed each handler returning 200 and reaching its mocked deletion service for a mismatched Origin or Sec-Fetch-Site: cross-site.

Correction: invoke the existing guard before params/service access. Nine route tests cover six rejections plus three trusted loopback deletions, asserting the service is never called on rejection. This closes a policy gap; it is not proof of browser-exploitable CSRF in every deployment, since CORS/preflight and host binding also matter. No authentication or deployment redesign introduced.

### E03 — Medium: timed reminder conflict aborts a tick — FIXED

Evidence: NotificationService's task loop caught ConflictError; the timed-source loop did not. Independent service instances can both read an empty dedupe set before writing, for example distinct scheduler/route module instances. The unique index correctly rejects the second insert, but the tick previously failed. A synchronized two-instance regression reproduced it against temporary SQLite.

Correction: use the existing conflict-only handling pattern for timed sources, add successfully written keys to the local set, and count only successful writes. The result is one persisted reminder and counts [0, 1]. A separate disk-failure test confirms other errors still propagate and immediate retry works. Schema, payload, timing, and interfaces remain compatible.

### E04 — Medium: failed SAVEPOINT permanently blocks transaction queue — FIXED

Evidence: LocalStorageAdapter.runInTransaction installed a new queue promise, then called SAVEPOINT outside try/finally. If opening it threw, releaseQueue was never called; later transactions hung. An injected native exec failure reproduced a five-second timeout.

Correction: move SAVEPOINT inside the existing protected block. Existing rollback cleanup and finally now release the queue on setup failure too. Regression verifies rejection and a subsequent successful transaction. No transaction API/schema redesign.

### E05 — High advisory exposure; exploitability not established — PROPOSAL

Read-only npm audit on this date reports 17 affected package entries: 2 critical, 3 high, 12 moderate. Entries include inherited parent-package severities, not 17 independent vulnerabilities. Critical entries are tinypool/vitest in the development toolchain. High entries include drizzle-orm, nested Next PostCSS, and zod. Advisory links returned by npm include:

- [Drizzle identifiers](https://github.com/advisories/GHSA-gpj5-g38j-94v9)
- [Tinypool worker options](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3)
- [Zod constrained collections](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
- [PostCSS source maps](https://github.com/advisories/GHSA-6g55-p6wh-862q)

Inspected SQL uses fixed schema identifiers and parameterized predicates; no user-controlled SQL identifier flow was demonstrated. Runtime collections and unauthenticated local APIs still deserve input-size/reachability review. Dev-tool issues must be separated from shipping runtime exposure. npm proposes changes across declared compatibility ranges for several packages; no npm audit fix --force, lockfile rewrite, or major upgrade was applied. Recommend a dedicated compatible-upgrade change with full checks/build and targeted contract/migration review. Risk of blindly upgrading Zod/Drizzle/Next/Vitest exceeds the scope of a surgical fix.

### E06 — Medium: crash lock recovery and shallow JSON validation — RETAIN / PROPOSE

JsonFileStore.transact exclusively creates <file>.lock and retries for five seconds. An abruptly terminated process can leave a lock indefinitely. load validates array shape, string IDs, and uniqueness, not nested feature schemas. Most services cast the result; only Events explicitly validates records on list. A structurally valid file with invalid nested arrays can fail later in a view/service. Do not auto-delete locks or reset malformed data: either can lose real work. Keep the existing documented manual recovery procedure in ENGINEERING_REMEDIATION.md; propose explicit validation/migration policies with fixtures and review before changing persisted formats.

### E07 — High potential impact: transaction isolation needs broader review — UNRESOLVED RISK

runInTransaction serializes callers of that method, but repositories remain callable directly on the same connection, and TaskService reads existing records before entering its transaction. An unrelated direct write interleaved during an awaited transaction could join its savepoint and be rolled back with it; pre-transaction snapshots can also become stale. Existing tests do not establish isolation under all mixed operations. This is a source-derived risk, not a reproduced production incident. Recommend an explicit transaction/session ownership design and deterministic interleaving tests. Do not solve by wrapping every method ad hoc or adding unreviewed nested transaction semantics.

### E08 — Medium: runtime and configuration portability — PROPOSAL

- APCS synchronously rescans its full archive for overview/search and reads entire downloads into memory; a large library can block the Node event loop and allocate large buffers. Root is hardcoded in apcs-storage.ts. No representative archive profiling was performed. Prefer measured indexing/streaming and explicit root configuration in a separate change.
- LocalMediaStorage returns /api/media/<id>, but no media HTTP route exists. Current task contracts contain no attachment records. Preserve the adapter/contract tests as compatibility capability; do not promise working uploads in documentation or delete it solely for lack of UI calls.
- Drive intentionally lacks implementation, and JSON stores bypass that driver. Treat local-only deployment as a real boundary; this audit does not approve public/multi-user hosting.
- phase01 capture-review.mjs depends on playwright and sharp while neither is a direct declared dependency (sharp may be available transitively). Clean-clone reproduction is not established; retain historical tooling and document its separate prerequisites before reuse.

### E09 — Medium/low: feature gaps and misleading state — PROPOSALS

| File / flow | Evidence and impact | Next action / verification |
|---|---|---|
| entertainment-service.ts getData | currentBook/currentGame fall back to first record even when none is reading/playing; UI labels say current | Confirm selection rule; return null for no active item if approved, with service/UI fixtures |
| LearningRoomView.tsx | Active/reflection state is component-local; navigation/reload before saving loses it | Define recovery vs explicit discard; then persistence/navigation tests |
| AiEngineeringService / AiEngineeringView | New state has an empty roadmap; exposed actions toggle topic/add note but do not create roadmap stages | Decide manual setup/import scope; do not reintroduce demo history |
| EventsView / event-domain | Recurrence metadata exists but occurrence expansion/exception editing is absent; no full month workflow | Confirm scheduling scope, then date-boundary and recurrence tests |
| MilestonesView delete | Dialog selection is cleared immediately after mutate; errors leave page alert but lose context | Focused failed-delete interaction change in later UI work |
| Projects/Milestones/Achievements | Stored date/link/update fields exceed fields exposed in current forms | Product completeness decision, not grounds for automatic feature expansion |
| notification-service.ts listNotifications | Live timed-source title/URL replace payload fields, but payload message can retain old title after rename | Targeted live-projection/read-state regression before changing DTO construction |

### E10 — Low: redundancy and coupling — KEEP unless separately justified

The static source graph found src/features/blank/BlankPage.tsx without source consumers. Repository documentation still references it extensively, and historical/future intent remains. No file was deleted. Symbol candidates include isNodeRuntime, getFeatureByHref, exposed hooks without current view consumers, ignored JsonFileStore seed argument, and orphan-looking modal CSS. A source-only graph is not enough to delete interfaces/styles/assets with dynamic or documentary use.

DailyBoard/HubList and newer views repeat form coordination, write-lock sets, error markup, and local modal styles. Several feature files are 500–700 lines. Forced merging would couple distinct workflows and visual designs; no evidence established a simpler shared abstraction that justified that risk. WorkspaceShell imports task styling/presentation: permitted by current lint configuration but broader than PROJECT_DESCRIPTION's advertised UI boundary. Reconcile intent before reorganizing.

## Outstanding priorities and review decisions

1. Prioritize compatible dependency remediation and transaction isolation investigation.
2. Approve factual documentation reconciliation and the proposed authority structure; preserve historical bytes.
3. Confirm unfinished product behavior (session recovery, AI setup/import, recurrence, leisure selection), instead of treating old completion claims as acceptance.
4. Keep a separate measured UI/accessibility/performance acceptance pass. The limited browser check here covers Writing Room only; no broad redesign was performed.

No code files were merged or removed. All changes are additive or small reversible edits, and the existing index was not staged or rewritten by this task. See DETOX_CHANGELOG.md for exact attribution and VERIFICATION_REPORT.md for limitations and results.
