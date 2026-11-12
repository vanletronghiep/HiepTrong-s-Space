# Verification report

12 November 2026, Asia/Saigon. Results belong to this working tree and execution environment. PASS means the named check completed successfully; it is not a full-coverage or production-readiness claim.

## Initial baseline

| Check | Status | Actual outcome |
|---|---|---|
| Working tree inspection | PASS | Substantial existing staged/unstaged/untracked changes; preserved as task baseline. No clean-HEAD assumption |
| Applicable instructions/config/scripts | PASS | Root AGENTS and documentation guide read; actual package scripts used; md/task inactive |
| Node/npm | PASS | Node 26.13.0, npm 11.20.0 (project minimum Node 22+) |
| npm run check in filesystem sandbox | FAIL | Lint and TypeScript passed; Vitest: 32 files passed/2 failed, 130 tests passed/6 failed |
| Sandboxed failure diagnosis | PASS | Five JSON rename EPERM failures and one APCS junction EPERM failure reproduced environment restrictions, not application defects |
| npm test outside filesystem sandbox | PASS | 34 files, 136 tests passed, exit 0; original source/tests unchanged at this point |
| npm run build in filesystem sandbox | FAIL | EPERM mkdir .next/server/app/api; no compile conclusion from that run |
| npm run build outside sandbox | PASS | Production compilation/type validation completed; generated 35 static-page jobs plus dynamic API routes |

The unrestricted build used DATA_DIR/MEDIA_DIR in a unique temporary directory. No runtime server was started against personal storage. The original suite's engineering route test can consult the configured projects store for a missing ID; its baseline execution was read-only. Final checks explicitly redirected that store to synthetic data. No baseline application defect caused a remaining test failure once the filesystem restrictions were removed.

## Regression evidence: fail before, pass after

| Regression | Before fix | After fix |
|---|---|---|
| DELETE guard: three handlers × mismatched Origin/cross-site metadata | FAIL: six cases returned 200 rather than 400 | PASS: rejects before service access |
| Trusted loopback DELETE, three handlers | PASS | PASS |
| Timed reminder, two independent service instances | FAIL: unique dedupe conflict rejected tick | PASS: one persisted reminder, creation counts 0 and 1 |
| Genuine timed-reminder disk failure/retry | PASS before change | PASS: exception preserved, immediate retry succeeds |
| SAVEPOINT setup failure followed by another transaction | FAIL: next transaction timed out in 5000ms | PASS: setup error surfaces; queue recovers |
| Close existing article edit → new piece | FAIL: editor still had existing identity/title | PASS: blank editor; create called, update not called; original fixture preserved |

Focused command before core fixes:

```powershell
npm test -- tests/server/delete-origin-guards.test.ts tests/services/notification-service.test.ts tests/services/storage/local-storage-adapter.test.ts
```

Before: 3 files failed, 8 cases failed and 18 passed. After: 3 files passed, all 26 cases passed. Writing Room's separate red run had 1 failure/2 passes; after its fix all 3 passed. These tests exercise observable persistence, boundary and identity behavior rather than duplicating implementation details.

## Final verification

| Check | Status | Outcome |
|---|---|---|
| npm run check (unrestricted, synthetic configured storage) | PASS | ESLint, strict TypeScript and 35 Vitest files / 149 tests, exit 0 |
| npm run build (unrestricted, synthetic configured storage) | PASS | Next 15.5.28 optimized build, type/lint gates, 35 generated page jobs, API route compilation and trace collection |
| Targeted regression files | PASS | All new cases and existing neighboring cases passed |
| Production HTTP: Events/Projects/Milestones | PASS | Create 201 → mismatched-Origin DELETE 400 → GET 200 (retained) → trusted DELETE 200 for each |
| Production HTTP: shared task lifecycle | PASS | Create 201 → unschedule with explicit null 200 → complete 200/completed → reopen 200/active → transfer date/deadline 200 → delete 200 |
| Writing Room browser round trip | PASS | Create synthetic draft → open/edit/close → overview/new editor blank → save second draft → reload shows both titles |
| Persisted synthetic article inspection | PASS | Two different IDs and original/separate prose retained in JSON; no PATCH-overwrite |
| Writing Room narrow/desktop inspection | PASS, limited | Blank dialog/controls visible, focus inside dialog; narrow dialog remained inside document. See viewport limitation below |
| Existing design/architecture checks | PASS | Token and craft guardrails, feature registry and transition tests included in full suite |
| git diff --check | PASS | Exit 0; Git emitted existing LF/CRLF conversion notices, no whitespace errors |
| Documentation preservation | PASS | All 51 inventoried existing documents hash-identical across the report-only phase |
| Protected owner files | PASS | Hashes match reconnaissance values below |
| Git index preservation | PASS | git ls-files --stage identical before/after final verification; no staging or commits |
| Static source cycle/package scan | PASS, limited | No cycles among resolved literal imports/exports/dynamic imports; all direct runtime packages referenced from src |
| Existing Markdown local targets | FAIL, pre-existing | 41 missing target occurrences: 26 archived, 15 outside; no original docs edited to conceal them |
| npm audit --json | FAIL, pre-existing advisories | Outside sandbox: 17 affected package entries, 2 critical / 3 high / 12 moderate; detailed in CODEBASE_AUDIT E05 |
| Test coverage percentages | NOT CONFIGURED | No coverage script/threshold configured; no coverage percentage claimed |
| Dedicated browser E2E/axe/visual CI gate | NOT CONFIGURED | Historical review scripts are not a general automated acceptance suite |
| Exhaustive 320–1440 viewport matrix / assistive technology | NOT RUN | No broad UI redesign; browser spot check is not complete accessibility acceptance |
| Reduced-motion live browser emulation | NOT RUN | Existing reduced-motion transition tests pass; live preference-switch matrix not exercised |
| Large APCS archive profiling/download memory | NOT RUN | Real archive was not used as an audit fixture |
| Public/shared deployment security, penetration testing | NOT RUN | Local-only application trust model retained |
| Dependency upgrade compatibility | NOT RUN | No packages changed; major-range updates remain proposals |

One intermediate final-check attempt failed on TypeScript inference in the new parameterized DELETE test (a union added optional undefined header properties). The test table was explicitly typed Record<string, string>; then the full check passed. No production type was loosened, lint disabled, or test skipped. The final build completed successfully. The initial npm audit attempt was BLOCKED by sandbox DNS; the approved read-only retry returned real advisory results. No automatic approval review rejected an action.

### Isolation and cleanup

Final commands used:

```powershell
$env:DATA_DIR = Join-Path (Get-Location) 'tmp/codebase-detox-tests'
$env:MEDIA_DIR = Join-Path $env:DATA_DIR 'media'
npm run check
npm run build
```

The directory contained synthetic projects.json=[] to avoid consulting the configured real project store. Existing SQLite/JSON/APCS suites use disposable fixtures. No CLI migration was run against the application database. Package installation, lockfile edits and real-data maintenance were not performed.

Browser/runtime command:

```powershell
$env:DATA_DIR = Join-Path (Get-Location) 'tmp/codebase-detox-browser'
$env:MEDIA_DIR = Join-Path $env:DATA_DIR 'media'
$env:DATABASE_FILE = 'synthetic.db'
npm start -- -p 4139
```

All feature JSON files were initialized to [] inside that dedicated directory, including timed-source collections. This prevents legacy-path fallback from reading personal files. The app bound 127.0.0.1:4139. No real APCS library request was made. Only synthetic articles/events/projects/milestones/tasks were created.

After verification the listening process was identified by its Next start command and port, stopped, and the two fixture directories were removed using checked absolute paths contained within workspace/tmp. Browser viewport override was reset. Ignored tmp/codebase-detox-audit retains hash/index inventory support, not personal stores; generated .next remains ordinary build output. No existing untracked files were deleted. The initial attempt to retain a pre-edit snapshot in a per-command sandbox temp directory was not durable across calls, so it is not presented as a complete byte-for-byte source baseline; attribution relies on the recorded initial Git status and bounded patches. Documentation-phase hashes and final index comparison are durable local evidence.

### Browser limitations

Screenshots and accessibility/DOM inspection confirmed the changed Writing Room flow. Viewport capability requests of 320×844 and 1440×900 yielded actual DOM widths of 291 and 1309 CSS pixels in this in-app browser, respectively. At the narrow size, dialog bounds were approximately x=16..275 within a 291px document and focus was inside it. At the desktop size, both article cards persisted after reload and document width equaled viewport width (1309). These are useful small/large spot checks, not proof of exact requested breakpoints or complete control reachability. Screenshots were displayed inline during the session, not delivered as a standalone screenshot evidence bundle. No styling or token change was made.

## Protected-file SHA-256

```text
md/user/user_desc.md
9df2cd18cfe768c412fb58a540f8cb02ba25fa6d7c695697a4a1ef12ac0340e3

md/user/user_notes.md
6803bd1ae2e9031c902785334a1087fa7e92e5c9a1eec9f0fcd9ab417d0b82c4
```

## Assessment

The final code fixes four reproduced failures without changing architecture or persistence formats and expands behavioral coverage from 136 to 149 tests. Existing verification remains green with filesystem permission limitations understood. Dependency advisories, documentation contradictions, and unresolved feature/isolation risks remain visible. The result is safer and easier to review, with narrowly attributable changes; it is not an assertion that the whole product is complete, visually accepted, or safe for public hosting.
