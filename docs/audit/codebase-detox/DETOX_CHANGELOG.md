# Detox changelog

12 November 2026, Asia/Saigon. Attribution begins at the already-dirty working tree supplied to this task, not Git HEAD. Existing broad client/service/UI remediation, seed removal, Earth/Daily work, new destinations, audit documents, and tests were pre-existing and are not claimed here.

## Code and test changes actually made

| File | Action | Reason |
|---|---|---|
| src/app/api/events/[id]/route.ts | MODIFY import and DELETE guard | Reject untrusted origin metadata before deleting |
| src/app/api/projects/[id]/route.ts | MODIFY import and DELETE guard | Same established mutation boundary |
| src/app/api/milestones/[id]/route.ts | MODIFY import and DELETE guard | Same established mutation boundary |
| src/services/notification-service.ts | MODIFY timed-source insert block | Handle only dedupe conflicts, retain genuine failures, count committed creations |
| src/services/storage/local/local-storage-adapter.ts | MODIFY one statement placement | Guarantee queue release if SAVEPOINT setup throws |
| src/features/blogs/WritingRoomView.tsx | MODIFY new-piece initialization and button callback | Clear previous identity and every field; owner selected blank-editor behavior |
| tests/server/delete-origin-guards.test.ts | CREATE (9 cases) | Rejected requests never reach persistence; trusted local deletes remain valid |
| tests/services/notification-service.test.ts | ADD 2 cases | Independent-instance dedupe and genuine failure/retry behavior |
| tests/services/storage/local-storage-adapter.test.ts | ADD 1 case | Savepoint setup failure does not poison queue |
| tests/features/blogs/writing-drafts.test.tsx | ADD 1 case | Canceled edit followed by new-piece save cannot PATCH the original |

Total: six production files modified, three existing test files extended, one test file created. Thirteen additional tests; no files merged, removed, or substantially rewritten. Formatting was restricted to new blocks; no repository-wide format command was run.

## New reports

- CODEBASE_AUDIT.md: architecture, evidence, findings, dispositions, risks, proposals.
- DETOX_CHANGELOG.md: this task's attributable changes.
- DOCUMENTATION_AUDIT.md: complete relevant document inventory, contradictions, overlaps, proposed structure and actions.
- VERIFICATION_REPORT.md: baseline, red/green regressions, final checks, browser evidence and limitations.

Ignored tmp/codebase-detox-audit contains local integrity/inventory support files. tmp/codebase-detox-tests and tmp/codebase-detox-browser were synthetic verification directories; neither is personal runtime storage. They are not deliverables or new application dependencies.

## Before/after architecture and compatibility

Architecture remains UI -> client -> HTTP -> services -> storage, with the existing SQLite and JSON persistence paths. HTTP success/error shapes, task identity, scheduling/deadline semantics, reminder timing, schemas, database migration history, and visual tokens are unchanged. Only untrusted DELETE requests are newly rejected, conflicting reminder writes are treated idempotently, failed transaction setup recovers, and a new article starts with a new identity. Writing Room's new behavior was explicitly confirmed by the owner during this task.

## Changes deliberately avoided

- No rewriting existing documentation, even where objectively stale: documentation audit is report-only under this mission.
- No cleanup/deletion of pre-existing untracked files, BlankPage, assets, migrations, tests, media compatibility interfaces, or ignored reference material.
- No forced JSON-to-SQLite migration, stale-lock auto-removal, seed/user-data cleanup, or format changes. These carry persistence/recovery risk.
- No package upgrade or npm audit fix --force: several suggested fixes cross compatibility ranges and need their own migration checks.
- No broad transaction abstraction, component extraction, global styling correction, or feature expansion based on file length or unactivated plans.
- No activation of md/task.md, historical prompts, model-provider handoffs, commits, pushes, merges, resets, or staging.

The final self-review found no new abstraction beyond the direct editor initialization callback, no new orphaned imports, no dependency/layer shortcut, and no weakened test or lint rule. Broader improvements and approval decisions are recorded in the companion audits rather than represented as completed work.
