# Hiep Trong Space — website quality audit

Audit date: 10 November 2026 (Asia/Saigon). Status: initial audit complete; remediation has not been implemented or accepted.

## Executive assessment

The application has a strong reference in Daily Task Management: pale lavender atmospheric layers, fine celestial illustration, editorial serif headings, soft rounded surfaces, and compact, readable task controls. Preserve this work and Tasks Hub. The eleven newer feature implementations do not yet meet the same standard. Most reproduce a generic header/statistics/card template; some of their intended colors, pill shapes, backgrounds, and motion never render because they reference undefined tokens.

The highest priorities are more serious than aesthetics:

1. **Protect stored information.** The JSON store overwrites malformed files with seed data and loses concurrent saves. Both were reproduced using synthetic files.
2. **Restore dependable interaction.** New routes omit readiness signals, producing an approximately 11-second navigation overlay; Events dialogs render behind their own statistics; failures masquerade as empty data.
3. **Make the product truthful.** Events appear in all seven calendar columns, non-task reminders are not connected, focus statistics record invented durations, and seeded personal history is presented as real information.
4. **Repair the shared foundation, then redesign by feature.** Fix missing tokens, overlays, keyboard access, responsive controls, and feedback once. Carry Daily's composition and illustration quality into the blueprint's individual themes.

`npm run check` passed: lint, TypeScript, and **25 Vitest files / 104 tests**. The isolated production build also passed. Those checks do not establish quality of the eleven new features. The browser and storage findings below remain despite that result.

## Scope, authority, and reproducibility

- Actual repository: `D:\Vibe Coding\HiepTrong's Space`. The chat's configured `D:\Vibe Coding\Task Management` did not exist.
- Read the objective, root `AGENTS.md`, the entire `blueprint.md`, documentation ownership rules, shared UI specification, engineering reference, and relevant homepage/task specifications. The blueprint and current instruction establish the product direction. Older descriptions of eleven blank routes and a dark Daily theme are stale implementation facts.
- Reviewed all 14 product routes (home plus 13 workspace routes), the motion preview, and a missing route; traced new feature UI → client hooks → API → service → persistence. Inspected shared tasks, notification lifecycle, motion, fonts, assets, forms, error handling, architecture rules, and current test coverage.
- Tested an **isolated source copy**, with its own SQLite database and newly created JSON files, at `http://127.0.0.1:4317`. Original `.env`, databases, user documents, and source files were not edited. Existing uncommitted changes were preserved. No push, deployment, migration of personal data, or application rewrite occurred.
- Chromium captures: 1440×900 and 390×844, Asia/Ho_Chi_Minh timezone; baseline captures use reduced motion for stable comparisons. Targeted 320×780 layout checks and ordinary-motion navigation were also run. The local APCS directory was only read; listings contain real filenames, so evidence remains local/ignored.
- Evidence is in [review/quality-audit-2026-11-10](review/quality-audit-2026-11-10/README.md). `routes.json` records HTTP responses, page errors, text, fonts, and screenshot names. `interactions.json`, `followup.json`, `final-checks.json`, and `production-checks.json` distinguish completed checks from automation timeouts. `storage-probes.json` records deterministic reproductions. Scripts and source hashes accompany the evidence.
- All 14 product routes and the preview returned 200 in the baseline; the missing route returned 404. No `pageerror` was captured in those baseline visits. This is **not** a guarantee that every workflow or console warning is clean. Full-page screenshots of sticky/fixed layouts do not represent scroll choreography; dedicated homepage pose captures were used for that.
- Initial sandbox networking and cross-drive dependency-junction compilation failures were audit-environment problems. Captures were rerun successfully after using a separate dependency copy. Do not report those setup failures as application defects.

Evidence labels: **R** = runtime/browser or deterministic synthetic reproduction; **S** = directly traced source; **V** = visual judgment; **G** = blueprint gap. P0 = critical data/security/functionality; P1 = major functionality/UX; P2 = minor defects, visual inconsistency, or polish; P3 = optional enhancement.

## Route and state coverage

Every route below has `*-1440.png` and `*-390.png` baseline evidence. All baseline data outside Tasks/APCS is the application's automatic seed data, not verified user history.

| Surface | Additional inspected states/evidence | Main conclusions |
|---|---|---|
| `/` | Intro at scroll fractions .50/.67/.83/1; vertical gallery; desktop and phone opening | Earth and wordmark remain valuable; closing motto invisible; nebula references invalid. F05, F15 |
| `/tasks/daily` | Empty; five synthetic tasks; Day/Week/Month; Observatory drawer; form | Most polished reference; shared task structure preserved; hardcoded forecast contradicts empty data. F14 |
| `/tasks/hub` | Empty/populated, task form; API complete/uncomplete/unschedule | Preserve its simpler collection design and task identity. F24 records a validation error confirmed in development and production |
| Notifications | Empty and overdue popovers; production expiry → reminder → mark-read; task completion/uncompletion APIs; service/domain inspection | Existing read checkbox/age/time-left/retention structure is useful; general timed entities absent. F09 |
| `/events` | Cards, category controls, week, desktop/phone create modal, injected GET failure, 320px | Sevenfold calendar duplication, blocked form, hidden primary action, no month/recurrence UI. F05–F08 |
| `/projects` | Collection, filters, edit modal, 320px | Manual progress exists; deadline and relationship workflows missing; actions poorly composed. F16–F18 |
| `/milestones` | Landmark toggle, options, new milestone, 320px | Basic checklist works; target date/relationship editing unavailable. F18 |
| `/apcs` | Real overview; loaded production folder/search; PDF download response; synthetic path-boundary probe; 320px | Real archive browsing exists; path containment defect and misleading fallback. F02, F17, F19 |
| `/learning-room` | Presets, running/paused timer, early finish, reflection save, 320px | Timer counts down; recorded pause/break/start time are incorrect. F10 |
| `/blogs` | Collection, reading view, write form, filters, 320px; external reference desktop/phone | Editorial structure worth retaining; no durable draft/edit workflow or rich text. F12 |
| `/tracking` | Habit toggle, sleep form, screen-time UI, 320px | Check-ins exist; streak/day/window calculations are unreliable. F11 |
| `/ai-engineering` | Roadmap, note modal, source links, 320px | Static notes presented as synchronized; note cards inaccessible by keyboard. F06, F20 |
| `/flashcards` | Add-card form, Ctrl+S → 201, study, reveal, confidence click, 320px | Core card creation works; review is an array loop, not prioritization. F21 |
| `/achievements` | View/Edit modes, add form, era filters, 320px | Can add/delete, cannot edit existing entries; reminders misleading; oversized SVG. F09, F13, F22 |
| `/entertainment` | Books/games/music, progress sliders, add-book form, 320px | Useful collection baseline; static games/music cannot be maintained fully. F22 |
| `/preview/home-motion`, missing route | Desktop/phone captures | Preview remains a development surface; 404 renders. No specific defect established |

**Coverage limits:** not every CRUD permutation was executed. Browser restart durability, mobile virtual keyboard, real touch hardware, screen-reader speech, video/audio attachments, long-running background timers, all recurrence cases, and production performance remain acceptance work. Initial APCS captures caught loading states; production follow-up loaded the folder/search and returned a PDF download with HTTP 200 (604,662 bytes). PDF viewer rendering and all supported file types were not tested. Normal-motion route timing was measured, but normal-motion homepage performance was not profiled. No live Notion import, source-link ownership, or external music playback was verified. Failed automation selectors/timeouts are retained as limitations, not product findings.

## Findings and acceptance criteria

### F01 — P0 · JSON persistence can destroy data (R/S)

**Affected:** `src/services/storage/json-store.ts` and all new JSON-backed services. `load()` catches every read/parse failure and writes `defaultSeed`; `save()` reads/constructs a replacement outside the write lock; `persist()` updates the cache before disk success and writes the destination directly. It also ignores configured `DATA_DIR`.

**Evidence:** [storage-probes.json](review/quality-audit-2026-11-10/storage-probes.json): malformed synthetic JSON was replaced by `[{"id":"seed"}]`; 20 concurrent `save()` calls retained **one** row. No personal data was used. `probes.cjs` transpiles the actual class and runs it in a temporary fixture directory.

**Impact / correction:** new events, projects, reflections, and other records can disappear. Treat only ENOENT as an empty-store case; preserve invalid/unreadable bytes, report an actionable error, validate loaded records, serialize the entire read-modify-write operation, use atomic replacement, and publish cache changes only after durable success. Inject configured paths. Keep the patch focused; a database migration is not required to contain the defect.

**Accept:** 20 concurrent creates retain 20 unique records after fresh-instance reload; malformed JSON is byte-identical after rejection; forced write failure preserves disk and cache; configured directories contain all stores; documented behavior under multiple processes; existing user files are never silently reseeded.

### F02 — P1 · APCS file boundary accepts sibling paths (R/S)

**Affected:** `ApcsStorage.getFileSafe()` and `getDirectoryListing()` in `src/services/storage/apcs-storage.ts`. A string `startsWith(root)` check accepts a sibling such as `Year II` when root is `Year I`.

**Evidence:** synthetic allowed-root `Year I`, sibling `Year II/audit.txt`; `getFileBuffer('../Year II/audit.txt')` returned the sibling's marker. This is a boundary violation in local file serving; no claim of remote internet exposure or exploitation is made.

**Correction / accept:** validate `path.relative` boundary and actual canonical target, including Windows case, separators, traversal, absolute paths, and junction/symlink escape. Keep permitted archive files read-only. Synthetic sibling/outside/junction requests must fail; valid nested files must open without moving originals. Do not inspect unrelated real folders to reproduce it.

### F03 — P1 · New APIs bypass mutation guards and accept invalid domain data (R/S)

**Affected:** new handlers using `request.json()` directly, including learning-room, tracking, flashcards, blogs, AI, achievements, entertainment; weak date fields in `src/contracts/event.ts` and related contracts.

**Evidence:** `final-checks.json` and the production follow-up `production-checks.json`: cross-site Origin + `Sec-Fetch-Site: cross-site` + `Content-Type: text/plain` to learning-room returned **201**; Events accepted `startAt: 'not-a-date'` with **201** (synthetic record removed afterward). Existing `parseJsonBody()` already enforces same-origin/content-type and handles malformed JSON. New endpoints diverge from it.

**Impact / correction:** a local service can accept unintended browser writes; malformed records can later fail date formatting. Reuse the existing guard/error path and validate calendar instants, chronology, numeric bounds, IDs, and cross-field totals at the contract/service boundary. Preserve single-user local operation; do not add a speculative authentication system.

**Accept:** cross-site/plaintext mutations rejected; invalid event dates/intervals rejected with actionable 4xx fields; nonexistent records return 404; malformed JSON returns 400; valid requests remain compatible. Regression cases must run through actual route handlers.

### F04 — P1 · New destinations wait for the navigation failsafe (R/S)

**Affected:** eleven new `src/app/(workspace)/*/page.tsx` routes / feature views. Replacing `BlankPage` removed `<PageReady />`; workspace layout does not signal readiness.

**Evidence:** `final-checks.json` navigation-timing: Universe → Events reached `/events` but `aria-busy` remained true at 3.5 seconds; interaction was released after approximately **11.2 seconds**. `TransitionProvider.tsx` waits for readiness, then has a 10-second failsafe. Ordinary-motion screenshot attempts timed out; timing evidence is independent of those failures.

**Correction / accept:** restore destination readiness for successful, empty, and failed loads. Warm navigation completes within the existing approximately 3-second transition, reduced motion ≤300ms after readiness, Back/Forward remains usable, and failed loads cannot strand focus or scroll locks. Do not shorten the transition to conceal a missing readiness signal.

### F05 — P1 · Missing tokens make controls and themed surfaces disappear (R/S)

**Affected:** newer feature CSS, homepage additions, Tailwind classes; `tokens.css` / `globals.css` integration.

**Evidence:** Events' `New event` computes white text on transparent background; `.forestGlow` computes `background-image: none`. `--status-optional`, `--status-warn`, `--ws-bg-alt`, `--cosmos-accent`, `--cosmos-bg`, `--z-modal`, `--radius-full`, `--timing-fast`, and `--motion-standard` have no effective definition in relevant contexts. Writing filters compute a 0px radius. See `followup.json` styles, [Events baseline](review/quality-audit-2026-11-10/events-1440.png), and `undefined-tokens.json`.

**Correction:** map feature styles to actual semantic tokens, defining only intentional new palette roles centrally and registering required Tailwind utilities. Repair `Button` usage: pass the icon through `leftIcon`; inline SVG children currently stack over text inside Button's child span. Do not blindly add aliases for every obsolete name. Dynamic variables such as `--logo-x` and `--carousel-board-index` in the static inventory are assigned by code and are not defects.

**Accept:** visible primary action in every route/form; measured text/background contrast; intended pills, fills and focus states render; all static no-fallback CSS variable uses resolve in their actual scope; computed styles plus screenshots prove the fix. Test guardrails must detect undefined variables/utility names, not merely raw hex literals.

### F06 — P1 · Custom dialogs and clickable content bypass accessible primitives (R/S)

**Affected:** Events/Projects/Milestone bespoke modal backdrops, newer feature modals, Writing and AI cards, shared shell landmarks.

**Evidence:** [phone Events dialog](review/quality-audit-2026-11-10/events-create-mobile.png) shows statistic cards covering inputs; computed modal z-index is `auto`. Events focus stays on the trigger; Tab reaches background controls; four text/date inputs have no associated label. Escape closes it. Writing and AI notes use clickable `article` elements without keyboard actions. Source search found no skip link or `main-content` target despite documentation promising them.

**Correction / accept:** use existing `Dialog`, `Drawer`, `useFocusTrap` and portal support; fix stack order and bounded scrolling rather than adding arbitrary large z-index numbers. Accessible name, associated labels, focus entry/trap/restore, Escape, background inertness, and reachable submit/close must work at 320px and 200% zoom. Notes/articles open with keyboard and are announced as actionable. Add a working skip link/landmark. Nested overlays close only the top layer.

### F07 — P1 · Failed requests look like empty collections or successful actions (R/S)

**Affected:** new views defaulting `data` to empty arrays and using only `isLoading`; mutations without visible error handling; duplicate fetch/error patterns in new client hooks.

**Evidence:** injected Events GET 500 → “No events in this category yet” and zero statistics (`events-error.png`). Projects' edit handler closes its modal immediately after `mutate()`; Events deletion also closes before success. Other views follow similar patterns; not all failure paths were executed.

**Correction / accept:** explicit loading/empty/error distinctions, retry, preserved stale data, pending controls, failure messages and retained drafts. Force GET and POST/PATCH failures on each feature: users must see the failure, retain entered content, and retry once without duplicate writes. Delete dialogs close only after success or deliberate cancellation.

### F08 — P1 · Events calendar is incorrect; required scheduling flows are incomplete (R/S/G)

**Affected:** `EventsView.tsx` week grid, event contracts/service, event creation.

**Evidence:** week rendering nests `filteredEvents.map()` inside every weekday without date filtering; one seed event appeared **seven times**. No month control, date navigation, recurrence editor/expansion, or event edit action is exposed. Recurrence fields exist in contracts but do not establish recurrence behavior. Week cards have click handlers without keyboard support.

**Correction / accept:** date-index occurrences using the app timezone; week/month navigation; clear timed-event vs deadline representation; exam emphasis; recurrence and single-occurrence editing without identity duplication. A dated one-time event appears only in its correct cell; out-of-week entries are absent; midnight/week/month boundary and recurrence exception cases pass. Details remain keyboard accessible. Tie reminders to M03's shared contract.

### F09 — P1 · Timed features are not connected to shared notifications (S/G)

**Affected:** notification service/domain/storage, event/project/milestone/achievement mutations, achievement reminder copy.

**Evidence:** `NotificationService.executeReminderTick()` enumerates `storage.tasks` only; notification records link `taskId`. New feature services use separate JSON stores and do not participate. Achievements nonetheless displays “Connected to notification reminders” when a boolean is true. Task read checkboxes, relative age, deep links, and seven-day filtering already exist and should be retained.

**Correction / accept:** a minimal shared timed-source/occurrence identity and typed target links; edits, completion/cancellation, mute/timing, catch-up, deduplication, and retention apply across applicable entities. For one fixture of each timed feature, assert one relevant alert, correct destination, disappearance/suppression of obsolete alerts after reschedule, read-state behavior, and expiry at age ≥7 days. No desktop/background-closed-app delivery is implied. Never equate a stored boolean with delivered reminders.

### F10 — P1 · Focus sessions record invented durations and cannot complete a real break cycle (R/S)

**Affected:** `LearningRoomView.tsx`, `learning-room-service.ts`.

**Evidence:** after 65 seconds focus and 65 seconds pause, save sent `focusMinutes: 1`, `breakMinutes: 5`, `pausedMinutes: 0`, `durationMinutes: 25`; the service wrote identical start/end instants. `isBreak` is never set true; “Skip notes” resets without logging. Streak is hardcoded to 5. Timer state is component-local and uses interval decrements, so background/reload reliability remains unverified.

**Correction / accept:** track timestamps and actual phase durations, preserve pause time, implement focus→reflection/break→focus, log without requiring notes, derive statistics from sessions. Simulated pauses, early finish, hidden-tab elapsed time, phase completion, save failure and revisit have explicitly tested outcomes. No fabricated break/streak values; statistics reconcile with recorded elapsed time.

### F11 — P1 · Tracking dates and statistics do not match their labels (S/G)

**Affected:** `TrackingView.tsx`, `tracking-service.ts`.

**Evidence:** `toISOString().slice(0,10)` uses UTC for “today”; before 07:00 local time it is the prior local date. “7-day average sleep” averages all logs. `activeStreakDays: 6` is fixed; each toggle increments/decrements streak regardless of consecutive dates. Empty data yields 7.5 hours/80%. Sleep “calculator” is fixed 23:00 text, not an input-driven calculator, and promises guaranteed energy.

**Correction / accept:** use existing timezone helpers; compute bounded periods and consecutive-day streaks; distinguish no data; implement the requested planning calculator without health guarantees; expose readable trends. Fixture tests at 00:01 and 06:59 Asia/Saigon, missing-day gaps, duplicate-day logs and empty records produce accurate dates/counts. This is an application-truthfulness finding, not medical advice.

### F12 — P1 · Writing lacks durable drafts, editing, and source capture (R/S/G)

**Affected:** `WritingRoomView.tsx`, blog queries/contracts/service.

**Evidence:** form says “Draft a new piece” but always sends `status: 'published'`; no save-draft/resume/edit-existing controls; content lives in component state. The editor is a textarea with a minimal paragraph parser; `**bold**` remains literal in the captured reader. The contract has `originalSourceUrl` and sources but the creation form does not collect them. Author/commentary separation exists and is worth retaining. Publishing here is local storage, not public web deployment.

**Correction / accept:** durable draft and edit workflow, basic rich-text tools, safe rendering, original source entry for saved writing, explicit local-save language, optional user-controlled music as specified. Save, reload, resume and edit a draft without loss; formatted text displays correctly; attribution and commentary stay separate. Existing content migrates without rewriting the user's prose.

### F13 — P1 · Automatic demo content masquerades as personal history (R/S)

**Affected:** initial arrays in new services; AI “Synced” labels; achievement portfolio; study/tracking/progress summaries.

**Evidence:** a clean isolated directory immediately produces contest awards, study sessions/reflections, habit history, project progress and imported-note timestamps. These are hardcoded seed records, not verified user facts. `lastSyncedAt` dates are generated from `Date.now()` without an import.

**Correction / accept:** new personal stores start empty; demo content requires explicit, clearly labelled demo context. Do not mass-delete existing seeded/user-mixed stores: provide a reviewable distinction/migration and preserve backups. A clean personal profile must never claim awards, logged study, completed work, or sync that did not occur.

### F14 — P2 · Daily has misleading forecast copy and an unresolved placeholder (R/S)

**Evidence:** zero-task screenshot says “One urgent task is still due before midnight”; `DailyDashboard.tsx` hardcodes this plus a personal productivity peak. Observatory opens a Statistics placeholder. Conversely, seconds/countdown now work, and named removed decoration assets have no remaining `src` references; do not re-open those stale issues blindly.

**Correction / accept:** use truthful neutral copy or deterministic workload-derived text; leave analytics expansion subject to existing OD-01/OD-02. Preserve day/week/month, custom scrollbar, priority encoding and overdue transfer. Empty data cannot claim urgent work or inferred productivity patterns. A placeholder must be clearly signposted without pretending analytics exists.

### F15 — P1 · Homepage closing emphasis is invisible; atmospheric phase is incomplete (R/S/G)

**Evidence:** at scroll fractions .50/.67/.83, intro opacity is 1, but motto computes transparent text fill and `background-image: none` because its gradient uses undefined `--cosmos-accent`. See [Meet Hiep pose](review/quality-audit-2026-11-10/home-pose-0.67.png). Nebula additions also use this undefined token; gallery capture remains predominantly black.

**Correction / accept:** restore a readable solid-color fallback and defined accents, complete soft nebula composition while preserving the Earth/wordmark and both gallery modes. Verify the reference phase boundary against local `sources/img/img10.png`–`img12.png` and `sources/vid/vid8.mp4` before changing Earth geometry. Exact legacy reference alignment was not established in this audit. All intro text including the closing line remains legible on desktop/phone and with reduced motion/WebGL fallback.

### F16 — P2 · New feature styling lacks Daily's shared visual language (V/R)

**Evidence:** Events/Projects/Milestone use shallow white stat boxes and sparse lavender space; later pages use a second nested container with a large tinted header panel and sans-serif h1. Writing, Flashcards and Learning Room reuse nearly identical brown card treatments; Events' forest is absent; APCS has a small wave but little atmospheric depth. Achievements' eyebrow SVG has no defined dimensions and dominates the header. See each route's baseline captures.

**Direction / accept:** follow [DESIGN_SYSTEM_GUIDE.md](DESIGN_SYSTEM_GUIDE.md): one typographic hierarchy, shared page alignment and controls, pale theme-specific atmospheric fields, fine vector decoration at edges, opaque reading zones, distinct activity-led layouts. No blanket recolor or replacement dashboard template. Compare each final route beside Daily at 1440/390; evaluate hierarchy, balance, silhouette, illustration style, information density and readability. This is a design review judgment, not a claim that a specific hue breaks functionality.

### F17 — P1 · Narrow filters and calendar content clip or overflow (R/S)

**Evidence:** at 320px, Events' Deadlines control extends to x≈400, Projects' Completed to x≈327, and APCS filters to x≈543 (`followup.json`, `*-320-clipped.png`). Events' seven-column populated week expands full-page capture to 2187px. Global `overflow-x: clip` hides symptoms, so `scrollWidth === viewport` alone is insufficient proof of responsiveness. Some filter strips intentionally scroll, but their affordance/reachability needs explicit verification.

**Correction / accept:** wrap/reflow filter groups or provide clearly operable bounded horizontal scrolling; use an accessible narrow calendar agenda or contained calendar viewport. All controls reachable by touch and keyboard at 320/390/768/1440, no document-wide overflow or obscured active control, and modals work with zoom/virtual keyboard. Record element bounds and screenshots, not only document width.

### F18 — P2 · Projects and Milestone expose only part of their stored model (S/G)

**Evidence:** project creation hardcodes `deadlineAt: null`, empty linked IDs; edit modal exposes next step/blockers/status but no deadline/overview/title editing. Milestone creation hardcodes `targetDate: null`, empty project links; Options only deletes. These prevent the blueprint's deadline/linked-context workflow. Manual ±5% progress and landmark toggles work and should remain.

**Correction / accept:** usable date/relative-time and identity-preserving linking/edit controls, arbitrary milestone timeframes, optional dates, manually adjustable project progress. Edit and reload a dated project and milestone; links navigate to the same task/project; notification updates follow M03. Do not force progress to equal task completion.

### F19 — P2 · APCS fallback and scanning hide operational reality (S/R)

**Evidence:** real overview enumerated 3328 files, so archive integration is implemented. Inaccessible-root fallback instead reports 60 files/72.5 MB from fake metadata; folder/search code synchronously traverses the filesystem and search rescans all files. Course semester metadata is hardcoded. Initial browser probes captured loading. Production follow-up loaded folder/search results and a PDF download returned 200 with the expected content type and attachment headers; full PDF viewer interaction remains unverified. Performance impact is a risk, not a measured latency claim.

**Correction / accept:** explicit missing/inaccessible/empty states, actual path context and configurable root, cancellable/bounded search with measured responsiveness before adding caching complexity. Test synthetic missing/empty/large roots and supported file open/download; original files/paths remain unchanged. Fix F02 before broadening access.

### F20 — P2 · AI roadmap/note labels promise an import workflow that is absent (S/R/G)

**Evidence:** notes and source URLs originate from static service arrays; no manual import/refresh UI is present. Note modal displays raw Markdown heading markers. Topic toggles mutate completion but stage status is not recalculated. F06 covers keyboard access; F13 covers fake sync timestamps.

**Correction / accept:** implement selected-note reading-copy import/manual refresh with source provenance, safe readable content, honest timestamps and useful roadmap progress. Keep originals in Notion; no two-way sync. Until a real import exists, label samples as samples. Test refresh failure preserving the previous copy; do not claim access to any real note based on the fixture URLs.

### F21 — P2 · Flashcard review claims more than it implements (S/R/G)

**Evidence:** Ctrl+S successfully creates a card (201), reveal works, and confidence requests are issued. Review chooses array order and wraps to index zero, independent of confidence, while copy advertises spaced repetition. Ctrl+S handler and confidence buttons do not guard duplicate submissions while pending. Empty decks can display “Card 1 of 0”.

**Correction / accept:** preserve typed creation and shortcut; provide a clear finite session/progress/end state and simple prioritization only to the extent approved by the blueprint's proposed confidence flow. Remove unsupported scheduling claims until implemented. Repeated shortcut/click during an in-flight request creates one operation; empty deck has no impossible counter; review failure retains the card and answer. A full spaced-repetition algorithm is an open product choice, not required by this audit.

### F22 — P2 · Portfolio and leisure maintenance flows are incomplete (S/R/G)

**Evidence:** Achievements Edit mode supplies Add/Delete but no edit-existing action despite an update hook; Elementary exists in the form but not era filters. Its large header icon is visibly disproportionate. Entertainment can add books/games and change book progress; existing game status/hours and music collection cannot be maintained through UI. Every created book/game is assigned rating 5. F09/F13 cover false reminders/history.

**Correction / accept:** complete existing record editing, accurate era coverage, user-supplied/absent ratings, and modest local collection maintenance. Keep external music links; no speculative embedded provider. Existing entries can be corrected without delete/recreate, and no unentered rating appears as a personal opinion.

### F23 — P2 · Motion and engineering checks miss the new implementation's failure modes (S/R)

**Evidence:** new CSS uses nonexistent timing/easing names; Events/Projects/Milestone lack local reduced-motion overrides; project progress animates width, Learning Room animates padding/height. Many new views duplicate modal and API scaffolding, while tests remain concentrated on tasks/home/notifications. `README.md`, `PROJECT_DESCRIPTION.md`, and shared UI docs describe a different token set, dark Daily and blank pages.

**Correction / accept:** consolidate shared behavior through existing primitives; use real motion tokens; disable nonessential motion when requested; update observed-implementation docs. Add focused regression tests for F01–F12 and real route readiness/failed requests. No UI rewrite, global format pass, or new animation/chart dependency without demonstrated need. Build/lint/unit tests supplement browser evidence rather than replace it.

### F24 — P2 · Past-deadline task validation returns 500 in development and production (R/S; cause unconfirmed)

**Evidence:** two development POSTs and a fresh production-server POST with a past `deadlineAt` returned 500 (`production-checks.json`). The response is `INTERNAL_ERROR`; the production log reports “Deadline must be in the future.” `TaskService` throws `ValidationError`; `handleApiError` normally maps its `AppError` base to 4xx. The error-class/module boundary needs investigation; the cause is not established.

**Correction / accept:** fix the established error-mapping failure in M00 and test both development and production handlers. Past deadlines should produce 400 with the deadline field error, and no stored row. Preserve the future-deadline rule. Keep this distinct from Events accepting invalid strings.

## Design and source conflicts to carry forward

- Current objective explicitly makes actual Daily Task Management the reference and permits blueprint feature themes. This resolves older blanket lavender/dark-Daily documentation as a planning authority conflict; do not revert the rendered reference to match stale prose.
- Writing blueprint contains both warm wood/trees and an embedded instruction to preserve cosmic identity. Recommended interpretation: warm editorial surface within the shared atmospheric family, with restrained celestial continuity; no copied newspaper branding. A materially different theme requires owner resolution during that milestone.
- OD-01/OD-02 analytics/forecast scope remains open. Truthful copy and honest placeholder labelling can be fixed without inventing analytics.
- Recurrence semantics and cross-feature reminder timing need an explicit implementation contract. Use the blueprint defaults; ask only when alternatives change product rules.

## Local reference review

Inspected `sources/img/img10.png`–`img14.png`: centered night Earth, annotated leftward handoff, intended left-Earth/right-copy composition, the compact Universe search menu, and the unwanted diagonal glow decoration. These establish composition intent; the blueprint remains authoritative for actual copy. `sources/vid/vid8.mp4` exists, but its motion was not reviewed. Exact legacy motion/pixel alignment is therefore an implementation verification item.

## External reference review

The [Writing Room reference article](https://codexinsider.com/guides/codex-usage-dashboard/) was inspected as a visual reference, not as authoritative technical advice. Desktop rendering has a 760px article column, serif title/body, warm paper background, restrained dividers, a summary callout and clear source links. Phone layout was captured. Adapt reading measure, hierarchy, summary and attribution patterns; retain this product's fonts, shared controls and quiet wood atmosphere. Do not copy the reference's branding, uppercase navigation, monospace metadata or assets. Theme/menu interactions on the reference were not exhaustively tested.

Production task-reminder baseline also works: a synthetic future task expired, appeared as Overdue in the center with a task target URL, and mark-read returned 200 with `isRead: true`. See `notifications-overdue-production.png` and `production-checks.json`; this does not prove cross-feature reminders.

## Handoff

Use [REMEDIATION_PLAN.md](REMEDIATION_PLAN.md) for dependency order and progress ledger, [DESIGN_SYSTEM_GUIDE.md](DESIGN_SYSTEM_GUIDE.md) for visual acceptance, and [FLASH_IMPLEMENTATION_PROMPTS.md](FLASH_IMPLEMENTATION_PROMPTS.md) for executable milestone assignments. No milestone is accepted by this initial audit. Codex must review Flash's actual changes and new rendered evidence before acceptance.
