# HTS v2.0 — Focused refinement plan for AGY

## 1. Objective and execution boundaries

Refine the existing website while preserving its structure, visual identity, feature destinations, data relationships, and unrelated functionality.

This plan incorporates the owner’s outline, reference images, repository inspection, and 20 clarification decisions.

**Execution workflow:** AGY first builds a shared editor/control pilot and pauses for visual approval. After approval, AGY completes the agreed feature batches without routine approval interruptions, then presents final verification.

**Protected boundaries:**

- Preserve existing themes, Cormorant Garamond/Inter typography, tokens, and established motion language.
- Preserve the 12-card collection; Tasks Hub remains accessible through its route and navigation.
- Preserve task scheduling, deadline, overdue, reminder, and completion rules.
- Keep the current Zodiac work separate. This plan does not authorize its rollout.
- Preserve unrelated working-tree changes, deletions, and untracked work.
- Do not edit protected user documents or activate historical assignments.
- No commits, pushes, migrations, or deployment without authorization.
- Do not update `report.md`.
- Planning has not modified application files.

### Confirmed decisions

| Area | Agreed behavior |
|---|---|
| Collection return | Stop the current backward gesture at the beginning; require a fresh gesture before returning home |
| Collection mode switching | Smoothly return to the beginning when switching modes |
| Mobile collection | Preserve native horizontal swipes; guard upward exit from whichever card is visible |
| Task inspection | Shared Daily/Hub inspector, approximately 75% desktop width |
| Inspector dates | Show complete dates, including year |
| Hub cards | Balanced compact size, approximately 220–240px desktop height |
| Hub date preview | `19:00 · Sun · 15 Nov`, without year |
| Task scheduling actions | Preserve both scheduling and transfer; clarify their purposes |
| Event drafts | Explicit saving, app-level storage, multiple drafts, manageable from the dashboard |
| Unsaved Event edits | Retain Save draft / Discard / Continue editing choices |
| Existing browser drafts | Offer a one-time, non-destructive import |
| Past events | Approximately 3.5 visible cards with internal scrolling |
| Notes editing | Visual Bold/Bullets editing across notes/descriptions |
| Specialized editors | Preserve Blog article bodies and Flashcard question/answer authoring |
| Compact task previews | Clean text; show full formatting in the inspector |
| Form controls | Theme fields and opened pickers/options |
| Decorations | Targeted replacements; preserve unrelated artwork |
| Cosmic Forecast | Remove the planet only; retain the star medallion |
| Earth credits | Move to a quiet Homepage action |

## 2. Required behavior by feature

### A. My Collection

**Remove the footer**

Remove the rendered collection footer in both modes. Scrolling past Personal Achievements must end naturally without revealing footer content or an empty footer-sized region.

Preserve the current final-card arrangement shown by `img23.png`. Recalculate the collection/reveal spacers after removing the footer.

Move the existing Earth imagery disclosure into a small **Earth credits** action on the Homepage. Its panel retains the existing attribution and links and does not add collection scroll height.

**Correct the first-card position**

The pinned gallery currently centers a pair of cards. On short screens, smaller cards increase the leading empty space.

Separate starting and ending padding:

- Use a bounded starting gutter, initially 24px on desktop.
- Preserve the existing ending composition independently.
- Keep current card sizing and gaps.
- Update travel calculations and keyboard focus scrolling to use the revised geometry.

Treat `img24.png` as a positioning reference only; its older Tasks Hub collection card must not return.

**Add an intentional return guard**

Use a small boundary state machine scoped to Horizontal mode:

1. Browse cards normally.
2. Clamp at the first-card boundary.
3. Consume the remainder of that backward gesture.
4. Arm return after the gesture ends.
5. Allow a fresh backward gesture through a short resistance zone into the existing homepage transition.

Initial implementation defaults:

- Wheel gestures separate after approximately 220ms without wheel input.
- The fresh gesture crosses approximately 120 CSS pixels of normalized wheel movement.
- Touch uses a new touch gesture and approximately 24px of deliberate upward movement.
- Keyboard scrolling has equivalent intentional behavior; held-key repeats cannot bypass the boundary accidentally.

These values are tuning defaults. Verify their feel on a mouse wheel, precision trackpad, and touch device.

On mobile, horizontal swiping remains native. At the collection’s vertical top boundary, a fresh upward gesture may return home without first rewinding the horizontal cards.

Explicit Home navigation bypasses resistance. Vertical mode retains its existing return behavior. The guard must ignore interactive overlays and unrelated scroll containers.

**Smooth Horizontal/Vertical switching**

Retain the current reset-to-beginning behavior, but conceal the structural reset within a short transition:

- Fade out the current view.
- While hidden, swap layouts, establish valid geometry, and reset to the collection start.
- Fade in the new view.
- Preserve the persistent collection topbar and restore focus to the selected mode control.
- Use a temporary sizing constraint during the swap if needed to prevent document-height collapse.
- Do not animate layout width/height or leave both galleries processing scroll simultaneously.
- Rapid toggles resolve to the latest selection.
- Reduced motion performs an immediate stable swap.

### B. Daily Task Management

**Remove the specified decorations**

Remove only:

- The two yellow bottom accents identified by `img14.png` and `img25.png`.
- Every active use of `eclipse-broken-orbit.svg`.
- Every active use of `spiral-galaxy.svg`.
- The right-side planet inside Cosmic Forecast.

Retain Cosmic Forecast’s star medallion and text. Keep the reusable planet component wherever it remains appropriate.

The yellow accents are inline SVG content, so removing external asset references alone is insufficient.

**Organize the asset library**

Inventory the older Daily reference assets and the newer Daily/Hub libraries.

- Consolidate reusable authoring assets into the corresponding existing feature libraries.
- Preserve originals for provenance; do not perform broad directory moves.
- Mark the two retired assets as excluded from active catalogs and publishing.
- Keep existing public URLs stable wherever possible.
- Preserve the current replacement Zodiac wheel.
- Publish only assets actually needed by the approved changes.

Use the newer corner/divider artwork for affected card and overdue decoration slots. Do not introduce unrelated header or background artwork.

**Fix date-navigation arrows**

Give Week and Month navigation a stable three-part layout:

`Previous button | reserved date-label area | Next button`

Reserve enough label width for long month names and cross-year week ranges. Keep arrows close to the date without allowing label length to move their hit targets.

At narrow widths, wrap the entire navigation group onto an appropriate row rather than overlapping adjacent controls. Preserve existing date selection behavior.

**Align Daily task content**

Use one consistent content column beside the checkbox for title, description, and metadata. Remove conflicting manual indentation.

Preserve Daily card dimensions, colors, decoration bounds, and its existing list viewport. Long content must truncate within the existing card rather than increasing its size.

### C. Shared task inspector and Tasks Hub

**Shared inspector**

Introduce one controlled task inspector per page, reused by Daily, Week/Month task lists, Overdue, and Hub.

- Desktop width: approximately 75%, with a readable maximum comparable to existing large dialogs.
- Height: content-driven, capped to the viewport.
- Mobile: near-full-width, with internal scrolling when necessary.
- Show the complete title, formatted description, priority, status, deadline, scheduled date, and pin state where applicable.
- Preserve existing management actions.
- Use natural word wrapping; break oversized unbroken strings only when necessary.
- Align title, description, metadata, and action groups to a consistent reading edge.
- Eliminate the excessive description-to-metadata gap.
- Preserve nested drawer/dialog focus and return focus to the initiating task.

Clicking a task’s body opens inspection. Checkbox, menu, and action clicks retain their existing behavior and do not accidentally open it. Support keyboard activation.

**Clarify scheduling actions**

Keep the underlying distinction:

- **Schedule for today / tomorrow / choose day:** changes calendar placement; deadline remains unchanged.
- **Reschedule overdue task:** uses the existing transfer flow and changes both scheduled day and deadline.

Place these in separate labeled groups with concise explanatory text. Keep edit/delete/close actions visually distinct from calendar-placement actions.

**Compact Hub cards**

Preserve current widths, grid breakpoints, note-color families, borders, and hover behavior.

- Begin with a common 240px card height, within the approved compact range.
- Title: one line, ellipsis on overflow.
- Description: maximum two lines, using a clean text preview.
- Reserve consistent description space so metadata aligns between cards.
- Keep all full content available in the inspector.
- Remove the unnecessary separator before the remaining-time text.
- Format card deadlines as `HH:mm · ddd · d MMM`.
- Align group headings and count badges optically.

**Simplify grouping**

Replace Due soon and Later sections with **On-going**:

- **Overdue:** active tasks classified overdue by the existing domain logic.
- **On-going:** all remaining active tasks, including due-soon tasks.
- **Completed:** a permanently available collapsible section heading.

This is a presentation change. Preserve due-soon calculation, reminders, sorting, and priority filtering.

Completed starts collapsed. Its heading and count remain accessible, including when empty. Existing completed-task deep links must expand the section and reveal the target.

**Reorganize controls**

Remove the top Show completed control. Move the main Add task action into the vacated controls area and remove its previous header duplicate.

Keep one right-side clear-search button. Suppress the browser’s duplicate search-clear affordance while preserving search semantics and keyboard access.

### D. Events

**Manageable app-level drafts**

Add a **Drafts** dashboard view alongside the existing agenda modes. Show draft titles, draft type, and last-saved time, with actions to resume, delete, or apply to the schedule.

Support:

- Multiple independent new-event drafts.
- One working edit draft per existing event.
- Incomplete date/time/title values while drafting.
- An “Untitled event” presentation when necessary.
- No draft participation in calendar counts, upcoming lists, exams, or reminders.

Saving a draft does not change the published event.

For a new draft, the final action is **Add to schedule**. For an edit draft, it is **Apply changes**.

Keep incomplete work in the editor if saving fails.

**Preserve unsaved-change protection**

Retain the three existing choices:

- Discard changes.
- Continue editing.
- Save draft and close.

Align them in an equal-height desktop row. On narrow screens, stack equal-width buttons rather than allowing an uneven wrap.

Extend the shared save callback to support asynchronous results. Closing and guarded navigation proceed only after successful draft persistence. Existing synchronous draft handlers remain compatible.

**Import browser drafts**

Offer a one-time import action within Drafts:

- Read existing new-event and edit drafts.
- Preserve their association with existing events.
- Save to app storage before acknowledging import success.
- Retain recoverable browser copies on failure.
- Use stable import identity to prevent duplicates on retry.
- Do not clear drafts belonging to other features.

**Past events scrolling**

Show approximately 3.5 cards in a bounded, themed scrolling region. Preserve filtering, selection, ordering, and access to the complete history.

Use native scrolling with the Daily list’s visual treatment. A partial next card indicates more content. Short histories should not acquire artificial empty space.

**Dates and header artwork**

Use 24-hour time throughout Events.

In event details, separate:

- Date: for example, `Sun, 15 Nov 2026`.
- Time: for example, `19:00`, including an end time when present.

Preserve the application timezone and existing stored instants.

Move the manta artwork left into available header space, clear of the clock and New event button. Hide decorative artwork at constrained sizes before allowing it to obscure text or controls.

### E. Shared notes editor and themed controls

**Visual notes editor**

Provide a restrained toolbar containing Bold and Bullets.

Required behavior:

- Immediate visible formatting.
- `Ctrl/Cmd+B`.
- Typing `- ` starts a bullet list.
- Enter continues a list; Enter on an empty item exits it.
- Undo/redo, text selection, paste, and Vietnamese IME composition work normally.
- No unsolicited headings, tables, images, or collaboration features.

Apply this to editable description/note fields, including task descriptions, Event notes, Tracking notes, Project overview/blockers, Milestone meaning/reflection, Achievement descriptions/lessons, Learning reflections, Entertainment takeaways, Blog commentary/summaries, and Flashcard notes/deck descriptions.

Preserve Blog article-body editing and Flashcard question/answer editing. Titles, URLs, dates, code, and short structured fields remain plain controls.

Use safe formatted rendering for full descriptions. Compact task previews use text without markup markers.

**Themed controls**

Create shared, accessible date, time, and category controls. Refine the existing checkbox instead of replacing its behavior unnecessarily.

- Derive colors, focus rings, borders, and selected states from each page’s existing tokens.
- Theme the opened calendar and option lists.
- Preserve existing category values, constraints, and form validation.
- Preserve typed task date formats: `DD/MM`, `DD/MM/YYYY`, and ISO dates.
- Offer explicit 24-hour time entry with one-minute precision.
- Maintain keyboard navigation, touch targets, visible focus, disabled states, and error associations.
- Keep popup theme and focus ownership intact inside dialogs.
- Escape closes the topmost popup before its parent dialog.

This work covers form controls; it does not redesign the Daily Month view or Events’ main calendar.

## 3. Technical approach and interfaces

### Shared editor and controls

Use a headless Tiptap editor restricted to the approved formatting features. Initialize it client-side with `immediatelyRender: false`, following its Next.js integration guidance. [Tiptap Next.js integration](https://tiptap.dev/docs/editor/getting-started/install/nextjs)

Keep existing note/description API fields as strings. Use a small, tested restricted Markdown codec for bold and lists, plus a pure text-extraction helper for previews and applicable searches.

- Do not bulk rewrite existing records.
- Preserve original strings until the user edits them.
- Treat unsupported syntax and raw HTML as text.
- Preserve existing validation limits and unsaved content on validation failure.
- Test round trips, escaping, line breaks, Unicode, and formatting near field limits.
- Avoid depending on Tiptap’s currently beta Markdown extension for this narrow format. [Tiptap Markdown status](https://tiptap.dev/docs/editor/markdown)

Use React Aria behavior for calendars, time fields, and selects, styled through HTS wrappers. Its time field supports explicit 24-hour display. [React Aria Calendar](https://react-aria.adobe.com/Calendar), [TimeField](https://react-aria.adobe.com/TimeField), [Select](https://react-aria.adobe.com/Select)

Keep owned popups within the active dialog’s focus boundary through a localized overlay adapter. Do not replace the entire dialog system.

Lazy-load editor code when needed. Add and lock only the dependencies required by these components.

### Event draft data flow

Follow:

**UI → typed client/query → HTTP API → draft service → storage**

Store drafts separately from published events in a new local JSON store, using the existing atomic storage infrastructure.

Introduce typed draft contracts containing draft identity, optional source-event identity, source version, editor values, and timestamps.

Provide:

| Endpoint | Purpose |
|---|---|
| `GET /api/event-drafts` | List active drafts |
| `POST /api/event-drafts` | Create a draft |
| `GET/PATCH/DELETE /api/event-drafts/[id]` | Read, update, or delete a draft |
| `POST /api/event-drafts/[id]/publish` | Validate and apply a draft to the schedule |

Follow existing response and error conventions.

Publishing must be retry-safe. Use stable target identity and a persisted publication receipt so an interrupted response or cleanup failure cannot create duplicate events.

For edit drafts, check the source event version before applying changes. Stale drafts require review; never silently overwrite a newer event. Deleting a draft must never delete its published source.

No SQLite schema migration is expected.

### Main implementation locations

| Area | Expected locations |
|---|---|
| Collection | [Home module](<D:/Vibe Coding/HiepTrong's Space/src/features/home/>) and its `feature-collection` components |
| Tasks | [Tasks module](<D:/Vibe Coding/HiepTrong's Space/src/features/tasks/>): shared inspector, cards, Hub grouping, Daily navigation, and decoration styles |
| Events | [Events module](<D:/Vibe Coding/HiepTrong's Space/src/features/events/>): Drafts view, async editing integration, history scroller, formatting, and masthead |
| Shared UI | [UI primitives](<D:/Vibe Coding/HiepTrong's Space/src/ui/>): editor, renderer, pickers, select, checkbox styling, dialog save handling, and overlay integration |
| Pure helpers | [Domain modules](<D:/Vibe Coding/HiepTrong's Space/src/domain/>): restricted note codec, preview text, and display formatting |
| Draft backend | [Contracts](<D:/Vibe Coding/HiepTrong's Space/src/contracts/>), [client](<D:/Vibe Coding/HiepTrong's Space/src/client/>), [API](<D:/Vibe Coding/HiepTrong's Space/src/app/api/>), and [services/storage](<D:/Vibe Coding/HiepTrong's Space/src/services/storage/>) |
| Theme and dependencies | [Design tokens](<D:/Vibe Coding/HiepTrong's Space/src/design/tokens.css>), package manifest, and lockfile |
| Feature adoption | Existing feature forms and corresponding description readers; no unrelated page-layout refactors |

## 4. AGY milestones and approval gate

| Milestone | Deliverable | Completion condition |
|---|---|---|
| **0 — Fresh baseline** | Record current diffs, protected-file state, screenshots, asset usage, relevant tests, and responsive geometry | Distinguish existing work/failures from this assignment; reverify concurrent changes |
| **1 — Shared pilot** | Fixture-backed editor/control preview in Daily/Hub and Events themes, including nested popup and mobile behavior | Functional prototype, round-trip tests, and visual evidence ready |
| **Approval gate** | Present the shared pilot | **Stop until the owner approves its appearance and interaction** |
| **2 — Collection** | Footer removal, relocated credits, bounded gutter, return guard, and mode transition | Reference positions and input-method checks pass |
| **3 — Daily and Hub** | Shared inspector, stable date arrows, alignment, compact cards, grouping, control placement, and targeted asset retirement | Shared-task behavior and all existing task actions remain correct |
| **4 — Events** | Durable drafts, import, async close protection, history scroller, date formatting, and artwork positioning | Draft lifecycle and failure/retry cases pass |
| **5 — Site-wide adoption** | Approved editor/control patterns applied to scoped fields across feature pages | Complete adoption inventory; specialized editors remain intact |
| **6 — Final verification** | Regression results, production build, browser recordings, responsive captures, and limitations | Owner receives a reviewable completion packet |

After the shared pilot approval, continue through the remaining agreed milestones without requesting routine implementation permission. Escalate only unresolved product decisions or genuine scope changes.

## 5. Acceptance, verification, and rollback

### Required verification

| Area | Essential scenarios |
|---|---|
| Collection boundary | Fast backward wheel/trackpad momentum stops at the first card; a fresh gesture returns home; explicit Home still works |
| Collection responsiveness | 14-inch laptop-like viewports, short windows, browser zoom, native mobile swiping, resize, and reduced motion |
| Collection end | Final card is reachable; no footer or empty trailing viewport; ending composition remains correct |
| Mode switching | Switch from beginning, middle, and end; repeat rapidly; no visible scroll reset, stale layout, or focus loss |
| Task inspection | Daily, Hub, Overdue, and Week/Month drawers; keyboard entry; completion/deletion updates; return focus |
| Task data rules | Scheduling preserves deadline; rescheduling changes both values; reminders and due-soon classification remain unchanged |
| Hub presentation | Uniform card height, long words, empty/two-line descriptions, complete dates in inspector, one clear-search button |
| Completed section | Always-accessible heading, collapse/expand, filtering/counts, and completed-task deep links |
| Draft lifecycle | Multiple new drafts, saved edits, incomplete values, reload, deletion, publishing, stale versions, network failure, retry, and duplicate prevention |
| Legacy import | Partial failure and repeated import preserve recoverability without duplicates |
| Rich text | Bold, bullets, list exit, undo/redo, paste, IME, Unicode, escaping, search, existing records, and field-limit boundaries |
| Controls | Keyboard-only operation, typed dates, leap days, year boundaries, `00:00`/`23:59`, minute precision, nested popups, and theme inheritance |
| Assets | No active retired-asset references; only specified yellow accents removed; current Zodiac wheel preserved |
| Events | Approximately 3.5-card history window, complete scroll access, separate date/time lines, and unobscured header controls |

Test widths from 320–1440px, including 1366×768 and 1536×864 laptop configurations, landscape, 100%/125% zoom, touch emulation, and reduced motion.

Use normal input scrolling; do not introduce smoothing loops that continue drifting after input stops. Record performance on warmed pages and check for animation-attributable long tasks and noticeable dropped frames.

Run focused regressions, then `npm run check` with Vitest limited to two workers, followed by `npm run build` **sequentially**. Restart the production preview after rebuilding before browser verification.

### Material risks and controls

- **Scroll resistance becoming a trap:** scope it to the collection boundary; preserve explicit navigation and keyboard escape paths.
- **Popup focus conflicts:** verify nested controls during the pilot before global adoption.
- **Formatting changing existing content:** preserve stored strings, restrict the codec, and prohibit silent truncation or bulk conversion.
- **Draft publishing across separate stores:** use retry-safe identity and publication receipts; test interrupted operations.
- **Broad asset reorganization breaking references:** inventory first, preserve originals and stable public URLs, and change only affected runtime slots.
- **Concurrent work being overwritten:** refresh the baseline before each batch and review targeted diffs.

Rollback must restore only changes attributable to this assignment. Preserve published events, saved drafts, original assets, and unrelated work; do not delete user data merely because the UI implementation is reverted.

The final packet must identify completed requirements, automated results, native-size visual evidence, performance observations, and any browser/device coverage that could not be verified.
