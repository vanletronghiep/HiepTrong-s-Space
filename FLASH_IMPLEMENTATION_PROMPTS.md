# Gemini 3.8 Flash High — implementation assignments

Copy one milestone block into Flash when assigning that milestone. Each block references repository documents so the assignment remains concrete without pasting the whole audit. **Do not run all blocks at once.** Codex directs and evaluates; Flash implements. These prompts are prepared, not executed.

## Common implementation contract

Every milestone must read and follow this contract:

1. Work in the actual Hiep Trong Space repository. Read root `AGENTS.md`, applicable nested instructions, `blueprint.md`, `WEBSITE_QUALITY_AUDIT.md` relevant findings, `DESIGN_SYSTEM_GUIDE.md`, and your row in `REMEDIATION_PLAN.md`. Do not activate `md/task.md` or archived assignments. Check current source; older documents can describe obsolete implementation.
2. Inspect Git status/diff before editing. Preserve existing user changes and record hashes of `md/user/user_desc.md` and `md/user/user_notes.md`; never edit either. Do not commit unless explicitly authorized; never push/deploy or change protected branches, credentials or original personal data.
3. Record assumptions and a short implementation/check plan. Implement only the assigned milestone. Follow UI → client → HTTP API → services → storage boundaries; keep contracts/domain pure. Reuse existing primitives and utilities. Do not reformat/refactor adjacent code or add speculative features/dependencies.
4. Reproduce objective defects using isolated synthetic fixtures. Do not start a pre-M00 runtime against real data: the current JSON store ignores DATA_DIR and can overwrite files. Use an isolated source copy until that defect is corrected.
5. Actual Daily Task Management is the visual reference: soft lavender atmosphere, editorial serif title, fine edge illustration, soft rounded clear panels, precise sans-serif controls. Preserve successful Daily/Hub behavior. Apply the blueprint's feature themes through the shared guide; no generic dashboard replacement, emoji decoration, harsh random gradients or excessive glass.
6. Provide every significant UI state: loading, empty, populated, invalid form, pending, error/retry, and success. Keyboard, focus, labels, Escape, mobile sizing and reduced motion are requirements, not optional polish.
7. Run focused meaningful regressions, then required `npm run check`; run build for route/bundle/asset/dependency/schema/release changes. Save commands, exits and logs. Existing passing tests are not evidence that a new feature works.
8. Save real browser evidence to ignored `review/quality-remediation/Mxx/`: manifest, desktop/phone captures, affected 320px layouts, interactions/persistence assertions, normal/reduced-motion evidence where relevant, and `RESULT.md`. Do not alter `.gitignore`, include secrets, or call a mockup an implementation screenshot.
9. Update your ledger row to **review**, not accepted. Report exact criteria met, unresolved problems, evidence and remaining decisions. Codex will inspect the diff and rendered product and may issue corrections. Stop at this milestone; no automatic expansion or provider calls for unrelated work.

## M00 — persistence and API boundaries

```text
You are Gemini 3.8 Flash High implementing M00 in Hiep Trong Space. Follow the Common implementation contract in FLASH_IMPLEMENTATION_PROMPTS.md and the M00 row of REMEDIATION_PLAN.md.

Objective: contain the reproduced data-loss and boundary defects F01–F03, correct task validation error mapping F24, and prevent false personal demo history F13 before further UI work.
Read src/services/storage/json-store.ts, apcs-storage.ts, src/server/config.ts, api-response.ts, the new JSON-backed services/contracts/API handlers, and review/quality-audit-2026-11-10/storage-probes.json. Use existing SQLite transaction and API-error conventions as references; do not replace the app architecture.

Required: preserve corrupt/unreadable JSON; initialize only truly missing stores; serialize read-modify-write, atomically replace files, commit cache only after success; inject configured data paths. Test concurrent fresh loads and multiple service instances. Fix APCS lexical/canonical path containment including Windows sibling prefixes and junctions. Reuse same-origin/content-type/body parsing in all new mutations, validate date/chronology/IDs/numeric relationships, and return appropriate 4xx errors. Fresh personal stores must be empty, with any demo seed explicitly separated. Do not delete existing mixed user/seed records or migrate personal databases automatically.

Acceptance: 20 concurrent creates survive reload as 20 unique records; malformed fixture bytes unchanged; forced write failure preserves disk/cache; custom DATA_DIR used by every store; sibling/outside/junction reads denied while valid nested file access succeeds; cross-site plaintext POST rejected; invalid event date rejected; past task deadline returns 400 with a field error in development and production, not INTERNAL_ERROR; clean store claims no personal achievements/history. Preserve API compatibility for valid clients.
Visual boundary: no redesign. Capture honest empty/error states if changed, using existing primitives. Run focused storage and route tests, npm run check and build for changed configuration/routing. Provide synthetic fixture reproduction and evidence in review/quality-remediation/M00. Request Codex review, not self-acceptance.
```

## M01 — shared rendering and interaction reliability

```text
Implement M01 only; follow this file's Common implementation contract. Confirm M00's relevant gates before using persistent test data. Address F04–F07, F17 and the shared part of F23.

Objective: make every route navigable, forms usable, and the design tokens real before thematic restyling. Read tokens.css, globals.css, motion.ts, Button.tsx, Dialog.tsx, Drawer.tsx, use-focus-trap.ts, UniverseMenu.tsx, WorkspaceShell.tsx, TransitionProvider.tsx and all eleven replacement page/view entry points. Compare actual Daily and Hub screenshots. Review undefined-tokens.json while excluding code-assigned variables.

Required: resolve no-fallback token/utility failures through intentional semantic mappings; do not blindly recreate obsolete aliases. Fix leftIcon/rightIcon usage. Add PageReady to success/empty/error route states. Replace bespoke overlay/focus behavior with shared primitives and portals where required. Associate form labels, keyboard-enable article/note actions, add skip navigation, restore/contain focus, and prevent background controls covering dialogs. Give queries and mutations explicit loading/empty/error/retry/pending behavior; retain drafts on failure. Make narrow filters/calendar containers reachable without document overflow. Keep existing data rules and successful components.

Acceptance: Universe to every new page no longer waits for the 10s failsafe; normal warm navigation follows the existing ~3s sequence and reduced motion <=300ms after readiness. Events New event has a visible contrast-compliant fill; modal above stats at 390px; Tab/Shift+Tab stay inside, Escape restores trigger focus. Inject GET/write failures: visible error, preserved input, one successful retry. Check 320/390/768/1440 and computed CSS values/contrast. No missing-token fill, hidden submit, inaccessible article, or fake empty state.

Creative freedom: shared spacing/control refinements only; preserve Daily's art and do not redesign every page. Run check/build and capture review/quality-remediation/M01. Update ledger to review for Codex.
```

## M02 — homepage and task reference finish

```text
Implement M02 only, following the Common implementation contract after M01 review. Address F14–F16 for Home, Daily and Hub.

Objective: deliver a polished reference that subsequent themes can follow, preserving the established task workflows and Earth journey. Read HomeJourney.tsx, home-journey.ts/CSS, earth-scene.ts, FeatureCollection and gallery modes, DailySky/DailyDashboard/DailyBoard/TaskCard/HubList, daily CSS and DESIGN_SYSTEM_GUIDE.md. Inspect local sources/img/img10.png–img14.png and sources/vid/vid8.mp4 if present; record missing-reference limits rather than inventing their appearance.

Required: make the closing motto readable even when its gradient cannot render; verify Earth size/leftward handoff, progressive right-to-left intro reveal, and soft lavender/blue nebula gallery. Preserve wordmark, Earth textures/fallback, horizontal and vertical browsing. Correct the hardcoded false urgent-task/productivity forecast using neutral or genuine deterministic data. Preserve completed Daily decoration cleanup, clock/countdown, priority glyphs, board hierarchy, measured scrollbar and task identity. Do not build new analytics for Observatory without resolving OD-01; make any placeholder honest. Keep Tasks Hub the calmer collection view.

Acceptance: full intro including closing emphasis legible at desktop/phone; no phase jump, inaccessible hidden panel or content overlap; both gallery modes usable; WebGL failure and reduced motion retain content/navigation. Empty Daily claims no urgent task; populated Day/Week/Month/Overdue and transfer work; schedule-only changes preserve deadline and transfer updates both. Capture matching before/after 1440/390, 320 controls and a normal-motion recording or measured poses. Compare the visual rubric, not just colors. No generic dashboard/blanket art removal. Run check/build, provide M02 evidence, request Codex review.
```

## M03 — shared timed-source reminders

```text
Implement M03 only under the Common implementation contract. M00 and shared reliability must be reviewed. Address F09 without disrupting task reminder behavior.

Objective: every deadline or explicit scheduled time participates in one trustworthy in-app notification system. Read NotificationService, scheduler, domain notification/reminder rules, DTOs/repositories, task write hooks, NotificationItem/Popover and event/project/milestone/achievement time fields. Preserve current read checkbox, relative age, time-left, task joins and seven-day retention.

Required: design the smallest typed source and occurrence identity needed across the current domains, with target links, dedupe, timing/mute preferences, catch-up and stale-alert suppression. Document the contract before coding; retain established task rules. Wire reschedule, complete/cancel, delete, and reminder changes. Make the achievement connected-state label reflect actual support. No external notification delivery, app-closed service, public backend, or speculative plugin framework.

Acceptance: fake-clock fixture for each timed source produces appropriate advance/due/overdue states once, opens the correct entity, survives restart without duplicates, and suppresses obsolete occurrences after edits. Mark read/unread and read-all work; age >=7 days expires; muted/finished/cancelled sources do not emit stale reminders. Include occurrence exception cases shared with M04. Capture center empty/loading/error/read/unread on desktop/phone using shared theme. Check and build when schema/routes change; evidence under M03 and Codex review required.
```

## M04 — Events correctness and forest composition

```text
Implement M04 only under the Common implementation contract after shared UI and reminder contracts are reviewed. Address F08, plus Events-specific F16/F17.

Objective: a correct usable week/month event planner with the blueprint's soft forest identity. Read EventsView/CSS, event contracts/service/domain, Daily WeekView/MonthView as interaction references, and the M03 occurrence contract. Daily is the illustration/typography/proportion reference, not a source of task-specific scheduling rules.

Required: assign each occurrence to its actual zoned date; support week/month navigation, one-time and recurring events, editing one occurrence without rewriting the series, detailed centered dialogs, preparation-task links, explicit deadline versus timed-event cues, and prominent exams. Expose only meaningful stats. Keep today's date/time without seconds and update relative times. Use shared controls, dialogs, loading/error and pending states. Implement a pale sage/mint layered scene with fine tree/grass/leaf motifs outside calendar content; optional fauna only if tasteful.

Acceptance: a Wednesday fixture renders once on Wednesday, never all seven days; events outside selected range absent; month/week/midnight boundaries correct; recurring edit/cancel changes only intended occurrence; reminder identity deduplicates. Keyboard opens calendar details, saves/edits with visible errors, and Escape works. At 320/390 use a readable agenda or contained calendar with all controls accessible. Capture cards, week, month, exam detail, recurring edit, empty/error and mobile states; compare forest/Daily side by side. Run check/build and submit M04 evidence to Codex.
```

## M05 — Projects and Milestone workflows

```text
Implement M05 only following the Common implementation contract; depend on M01/M03 and follow Events review. Address F18 and these pages' F16/F17.

Objective: complete editable project/ambition context while preserving manual progress and shared identities. Read ProjectsView, MilestonesView, relevant contracts/domain/services/query hooks, and shared task navigation/pickers. Use Daily panels/typography with distinct computing and quiet-horizon themes.

Required: edit title/overview/next step/blockers/status, optional deadline and relative remaining time; select/navigate linked existing tasks and milestones without copies. Keep manual progress independent of task percentages. Milestone supports arbitrary timeframe, optional target date, reflection, editable landmarks and related projects. Integrate changed dates/status with M03. Use controlled forms and success-confirmed closure; maintain input on failure.

Creative boundaries: subtle technical line art for Projects, soft path/horizon landmarks for Milestone; shared cards/controls and reading zones. Do not turn Milestone into a second daily task list or force a complex graph canvas.
Acceptance: create/edit/reload both records, clear optional dates, link and navigate to existing identity, preserve manual percentages, and observe updated reminders. No delete/recreate editing. Test failure/pending/long titles, keyboard and 320/390/1440 states. Capture empty/populated/edit/linked context. Run check (build for route changes); submit M05 result for Codex review.
```

## M06 — APCS ocean library

```text
Implement M06 only under the Common implementation contract; require M00 file-boundary protection and M01 controls. Address F19 and APCS F17/F16.

Objective: browse/search/open the existing Year I archive honestly and comfortably without moving any files. Read ApcsStorage, APCS service/API/hooks/view/CSS and the sea/sky palette specification. Use synthetic roots for unsafe, missing, empty, large and junction tests. Existing personal files are read-only.

Required: explicit inaccessible/missing/empty states instead of fake counts; show real path and supported course metadata clearly. Preserve folder/breadcrumb navigation, search/category filtering and safe open/download. Measure request latency/scanning on a representative fixture before choosing bounded async scanning/cache improvements; don't add a search server. Provide cancellation/loading/error feedback. Retain the source hierarchy; app labels must not imply reorganized disk contents.

Visual direction: pale blue/turquoise layered sky/waves and fine edge motifs from Daily's illustration family, with a crisp file list and prominent search. Avoid decorative effects inside dense file metadata.
Acceptance: path-boundary tests still pass; search and filters reach all results/controls at 320px; keyboard opens folders/files; supported preview/download responses match actual bytes and names; missing root is truthful; archive unchanged. Capture desktop/mobile browse/search/empty/error and record an actual file-open result. Check/build and submit M06 evidence to Codex.
```

## M07 — focus and tracking accuracy

```text
Implement M07 only under the Common implementation contract after M00/M01. Address F10/F11 and relevant F16. Finish Learning Room first in the blueprint's primary sequence, then Tracking accuracy; secondary Tracking visual polish may be a separate review pass within this milestone.

Objective: recorded focus, pause, sleep and habit statistics must reflect actual user activity. Read LearningRoomView/service/contracts and TrackingView/service/contracts alongside domain clock/time helpers and the design guide.

Required: timestamp-based focus timer with measured pauses/breaks and true start/end, meaningful early finish and focus-to-break lifecycle, logging without notes, recoverable failed save, and explicit reload/navigation behavior. Derive streaks/efficiency/history from sessions. Use Asia/Saigon day keys for habits/logs, proper seven-day windows and consecutive streaks; no invented empty-data fallbacks. Make sleep calculator input-driven and label it a planning aid without guaranteed-health copy. Validate manual totals and offer readable chart/text summaries.

Visual direction: cozy quiet focus surface, reduced ornament while active; Tracking uses restrained Japanese-inspired botanical geometry, not guilt-driven scores. Both retain shared type/control/overlay language.
Acceptance: controlled clock reproduces 65s focus +65s pause with correct recorded amounts and zero unperformed break; phase completion/skip-notes/reload/failure tested. 00:01/06:59 local dates, gap days, empty data and period boundaries produce correct stats. Capture running/paused/break/reflection/quiet mode and populated/empty Tracking at desktop/phone. Check and build for persistence changes; M07 evidence and Codex review.
```

## M08 — durable Writing Room

```text
Implement M08 only under the Common implementation contract after M00/M01. Address F12 and Writing F16.

Objective: a calm local writing workspace with durable drafts, editing, basic rich text and honest attribution. Read blog contracts/service/hooks, WritingRoomView/CSS, blueprint's Writing section and DESIGN_SYSTEM_GUIDE.md. Inspect the saved desktop/mobile reference screenshots and https://codexinsider.com/guides/codex-usage-dashboard/ when available; use article measure, hierarchy, summary and source patterns, not branding/assets/uppercase or monospace styling.

Required: save/resume/edit draft, existing article editing, clear local-save/publish status, basic formatting with safe rendering, category separate from authorship, original source and author for saved work, Hiep commentary separated from original content. Preserve user's existing prose and format during upgrades; handle unsaved/failure states explicitly. Provide optional user-controlled music only within an approved source and without autoplay or an invented provider connection.

Creative direction: warm ivory/wood/sage editorial surface, fine botanical margins, serif titles and readable long-form measure. Maintain cosmic-family continuity through shared forms, controls and atmosphere. Resolve any materially different interpretation with the owner, not by silently overriding the blueprint.
Acceptance: save draft → reload → resume → edit → save without loss; bold/list/quote/basic headings render correctly; saved external writing retains source URL and separate commentary; failure preserves inputs. Desktop/phone long article, composer, empty/filter/error evidence; keyboard and zoom. Check, build for editor dependencies, M08 review bundle for Codex. Public publishing is out of scope.
```

## M09 — AI learning and Flashcards

```text
Implement M09 only under the Common implementation contract after M00/M01. Address F20/F21; F13's honest data policy is mandatory.

Objective: accessible, truthful study flows with useful progress. Read AI/Flashcard views, models, services and query hooks. Preserve typed card creation, Ctrl+S, reveal and confidence controls; preserve roadmap/topic context. Use subtle network art for AI and pale parchment/slate/knotwork margins for Flashcards, within Daily's shared typography and geometry.

Required: an actual selected-note reading-copy/manual-refresh workflow with provenance and real refresh timestamps if source access is available; otherwise explicit unconfigured state and usable manual reading-copy workflow. Never label fixture notes synced. Render note content readably and support keyboard activation; recalculate roadmap stages consistently. For cards, add in-flight/duplicate guards, correct empty counters, finite review feedback and a clear end state. Simple confidence prioritization may follow the blueprint proposal, but do not invent a full spaced-repetition contract; remove unsupported claims if not implemented.

Acceptance: refresh failure preserves previous note/source; originals never modified; topic progress consistent; note opens with keyboard. Ctrl+S saves once under slow network; reveal/rate moves exactly once; empty deck never says 1 of 0; review failure preserves current answer; completion clear. Capture roadmap/note/error and deck/create/study/answer/end at desktop/phone. Check/build when integration changes; submit M09 evidence to Codex, with external access limits stated.
```

## M10 — portfolio and leisure completion

```text
Implement M10 only under the Common implementation contract after M00/M01/M03. Address F22 and these pages' F16.

Objective: a maintainable personal gallery and relaxed leisure collection. Read Achievements/Entertainment views, contracts, services, update hooks and the guide. Preserve local-only single-user operation, era stories/lessons, manual book progress and external music links.

Required: edit existing achievement records without delete/recreate, full era coverage including Elementary, truthful optional future-contest reminders via M03; replace the unbounded eyebrow SVG with a deliberately sized motif. Books/games/music need practical maintenance of their existing fields, including status/hours/links where relevant. Do not assign a five-star opinion the user never entered. Keep mutation errors/pending behavior and slider persistence reliable.

Visual direction: soft portfolio gallery/era hierarchy and muted lounge blue/lilac/warm cream; distinct compositions, common controls/typography/illustration style. No public portfolio, gaming platform, or embedded streaming integration.
Acceptance: create/edit/reload records, change era/status/progress/optional rating, preserve identity and actual reminders; failure leaves data/forms intact; keyboard actions and 320/390/1440 layouts work. Capture view/edit/long content/empty/error and collection detail states. Run check and build when required; submit M10 result to Codex.
```

## M11 — final product verification

```text
Implement M11 verification and only necessary corrections after M00–M10 have Codex reviews. Follow the Common implementation contract. This is not permission for another redesign or full-repository refactor.

Objective: establish a reviewable release-quality result across every route and meaningful workflow, and close F23/F24 plus all milestone criteria. Use the audit, design guide, accepted bundles and current diff as the scope map. Do not rerun broad discovery of unchanged code.

Run npm run check and production build with isolated data. Recheck F24 past-deadline validation through a fresh production server and supported dev flow, report root cause only when established. Exercise source identity/deadline/transfer/reminder lifecycle, all feature create/edit/reload flows, errors/empty/loading, navigation/back/forward, modal focus and 320/390/768/1024/1440 with normal/reduced motion. Measure meaningful performance issues; do not infer smoothness from screenshots. Verify protected hashes and unrelated changes remain intact.

Update observed-implementation docs (README, PROJECT_DESCRIPTION, shared/epic docs) to match verified routes/tokens/behavior while preserving open product decisions. Produce a finding-by-finding disposition and route/state evidence matrix. Compare every feature against actual Daily and the visual rubric; identify precise residual P2/P3 limitations, not vague polish claims.

Save the final bundle under review/quality-remediation/M11 and set ledger to review. Codex, not Flash, grants acceptance. Do not push/deploy/commit or mark the overall website restored merely because all tests pass.
```

## Corrective review template

Use this after Codex rejects a specific criterion; send only the affected correction, not the entire audit again.

```text
Continue Mxx under its existing scope and Common implementation contract.
Criterion/finding: [ID and exact acceptance criterion].
Evidence: [current revision, screenshot/interaction/log, code location].
Observed: [specific rendered or functional behavior].
Expected: [measurable behavior or precise composition change].
Correction: [smallest targeted action; preserve named successful elements].
Recheck: [affected tests/viewports/states plus required repository gates].
Return updated evidence and diff; leave ledger in review for Codex. Do not expand scope or claim acceptance.
```
