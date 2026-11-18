# Tasks Epic Specification (Daily Task Management, Tasks Hub & Notifications)

> **Current approved interaction changes (13 November 2026):** [plan.md](../../../plan.md) supersedes the historical clock/countdown, carousel-arrow, inline Hub-expansion, and uniform-lavender notification examples in this specification. Daily displays `HH:MM` with no countdown; neighboring previews and the mobile day selector replace arrow buttons. Lists retain a 3.5-card viewport without an artificial tail. Task forms reserve Title-error space and omit Today/Tomorrow deadline presets. Hub has deterministic portrait notes and centered task inspection; notifications use an isolated sakura palette. Data, scheduling/deadline identity, ordering, reminders, and existing task APIs remain unchanged. See [review.md](../../../review.md) for evidence. Other historical audit findings below do not authorize unrelated work.

`md/agents/tasks/readme.md` is the canonical engineering and design specification for the **Tasks epic**, covering **Daily Task Management** (`/tasks/daily`), **Tasks Hub** (`/tasks/hub`), and the **Notification Center** (`NotificationPopover` + reminder evaluation engine).

- **Related System Reference (Shared Data & Domain Rules):** [`../../../docs/engineering/PROJECT_DESCRIPTION.md`](../../../docs/engineering/PROJECT_DESCRIPTION.md)
- **Related Shared UI/UX Baseline:** [`../shared/uiux.md`](../shared/uiux.md)
- **Implementation History & Audit Reports:** [`reports.md`](reports.md)
- **Local V2 Asset Reference Index:** [`../../../.local/sources/img/daily-v2-reference/README.md`](../../../.local/sources/img/daily-v2-reference/README.md)

---

## 1. Purpose, Scope, and Relationships

### 1.1 Epic Purpose
The Tasks epic provides a cohesive, two-surface personal task operating system backed by a single SQLite task model (`tasks`, `task_media`) and an automated deadline notification engine (`notifications`):

1. **Task management (`/tasks/daily`, formerly "Daily Task Management"):** A calm, dark-sky observatory workspace ("Celestial Luxury V2") dedicated to daily execution across **Day** (active-board carousel for Yesterday / Today / Tomorrow), **Week** (7-day summary cards), and **Month** (42-cell calendar grid) views, plus a dedicated **Overdue** recovery lane.
2. **Tasks Hub (`/tasks/hub`):** A high-clarity, light-lavender master backlog and planning workspace for capturing unscheduled tasks, searching/filtering/sorting across all tasks, managing media attachments (`<= 50 MiB`), and scheduling tasks onto specific calendar days.
3. **Notification Center (Topbar Bell):** An automated reminder system that evaluates approaching deadlines (`24h` and `1/4` remaining time window), overdue transitions, and task completions in `Asia/Ho_Chi_Minh` (`UTC+07:00`).

### 1.2 Shared Record & State Relationships
As defined in [`PROJECT_DESCRIPTION.md#4-shared-data-concepts--domain-rules`](../../../docs/engineering/PROJECT_DESCRIPTION.md#4-shared-data-concepts--domain-rules):
- **Single Source of Truth:** Creating or editing a task in `/tasks/daily` or `/tasks/hub` mutates the exact same `tasks` row ([`src/services/storage/local/schema.ts`](../../../src/services/storage/local/schema.ts)) and invalidates the shared TanStack Query caches (`['tasks']`, `['notifications']`).
- **Scheduling vs. Backlog (`scheduledDate`):**
  - `scheduledDate: 'YYYY-MM-DD'` assigns the task to that calendar day in `/tasks/daily`.
  - `scheduledDate: null` places the task in the unscheduled Tasks Hub backlog.
- **Overdue Qualification (`isOverdue` in [`src/domain/task-status.ts`](../../../src/domain/task-status.ts)):**
  - An incomplete task (`status === 'todo'`) is overdue when `deadline < now` OR (`deadline === null` AND `scheduledDate < todayKey(now)`).
  - Overdue tasks are excluded from standard Day boards in `/tasks/daily` and move automatically into the **Overdue** lane at the bottom of `/tasks/daily`.
- **Transfer (`POST /api/tasks/:id/transfer`):**
  - Atomically updates **both** `scheduledDate` (`>= todayKey(now)`) and `deadline` (`> now`) on an overdue task, clearing `isOverdue` and placing the task onto its new target day board.

---

## 2. Confirmed Requirements and User Flows

### 2.1 Daily Task Management (`/tasks/daily`) Flows

#### A. Header & View Mode Switching
- **Header Title & Controls:** Displays `Daily Task Management` (`h1`), a `SegmentedControl` for switching between `Day`, `Week`, and `Month` modes, and the `Observatory` action button (which opens the placeholder `Statistics` drawer; see [`OD-01`](../../../docs/engineering/PROJECT_DESCRIPTION.md#od-01)).
- **Task Topbar Shortcuts:** Daily provides a `Tasks Hub` pill immediately before its date readout; Tasks Hub provides a `Daily` pill before Universe. Both use `TransitionLink`, match the adjacent Universe control sizing and lavender theme, and appear only on their respective task routes. Below `480px`, shortcuts and Universe use accessible icon-only controls to keep the topbar on one row. There is no standalone shortcut or reserved gap above the Daily dashboard.
- **Topbar Date Readout & Mode Stage (`DailyBoard.tsx`):** When on `/tasks/daily`, `WorkspaceShell` ([`src/ui/WorkspaceShell.tsx`](../../../src/ui/WorkspaceShell.tsx)) displays the current weekday and date in `Asia/Ho_Chi_Minh`. `DailyBoard.tsx` (`DailyModeStage`) syncs persisted view mode via `useSyncExternalStore` without post-mount day-flash or hydration mismatch and switches modes inside `<AnimatePresence mode="wait" initial={false}>` using a single compositor opacity/subtle-Y transition (`0.17s` in / `0.09s` out; `0s` when reduced motion is active) without overlapping exiting panels or `ResizeObserver` `height` animation.

#### B. Observatory / Daily Dashboard (`DailyDashboard.tsx`)
Three glass summary cards sit above the main stage:
1. **`Cosmic forecast`:** Displays a calm editorial message (`Steady skies — focus on your brightest task first.`; see [`OD-02`](../../../docs/engineering/PROJECT_DESCRIPTION.md#od-02)) with celestial star accents.
2. **`Progress`:** Displays today's animated completion percentage (`0%`–`100%` in display serif numerals), a summary subtitle (`{done} of {total} tasks done today`), and a horizontal progress bar with a glowing leading dot.
3. **`Day arc`:** Tracks the progression of the 24-hour day in `Asia/Ho_Chi_Minh` (`UTC+07:00`) along a golden horizon arc (`day-arc-decoration.svg`):
   - **Confirmed Target Requirement:** Display a real-time `HH:mm:ss` clock in `Asia/Ho_Chi_Minh` and a live countdown to `00:00` of the next day.
   - **Observed Implementation (Epic 06 + [`OD-03`](../../../docs/engineering/PROJECT_DESCRIPTION.md#od-03)):** [`getDailyClock`](../../../src/features/tasks/daily-dashboard-time.ts) calculates `time`, `timeSeconds`, `countdown`, and `progress`, while `DayArc` in [`DailyDashboard.tsx`](../../../src/features/tasks/DailyDashboard.tsx) renders `HH:mm` without countdown text, schedules ticks on minute boundaries (`MINUTE_MS - (now.getTime() % MINUTE_MS) + 50`, paused on `document.hidden`), positions `.arcMarkerTrack` via `transform: translate3d(...)`, and updates `.arcElapsed` `clip-path` in discrete minute steps with zero idle CSS transitions.

#### C. Day Mode — Active-Board Carousel (`DayCarousel.tsx` & `DayTaskList.tsx`)
1. **3-Day Stage (`Yesterday`, `Today`, `Tomorrow`):**
   - Defaults to `Today` (index `1`) centered as the active, interactive board (`scale(1)`, `opacity: 1`).
   - Neighboring boards (`Yesterday` at index `0`, `Tomorrow` at index `2`) sit to the left and right as scaled, dimmed, slightly blurred (`blur(0.8px)`), non-interactive (`inert`) preview boards. During glide/drag (`data-moving` / `data-dragging`), `DayCarousel.tsx` animates strictly via compositor `translate3d` and `opacity` (`will-change: transform` scoped only while moving) and applies `blur(0.8px)` exclusively at rest.
   - Switching active boards: Users can click neighboring preview boards, use the mobile day selector, drag horizontally (`>= 54px` threshold), scroll horizontally with a trackpad wheel, or press `ArrowLeft` / `ArrowRight` while focused inside the carousel.
2. **Board Header & Quick Creation:**
   - Each board header displays the relative label (`Yesterday`, `Today`, `Tomorrow`), the formatted date, task count badge, and a `+ New task` button that opens `TaskForm` pre-filled with that board's `scheduledDate`.
3. **Measured 3.5-Card Scroll Viewport (`DayTaskList.tsx`, no visible scrollbar since v3.2):**
   - When a board has `<= 3` tasks, the list expands naturally without internal scrolling.
   - When a board has `>= 4` tasks (`count > 3`), `ResizeObserver` (decoupled from JSX `children` identity using `count` and a `childList` `MutationObserver`) measures the rendered `<article>` cards (`fourth.offsetTop + fourth.offsetHeight / 2`) so the scroll viewport clips cleanly at **3.5 visible cards** regardless of whether individual cards have descriptions or media attachments.
   - Displays a bottom gradient fade and a `Scroll for more` pill while more content remains below.
   - v3.2: the custom constellation scrollbar was removed. Scrolling stays native (wheel, touch, keyboard Arrow/Page/Home/End on the focused viewport) with hidden native scrollbars; only the end fade and `data-list-end` mask remain. `celestial-scroll-thumb.svg` is no longer referenced.

#### D. Week Mode (`WeekView.tsx`)
- Displays a 7-column grid (Monday through Sunday of the current week in `Asia/Ho_Chi_Minh`), with Today highlighted by a golden border and `Today` pill.
- **Confirmed Summary Card Anatomy:** Each day card renders:
  1. Weekday name (`Mon`–`Sun`) and tabular date (`DD/MM`).
  2. Circular SVG progress ring showing completion percentage (`{percent}%`) and count (`{done}/{total} done`).
  3. Priority breakdown rows (`{n} urgent`, `{n} normal`, `{n} optional`) paired with `<PriorityPlanet />` glyphs.
  4. Independent deadline counter (`{due} due this day`) counting tasks whose zoned `deadline` falls on that date, regardless of `scheduledDate`.
- **Day Inspection Drawer:** Clicking any day card opens a right-side `Drawer` listing that day's full `TaskCard` items (scheduled on or due on that date) plus a `New task` button pre-seeded for that date. Week cards update in place across fixed `7`-slot keys (`index`) with condensed stagger (`MOTION_DURATION.fast`, `index * 0.018`s).

#### E. Month Mode (`MonthView.tsx`)
- Displays a 42-cell (6-week, Monday-first) calendar grid for the selected month, with Previous/Next month navigation buttons (`ChevronLeft` / `ChevronRight`). The 42 cells reuse fixed slot keys (`index`) with shortened `calendar-arrive` stagger (`180ms`, `Math.floor(index / 7) * 12`ms delay) so month transitions update in place without full-grid remount spikes.
- **Cell Content:**
  - Day number (`1`–`31`), muted when outside the current month, highlighted when Today.
  - Overdue coral dot indicator if any incomplete task on that date is overdue.
  - Priority summary rows (`{n} urgent`, `{n} normal`, `{n} optional` on desktop; compact `{n}U`, `{n}N`, `{n}O` on narrow viewports) and completion badge (`{done}/{total}`).
- **Day Inspection Drawer:** Clicking any date cell opens a `Drawer` showing all tasks scheduled or due on that date, with a `New task` button for that date.

#### F. Overdue Recovery Lane & Modal Transfer (`OverdueList.tsx` & `TransferDialog.tsx`)
- Positioned below the Day/Week/Month stage on `/tasks/daily`.
- Lists all tasks where `task.isOverdue === true` (`status === 'todo'`), styled with the broken-orbit eclipse motif (`eclipse-broken-orbit.svg`), omitting redundant outer `motion.div` `layout` wrappers around `<TaskCard>` inside `<LayoutGroup>`.
- Each overdue card exposes a **Transfer** action button (in addition to completion toggle, edit/menu actions, and deletion).
- **Confirmed Modal Transfer Pattern:** Clicking **Transfer** opens the modal [`TransferDialog`](../../../src/features/tasks/TransferDialog.tsx) (`Dialog` primitive using a keyed inner draft body on open transitions cleanly), allowing the user to pick a future `scheduledDate` and future `deadline`. Submitting calls `POST /api/tasks/:id/transfer`.

---

### 2.2 Tasks Hub (`/tasks/hub`) Flows

1. **Master Filter & Search Bar (`HubList.tsx`):**
   - **Live Search Input:** Filters tasks case-insensitively across `title` and `description`.
   - **Priority & Status Filter Chips:** Filter by `Urgent`, `Normal`, `Optional`, `To do`, `Done`.
   - **Schedule Filter & Sort Selector:** Switch between canonical ordering and explicit sort modes (priority, deadline, creation date).
2. **Task Actions in Hub:**
   - Every `TaskCard` rendered with `context="hub"` uses the clean light-lavender Workspace styling, lazy-mounts its centered detail `<Dialog>` only on first open/highlight while preserving exit transitions, and honors `prefers-reduced-motion: reduce` (`motion-reduce:transition-none motion-reduce:duration-0`). `HubList.tsx` renders task/transfer/schedule/confirm modals with `portal` consistent with Daily.
   - Unscheduled tasks (`scheduledDate === null`) can be scheduled into Daily (`Today` or a chosen date) or edited via [`TaskForm`](../../../src/features/tasks/TaskForm.tsx) and [`TaskMenu`](../../../src/features/tasks/TaskMenu.tsx).
3. **Deep-Link Highlight (`?task=<id>`):**
   - Navigating to `/tasks/hub?task=<id>` (e.g., from a notification click) highlights and focuses the target task.

---

### 2.3 Task Creation, Editing & Media Flows (`TaskForm.tsx` & `TaskMenu.tsx`)

1. **`TaskForm` (`TaskForm.tsx`):**
   - Modal/form for creating or editing a task: `Title` (required, `1..200` chars), `Description` (`<= 4000` chars), `Priority` (`SegmentedControl`: `Urgent`, `Normal`, `Optional`), `Scheduled date`, `Deadline`, and `Media` attachments (`image/*`, `video/*`, `audio/*`, `<= 50 MiB`). Draft state initializes synchronously inside a keyed inner form body (`openSeq`) on open transitions (avoiding post-mount `useEffect` draft-reset cascades while keeping minute ticks and same-task refetches non-destructive), with `motion-reduce:transition-none motion-reduce:duration-0` on `#task-pinned-switch` and thumb.
2. **`TaskMenu` (`TaskMenu.tsx`):**
   - Contextual action menu on task cards for editing, scheduling/unscheduling, transferring, or deleting tasks (with confirmation dialog), applying `motion-reduce:transition-none motion-reduce:duration-0` on menu buttons.

---

### 2.4 Notification Center Flows (`NotificationPopover.tsx`, `BellButton.tsx`, `NotificationItem.tsx`, `/notifications`)

1. **Topbar Bell, Unread Badge & Shared Cache (`BellButton.tsx`):**
   - Queries `GET /api/notifications` via [`src/client/queries/notifications.ts`](../../../src/client/queries/notifications.ts) (`notificationKeys.list()`).
   - Displays an unread indicator/counter badge (`--status-overdue`) when unread notifications exist, synchronized across `BellButton`, `NotificationPopover`, and `/notifications` through the shared TanStack Query cache with optimistic read/unread and mark-all rollback plus error toasts (`Could not update notification status.`, `Could not mark notifications as read.`).
2. **Popover List & Actions (`NotificationPopover.tsx` & `NotificationItem.tsx`):**
   - Lists notifications ordered newest-first (`createdAt DESC`), showing a semantic badge (`Due soon`, `Overdue`, `Completed`, `General`, `System`), message text, and timestamp. Always renders in isolated Sakura (`notification`) styling across Homepage and workspace routes without recoloring the active page.
   - Supports marking individual notifications as read/unread (`/api/notifications/[id]/read`, `/api/notifications/[id]/unread`), `Mark all as read` (`/api/notifications/read-all`), clicking through to the associated item, and navigating via the compact footer `Expand` link (`aria-label="Expand notification center"`) to `/notifications`.
3. **Full Sakura Notification Center (`/notifications`, `NotificationsHubView.tsx` — Observed Epic 04 implementation):**
   - Dedicated full-page Sakura destination (`data-feature-theme="notification"`, reachable via `NotificationPopover` `Expand` or `UniverseMenu`) that opens without auto-marking notifications as read, displaying a sticky unread/category summary folio and chronological date-grouped sections in `Asia/Ho_Chi_Minh` (`Today`, `Yesterday`, or `EEEE, MMM d` / `EEEE, MMM d, yyyy` via `groupNotificationsByDate` in [`src/domain/notification-filter.ts`](../../../src/domain/notification-filter.ts)).
   - Provides deferred keyword search (`"Search notifications…"` + `Clear search`), read-status filter (`All`, `Unread`, `Read`), category filter chips (`All types`, `Due soon`, `Overdue`, `Completed`, `General`, `System`), an explicit `Mark full inbox read` button (`aria-describedby` linked to `"Affects full inbox, not only filtered results."`), individual `density="comfortable"` items, and distinct global (`All caught up.`) vs. filtered (`No matching notifications` + `Reset filters`) empty states.
   - **Verified Epic 04 checks:** `npm run check` passes (`53` test files / `208` tests, including `notification-filter.test.ts` `3`, `notification-popover.test.tsx` `2`, `notifications-hub.test.tsx` `3` covering cache sync and HTTP 500 optimistic rollback), `npm run build` generates `37/37` static pages (`47` app routes total; `○ /notifications` `4.91 kB` / `219 kB` First Load JS), and live Chromium `156.0.8078.4` Playwright verification on `next start` (`127.0.0.1:3149`) passes with zero horizontal overflow (`1440`/`1024`/`768`/`375`/`320`/`1280` at 200% zoom/`640` CSS width), `0` DB mutations, `consoleErrors: []`, `pageErrors: []`, and WCAG AA contrast (`markAllScopeNote` `6.59:1` / `5.91:1` over gradient, `popoverExpandLink` `7.38:1`; see [`review/redesign/epic-04-notifications.md`](../../../.local/review/redesign/epic-04-notifications.md)).

---

## 3. Epic-Specific UI/UX

### 3.1 Celestial Luxury V2 Direction (`/tasks/daily` Only)
By confirmed design decision, `/tasks/daily` uses the **Celestial Luxury V2** dark observatory aesthetic (`--daily-*` tokens in [`src/design/tokens.css`](../../../src/design/tokens.css)), whereas `/tasks/hub` retains the light-lavender Workspace theme (`--ws-*` tokens):

- **Background Sky (`DailySky.tsx`):**
  - Renders a fixed radial/linear twilight gradient (`#0D0C1D` → `#1B1638`, `contain: layout style paint`), static SVG starfield and nebula layers (`114` static `<circle>` stars + `4` static `<polygon>` sparkles inside static `svg.stars`, static `g.clouds` without per-frame `<g>` animation, `constellation-sprinkles.svg`, `nebula-clouds.svg`), `8` standalone `16x16` HTML `.twinkle` `<span>` overlays deferred via a `180ms` timer until `useIsTransitioning()` (Cosmic Launch / `popstate` overlay) clears (and kept static `data-animated="false"` when reduced motion is active), periodic diagonal shooting stars, an `Astrolabe` wheel cropped at the upper-left and a subtle `ZodiacCorner` watermark at the lower-right, both loading `/visuals/daily-v2/zodiac-wheel.svg` without adding motion.
- **Frosted Glass Panels (`daily-foundation.module.css`):**
  - Dashboard cards and day boards use translucent dark glass (`background: var(--daily-card)`, `backdrop-filter: blur(16px)`, `1px solid var(--daily-card-line)`) with warm golden inner highlights.
- **Scoped Task Card Visuals (`TaskCard.tsx` + `daily-task-card.module.css`):**
  - `TaskCard` accepts `context?: 'carousel' | 'overdue' | 'hub'`.
  - When `context === 'carousel'`, cards receive dark frosted glass styling, priority left-border accents (`#E85D04` urgent, `#E07A5F` normal, `#D4AF37` optional), `card-celestial-corner.svg` filigree in the top-right corner, and watermark planet art (`ringed-planet.svg` for urgent, `spiral-galaxy.svg` for normal).
  - When `context === 'overdue'`, cards receive a coral-red tint (`rgba(217, 56, 90, 0.12)`), pulsing border accent, and `eclipse-broken-orbit.svg` watermark.
  - When `context === 'hub'`, zero Celestial V2 classes or watermarks are applied; the card renders as a clean daylight surface (`--ws-surface`).

### 3.2 Celestial V2 SVG Asset Placement Guide
All 11 vector assets designed for the Celestial V2 upgrade are archived in [`.local/sources/img/daily-v2-reference/assets/`](../../../.local/sources/img/daily-v2-reference/assets/), with all 11 deployed as static files in [`public/visuals/daily-v2/`](../../../public/visuals/daily-v2/). Both wheel decorations load the runtime copy of `zodiac-wheel.svg`; replacing its reference copy alone does not synchronize the runtime file:

| Asset Filename | Runtime Location | Component / CSS Consumer | Visual Placement |
| :--- | :--- | :--- | :--- |
| `card-celestial-corner.svg` | [`/visuals/daily-v2/card-celestial-corner.svg`](../../../public/visuals/daily-v2/card-celestial-corner.svg) | `daily-task-card.module.css` | Top-right corner filigree on Daily carousel task cards (`opacity: 0.22`) |
| `celestial-scroll-thumb.svg` | [`/visuals/daily-v2/celestial-scroll-thumb.svg`](../../../public/visuals/daily-v2/celestial-scroll-thumb.svg) | `DayTaskList.tsx` | Custom constellation scrollbar thumb on `> 3` card boards |
| `constellation-sprinkles.svg` | [`/visuals/daily-v2/constellation-sprinkles.svg`](../../../public/visuals/daily-v2/constellation-sprinkles.svg) | `DailySky.tsx` / `daily-foundation.module.css` | Background starfield constellation overlay |
| `day-arc-decoration.svg` | [`/visuals/daily-v2/day-arc-decoration.svg`](../../../public/visuals/daily-v2/day-arc-decoration.svg) | `DailyDashboard.tsx` | Golden solar horizon curve inside the `Day arc` card |
| `eclipse-broken-orbit.svg` | [`/visuals/daily-v2/eclipse-broken-orbit.svg`](../../../public/visuals/daily-v2/eclipse-broken-orbit.svg) | `OverdueList.tsx`, `daily-task-card.module.css` | Header icon and card watermark for the Overdue lane |
| `moon-phase-divider.svg` | [`/visuals/daily-v2/moon-phase-divider.svg`](../../../public/visuals/daily-v2/moon-phase-divider.svg) | `DailyBoard.tsx` / `daily-foundation.module.css` | Ornamental lunar phase divider between sections |
| `nebula-clouds.svg` | [`/visuals/daily-v2/nebula-clouds.svg`](../../../public/visuals/daily-v2/nebula-clouds.svg) | `DailySky.tsx` | Soft atmospheric nebula cloud layer |
| `orbiting-moon.svg` | [`/visuals/daily-v2/orbiting-moon.svg`](../../../public/visuals/daily-v2/orbiting-moon.svg) | `DayTaskList.tsx` (`DayEmpty`) | Empty-state illustration for `Yesterday` board |
| `ringed-planet.svg` | [`/visuals/daily-v2/ringed-planet.svg`](../../../public/visuals/daily-v2/ringed-planet.svg) | `daily-task-card.module.css`, `DayTaskList.tsx` | Watermark on urgent Daily cards (`opacity: 0.12`) and `Tomorrow` empty state |
| `spiral-galaxy.svg` | [`/visuals/daily-v2/spiral-galaxy.svg`](../../../public/visuals/daily-v2/spiral-galaxy.svg) | `daily-task-card.module.css` | Watermark on normal Daily cards (`opacity: 0.10`) |
| `zodiac-wheel.svg` | [`/visuals/daily-v2/zodiac-wheel.svg`](../../../public/visuals/daily-v2/zodiac-wheel.svg) | `DailySky.tsx` (`Astrolabe`, `ZodiacCorner`) | Cropped upper-left wheel and lower-right corner watermark; runtime copy preserves the replacement reference artwork |

---

### 3.3 v3.1 Shared Brief-Card Anatomy (Confirmed requirement; full renovation pending mockup review)

- Daily and Hub cards share `task-brief.module.css`: checkbox · title · menu sit in one grid header row, each control offset so its visual centre aligns with the first title line (`--brief-title-lh`), independent of the 36px menu hit area.
- Descriptions use one two-line clamp everywhere (`-webkit-line-clamp: 2`, ellipsis on line two, `overflow-wrap: anywhere` for long tokens/URLs, explicit newlines preserved). Reserved areas derive from the same tokens the text uses (`--brief-desc-lh`, `--brief-desc-area` in `tokens.css`); a one-line description is vertically balanced inside the fixed-anatomy slot used by Daily carousel and Hub note cards. Cards without fixed anatomy (overdue lane, week/month drawers) reserve no blank space.
- The Daily carousel card height is derived (`padding + title line + two description lines + metadata row`, plus a wrapped metadata row on phones) instead of the former fixed 104/132px, and the 3.5-card viewport is still measured from the rendered fourth card.
- The substantial Daily/Hub layout renovation (plan §5.1–§5.2) is not implemented until the owner reviews the responsive mockups.

## 4. Current Implementation and Relevant Code Locations

### 4.1 Code Map

| Layer | File Paths | Key Symbols & Responsibilities |
| :--- | :--- | :--- |
| **Pages & API Routes** | [`src/app/(workspace)/tasks/daily/page.tsx`](../../../src/app/(workspace)/tasks/daily/page.tsx), [`src/app/(workspace)/tasks/hub/page.tsx`](../../../src/app/(workspace)/tasks/hub/page.tsx), [`src/app/(workspace)/notifications/page.tsx`](../../../src/app/(workspace)/notifications/page.tsx), [`src/app/api/tasks/`](../../../src/app/api/tasks/), [`src/app/api/notifications/`](../../../src/app/api/notifications/) | Next.js App Router pages wrapped in `WorkspaceShell` and JSON route handlers. |
| **Daily UI (`src/features/tasks/`)** | [`DailyBoard.tsx`](../../../src/features/tasks/DailyBoard.tsx), [`DailyDashboard.tsx`](../../../src/features/tasks/DailyDashboard.tsx), [`daily-dashboard-time.ts`](../../../src/features/tasks/daily-dashboard-time.ts), [`DailySky.tsx`](../../../src/features/tasks/DailySky.tsx), [`DayCarousel.tsx`](../../../src/features/tasks/DayCarousel.tsx), [`DayTaskList.tsx`](../../../src/features/tasks/DayTaskList.tsx), [`WeekView.tsx`](../../../src/features/tasks/WeekView.tsx), [`MonthView.tsx`](../../../src/features/tasks/MonthView.tsx), [`OverdueList.tsx`](../../../src/features/tasks/OverdueList.tsx), [`TransferDialog.tsx`](../../../src/features/tasks/TransferDialog.tsx) | Daily Task Management views, Celestial V2 sky/dashboard, active-board carousel, measured 3.5-card scroller, Week/Month grids, Overdue lane, and modal Transfer dialog. |
| **Shared Task UI (`src/features/tasks/`)** | [`HubList.tsx`](../../../src/features/tasks/HubList.tsx), [`TaskCard.tsx`](../../../src/features/tasks/TaskCard.tsx), [`TaskForm.tsx`](../../../src/features/tasks/TaskForm.tsx), [`TaskMenu.tsx`](../../../src/features/tasks/TaskMenu.tsx), [`PriorityBadge.tsx`](../../../src/features/tasks/PriorityBadge.tsx), [`DueSoonDot.tsx`](../../../src/features/tasks/DueSoonDot.tsx), [`FinishedCounter.tsx`](../../../src/features/tasks/FinishedCounter.tsx), [`daily-foundation.module.css`](../../../src/features/tasks/daily-foundation.module.css), [`daily-task-card.module.css`](../../../src/features/tasks/daily-task-card.module.css) | Tasks Hub view, context-aware `TaskCard`, creation/edit form, action menu, priority badges, and scoped CSS modules. |
| **Notifications UI** | [`NotificationPopover.tsx`](../../../src/features/notifications/NotificationPopover.tsx), [`NotificationsHubView.tsx`](../../../src/features/notifications/NotificationsHubView.tsx), [`BellButton.tsx`](../../../src/features/notifications/BellButton.tsx), [`NotificationItem.tsx`](../../../src/features/notifications/NotificationItem.tsx), [`notifications-hub.module.css`](../../../src/features/notifications/notifications-hub.module.css) | Topbar bell trigger, unread counter badge, isolated Sakura popover with compact `Expand` link to `/notifications`, and full Sakura Notification Center with `Asia/Ho_Chi_Minh` date grouping, search/read/type filters, and `Mark full inbox read`. |
| **Client Hooks & Transitions** | [`src/client/queries/tasks.ts`](../../../src/client/queries/tasks.ts), [`src/client/queries/notifications.ts`](../../../src/client/queries/notifications.ts), [`src/client/api-client.ts`](../../../src/client/api-client.ts), [`src/client/use-minute-ticker.ts`](../../../src/client/use-minute-ticker.ts), [`src/features/transitions/TransitionProvider.tsx`](../../../src/features/transitions/TransitionProvider.tsx) | TanStack Query hooks for task CRUD/transfer, shared notification polling/marking with optimistic rollback, and read-only `useIsTransitioning()` overlay-arrival state. |
| **Contracts & Domain** | [`src/contracts/task.ts`](../../../src/contracts/task.ts), [`src/contracts/notification.ts`](../../../src/contracts/notification.ts), [`src/domain/task-status.ts`](../../../src/domain/task-status.ts), [`src/domain/task-sort.ts`](../../../src/domain/task-sort.ts), [`src/domain/date-input.ts`](../../../src/domain/date-input.ts), [`src/domain/notification-rules.ts`](../../../src/domain/notification-rules.ts), [`src/domain/notification-filter.ts`](../../../src/domain/notification-filter.ts), [`src/domain/reminder.ts`](../../../src/domain/reminder.ts), [`src/domain/time.ts`](../../../src/domain/time.ts) | Zod schemas, overdue/due-soon calculation, canonical sorting, pure notification filter/date-grouping helpers, reminder math, and `Asia/Ho_Chi_Minh` date helpers. |
| **Services & Storage** | [`src/services/task-service.ts`](../../../src/services/task-service.ts), [`src/services/notification-service.ts`](../../../src/services/notification-service.ts), [`src/services/storage/`](../../../src/services/storage/) | SQLite CRUD, reminder evaluation/deduplication/retention, and local/Drive storage adapters. |
| **Tests** | [`tests/domain/task-domain.test.ts`](../../../tests/domain/task-domain.test.ts), [`tests/domain/notification-filter.test.ts`](../../../tests/domain/notification-filter.test.ts), [`tests/domain/time.test.ts`](../../../tests/domain/time.test.ts), [`tests/services/task-service.test.ts`](../../../tests/services/task-service.test.ts), [`tests/services/notification-service.test.ts`](../../../tests/services/notification-service.test.ts), [`tests/features/tasks/`](../../../tests/features/tasks/), [`tests/features/notifications/notification-popover.test.tsx`](../../../tests/features/notifications/notification-popover.test.tsx), [`tests/features/notifications/notifications-hub.test.tsx`](../../../tests/features/notifications/notifications-hub.test.tsx), [`tests/ui/popover-positioning.test.tsx`](../../../tests/ui/popover-positioning.test.tsx), [`tests/ui/drawer-and-checkbox.test.tsx`](../../../tests/ui/drawer-and-checkbox.test.tsx) | Unit, service integration, and jsdom UI tests covering Daily V2, `DayArc` minute stability, `DayCarousel` motion/settle & `DailySky` deferral, `DayTaskList` observer/thumb, `WeekView`, `MonthView`, `HubList`, `TaskCard`, reduced motion, `Popover`/`Drawer`/`Checkbox` primitives, notification filtering/date grouping, popover `Expand` & isolation, Bell/Center cache sync, and optimistic rollback. |

### 4.2 Confirmed Requirements vs. Observed Implementation Gaps
Because the 7 November 2026 reconstruction strictly forbade modifying application code, the following differences between confirmed requirements/contracts and the observed codebase (with Epic 06 updates noted where applicable) are explicitly recorded here:

| Area | Confirmed Requirement / Target Contract | Observed Implementation in `src/` | Tracking Reference |
| :--- | :--- | :--- | :--- |
| **Day Arc Clock & Countdown** | Real-time `HH:mm:ss` clock in `Asia/Ho_Chi_Minh` (`UTC+07:00`) + live countdown to `00:00` of the next day. | `getDailyClock` in [`daily-dashboard-time.ts`](../../../src/features/tasks/daily-dashboard-time.ts) computes `time`, `timeSeconds`, `countdown`, and `progress`, while `DayArc` in [`DailyDashboard.tsx`](../../../src/features/tasks/DailyDashboard.tsx) aligns ticks to minute boundaries (`MINUTE_MS - (now.getTime() % MINUTE_MS) + 50`), renders `HH:mm` without countdown text, and moves `.arcMarkerTrack` with `translate3d` (zero idle CSS transitions; see [`review/redesign/epic-06-daily-hub.md`](../../../.local/review/redesign/epic-06-daily-hub.md)). | [`OD-03`](../../../docs/engineering/PROJECT_DESCRIPTION.md#od-03) |
| **Dashboard Eyebrow Casing** | Sentence case across all labels (`Cosmic forecast`, `Progress`, `Day arc`); all-caps reserved solely for the homepage wordmark. | DOM strings in `DailyDashboard.tsx` are sentence case, but `.eyebrow` in [`daily-foundation.module.css`](../../../src/features/tasks/daily-foundation.module.css) (line 138) applies `font-variant-caps: all-small-caps;`. | [`OD-04`](../../../docs/engineering/PROJECT_DESCRIPTION.md#od-04) |
| **Header `Observatory` Button** | Clear separation between the 3-column Observatory dashboard strip and future completion analytics. | Header button in [`DailyBoard.tsx`](../../../src/features/tasks/DailyBoard.tsx) is labeled `Observatory` and opens a `Drawer` titled `Statistics` showing `Blank page — waiting for future features.`. | [`OD-01`](../../../docs/engineering/PROJECT_DESCRIPTION.md#od-01) |
| **Month View Priority Indicators** | Compact priority breakdown inside each date cell. | [`MonthView.tsx`](../../../src/features/tasks/MonthView.tsx) renders text labels (`1 urgent` on desktop, `1U` on mobile) without `<PriorityPlanet />` icons (`WeekView.tsx` renders both `<PriorityPlanet />` icons and text). | — |
| **Service & API Audit Defects (`C01`–`C12`, `C14`)** | Full reminder evaluation on task creation, clean `scheduledDate: null` unscheduling via `PATCH`, media file cleanup on task deletion, etc. | Logged with exact line numbers in [`docs/audit/BUG_INVENTORY.md`](../../../docs/audit/BUG_INVENTORY.md) (`C01` `createTask` skips `evaluateTaskNotifications`; `C04` `deleteTask` leaves orphan media files on disk; `C05` `PATCH` coerces `scheduledDate: null` via `?? existing.scheduledDate`; `C10` `drizzle.config.ts` DB filename mismatch). | [`OD-05`](../../../docs/engineering/PROJECT_DESCRIPTION.md#od-05), [`docs/audit/BUG_INVENTORY.md`](../../../docs/audit/BUG_INVENTORY.md) |

---

## 5. Acceptance Criteria

1. **Shared Task State:** Creating, completing, editing, scheduling, or deleting a task in `/tasks/daily` or `/tasks/hub` persists to SQLite and reflects across both views without manual page reload.
2. **Celestial V2 Scoping:** `/tasks/daily` renders the dark Celestial V2 sky (`DailySky`), frosted glass dashboard, and ornamented cards, while `/tasks/hub` renders the light-lavender Workspace theme without dark V2 styles leaking across routes.
3. **Active-Board Day Carousel & 3.5-Card Scroller:** Day mode centers the active board (`Today` by default) with scaled/dimmed `Yesterday` and `Tomorrow` neighbor boards, supports arrow/drag/wheel/keyboard switching, clips lists of `>= 4` tasks to `3.5` measured cards, and scrolls natively without a visible scrollbar.
4. **Week & Month Summaries + Drawers:** Week mode displays 7 day cards with circular progress, priority planet counts, and independent `due this day` counts; Month mode displays a 42-cell Monday-first calendar grid; clicking any day in either mode opens its inspection `Drawer`.
5. **Overdue Lane & Modal Transfer:** Incomplete tasks past their `deadline` (or past `scheduledDate` when `deadline === null`) appear in the Overdue lane and can be transferred via the modal `TransferDialog` to a valid future schedule and deadline.
6. **Notification Lifecycle:** `due_24h` (only when total duration `>= 24h`), `due_quarter` (final 25% of duration), and `overdue` notifications are deduplicated, replaced by a single `completed` notification when a task is marked done, and purged after 7 days.

---

## 6. Open Decisions and Supporting References

### 6.1 Open Decisions Touching Tasks Epic
All open decisions are maintained centrally in [`PROJECT_DESCRIPTION.md#8-open-decisions-register`](../../../docs/engineering/PROJECT_DESCRIPTION.md#8-open-decisions-register):
- [`OD-01`](../../../docs/engineering/PROJECT_DESCRIPTION.md#od-01): Daily Header `Observatory` Button vs. `Statistics` Drawer & Future Analytics Scope
- [`OD-02`](../../../docs/engineering/PROJECT_DESCRIPTION.md#od-02): Dynamic vs. Curated `Cosmic forecast` Copy in Daily Task Management
- [`OD-03`](../../../docs/engineering/PROJECT_DESCRIPTION.md#od-03): Day Arc Real-Time `HH:mm:ss` Clock & Midnight Countdown Implementation Alignment
- [`OD-04`](../../../docs/engineering/PROJECT_DESCRIPTION.md#od-04): Sentence-Case Rule vs. CSS `all-small-caps` on `.eyebrow` Labels
- [`OD-05`](../../../docs/engineering/PROJECT_DESCRIPTION.md#od-05): Remediation Priority & Behavioral Contracts for Confirmed Audit Defects (`C01`–`C14`)

### 6.2 Supporting References
- **Local V2 Asset Reference Index:** [`../../../.local/sources/img/daily-v2-reference/README.md`](../../../.local/sources/img/daily-v2-reference/README.md)
- **Owner Vision & Notes (Read-Only):** [`../../../md/user/user_desc.md`](../../../md/user/user_desc.md), [`../../../md/user/user_notes.md`](../../../md/user/user_notes.md)
- **Forensic Audit Reports (Read-Only):** [`../../../docs/audit/ARCHITECTURE_AUDIT.md`](../../../docs/audit/ARCHITECTURE_AUDIT.md), [`../../../docs/audit/BUG_INVENTORY.md`](../../../docs/audit/BUG_INVENTORY.md), [`../../../docs/audit/TECHNICAL_DEBT.md`](../../../docs/audit/TECHNICAL_DEBT.md), [`../../../docs/audit/STABILIZATION_PLAN.md`](../../../docs/audit/STABILIZATION_PLAN.md)
