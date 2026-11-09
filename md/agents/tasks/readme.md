# Tasks Epic Specification (Daily Task Management, Tasks Hub & Notifications)

`md/agents/tasks/readme.md` is the canonical engineering and design specification for the **Tasks epic**, covering **Daily Task Management** (`/tasks/daily`), **Tasks Hub** (`/tasks/hub`), and the **Notification Center** (`NotificationPopover` + reminder evaluation engine).

- **Related System Reference (Shared Data & Domain Rules):** [`../../../PROJECT_DESCRIPTION.md`](../../../PROJECT_DESCRIPTION.md)
- **Related Shared UI/UX Baseline:** [`../shared/uiux.md`](../shared/uiux.md)
- **Implementation History & Audit Reports:** [`reports.md`](reports.md)
- **Local V2 Asset Reference Index:** [`../../../sources/img/daily-v2-reference/README.md`](../../../sources/img/daily-v2-reference/README.md)

---

## 1. Purpose, Scope, and Relationships

### 1.1 Epic Purpose
The Tasks epic provides a cohesive, two-surface personal task operating system backed by a single SQLite task model (`tasks`, `task_media`) and an automated deadline notification engine (`notifications`):

1. **Daily Task Management (`/tasks/daily`):** A calm, dark-sky observatory workspace ("Celestial Luxury V2") dedicated to daily execution across **Day** (active-board carousel for Yesterday / Today / Tomorrow), **Week** (7-day summary cards), and **Month** (42-cell calendar grid) views, plus a dedicated **Overdue** recovery lane.
2. **Tasks Hub (`/tasks/hub`):** A high-clarity, light-lavender master backlog and planning workspace for capturing unscheduled tasks, searching/filtering/sorting across all tasks, managing media attachments (`<= 50 MiB`), and scheduling tasks onto specific calendar days.
3. **Notification Center (Topbar Bell):** An automated reminder system that evaluates approaching deadlines (`24h` and `1/4` remaining time window), overdue transitions, and task completions in `Asia/Ho_Chi_Minh` (`UTC+07:00`).

### 1.2 Shared Record & State Relationships
As defined in [`PROJECT_DESCRIPTION.md#4-shared-data-concepts--domain-rules`](../../../PROJECT_DESCRIPTION.md#4-shared-data-concepts--domain-rules):
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
- **Header Title & Controls:** Displays `Daily Task Management` (`h1`), a `SegmentedControl` for switching between `Day`, `Week`, and `Month` modes, and the `Observatory` action button (which opens the placeholder `Statistics` drawer; see [`OD-01`](../../../PROJECT_DESCRIPTION.md#od-01)).
- **Topbar Date Readout:** When on `/tasks/daily`, `WorkspaceShell` ([`src/ui/WorkspaceShell.tsx`](../../../src/ui/WorkspaceShell.tsx)) displays the current weekday and date in `Asia/Ho_Chi_Minh`.

#### B. Observatory / Daily Dashboard (`DailyDashboard.tsx`)
Three glass summary cards sit above the main stage:
1. **`Cosmic forecast`:** Displays a calm editorial message (`Steady skies — focus on your brightest task first.`; see [`OD-02`](../../../PROJECT_DESCRIPTION.md#od-02)) with celestial star accents.
2. **`Progress`:** Displays today's animated completion percentage (`0%`–`100%` in display serif numerals), a summary subtitle (`{done} of {total} tasks done today`), and a horizontal progress bar with a glowing leading dot.
3. **`Day arc`:** Tracks the progression of the 24-hour day in `Asia/Ho_Chi_Minh` (`UTC+07:00`) along a golden horizon arc (`day-arc-decoration.svg`):
   - **Confirmed Target Requirement:** Display a real-time `HH:mm:ss` clock in `Asia/Ho_Chi_Minh` and a live countdown to `00:00` of the next day.
   - **Observed Implementation Gap:** `getHoChiMinhDayArcSnapshot` in [`daily-dashboard-time.ts`](../../../src/features/tasks/daily-dashboard-time.ts) ticks every second (`1000ms`) and calculates `progress` to the second, but currently formats the visible label as `HH:mm` (`${hour}:${minute}`) without rendering the midnight countdown text. Tracked as [`OD-03`](../../../PROJECT_DESCRIPTION.md#od-03).

#### C. Day Mode — Active-Board Carousel (`DayCarousel.tsx` & `DayTaskList.tsx`)
1. **3-Day Stage (`Yesterday`, `Today`, `Tomorrow`):**
   - Defaults to `Today` (index `1`) centered as the active, interactive board (`scale(1)`, `opacity: 1`).
   - Neighboring boards (`Yesterday` at index `0`, `Tomorrow` at index `2`) sit to the left and right as scaled (`0.91`), dimmed (`opacity: 0.42`), slightly blurred (`blur(1px)`), non-interactive (`inert`) preview boards.
   - Switching active boards: Users can click the left/right `IconButton` arrows, drag horizontally (`>= 54px` threshold), scroll horizontally with a trackpad wheel, or press `ArrowLeft` / `ArrowRight` while focused inside the carousel.
2. **Board Header & Quick Creation:**
   - Each board header displays the relative label (`Yesterday`, `Today`, `Tomorrow`), the formatted date, task count badge, and a `+ New task` button that opens `TaskForm` pre-filled with that board's `scheduledDate`.
3. **Measured 3.5-Card Scroll Viewport & Custom Constellation Scrollbar (`DayTaskList.tsx`):**
   - When a board has `<= 3` tasks, the list expands naturally without internal scrolling.
   - When a board has `>= 4` tasks (`count > 3`), `ResizeObserver` measures the actual rendered DOM height of the `<article>` cards (`fourth.offsetTop + fourth.offsetHeight / 2`) so the scroll viewport clips cleanly at **3.5 visible cards** regardless of whether individual cards have descriptions or media attachments.
   - Displays a bottom gradient fade and a `Scroll for more` pill while more content remains below.
   - Renders a custom interactive constellation scrollbar (`role="scrollbar"`, `aria-valuenow`, pointer-draggable thumb using `celestial-scroll-thumb.svg`) along the right edge while native scrollbars remain hidden.

#### D. Week Mode (`WeekView.tsx`)
- Displays a 7-column grid (Monday through Sunday of the current week in `Asia/Ho_Chi_Minh`), with Today highlighted by a golden border and `Today` pill.
- **Confirmed Summary Card Anatomy:** Each day card renders:
  1. Weekday name (`Mon`–`Sun`) and tabular date (`DD/MM`).
  2. Circular SVG progress ring showing completion percentage (`{percent}%`) and count (`{done}/{total} done`).
  3. Priority breakdown rows (`{n} urgent`, `{n} normal`, `{n} optional`) paired with `<PriorityPlanet />` glyphs.
  4. Independent deadline counter (`{due} due this day`) counting tasks whose zoned `deadline` falls on that date, regardless of `scheduledDate`.
- **Day Inspection Drawer:** Clicking any day card opens a right-side `Drawer` listing that day's full `TaskCard` items (scheduled on or due on that date) plus a `New task` button pre-seeded for that date.

#### E. Month Mode (`MonthView.tsx`)
- Displays a 42-cell (6-week, Monday-first) calendar grid for the selected month, with Previous/Next month navigation buttons (`ChevronLeft` / `ChevronRight`).
- **Cell Content:**
  - Day number (`1`–`31`), muted when outside the current month, highlighted when Today.
  - Overdue coral dot indicator if any incomplete task on that date is overdue.
  - Priority summary rows (`{n} urgent`, `{n} normal`, `{n} optional` on desktop; compact `{n}U`, `{n}N`, `{n}O` on narrow viewports) and completion badge (`{done}/{total}`).
- **Day Inspection Drawer:** Clicking any date cell opens a `Drawer` showing all tasks scheduled or due on that date, with a `New task` button for that date.

#### F. Overdue Recovery Lane & Modal Transfer (`OverdueList.tsx` & `TransferDialog.tsx`)
- Positioned below the Day/Week/Month stage on `/tasks/daily`.
- Lists all tasks where `task.isOverdue === true` (`status === 'todo'`), styled with the broken-orbit eclipse motif (`eclipse-broken-orbit.svg`).
- Each overdue card exposes a **Transfer** action button (in addition to completion toggle, edit/menu actions, and deletion).
- **Confirmed Modal Transfer Pattern:** Clicking **Transfer** opens the modal [`TransferDialog`](../../../src/features/tasks/TransferDialog.tsx) (`Dialog` primitive), allowing the user to pick a future `scheduledDate` and future `deadline`. Submitting calls `POST /api/tasks/:id/transfer`.

---

### 2.2 Tasks Hub (`/tasks/hub`) Flows

1. **Master Filter & Search Bar (`HubList.tsx`):**
   - **Live Search Input:** Filters tasks case-insensitively across `title` and `description`.
   - **Priority & Status Filter Chips:** Filter by `Urgent`, `Normal`, `Optional`, `To do`, `Done`.
   - **Schedule Filter & Sort Selector:** Switch between canonical ordering and explicit sort modes (priority, deadline, creation date).
2. **Task Actions in Hub:**
   - Every `TaskCard` rendered with `context="hub"` uses the clean light-lavender Workspace styling.
   - Unscheduled tasks (`scheduledDate === null`) can be scheduled into Daily (`Today` or a chosen date) or edited via [`TaskForm`](../../../src/features/tasks/TaskForm.tsx) and [`TaskMenu`](../../../src/features/tasks/TaskMenu.tsx).
3. **Deep-Link Highlight (`?task=<id>`):**
   - Navigating to `/tasks/hub?task=<id>` (e.g., from a notification click) highlights and focuses the target task.

---

### 2.3 Task Creation, Editing & Media Flows (`TaskForm.tsx` & `TaskMenu.tsx`)

1. **`TaskForm` (`TaskForm.tsx`):**
   - Modal/form for creating or editing a task: `Title` (required, `1..200` chars), `Description` (`<= 4000` chars), `Priority` (`SegmentedControl`: `Urgent`, `Normal`, `Optional`), `Scheduled date`, `Deadline`, and `Media` attachments (`image/*`, `video/*`, `audio/*`, `<= 50 MiB`).
2. **`TaskMenu` (`TaskMenu.tsx`):**
   - Contextual action menu on task cards for editing, scheduling/unscheduling, transferring, or deleting tasks (with confirmation dialog).

---

### 2.4 Notification Center Flows (`NotificationPopover.tsx`, `BellButton.tsx`, `NotificationItem.tsx`)

1. **Topbar Bell & Unread Badge (`BellButton.tsx`):**
   - Queries `GET /api/notifications` via [`src/client/queries/notifications.ts`](../../../src/client/queries/notifications.ts).
   - Displays an unread counter badge in `--status-urgent` when unread notifications exist.
2. **Popover List & Actions (`NotificationPopover.tsx` & `NotificationItem.tsx`):**
   - Lists notifications ordered newest-first (`createdAt DESC`), showing a semantic badge (`24h`, `Quarter`, `Overdue`, `Completed`), message text, and timestamp.
   - Supports marking individual notifications as read/unread (`/api/notifications/[id]/read`, `/api/notifications/[id]/unread`), `Mark all read` (`/api/notifications/read-all`), and clicking through to the associated task.

---

## 3. Epic-Specific UI/UX

### 3.1 Celestial Luxury V2 Direction (`/tasks/daily` Only)
By confirmed design decision, `/tasks/daily` uses the **Celestial Luxury V2** dark observatory aesthetic (`--daily-*` tokens in [`src/design/tokens.css`](../../../src/design/tokens.css)), whereas `/tasks/hub` retains the light-lavender Workspace theme (`--ws-*` tokens):

- **Background Sky (`DailySky.tsx`):**
  - Renders a fixed radial/linear twilight gradient (`#0D0C1D` → `#1B1638`), a multi-layer twinkling starfield (`constellation-sprinkles.svg`, `nebula-clouds.svg`), periodic diagonal shooting stars, a rotating geometric `Astrolabe` SVG behind the upper-right sky, and a subtle `ZodiacCorner` watermark in the lower-right corner.
- **Frosted Glass Panels (`daily-foundation.module.css`):**
  - Dashboard cards and day boards use translucent dark glass (`background: var(--daily-card)`, `backdrop-filter: blur(16px)`, `1px solid var(--daily-card-line)`) with warm golden inner highlights.
- **Scoped Task Card Visuals (`TaskCard.tsx` + `daily-task-card.module.css`):**
  - `TaskCard` accepts `context?: 'carousel' | 'overdue' | 'hub'`.
  - When `context === 'carousel'`, cards receive dark frosted glass styling, priority left-border accents (`#E85D04` urgent, `#E07A5F` normal, `#D4AF37` optional), `card-celestial-corner.svg` filigree in the top-right corner, and watermark planet art (`ringed-planet.svg` for urgent, `spiral-galaxy.svg` for normal).
  - When `context === 'overdue'`, cards receive a coral-red tint (`rgba(217, 56, 90, 0.12)`), pulsing border accent, and `eclipse-broken-orbit.svg` watermark.
  - When `context === 'hub'`, zero Celestial V2 classes or watermarks are applied; the card renders as a clean daylight surface (`--ws-surface`).

### 3.2 Celestial V2 SVG Asset Placement Guide
All 11 vector assets designed for the Celestial V2 upgrade are archived in [`sources/img/daily-v2-reference/assets/`](../../../sources/img/daily-v2-reference/assets/), with 10 deployed as static files in [`public/visuals/daily-v2/`](../../../public/visuals/daily-v2/) and 1 (`zodiac-wheel.svg`) rendered inline in `DailySky.tsx`:

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
| `zodiac-wheel.svg` | Inline in [`DailySky.tsx`](../../../src/features/tasks/DailySky.tsx) (`Astrolabe`, `ZodiacCorner`) | `DailySky.tsx` | Rotating upper-right astrolabe and lower-right corner watermark |

---

## 4. Current Implementation and Relevant Code Locations

### 4.1 Code Map

| Layer | File Paths | Key Symbols & Responsibilities |
| :--- | :--- | :--- |
| **Pages & API Routes** | [`src/app/(workspace)/tasks/daily/page.tsx`](../../../src/app/(workspace)/tasks/daily/page.tsx), [`src/app/(workspace)/tasks/hub/page.tsx`](../../../src/app/(workspace)/tasks/hub/page.tsx), [`src/app/api/tasks/`](../../../src/app/api/tasks/), [`src/app/api/notifications/`](../../../src/app/api/notifications/) | Next.js App Router pages wrapped in `WorkspaceShell` and JSON route handlers. |
| **Daily UI (`src/features/tasks/`)** | [`DailyBoard.tsx`](../../../src/features/tasks/DailyBoard.tsx), [`DailyDashboard.tsx`](../../../src/features/tasks/DailyDashboard.tsx), [`daily-dashboard-time.ts`](../../../src/features/tasks/daily-dashboard-time.ts), [`DailySky.tsx`](../../../src/features/tasks/DailySky.tsx), [`DayCarousel.tsx`](../../../src/features/tasks/DayCarousel.tsx), [`DayTaskList.tsx`](../../../src/features/tasks/DayTaskList.tsx), [`WeekView.tsx`](../../../src/features/tasks/WeekView.tsx), [`MonthView.tsx`](../../../src/features/tasks/MonthView.tsx), [`OverdueList.tsx`](../../../src/features/tasks/OverdueList.tsx), [`TransferDialog.tsx`](../../../src/features/tasks/TransferDialog.tsx) | Daily Task Management views, Celestial V2 sky/dashboard, active-board carousel, measured 3.5-card scroller, Week/Month grids, Overdue lane, and modal Transfer dialog. |
| **Shared Task UI (`src/features/tasks/`)** | [`HubList.tsx`](../../../src/features/tasks/HubList.tsx), [`TaskCard.tsx`](../../../src/features/tasks/TaskCard.tsx), [`TaskForm.tsx`](../../../src/features/tasks/TaskForm.tsx), [`TaskMenu.tsx`](../../../src/features/tasks/TaskMenu.tsx), [`PriorityBadge.tsx`](../../../src/features/tasks/PriorityBadge.tsx), [`DueSoonDot.tsx`](../../../src/features/tasks/DueSoonDot.tsx), [`FinishedCounter.tsx`](../../../src/features/tasks/FinishedCounter.tsx), [`daily-foundation.module.css`](../../../src/features/tasks/daily-foundation.module.css), [`daily-task-card.module.css`](../../../src/features/tasks/daily-task-card.module.css) | Tasks Hub view, context-aware `TaskCard`, creation/edit form, action menu, priority badges, and scoped CSS modules. |
| **Notifications UI** | [`NotificationPopover.tsx`](../../../src/features/notifications/NotificationPopover.tsx), [`BellButton.tsx`](../../../src/features/notifications/BellButton.tsx), [`NotificationItem.tsx`](../../../src/features/notifications/NotificationItem.tsx) | Topbar bell trigger, unread counter badge, and notification list popover. |
| **Client Hooks** | [`src/client/queries/tasks.ts`](../../../src/client/queries/tasks.ts), [`src/client/queries/notifications.ts`](../../../src/client/queries/notifications.ts), [`src/client/api-client.ts`](../../../src/client/api-client.ts), [`src/client/use-minute-ticker.ts`](../../../src/client/use-minute-ticker.ts) | TanStack Query hooks for task CRUD/transfer and notification polling/marking. |
| **Contracts & Domain** | [`src/contracts/task.ts`](../../../src/contracts/task.ts), [`src/contracts/notification.ts`](../../../src/contracts/notification.ts), [`src/domain/task-status.ts`](../../../src/domain/task-status.ts), [`src/domain/task-sort.ts`](../../../src/domain/task-sort.ts), [`src/domain/date-input.ts`](../../../src/domain/date-input.ts), [`src/domain/notification-rules.ts`](../../../src/domain/notification-rules.ts), [`src/domain/reminder.ts`](../../../src/domain/reminder.ts), [`src/domain/time.ts`](../../../src/domain/time.ts) | Zod schemas, overdue/due-soon calculation, canonical sorting, reminder math, and `Asia/Ho_Chi_Minh` date helpers. |
| **Services & Storage** | [`src/services/task-service.ts`](../../../src/services/task-service.ts), [`src/services/notification-service.ts`](../../../src/services/notification-service.ts), [`src/services/storage/`](../../../src/services/storage/) | SQLite CRUD, reminder evaluation/deduplication/retention, and local/Drive storage adapters. |
| **Tests** | [`tests/domain/task-domain.test.ts`](../../../tests/domain/task-domain.test.ts), [`tests/domain/time.test.ts`](../../../tests/domain/time.test.ts), [`tests/services/task-service.test.ts`](../../../tests/services/task-service.test.ts), [`tests/services/notification-service.test.ts`](../../../tests/services/notification-service.test.ts), [`tests/features/tasks/`](../../../tests/features/tasks/), [`tests/features/notifications/notification-popover.test.tsx`](../../../tests/features/notifications/notification-popover.test.tsx) | Unit, service integration, and jsdom UI tests covering Daily V2, DayCarousel, WeekView, MonthView, HubList, and TaskCard. |

### 4.2 Confirmed Requirements vs. Observed Implementation Gaps
Because the 7 November 2026 reconstruction strictly forbade modifying application code, the following differences between confirmed requirements/contracts and the current code are explicitly recorded here:

| Area | Confirmed Requirement / Target Contract | Observed Implementation in `src/` (as of 7 Nov 2026) | Tracking Reference |
| :--- | :--- | :--- | :--- |
| **Day Arc Clock & Countdown** | Real-time `HH:mm:ss` clock in `Asia/Ho_Chi_Minh` (`UTC+07:00`) + live countdown to `00:00` of the next day. | [`daily-dashboard-time.ts`](../../../src/features/tasks/daily-dashboard-time.ts) updates every `1000ms` and computes second-accurate `progress`, but formats `time` as `HH:mm` (`${hour}:${minute}`) and does not render a midnight countdown string in [`DailyDashboard.tsx`](../../../src/features/tasks/DailyDashboard.tsx). | [`OD-03`](../../../PROJECT_DESCRIPTION.md#od-03) |
| **Dashboard Eyebrow Casing** | Sentence case across all labels (`Cosmic forecast`, `Progress`, `Day arc`); all-caps reserved solely for the homepage wordmark. | DOM strings in `DailyDashboard.tsx` are sentence case, but `.eyebrow` in [`daily-foundation.module.css`](../../../src/features/tasks/daily-foundation.module.css) (line 138) applies `font-variant-caps: all-small-caps;`. | [`OD-04`](../../../PROJECT_DESCRIPTION.md#od-04) |
| **Header `Observatory` Button** | Clear separation between the 3-column Observatory dashboard strip and future completion analytics. | Header button in [`DailyBoard.tsx`](../../../src/features/tasks/DailyBoard.tsx) is labeled `Observatory` and opens a `Drawer` titled `Statistics` showing `Blank page — waiting for future features.`. | [`OD-01`](../../../PROJECT_DESCRIPTION.md#od-01) |
| **Month View Priority Indicators** | Compact priority breakdown inside each date cell. | [`MonthView.tsx`](../../../src/features/tasks/MonthView.tsx) renders text labels (`1 urgent` on desktop, `1U` on mobile) without `<PriorityPlanet />` icons (`WeekView.tsx` renders both `<PriorityPlanet />` icons and text). | — |
| **Service & API Audit Defects (`C01`–`C12`, `C14`)** | Full reminder evaluation on task creation, clean `scheduledDate: null` unscheduling via `PATCH`, media file cleanup on task deletion, etc. | Logged with exact line numbers in [`docs/audit/BUG_INVENTORY.md`](../../../docs/audit/BUG_INVENTORY.md) (`C01` `createTask` skips `evaluateTaskNotifications`; `C04` `deleteTask` leaves orphan media files on disk; `C05` `PATCH` coerces `scheduledDate: null` via `?? existing.scheduledDate`; `C10` `drizzle.config.ts` DB filename mismatch). | [`OD-05`](../../../PROJECT_DESCRIPTION.md#od-05), [`docs/audit/BUG_INVENTORY.md`](../../../docs/audit/BUG_INVENTORY.md) |

---

## 5. Acceptance Criteria

1. **Shared Task State:** Creating, completing, editing, scheduling, or deleting a task in `/tasks/daily` or `/tasks/hub` persists to SQLite and reflects across both views without manual page reload.
2. **Celestial V2 Scoping:** `/tasks/daily` renders the dark Celestial V2 sky (`DailySky`), frosted glass dashboard, and ornamented cards, while `/tasks/hub` renders the light-lavender Workspace theme without dark V2 styles leaking across routes.
3. **Active-Board Day Carousel & 3.5-Card Scroller:** Day mode centers the active board (`Today` by default) with scaled/dimmed `Yesterday` and `Tomorrow` neighbor boards, supports arrow/drag/wheel/keyboard switching, clips lists of `>= 4` tasks to `3.5` measured cards, and provides an interactive constellation scrollbar.
4. **Week & Month Summaries + Drawers:** Week mode displays 7 day cards with circular progress, priority planet counts, and independent `due this day` counts; Month mode displays a 42-cell Monday-first calendar grid; clicking any day in either mode opens its inspection `Drawer`.
5. **Overdue Lane & Modal Transfer:** Incomplete tasks past their `deadline` (or past `scheduledDate` when `deadline === null`) appear in the Overdue lane and can be transferred via the modal `TransferDialog` to a valid future schedule and deadline.
6. **Notification Lifecycle:** `due_24h` (only when total duration `>= 24h`), `due_quarter` (final 25% of duration), and `overdue` notifications are deduplicated, replaced by a single `completed` notification when a task is marked done, and purged after 7 days.

---

## 6. Open Decisions and Supporting References

### 6.1 Open Decisions Touching Tasks Epic
All open decisions are maintained centrally in [`PROJECT_DESCRIPTION.md#8-open-decisions-register`](../../../PROJECT_DESCRIPTION.md#8-open-decisions-register):
- [`OD-01`](../../../PROJECT_DESCRIPTION.md#od-01): Daily Header `Observatory` Button vs. `Statistics` Drawer & Future Analytics Scope
- [`OD-02`](../../../PROJECT_DESCRIPTION.md#od-02): Dynamic vs. Curated `Cosmic forecast` Copy in Daily Task Management
- [`OD-03`](../../../PROJECT_DESCRIPTION.md#od-03): Day Arc Real-Time `HH:mm:ss` Clock & Midnight Countdown Implementation Alignment
- [`OD-04`](../../../PROJECT_DESCRIPTION.md#od-04): Sentence-Case Rule vs. CSS `all-small-caps` on `.eyebrow` Labels
- [`OD-05`](../../../PROJECT_DESCRIPTION.md#od-05): Remediation Priority & Behavioral Contracts for Confirmed Audit Defects (`C01`–`C14`)

### 6.2 Supporting References
- **Local V2 Asset Reference Index:** [`../../../sources/img/daily-v2-reference/README.md`](../../../sources/img/daily-v2-reference/README.md)
- **Owner Vision & Notes (Read-Only):** [`../../../md/user/user_desc.md`](../../../md/user/user_desc.md), [`../../../md/user/user_notes.md`](../../../md/user/user_notes.md)
- **Forensic Audit Reports (Read-Only):** [`../../../docs/audit/ARCHITECTURE_AUDIT.md`](../../../docs/audit/ARCHITECTURE_AUDIT.md), [`../../../docs/audit/BUG_INVENTORY.md`](../../../docs/audit/BUG_INVENTORY.md), [`../../../docs/audit/TECHNICAL_DEBT.md`](../../../docs/audit/TECHNICAL_DEBT.md), [`../../../docs/audit/STABILIZATION_PLAN.md`](../../../docs/audit/STABILIZATION_PLAN.md)
