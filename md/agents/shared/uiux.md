# Shared UI/UX & Design System Specification

`md/agents/shared/uiux.md` is the canonical specification for project-wide visual foundations, CSS design tokens, typography, motion, imagery, craft guardrails, responsive layout, accessibility, shared `src/ui/` components, the Cosmic Launch route transition, and the `WorkspaceShell` / `UniverseMenu` chrome.

- **Epic-specific UI/UX lives in the epic documents:**
  - Homepage 3D Earth journey, starfield, and feature collection gallery → [`../homepage/readme.md`](../homepage/readme.md)
  - Daily Task Management (Celestial Luxury V2 observatory), Tasks Hub, and Notification Center → [`../tasks/readme.md`](../tasks/readme.md)
- **Precedence Rule:** General cross-project visual rules live in this file. Epic-specific overrides live in the respective epic `readme.md` and **must** also be registered in [Section 12: Scoped Visual Exceptions](#12-scoped-visual-exceptions) so the shared baseline and epic specifications never silently contradict each other.

---

## Current approved rollout — 13 November 2026

The owner-approved [UI/UX plan](../../../plan.md) supersedes older palette snapshots and task-interaction examples below for its explicit scope. Preserve the existing soft-lavender Daily V2 implementation; do not restore the historical dark Daily colors described in older tables. Cosmic Launch remains unchanged, Homepage (`/`) incorporates the Epic 05 borderless intro, collection feedback, and rendering smoothness updates (preserving Earth, wordmark, and 13-destination identity), Epic 06 updates Daily/Hub transition smoothness within protected visual bounds (`DayArc` minute-boundary `translate3d`, settled-only neighbor blur, single-panel `DailyModeStage` + `useSyncExternalStore`, `DailySky` `8` HTML sparkles deferred via `useIsTransitioning()`, `DayTaskList` `translateY` thumb, and shared overlay/reduced-motion fixes; live Chromium re-verify of `#55`/`#56` follow-ups deferred to Epic 17 — see [`review/redesign/epic-06-daily-hub.md`](../../../.local/review/redesign/epic-06-daily-hub.md)), Epic 07 delivers the full-page `/tracking` "Herbal Tea Sanctuary" workspace with 5 curated botanical SVGs, compact `Dialog` forms, `--text-due-soon` star contrast, and `totalMinutes <= 0` ratio safety (production `next build` and live Chromium deferred to Epic 17 — see [`review/redesign/epic-07-tracking.md`](../../../.local/review/redesign/epic-07-tracking.md)), Epic 08 delivers the full-page `/ai-engineering` "Mist Trail" curriculum and Notion-synced reading shelf with 5 curated static SVGs, `--text-notif-completed` status contrast, and a cleaned `<Dialog>` Note Reader (build and live Chromium deferred to Epic 17 — see [`review/redesign/epic-08-ai-engineering.md`](../../../.local/review/redesign/epic-08-ai-engineering.md)), Epic 09 delivers the full-page `/apcs` "Winter Library" archive explorer with 5 curated static SVGs, `recentFiles` strip, fixed `.actionBtnPrimary:hover` and interactive border contrast, and a cleaned `<Dialog>` File Preview while preserving the APCS filesystem boundary (build and live Chromium deferred to Epic 17 — see [`review/redesign/epic-09-apcs.md`](../../../.local/review/redesign/epic-09-apcs.md)), Epic 10 delivers the full-page `/flashcards` "Vintage Reading Room" with 5 curated static SVGs, `Add card` in `LargeEditorDialog` + `editor-drafts.ts` (`formId: 'flashcard'`), and compact `New deck` `<Dialog>` while preserving Flashcards study and mastery logic (see [`review/redesign/epic-10-flashcards.md`](../../../.local/review/redesign/epic-10-flashcards.md)), Epic 11 delivers the full-page `/learning-room` "Bonsai Timer Sanctuary" with 5 curated static SVGs, `--text-due-soon` star contrast, non-blocking offline timer Retry, `Asia/Saigon` analytics dates, and compact `Session reflection` `<Dialog>` while preserving timer accounting (`PRESETS`, `Date.now()`/`deadline`, 5m break, `session-accounting.test.tsx`) (build and live Chromium deferred to Epic 17 — see [`review/redesign/epic-11-learning-room.md`](../../../.local/review/redesign/epic-11-learning-room.md)), Epic 12 delivers the full-page `/blogs` "Editorial Woodland Reading Room" with 5 curated static SVGs, fixed badge/heading AA contrast, semantic card triggers, `<ol>` + safe inline prose markdown, and `LargeEditorDialog` (`footerActions`) + `editor-drafts.ts` (`formId: 'blog-article'`) preserving both server `Save draft` (`status: 'draft'`) and local crash recovery (build and live Chromium deferred to Epic 17 — see [`review/redesign/epic-12-blogs.md`](../../../.local/review/redesign/epic-12-blogs.md)), Epic 13 delivers the full-page `/entertainment` "Continue Strip & Shelves" lounge with 5 curated static SVGs, resolved `#continue-heading`, `--text-due-soon` / `--text-notif-completed` AA contrast, preserved roving keyboard tabs, and compact `Add book to library` / `Add game` `<Dialog>` forms with scoped alerts and numeric clamping ([`review/redesign/epic-13-entertainment.md`](../../../.local/review/redesign/epic-13-entertainment.md)), and Epic 14 delivers the full-page `/projects` "Eastern Strategy Workspace" with 5 curated static SVGs, `--project-control-border` >= 3:1 control/border contrast, `-5%`/`+5%` guarded progress steppers, `scaleX` reduced-motion progress bar, `ConfirmDialog` delete, and unified `LargeEditorDialog` + `LargeEditorTwoColumn` + `localStorage` draft lifecycle preserving linked IDs ([`review/redesign/epic-14-projects.md`](../../../.local/review/redesign/epic-14-projects.md)), and Epic 15 delivers the full-page `/milestones` "Yearbook of Ambitions" with 5 curated static SVGs, `--milestone-control-border` >= 3:1 control/border contrast, inline `<Checkbox>` landmark toggles with card-scoped alerts, quick status `<select>`, `ConfirmDialog` delete, and unified `LargeEditorDialog` + `LargeEditorTwoColumn` + `localStorage` draft lifecycle preserving landmark IDs and completion ([`review/redesign/epic-15-milestones.md`](../../../.local/review/redesign/epic-15-milestones.md)), and Epic 16 delivers the full-page `/achievements` "Roman Marble Gallery" with 5 curated static SVGs, all 6 era filter radio chips (restoring `Elementary` + roving keyboard nav), `--ach-control-border` >= 3:1 control/border contrast, `featured` badge/toggle, timezone-safe `future_contest` strip, `<ConfirmDialog>` delete, and unified `LargeEditorDialog` + `LargeEditorTwoColumn` + `localStorage` draft lifecycle (`formId: 'achievement'`, `recordUpdatedAt: null`) wiring both `useCreateAchievement` and `useUpdateAchievement` (build, unsandboxed `apcs-boundary.test.ts`, and live Chromium deferred to Epic 17 — see [`review/redesign/epic-16-achievements.md`](../../../.local/review/redesign/epic-16-achievements.md)), and Epic 17 completes post-polish duplicate `+ ` button label removal (`Add card`, `New deck`, `Add book`, `Add game`, `Add record`), cross-feature static guardrails (`0` unsafe SVGs across `72` files in `14` folders), combined `65/65` Vitest (`299/299` tests), `npm run build` (`38/38` static pages), and live headless Chromium production verification across `/`, `/tasks/daily`, `/tasks/hub`, and all `12` full-page themes (see [`review/redesign/epic-17-cross-feature-verification.md`](../../../.local/review/redesign/epic-17-cross-feature-verification.md)).

The actual root baseline in `tokens.css` is `--ws-bg: #f0eff8`, `--ws-surface: #ffffff`, `--ws-text: #29263b`, `--ws-text-muted: #777387`, `--ws-accent: #a99aef`, `--ws-accent-soft: #dcd5f1`, and `--ws-border: #e9e5f2`. The rollout adds feature-scoped palettes without changing those defaults. Each `[data-feature-theme]` defines canvas, ink, muted text, accent, and soft surface centrally. `FeatureTheme` scopes page content; React context carries the same identity into owned portaled dialogs, drawers, and popovers. Shared navigation stays outside that scope. Notifications explicitly select their sakura palette on every route.

Reuse existing Cormorant Garamond/Inter typography, spacing, controls, status colors, and motion utilities. Body copy and controls use the existing UI sans-serif. Desktop header accents and empty-state illustrations come from the selected runtime SVG pairs in `public/visuals/<feature>/`; decorative header accents are hidden below 768px to prioritize controls and reading space. Supplemental Homepage/Daily assets remain unintegrated.

Daily now displays `HH:MM` without a textual countdown, offers neighboring-panel selection plus a mobile day selector, and preserves the measured 3.5-card viewport with a natural list end. Hub uses deterministic six-family portrait notes and a complete task-detail dialog. Task-success toasts last 1,000ms; errors persist. See [review.md](../../../review.md) for actual verification and outstanding visual acceptance.

## 1. Identity, Themes & Precedence

Hiep Trong Space is structured around two foundational visual worlds plus one scoped dark workspace theme:

| Surface / Theme | Routes | Emotional Character | Primary Palette Family |
| :--- | :--- | :--- | :--- |
| **1. The Cosmos** | `/` (Homepage & Cosmic Launch transition) | Deep space, orbital calm, museum-grade editorial restraint | `--cosmos-*` & `--journey-*` (`#0B0A14` to `#050508`, `#F4F2FA` text, `#9B8CFF` / `#FFD27A` accents) |
| **2. The Workspace (Light Lavender Default)** | `/tasks/hub`, `/events`, `/ai-engineering`, `/blogs`, `/apcs`, `/flashcards`, `/entertainment`, `/tracking`, `/projects`, `/milestones`, `/learning-room`, `/achievements` | Crisp daylight clarity, calm paper-and-lavender workspace | `--ws-*` (`#F7F5FC` canvas, `#FFFFFF` cards, `#1A162B` ink, `#6E56CF` accent) |
| **3. Daily Observatory (Celestial Luxury V2 Exception)** | `/tasks/daily` | Contemplative midnight observatory, frosted glass, golden horizon arc, constellation lines | `--daily-*` (`#0D0C1D` to `#1B1638` gradient sky, `#F0A500` amber gold, `#D4AF37` metallic gold) — see [Section 12](#12-scoped-visual-exceptions) and [`../tasks/readme.md`](../tasks/readme.md) |

---

## 2. Design Tokens (`src/design/tokens.css`)

All colors, typography scales, spacing steps, radii, shadows, z-layers, and motion curves are defined in [`src/design/tokens.css`](../../../src/design/tokens.css). **Raw `#hex`, `rgb()`, `rgba()`, `hsl()`, or `hsla()` literals are forbidden inside `src/ui/` and `src/features/`** (enforced by [`tests/design/tokens-guardrail.test.ts`](../../../tests/design/tokens-guardrail.test.ts), with documented inline SVG/WebGL exceptions noted in [Section 6](#6-craft-rules--automated-guardrails)).

### 2.1 Color Palette Tokens

#### Cosmos Theme (`--cosmos-*` & `--journey-*`)
| Token | Value | Role |
| :--- | :--- | :--- |
| `--cosmos-bg` | `#0B0A14` | Primary deep-space background |
| `--cosmos-bg-elevated` | `#131124` | Elevated dark card / modal surface |
| `--cosmos-surface` | `rgba(26, 23, 48, 0.72)` | Translucent dark glass surface |
| `--cosmos-border` | `rgba(182, 168, 255, 0.16)` | Hairline border in dark cosmos views |
| `--cosmos-text` | `#F4F2FA` | Primary high-contrast cosmic text |
| `--cosmos-text-muted` | `#A59EC2` | Secondary cosmic copy and captions |
| `--cosmos-accent` | `#9B8CFF` | Soft violet interactive accent |
| `--cosmos-star` | `#FFD27A` | Warm starlight gold |
| `--journey-flare-light` | `#FFFDF8` | Warm white light-flare highlight |
| `--journey-space-black` | `#050508` | Deepest outer-space black |
| `--journey-flare-gold` | `rgba(255, 210, 122, 0.35)` | Atmospheric golden rim glow |

#### Workspace Theme (`--ws-*`)
| Token | Value | Role |
| :--- | :--- | :--- |
| `--ws-bg` | `#F7F5FC` | Default light-lavender workspace canvas |
| `--ws-bg-alt` | `#EFEBF9` | Secondary lavender surface / hover / muted pill |
| `--ws-surface` | `#FFFFFF` | Primary card, input, drawer, and popover surface |
| `--ws-border` | `#E3DDF2` | Standard `1px` structural border |
| `--ws-border-strong` | `#C9BFE6` | Emphasized border on hover/active controls |
| `--ws-text` | `#1A162B` | Primary deep-violet ink |
| `--ws-text-muted` | `#5E5678` | Secondary body copy and metadata |
| `--ws-text-subtle` | `#746B90` | Tertiary hints and placeholders (tuned for WCAG AA contrast) |
| `--ws-accent` | `#6E56CF` | Primary interactive violet accent |
| `--ws-accent-hover` | `#5B43BC` | Hover state for primary violet actions |
| `--ws-accent-soft` | `#EDE8FA` | Selected chip / subtle badge fill |

#### Daily Task Management Celestial V2 Theme (`--daily-*`)
| Token | Value | Role |
| :--- | :--- | :--- |
| `--daily-sky-start` / `--daily-sky-end` | `#0D0C1D` / `#1B1638` | Midnight navy to deep twilight violet background gradient |
| `--daily-accent` / `--daily-accent-hover` | `#F0A500` / `#FFB81C` | Warm amber gold primary CTA and active glow |
| `--daily-heading-accent` | `#D4AF37` | Metallic antique gold for ornamental lines and accents |
| `--daily-card` / `--daily-card-line` | `rgba(255, 255, 255, 0.06)` / `rgba(255, 255, 255, 0.12)` | Frosted glass panel fill and `1px` border |
| `--daily-arc-line` / `--daily-pill` | `rgba(255, 255, 255, 0.14)` / `rgba(255, 255, 255, 0.09)` | Horizon arc guide and translucent pill fill |
| `--daily-planet` / `--daily-shooting-star` | `#8F7AE5` / `#FFE49E` | Celestial SVG accents |
| `--daily-priority-urgent` / `-normal` / `-optional` | `#E85D04` / `#E07A5F` / `#D4AF37` | Warm solar priority palette for Daily V2 |
| `--daily-planet-core` / `-gold` / `-coral` / `-sky` / `-emerald` / `-violet` | `#FFFDF9` / `#F0A500` / `#E85D75` / `#38BDF8` / `#34D399` / `#9B8CFF` | Planet glyph fills in Daily V2 |

#### Semantic Status Tokens (`--status-*`)
| Token | Value | Role |
| :--- | :--- | :--- |
| `--status-urgent` / `--status-urgent-soft` | `#D9385A` / `#FCE8EC` | Urgent priority, overdue indicator, and destructive actions |
| `--status-normal` / `--status-normal-soft` | `#6E56CF` / `#EDE8FA` | Normal priority and due-soon badge |
| `--status-optional` / `--status-optional-soft` | `#2E7D6B` / `#E4F3EF` | Optional priority |
| `--status-done` / `--status-done-soft` | `#2E8555` / `#E5F4EC` | Completed state |
| `--status-warn` / `--status-warn-soft` | `#C87A19` / `#FDF1E1` | Warning / approaching deadline |
| `--tint-highlight-bg` / `--tint-highlight-border` / `--tint-highlight-border-hover` | `color-mix` of `--status-due-soon` (`#D7A45D`) at 14% / 45% / 75% | Events Highlights cards (v3.3 soft gold); derived, no new colour |

### 2.2 Spacing, Radii, Shadows & Z-Index Scales

- **8-Point Spacing Scale:** `--space-1` (`4px`), `--space-2` (`8px`), `--space-3` (`12px`), `--space-4` (`16px`), `--space-5` (`24px`), `--space-6` (`32px`), `--space-7` (`48px`), `--space-8` (`64px`), `--space-9` (`96px`).
- **Border Radii:** `--radius-sm` (`6px`), `--radius-md` (`10px`), `--radius-lg` (`16px`), `--radius-xl` (`24px`), `--radius-full` (`9999px`).
- **Shadows:** `--shadow-sm` (`0 1px 2px rgba(26, 22, 43, 0.05)`), `--shadow-md` (`0 6px 20px rgba(26, 22, 43, 0.08)`), `--shadow-lg` (`0 18px 48px rgba(26, 22, 43, 0.14)`), `--shadow-cosmos` (`0 20px 60px rgba(0, 0, 0, 0.55)`).
- **Z-Layers:** `--z-base` (`1`), `--z-sticky` (`20`), `--z-popover` (`40`), `--z-drawer` (`60`), `--z-modal` (`80`), `--z-toast` (`90`), `--z-cosmic-launch` (`100`).

---

## 3. Typography

### 3.1 Font Families & Offline-Safe Fallbacks (`src/design/fonts.ts`)

[`src/design/fonts.ts`](../../../src/design/fonts.ts) loads two font families via `next/font/google` and binds their CSS variables on `<html>` in [`src/app/layout.tsx`](../../../src/app/layout.tsx):

1. **Display Serif (`--font-display`):** `Cormorant_Garamond` (weights `500`, `600`; styles `normal`, `italic`) with fallback stack `var(--font-cormorant), 'Cormorant Garamond', Georgia, serif`. Used for page titles, editorial headings, and large display numerals.
2. **UI & Body Sans (`--font-sans`):** `Inter` (weights `400`, `500`, `600`) with fallback stack `var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif`. Used for body text, controls, inputs, badges, and tabular numerals.

> **Compilation vs. Runtime Font Delivery:** `next/font/google` downloads and self-hosts font assets at build time when internet access is available; in restricted/offline environments, the CSS fallback stacks (`Georgia, serif` and `system-ui, sans-serif`) preserve layout metrics cleanly. Note that `Forum` was retired and removed from `src/design/fonts.ts`; only `Cormorant Garamond` and `Inter` are active.

### 3.2 Typographic Scale

| Token | Value | Typical Usage |
| :--- | :--- | :--- |
| `--text-hero` | `clamp(2.75rem, 6vw, 5.25rem)` | Hero display headlines |
| `--text-2xl` | `clamp(1.75rem, 2.6vw, 2.375rem)` | Workspace page titles (`Task Management`, `Tasks Hub`) |
| `--text-xl` | `1.375rem` (`22px`) | Section headings (`My collection`, `Overdue`, Drawer titles) |
| `--text-lg` | `1.125rem` (`18px`) | Card titles, prominent controls |
| `--text-md` | `1rem` (`16px`) | Primary body copy, task titles, form inputs |
| `--text-sm` | `0.875rem` (`14px`) | Secondary metadata, buttons, segmented controls |
| `--text-xs` | `0.75rem` (`12px`) | Badges, chips, timestamps, helper text |

### 3.3 Casing & Numeral Rules

1. **Sentence-Case Mandate:** All workspace headings, section labels, buttons, badges, and navigation items must use **sentence case** (e.g., `Cosmic forecast`, `Progress`, `Day arc`, `My collection`, `Schedule today`).
2. **No `text-transform: uppercase`:** CSS `text-transform: uppercase` is banned across `src/` by [`tests/design/craft-and-architecture-guardrails.test.ts`](../../../tests/design/craft-and-architecture-guardrails.test.ts).
3. **Scoped all-caps exception (owner, 19 Nov 2026):** the Daily dashboard label `ACTIVE TASK` is written as literal capitals (not via CSS `uppercase`) at the same size and colour as the other dashboard eyebrows.
4. **Sole All-Caps Exception:** Only the homepage `HIEP TRONG` brand wordmark (rendered via vector asset [`public/brand/wordmark.svg`](../../../public/brand/wordmark.svg)) uses all-caps lettering. *(See also [`OD-04`](../../../docs/engineering/PROJECT_DESCRIPTION.md#od-04) regarding `font-variant-caps: all-small-caps` on `.eyebrow` in Daily V2.)*
5. **Tabular Numerals & No Monospace:** All dates, clocks (`HH:mm:ss`), percentages, and counters use `--font-sans` (`Inter`) with `font-variant-numeric: tabular-nums`. Monospace fonts are never used in user-facing UI.

---

## 4. Motion System (`src/design/motion.ts`)

### 4.1 Durations & Easing Curves

Defined in [`src/design/tokens.css`](../../../src/design/tokens.css) and exported from [`src/design/motion.ts`](../../../src/design/motion.ts):

- **Easing Curves:**
  - `--ease-out`: `cubic-bezier(0.22, 1, 0.36, 1)` — default entrance and state transition curve
  - `--ease-in-out`: `cubic-bezier(0.65, 0, 0.35, 1)` — symmetric morphs and view switches
  - `--ease-cosmic`: `cubic-bezier(0.16, 1, 0.3, 1)` — expressive spatial motion (drawers, carousels, launch)
- **Durations:**
  - `--duration-fast`: `140ms` (hover, focus, checkbox press)
  - `--duration-base`: `220ms` (popovers, chips, subtle fades)
  - `--duration-slow`: `380ms` (drawers, dialogs, carousel slide)
  - `--duration-cosmic`: `3000ms` (standard 4-phase Cosmic Launch route transition; capped at `<= 300ms` under `prefers-reduced-motion: reduce`)

### 4.2 Allowed vs. Forbidden Motion

- **Allowed:** `transform` (`translate3d`, `scale`, `rotate`), `opacity`, `background-color`, `border-color`, `color`, `box-shadow`, SVG `stroke-dashoffset`, and `requestAnimationFrame` canvas/WebGL loops that pause on `document.hidden`.
- **Forbidden:** `transition: all`, bouncy/overshooting spring physics on productivity controls, layout-thrashing animations (`top`, `left`, `width`, `height`), and continuous animations that ignore `prefers-reduced-motion: reduce`.
- **Working-page Card Hover (owner-approved, 12 Nov 2026):** Keep card position stable on hover; use restrained border/surface/shadow changes for interactive cards. Noninteractive summary, achievement, book, and milestone containers do not imply whole-card clickability. Homepage compositor choreography (with stationary-bounds per-feature `--card-accent` `FeatureCard` feedback) and Daily carousel inactive-panel blur are preserved; the latter is not a hover effect.

### 4.3 Global Scroll & Viewport Policies (`src/app/globals.css`)

In [`src/app/globals.css`](../../../src/app/globals.css):
1. **Overscroll Containment (`overscroll-behavior-y: none`):** Applied on `html` (line 80) intentionally so trackpad/touch momentum at the top or bottom of the viewport never causes rubber-band bounce that disrupts the homepage 3D scroll journey or fixed workspace overlays.
2. **Hidden Native Scrollbars:** `* { scrollbar-width: none; -ms-overflow-style: none; }` and `*::-webkit-scrollbar { display: none; }` (lines 92–98) hide browser-default scrollbars globally while preserving native wheel, trackpad, touch, and keyboard scrolling. Where explicit scroll position feedback is needed (such as the Daily Task Management day board), a custom accessible scrollbar is rendered (`role="scrollbar"` in [`DayTaskList.tsx`](../../../src/features/tasks/DayTaskList.tsx)).

---

## 5. Imagery, Icons & Local Reference Media

### 5.1 Iconography
- **Primary Icon Set:** `lucide-react` rendered at `1.5px` stroke width, sized `16px`–`20px`, with `aria-hidden="true"` when accompanied by visible text or `aria-label` on icon-only buttons (`IconButton`).
- **Brand Glyph ([`StarIcon.tsx`](../../../src/ui/StarIcon.tsx)):** Custom 4-point celestial star SVG used in the Universe button, section ornaments, and Cosmic Launch center flare.
- **Feature Thumbnail Presets ([`FeatureThumbnail.tsx`](../../../src/features/home/feature-collection/FeatureThumbnail.tsx)):** 13 bespoke vector SVG illustrations (`constellation-arc`, `dual-orbit`, `meridian-grid`, `neural-lattice`, `manuscript-lines`, `academic-compass`, `paired-cards`, `harmonic-waves`, `pulse-timeline`, `blueprint-vectors`, `summit-trajectory`, `focus-aperture`, `zenith-crown`) rendered inside homepage `FeatureCard` headers.

### 5.2 Runtime Assets vs. Local-Only Reference Media
- **Committed Runtime Assets (`public/`):**
  - [`public/brand/wordmark.svg`](../../../public/brand/wordmark.svg): Vector `HIEP TRONG` wordmark (`1200x430`).
  - [`public/earth/`](../../../public/earth/): NASA Visible Earth / Solar System Scope WebP textures (`earth-day-2k.webp`, `earth-day-4k.webp`, `earth-night-2k.webp`, `earth-night-4k.webp`, `earth-clouds-2k.webp`, `earth-clouds-4k.webp`), WebP posters (`earth-poster-4k.webp`, `earth-poster-2k.webp`), and license attribution ([`public/earth/ATTRIBUTION.md`](../../../public/earth/ATTRIBUTION.md)).
  - [`public/visuals/daily-v2/`](../../../public/visuals/daily-v2/): 10 Celestial V2 decorative SVGs (`card-celestial-corner.svg`, `celestial-scroll-thumb.svg`, `constellation-sprinkles.svg`, `day-arc-decoration.svg`, `eclipse-broken-orbit.svg`, `moon-phase-divider.svg`, `nebula-clouds.svg`, `orbiting-moon.svg`, `ringed-planet.svg`, `spiral-galaxy.svg`).
  - [`public/visuals/ai-engineering/`](../../../public/visuals/ai-engineering/): 5 curated Mist Trail decorative SVGs (`mist-layered-ridges.svg`, `misty-footbridge.svg`, `ridge-trail-edge.svg`, `trail-cairn.svg`, `valley-river-contours.svg`; `FeatureTheme.tsx` maps `ai-engineering` to `['mist-layered-ridges', 'trail-cairn']`). On `/ai-engineering`, `mist-layered-ridges.svg` accents the masthead top-right (`>= 768px` only, left-fade mask), `ridge-trail-edge.svg` pins softly in the outer left margin (`>= 1280px` only), `misty-footbridge.svg` ornaments the Trailhead Priority folio (`>= 640px` only), `valley-river-contours.svg` separates the Engineering roadmap from Local notes & research, and `trail-cairn.svg` anchors `FeatureEmptyState`; all render with `alt=""`, `aria-hidden="true"`, `pointer-events: none`, and `user-select: none`.
  - [`public/visuals/apcs-hub/`](../../../public/visuals/apcs-hub/): 5 curated Winter Library decorative SVGs (`aurora-silk.svg`, `frost-fern.svg`, `glacier-shelf.svg`, `ice-window-frame.svg`, `snow-fox-rest.svg`; `FeatureTheme.tsx` maps `apcs-hub` to `['glacier-shelf', 'snow-fox-rest']`). On `/apcs`, `glacier-shelf.svg` accents the masthead top-right (`>= 768px` only, left-fade mask), `aurora-silk.svg` forms the centered horizontal divider between courses / recent materials and the explorer, `ice-window-frame.svg` (`>= 768px`) and `frost-fern.svg` (`>= 1024px`) ornament the Study materials explorer corners below interactive controls, and `snow-fox-rest.svg` illustrates `<EmptyState />`; all render with `alt=""`, `aria-hidden="true"`, `pointer-events: none`, `unoptimized`, and `user-select: none`.
  - [`public/visuals/blogs-hub/`](../../../public/visuals/blogs-hub/): 5 curated Editorial Woodland Reading Room decorative SVGs (`cabin-lantern.svg`, `falling-maple-pair.svg`, `timber-grain-rule.svg`, `woodland-cabin.svg`, `woodland-typewriter.svg`; `FeatureTheme.tsx` maps `blogs-hub` to `['woodland-cabin', 'cabin-lantern']`). On `/blogs`, `woodland-cabin.svg` accents the overview masthead right column (`>= 768px` only), `timber-grain-rule.svg` divides controls from the essay shelf and separates `Sources & references` in Reader Mode, `falling-maple-pair.svg` ornaments the Reader Mode sheet top-right (`>= 768px`), `woodland-typewriter.svg` ornaments the `LargeEditorTwoColumn` metadata rail (`>= 900px`), and `cabin-lantern.svg` illustrates `<EmptyState />`; all render with `alt=""`, `aria-hidden="true"`, `pointer-events: none`, `unoptimized`, and `user-select: none`.
  - [`public/visuals/entertainment-hub/`](../../../public/visuals/entertainment-hub/): 5 curated Entertainment Lounge decorative SVGs (`dream-city-horizon.svg`, `dream-console.svg`, `floating-headphones.svg`, `pixel-waterfall-edge.svg`, `ribbon-signal.svg`; `FeatureTheme.tsx` maps `entertainment-hub` to `['dream-city-horizon', 'dream-console']`). On `/entertainment`, `dream-city-horizon.svg` accents the masthead top-right (`>= 768px` only, left-fade mask), `pixel-waterfall-edge.svg` pins softly in the outer left margin (`>= 1280px` only), `ribbon-signal.svg` divides Continue enjoying from the media tabs, `dream-console.svg` illustrates Books/Games `<EmptyState compact />`, and `floating-headphones.svg` illustrates the Music shelf empty state; all render with `alt=""`, `aria-hidden="true"`, `pointer-events: none`, `unoptimized`, and `user-select: none`.
  - [`public/visuals/annual-milestones/`](../../../public/visuals/annual-milestones/): 5 curated Yearbook of Ambitions decorative SVGs (`celebration-streamer.svg`, `champions-cup.svg`, `hall-of-golden-years.svg`, `honor-ribbon.svg`, `victory-pennant-edge.svg`; `FeatureTheme.tsx` maps `annual-milestones` to `['hall-of-golden-years', 'champions-cup']`). On `/milestones`, `hall-of-golden-years.svg` accents the masthead top-right (`>= 768px` only, left-fade mask), `victory-pennant-edge.svg` pins softly in the outer left margin (`>= 1280px` only), `celebration-streamer.svg` divides the folio list from the colophon, `honor-ribbon.svg` ornaments the footer colophon, and `champions-cup.svg` illustrates `<EmptyState />`; all render with `alt=""`, `aria-hidden="true"`, `pointer-events: none`, `loading="eager"`, `unoptimized`, and `user-select: none`.
  - [`public/visuals/events/`](../../../public/visuals/events/): 5 owner-approved Events Aquatic Agenda decorative SVGs (`coral-garden.svg`, `hermit-shell-haven.svg`, `kelp-ribbon-edge.svg`, `manta-in-the-current.svg`, `tidal-lace.svg`). `FeatureTheme.tsx` maps `events` to `['manta-in-the-current', 'hermit-shell-haven']`.
  - [`public/visuals/flashcards/`](../../../public/visuals/flashcards/): 5 curated Vintage Reading Room decorative SVGs (`bookmark-ribbon-edge.svg`, `library-arched-window.svg`, `quill-and-bookmark.svg`, `reading-corner.svg`, `shelf-of-stories.svg`; `FeatureTheme.tsx` maps `flashcards` to `['library-arched-window', 'reading-corner']`). On `/flashcards`, `library-arched-window.svg` accents the masthead right column (`>= 768px` only, hidden during active study), `shelf-of-stories.svg` divides stats from Vocabulary decks (hidden during active study), `bookmark-ribbon-edge.svg` pins softly at the outer right margin (`>= 1024px`, hidden during active study), `quill-and-bookmark.svg` ornaments `.flashcardFrame` during study (`>= 640px`), and `reading-corner.svg` illustrates `.emptyLibrary`; all render with `alt=""`, `aria-hidden="true"`, `pointer-events: none`, `unoptimized`, and `user-select: none`.
  - [`public/visuals/learning-room/`](../../../public/visuals/learning-room/): 5 curated Bonsai Timer Sanctuary decorative SVGs (`bamboo-interval.svg`, `bamboo-screen-edge.svg`, `bonsai-on-a-stone.svg`, `enso-and-pebble.svg`, `meditation-cushion.svg`; `FeatureTheme.tsx` maps `learning-room` to `['bonsai-on-a-stone', 'meditation-cushion']`). On `/learning-room`, `bonsai-on-a-stone.svg` accents the masthead top-right (`>= 768px` only, left-fade mask, hidden in quiet view), `bamboo-screen-edge.svg` pins softly in the outer left margin (`>= 1280px` only), `enso-and-pebble.svg` forms the watermark halo behind the circular timer ring, `bamboo-interval.svg` separates the timer sanctuary from analytics (hidden in quiet view), and `meditation-cushion.svg` illustrates `<EmptyState compact />`; all render with `alt=""`, `aria-hidden="true"`, `pointer-events: none`, `unoptimized`, and `user-select: none`.
  - [`public/visuals/notification/`](../../../public/visuals/notification/): 5 owner-approved Sakura Notification Center decorative SVGs (`blossom-thread.svg`, `blossom-vine-edge.svg`, `fairy-glass-chime.svg`, `sakura-branch.svg`, `sakura-petal-current.svg`). `sakura-branch.svg` is shared by `NotificationPopover.tsx` and the `/notifications` summary card; `blossom-vine-edge.svg`, `sakura-petal-current.svg`, `blossom-thread.svg` (first date-section divider or single-group shoreline), and `fairy-glass-chime.svg` frame the `/notifications` layout and global/filtered empty states.
  - [`public/visuals/personal-achievements/`](../../../public/visuals/personal-achievements/): 5 curated Roman Marble Gallery decorative SVGs (`acanthus-column-edge.svg`, `ceremonial-marble-plinth.svg`, `laurel-spray.svg`, `marble-arcade.svg`, `roman-mosaic-band.svg`; `FeatureTheme.tsx` maps `personal-achievements` to `['marble-arcade', 'ceremonial-marble-plinth']`). On `/achievements`, `marble-arcade.svg` accents the masthead top-right (`>= 768px` only, left-fade mask), `acanthus-column-edge.svg` pins softly in the outer left margin (`>= 1280px` only), `roman-mosaic-band.svg` divides the controls bar from the gallery grid/empty state, `laurel-spray.svg` ornaments the footer colophon, and `ceremonial-marble-plinth.svg` illustrates `<EmptyState />`; all render with `alt=""`, `aria-hidden="true"`, `pointer-events: none`, `loading="eager"`, `unoptimized`, and `user-select: none`.
  - [`public/visuals/project/`](../../../public/visuals/project/): 5 curated Eastern Strategy Workspace decorative SVGs (`auspicious-cloud-pillar.svg`, `auspicious-cloud-scroll.svg`, `dragon-over-the-ridge.svg`, `jade-knot-talisman.svg`, `wooden-training-dummy.svg`; `FeatureTheme.tsx` maps `project` to `['dragon-over-the-ridge', 'wooden-training-dummy']`). On `/projects`, `dragon-over-the-ridge.svg` accents the masthead top-right (`>= 768px` only, left-fade mask), `auspicious-cloud-pillar.svg` pins softly in the outer left margin (`>= 1280px` only), `auspicious-cloud-scroll.svg` divides the status filter bar from the projects grid/empty state, `wooden-training-dummy.svg` illustrates `<EmptyState />`, and `jade-knot-talisman.svg` accents the bottom-right metadata column inside `LargeEditorDialog` (`>= 900px` only); all render with `alt=""`, `aria-hidden="true"`, `pointer-events: none`, `loading="eager"`, `unoptimized`, and `user-select: none`.
  - [`public/visuals/tracking/`](../../../public/visuals/tracking/): 5 curated Herbal Tea Sanctuary decorative SVGs (`climbing-thyme-edge.svg`, `garden-watering-can.svg`, `herbal-tea-ritual.svg`, `mint-herbarium.svg`, `tea-steam-rule.svg`; `FeatureTheme.tsx` maps `tracking` to `['herbal-tea-ritual', 'garden-watering-can']`). On `/tracking`, `herbal-tea-ritual.svg` accents the masthead top-right (`>= 768px` only, left-fade mask), `climbing-thyme-edge.svg` pins softly in the outer left margin (`>= 1280px` only), `tea-steam-rule.svg` divides Sleep tracking from Screen time balance, `mint-herbarium.svg` sits at the bottom-right footer corner, and `garden-watering-can.svg` illustrates the Habits empty state; all render with `alt=""`, `aria-hidden="true"`, `pointer-events: none`, and `user-select: none`.
- **Local-Only Reference & Review Directories (`sources/` and `review/`):**
  - Both `sources/` and `review/` are ignored by `.gitignore` and exist on the local development machine as design inspiration and Phase 01 visual review evidence.
  - Because `sources/` is gitignored, canonical documentation in `md/` describes all visual requirements in self-contained prose so contributors never depend on gitignored binaries to understand a requirement.

---

## 6. Craft Rules & Automated Guardrails

Two automated test suites in `tests/design/` enforce design-system integrity:

1. **Token Purity ([`tests/design/tokens-guardrail.test.ts`](../../../tests/design/tokens-guardrail.test.ts)):**
   - Scans every `.ts`, `.tsx`, and `.css` file under `src/` to ensure zero raw `#hex`, `rgb()`, `rgba()`, `hsl()`, or `hsla()` literals appear outside [`src/design/tokens.css`](../../../src/design/tokens.css), and checks static `var(--...)` references and Tailwind color tokens cleanly (zero raw CSS color literal allowlist remains: `StarfieldEngine` resolves `--cosmos-star-*` via `getComputedStyle`, `FeatureThumbnail` uses CSS tokens/`color-mix()`, and `earth-scene.ts` uses normalized GLSL `vec3` uniforms).
2. **Craft & Architecture Guardrails ([`tests/design/craft-and-architecture-guardrails.test.ts`](../../../tests/design/craft-and-architecture-guardrails.test.ts)):**
   - Forbids `transition: all` across `src/`.
   - Forbids `text-transform: uppercase` across `src/`. *(Note: line 23 of the test still checks `rel !== 'src/features/home/Wordmark.tsx'` from before `Wordmark.tsx` was replaced by `/brand/wordmark.svg`; see [`OD-04`](../../../docs/engineering/PROJECT_DESCRIPTION.md#od-04)).*
   - Enforces strict layer imports (`src/domain` and `src/contracts` cannot import React/server/services; `src/features` and `src/ui` cannot import `src/services`, `src/server`, or `better-sqlite3`).

---

## 7. Responsive System

### 7.1 Viewport Breakpoints

| Tier | Width Range | Layout & Density Adjustments |
| :--- | :--- | :--- |
| **Mobile (`base` / `sm`)** | `< 768px` | Single-column stacks, full-width sheets/drawers, compact topbar (`Universe` + icon actions), `16px` (`--space-4`) horizontal padding, `44x44px` minimum touch targets. |
| **Tablet (`md`)** | `768px – 1023px` | 2-column feature grid on homepage (when Vertical mode active or narrow screen), collapsible filter bars, `24px` (`--space-5`) padding. |
| **Desktop (`lg` / `xl`)** | `1024px – 1439px` | Full 3-column Daily Dashboard, centered active-board DayCarousel with flanking Yesterday/Tomorrow preview boards, 7-column Week/Month grids, `32px` (`--space-6`) padding. |
| **Wide (`2xl`)** | `>= 1440px` | Contained max-width (`1320px`–`1440px`) centered in viewport with generous breathing room. |

---

## 8. Accessibility Baseline

1. **Semantic Landmarks:** Every route provides a keyboard skip link (`Skip to content` targeting `#main-content`), a `<header>` landmark (in workspace routes), and a `<main id="main-content">` landmark.
2. **Immediate Focus Indicators (Confirmed requirement, v3.1 — supersedes the earlier ring styling):** Form controls (text inputs, textareas, selects, contenteditable rich-text, checkbox/radio/switch roles, date/time segments, search rows, and rich-text toolbar buttons marked `data-focus-tint`) show **no** focus ring, outline, border-colour change, or focus shadow. Instead they receive an immediate theme-derived background tint (`--focus-tint`, from `--ws-focus-tint` / `--cosmos-focus-tint`); selected controls use the stronger `--focus-tint-selected` so focus stays distinguishable from selection. Composite fields mark their wrapper with `data-focus-field` and tint as one surface. Static borders, invalid styling, and selection states are unchanged. Buttons, links, and other interactive elements keep the outline treatment. Non-interactive programmatic focus targets (`main#main-content`, route-arrival headings, dialog containers with `tabindex="-1"`) keep semantic focus but draw no frame — this removes the full-page frame that appeared after Win + Shift + S and window refocus (img35). Rules live in `src/app/globals.css`; tokens in `src/design/tokens.css`.
3. **Stacked Modal Focus Trapping ([`src/ui/use-focus-trap.ts`](../../../src/ui/use-focus-trap.ts)):**
   - Supports nested overlays (e.g., opening a `Dialog` or `TransferDialog` on top of a `Drawer`) via a module-level `activeTrapStack`.
   - Only the topmost trap intercepts `Tab`, `Shift+Tab`, and `Escape`.
   - Calls `.focus({ preventScroll: true })` on both initial focus acquisition and cleanup focus restoration so opening or dismissing modals/drawers never scrolls the viewport or nudges sliding surfaces.
4. **Non-Color Status Encoding:** Priority and urgency are never communicated by color alone — they pair color tokens with distinct shapes/icons (`PriorityBadge` / `PriorityPlanet`) and text badges (`Urgent`, `Overdue`, `Due soon`).
5. **Global Keyboard Shortcuts:**
   - `Ctrl+K` / `Cmd+K`: Toggle `UniverseMenu` in any workspace route.
   - `Escape`: Close the topmost active `Dialog`, `Drawer`, `Popover`, or `UniverseMenu`.
   - `UniverseMenu` destinations are real anchors (`TransitionLink`, v3.2): plain click navigates with the route transition; Ctrl/Cmd/Shift/middle-click and `Ctrl/Cmd+Enter` in the search box open a new tab.
   - `ArrowLeft` / `ArrowRight`: Rotate the 3D Earth on `/` or switch active days in `/tasks/daily` `DayCarousel`.

---

## 9. Shared UI Components (`src/ui/`)

All reusable primitives live in [`src/ui/`](../../../src/ui/):

| Component | Path | Variants & Behavior |
| :--- | :--- | :--- |
| **`Button`** | [`src/ui/Button.tsx`](../../../src/ui/Button.tsx) | Variants: `primary`, `secondary`, `ghost`, `danger`, `cosmos`. Sizes: `sm`, `md`, `lg`. |
| **`IconButton`** | [`src/ui/IconButton.tsx`](../../../src/ui/IconButton.tsx) | Accessible icon-only button requiring `label` (`aria-label` + `title`). |
| **`Chip`** | [`src/ui/Chip.tsx`](../../../src/ui/Chip.tsx) | Toggleable filter pill (`aria-pressed`) used for priority/status filters in Tasks Hub. |
| **`Badge`** | [`src/ui/Badge.tsx`](../../../src/ui/Badge.tsx) | Semantic status pill (`urgent`, `normal`, `optional`, `done`, `warn`, `neutral`, `cosmos`). |
| **`SegmentedControl`** | [`src/ui/SegmentedControl.tsx`](../../../src/ui/SegmentedControl.tsx) | Accessible radiogroup/tab switcher used for `Day / Week / Month` views and task forms. The homepage collection uses its own single-button `LayoutToggle` since v3.2 (see [`../homepage/readme.md`](../homepage/readme.md)). |
| **`Checkbox`** | [`src/ui/Checkbox.tsx`](../../../src/ui/Checkbox.tsx) | Animated SVG checkmark control with optional visible label and strikethrough coordination; pairs `useReducedMotion()` with `motion-reduce:transition-none motion-reduce:duration-0` so both box `<span>` (`transitionProperty: none`, `transitionDuration: 0s`) and SVG `<path>` (`transition: none`) suppress transitions under reduced motion. |
| **`Dialog`** | [`src/ui/Dialog.tsx`](../../../src/ui/Dialog.tsx) | Portal-rendered modal dialog (`role="dialog"`, `aria-modal="true"`) with backdrop blur and focus trap. |
| **`LargeEditorDialog` & `DraftRecovery`** | [`src/ui/LargeEditorDialog.tsx`](../../../src/ui/LargeEditorDialog.tsx) | Centered desktop (`min(75vw, 1140px)`), single-column tablet, and `100dvh` phone modal editor with pinned header/footer, focused-field `scrollIntoView`, `beforeunload` + `useNavigationGuard` dirty-close protection, 3-choice close prompt (`Save draft and close`, `Discard changes`, `Continue editing`), explicit local draft recovery (`src/client/editor-drafts.ts`), and inline `role="alert"` save-error retention. |
| **`Drawer`** | [`src/ui/Drawer.tsx`](../../../src/ui/Drawer.tsx) | Portal slide-over panel from the right edge (`max-width: 520px`) used for Week/Month day drawers and `Statistics`; reads `(min-width: 768px)` via `useSyncExternalStore` for single-axis compositor slide + opacity (`x` on `>= 768px`, `y` on `< 768px`; instant opacity under `useReducedMotion()`). |
| **`Popover`** | [`src/ui/Popover.tsx`](../../../src/ui/Popover.tsx) | Anchored floating panel with outside-click and `Escape` dismissal; separates stationary outer `role="dialog"` fixed geometry (`outerStyle`) from the animated inner `<motion.div>` surface (`surfaceStyle`), coalesces capture `scroll` / `ResizeObserver` / burst `resize` updates via `requestAnimationFrame` with clean unmount cancellation, and preserves `UNMEASURED_STYLE` pre-anchor placement (used by `NotificationPopover` and `TaskMenu`). |
| **`ToastProvider` / `useToast`** | [`src/ui/Toast.tsx`](../../../src/ui/Toast.tsx) | Stacked bottom-center toasts (`info`, `success`, `error`) with `aria-live="polite"`. `pushToast(message, tone?, { durationMs? })` defaults to 4000ms for non-errors; Daily/Hub task-success and successful-deletion messages use 1000ms. Errors persist until dismissed even if a duration is supplied. |
| **`Skeleton` & `EmptyState`** | [`src/ui/Skeleton.tsx`](../../../src/ui/Skeleton.tsx), [`src/ui/EmptyState.tsx`](../../../src/ui/EmptyState.tsx) | Shimmer loading placeholders and centered empty-state callouts with icon, title, description, and optional action slot. |
| **`FocusModality`** | [`src/ui/FocusModality.tsx`](../../../src/ui/FocusModality.tsx) | Mounted once in `src/app/providers.tsx`. Sets `<html data-keyboard-nav>` on real keyboard navigation (any key except Shift/Ctrl/Alt/Meta/CapsLock) and clears it on pointer press. `globals.css` hides `:focus-visible` outlines unless that attribute is set, so a mouse click followed by a lone Shift press never draws a stray frame. Background focus tints are unaffected. |
| **`AutofillGuard`** | [`src/ui/AutofillGuard.tsx`](../../../src/ui/AutofillGuard.tsx) | Mounted once in `src/app/providers.tsx`. Global rule: browser autofill, autocomplete, saved entries, and input history are disabled everywhere. Forces `autocomplete="off"` on every `form`, `input`, `textarea`, and `select`, including fields mounted later, and overrides any other value. Only application-controlled suggestions (menus, comboboxes, `datalist`) may appear. Do not set other `autoComplete` values on new fields. |

---

## 10. Route Loading Transition (`src/features/transitions/`)

> **v3.1 (Confirmed requirement):** The destination zodiac loader below supersedes the Cosmic Launch sequence (archived original: [`md/archive/v3.1-pre-update/agents/shared/uiux.md`](../../archive/v3.1-pre-update/agents/shared/uiux.md)). `CosmicLaunchOverlay.tsx` was removed.

### 10.0 Destination Zodiac Loader (v3.1)
- Navigation starts immediately. `TransitionProvider` shows one overlay: the destination's canonical zodiac drawing (`ZodiacIllumination presentation="loader"`), or text only for routes without a mapped sign (v3.2; was a neutral spinner). Daily and Tasks Hub use Aries, Events uses Taurus, other features keep their registry sign (`route-zodiac.ts`); the registry itself is unchanged.
- There is **no minimum display time** and no wait for the drawing to finish. The overlay ends as soon as the destination pathname is reached **and** that destination signals `PageReady` (a usable primary surface or a visible error/retry state). Slow destinations keep drawing, then hold with the completed-glow loop.
- Readiness is collected per navigation (cleared at each start), so stale signals from the origin or an earlier visit cannot complete a later navigation. Scroll and interaction are released at readiness; the overlay then fades out over `--dur-fast` (150ms) with `pointer-events: none`.
- Reduced motion shows a static symbol and loading text with no drawing, travel, or hold. Loading is announced once through a polite `role="status"` region.
- A 10-second failsafe reveals the page. Back/Forward keeps the lightweight quick fade and abandons any pending loader. Same-path query/hash changes never show the loader. A failing zodiac renderer falls back to the neutral indicator.
- Views gate readiness on their primary query (`usePageReady(!isLoading)`), not on route-shell mount.

### 10.0.1 Loader v2 (v3.2)
- **Estimate-paced drawing:** `load-estimate.ts` keeps a per-route moving average of measured navigation-to-`PageReady` durations (localStorage via `preferences.ts`, key `hts.routeLoadHistory`), separately for the first ("cold") and repeat ("warm") visit in a session. Defaults without history: cold `1200ms`, warm `250ms` (+`300ms` for a warm route whose zodiac data is not cached). The estimate chooses the path: **fast** (`<= 300ms`) shows only the fully drawn static artwork; **draw** paces the drawing to `clamp(estimate, 700ms, 4800ms)` through `forwardSpeed` on `ZodiacIllumination presentation="loader"`. A fast-path route still loading after `450ms` upgrades to a `1500ms` drawing.
- **Ready early:** when the page is ready mid-drawing (progress `> 5%`) the remainder is fast-forwarded in `~300ms` and the overlay then fades; if drawing has not started the overlay dismisses immediately. Ready late: the drawing completes and the glow holds until ready (10s failsafe unchanged).
- **Hard load / refresh:** feature routes and `/notifications` server-render the overlay (dim static art + label, `noscript` guard) and dismiss on `PageReady` after hydration; Home and unknown routes are excluded. Hard-load dismissals do not move focus to the heading.
- **Look (v3.4):** background mirrors the collection card (`thumbSurface` gradient plus accent radial glows from `getFeatureAccentVar`). The destination title alone (no "Loading" prefix; `getRouteLoaderTitle`) is set in Cormorant italic 500 in `--zodiac-rose-gold-highlight`, with three small twinkling stars beneath (CSS only, staggered `1.5s` opacity/scale cycle): `clamp(1.75rem, 3.2vw, 2.6rem)` beneath artwork, `clamp(2.25rem, 4.4vw, 3.4rem)` centred when a route has no zodiac. "Loading {title}…" is announced once through the polite `role="status"` region. Reduced motion keeps the artwork and shows the stars static.
- `TransitionLink` warms the destination's zodiac JSON on pointer-enter/focus.

### Historical: Cosmic Launch (superseded in v3.1)

Defined in [`src/features/transitions/TransitionProvider.tsx`](../../../src/features/transitions/TransitionProvider.tsx), [`TransitionLink.tsx`](../../../src/features/transitions/TransitionLink.tsx), [`CosmicLaunchOverlay.tsx`](../../../src/features/transitions/CosmicLaunchOverlay.tsx), and [`transition-rules.ts`](../../../src/features/transitions/transition-rules.ts).

### 10.1 How It Works
- Clicking any `<TransitionLink>` or calling `useTransitionRouter().push(href)` triggers a full-viewport (`z-index: var(--z-cosmic-launch)`) HTML5 `<canvas>` star-warp overlay (`CosmicLaunchOverlay`).
- **Standard 4-Phase Timeline (`~3000ms` total):**
  1. **`gather` (`0ms – 650ms`):** Stars accelerate radially toward the screen center while the current view fades.
  2. **`flare` (`650ms – 1350ms`):** Central golden-violet flare expands (`StarIcon` + radial glow) as navigation triggers.
  3. **`warp` (`1350ms – 2300ms`):** Stars streak outward in warp trails while the destination route mounts.
  4. **`reveal` (`2300ms – 3000ms`):** Overlay dissolves smoothly (`opacity: 1 -> 0`) into the new workspace route.
- **Reduced Motion & Browser Back/Forward (`popstate`):**
  - When `prefers-reduced-motion: reduce` is active, the entire transition completes in **`<= 300ms`** using a simple opacity crossfade without canvas star streaks.
  - Native browser `popstate` (Back/Forward buttons) bypasses the 3-second warp and performs an immediate reveal.
- **Arrival State Hook (`useIsTransitioning()`):** `TransitionProvider.tsx` exposes a read-only `useIsTransitioning()` hook (`isTransitioning || isOverlayActive`) so destination views such as `DailySky` can defer non-critical animations until launch or quick-fade overlays unmount without modifying Launch timing or choreography.

---

## 11. Workspace Shell, Universe Menu & Blank Pages

### 11.1 `WorkspaceShell` (`src/ui/WorkspaceShell.tsx`)
Wraps all non-home workspace routes ([`src/app/(workspace)/layout.tsx`](../../../src/app/(workspace)/layout.tsx)):
- **Sticky Topbar:**
  - Left: **Universe** trigger button (`Ctrl+K` badge) + breadcrumb link back to `Tasks Hub` when inside `/tasks/daily`.
  - Right: Route-specific date readout (on `/tasks/daily`, shows `Asia/Ho_Chi_Minh` weekday and date) + `<NotificationPopover />` bell button ([`BellButton.tsx`](../../../src/features/notifications/BellButton.tsx)).
- **Route-Aware Theme Branching (Observed Epic 03–16 implementation):** When `usePathname() === '/tasks/daily'`, `WorkspaceShell` applies `.shellDaily` chrome, renders `<DailySky />` behind the page content, and swaps `StarIcon` for `<OrbitPlanetIcon />`. For routes listed in `FULL_PAGE_FEATURE_THEMES` (`events`, `notification`, `tracking`, `project`, `annual-milestones`, `personal-achievements`, `ai-engineering`, `blogs-hub`, `apcs-hub`, `flashcards`, `learning-room`, `entertainment-hub`), `WorkspaceShell` propagates `data-feature-theme`, `data-fullpage-theme="true"`, and `data-fullpage-topbar="true"` across the viewport background (`[data-theme='workspace'][data-fullpage-theme='true'][data-feature-theme=...]` washes in `src/app/globals.css`), sticky topbar, content surface (`<FeatureThemeProvider>` without the boxed inner frame), and `UniverseMenu`, while preserving Daily, Tasks Hub, and unmigrated features and leaving `NotificationPopover` (with its compact `Expand` link to `/notifications`) isolated in Sakura (`notification`) styling across every route (including Homepage and non-notification workspace pages). On `/tracking`, `TrackingView.tsx` preserves compact portaled `<Dialog>` forms (`max-w-[440px]`, scoped inline alerts with input retention), `DEFAULT_APP_TIMEZONE` (`Asia/Saigon`) date formatting, `--text-due-soon` star rating contrast, and `totalMinutes <= 0` ratio safety. On `/ai-engineering`, `AiEngineeringView.tsx` fixes completed stage pill contrast to `--text-notif-completed` / `text-text-notif-completed`, replaces clickable article containers with semantic `Read note` buttons, scopes topic-toggle alerts to the roadmap section, and renders Notion-synced notes cleanly inside a `<Dialog open portal>` Note Reader (`footer` actions, structured `<= 64ch` reading blocks, no duplicate close button). On `/blogs`, `WritingRoomView.tsx` renders an unboxed woodland reading room with `<Chip aria-pressed>` filters, semantic `<button type="button">` card triggers (replacing clickable `<article role="button">`), `--ws-accent` / `--text-notif-completed` AA contrast, `<Skeleton>` loading + non-blocking `role="alert"` Retry + `<EmptyState />` (`cabin-lantern.svg`), `68ch` Reader Mode with `<ol>` lists and safe inline `<strong>`/`<em>` parsing, and `LargeEditorDialog` (with optional `footerActions`) + `LargeEditorTwoColumn` + `editor-drafts.ts` (`formId: 'blog-article'`) preserving both server `Save draft` (`status: 'draft'`) and local crash-recovery drafts. On `/apcs`, `ApcsView.tsx` renders an unboxed Winter Library masthead, `recentFiles` strip, Study materials explorer with `color-mix(in srgb, var(--ws-accent) 68%, var(--ws-surface))` control borders, explicit `--cosmos-star-white` text on `.actionBtnPrimary:hover`, shared `<Dialog open portal>` File Preview (`footer` actions, no duplicate close button, zero monospace leaks), `<Skeleton>` loading, non-blocking `role="alert"` Retry, and `<EmptyState />` (`snow-fox-rest.svg`) while preserving APCS filesystem boundaries (`apcs-service.ts`, `apcs-storage.ts`, `apcs-boundary.test.ts`). On `/flashcards`, `FlashcardsView.tsx` opens `Add card` inside `LargeEditorDialog` + `LargeEditorTwoColumn` with `src/client/editor-drafts.ts` (`formId: 'flashcard'`, `DEFAULT_APP_TIMEZONE` `'Asia/Saigon'` draft timestamps, competing global `Escape` listener removed), keeps `New deck` in a compact `<Dialog max-w-[440px]>`, guards `deck.masteryPercentage ?? 0`, disables `Study deck` at 0 cards, uses `<Skeleton>` loading + non-blocking `role="alert"` Retry, removes `--cosmos-*` leaks, and preserves active-recall rating and untouched backend services. On `/learning-room`, `LearningRoomView.tsx` keeps `Session reflection` in a compact `<Dialog max-w-[440px] max-h-[90svh] overflow-y-auto>` with dialog-scoped `role="alert"` and retained notes, fixes star ratings/buttons to `--text-due-soon` / `text-text-due-soon`, keeps the focus timer interactive offline alongside non-blocking `role="alert"` Retry, renders `<Skeleton>` analytics/history placeholders and `Asia/Saigon` chart dates, and preserves `PRESETS`, `Date.now()`/`deadline` math, 5-minute break phase, and backend/accounting behavior unchanged. On `/entertainment`, `EntertainmentView.tsx` renders an unboxed Entertainment Lounge masthead, stationary 4-card overview strip (`tabular-nums`), Continue enjoying strip with `<h2 id="continue-heading">` and `text-text-due-soon` star rating `aria-label`, `--text-due-soon` / `--text-notif-completed` shelf status contrast, preserved roving keyboard tabs, `EmptyState compact` (`dream-console.svg`) + `floating-headphones.svg` empty Music shelf, `https?://` link safety, and compact `<Dialog max-w-[440px]>` media entry forms with scoped `role="alert"`, unfinished draft retention, and numeric clamping. On `/projects`, `ProjectsView.tsx` renders an unboxed Eastern Strategy Workspace masthead, 4-card KPI strip (`tabular-nums`), status filter chips + `auspicious-cloud-scroll.svg` divider, `minmax(min(100%, 340px), 1fr)` responsive grid with `--project-control-border` >= 3:1 control/border contrast, `-5%`/`+5%` guarded progress steppers, GPU `scaleX` progress fill with `prefers-reduced-motion` support, `<ConfirmDialog>` delete confirmation, and unified `LargeEditorDialog` + `LargeEditorTwoColumn` + `localStorage` draft lifecycle (`formId: 'project'`) preserving `linkedTaskIds`/`linkedMilestoneIds`. On `/milestones`, `MilestonesView.tsx` renders an unboxed Yearbook of Ambitions masthead (`Annual Milestones`, `Cormorant Garamond`), stationary 3-card `Yearbook trajectory` strip (`tabular-nums`), `Status filter` / `Category filter` `<Chip aria-pressed>` rows, `--milestone-control-border` >= 3:1 control/border contrast, folio cards preserving `id="item-${milestone.id}"`, inline `<Checkbox>` landmark toggles (`useToggleLandmark`, per-landmark pending guard, card-scoped `role="alert"`), a quick status `<select>` (`useUpdateMilestone`), `<ConfirmDialog>` delete (`clearEditorDraft('milestone', id)`), `<Skeleton>` loading + non-blocking `role="alert"` Retry + `<EmptyState />` (`champions-cup.svg`), and unified `LargeEditorDialog` + `LargeEditorTwoColumn` + `localStorage` draft lifecycle (`formId: 'milestone'`) with a structured Landmarks editor preserving each existing landmark's `id`, `completed`, and `completedAt`. On `/achievements`, `AchievementsView.tsx` renders an unboxed Roman Marble Gallery masthead (`Personal Achievements`, `Cormorant Garamond`, `data-feature-heading`), stationary 4-card `Gallery summary` strip (`tabular-nums`), all 6 `Filter by era` radio chips (restoring `Elementary` alongside `All eras`, `University`, `High school`, `Secondary`, and `Upcoming contests`, with roving `ArrowLeft`/`ArrowRight`/`Home`/`End` keyboard nav), `View mode`/`Edit mode` switcher, `--ach-control-border` >= 3:1 control/border contrast, stationary plaques (`id="item-${item.id}"`, `'Upcoming contest'` badge, `featured` badge/toggle via `useUpdateAchievement`, `DEFAULT_APP_TIMEZONE` `'Asia/Saigon'` contest date formatting, `--text-due-soon`), `<ConfirmDialog>` delete replacing `window.confirm`, `<Skeleton>` loading + non-blocking `role="alert"` Retry + `<EmptyState />` (`ceremonial-marble-plinth.svg`), and unified `LargeEditorDialog` + `LargeEditorTwoColumn` + `localStorage` draft lifecycle (`formId: 'achievement'`, `recordUpdatedAt: null`) wiring both `useCreateAchievement` and `useUpdateAchievement`.

### 11.2 `UniverseMenu` (`src/ui/UniverseMenu.tsx`)
- Modal launcher toggled via the **Universe** topbar button or `Ctrl+K` / `Cmd+K`. Accepts an optional `featureTheme?: FeatureThemeName` prop (defaulting to `useFeatureTheme()`), applies `data-feature-theme={resolvedTheme}`, and renders at `calc(var(--z-drawer) + 1)` above `LargeEditorDialog` while routing internal navigation through `TransitionProvider` so active dirty-editor navigation guards can prompt before leaving.
- Provides a frameless live search row (`img20` baseline), a direct `Return to Cosmos (/)` action, and searchable navigation across the 13 features from [`FEATURE_REGISTRY`](../../../src/features/registry.ts) plus the `/notifications` Inbox destination (`UNIVERSE_DESTINATIONS` inside `UniverseMenu.tsx`, preserving `FEATURE_REGISTRY` and Homepage's 13-card collection unchanged).

### 11.3 `BlankPage` (`src/features/blank/BlankPage.tsx`)
- Renders inside `WorkspaceShell` for the 11 unbuilt feature routes (`/events`, `/ai-engineering`, `/blogs`, `/apcs`, `/flashcards`, `/entertainment`, `/tracking`, `/projects`, `/milestones`, `/learning-room`, `/achievements`).
- Displays the feature's title, label, a calm cosmic illustration, the required message `"Blank page — waiting for future features."`, and a `TransitionLink` back to `/`.

---

## 12. Scoped Visual Exceptions

In accordance with the Precedence Rule, the following epic-specific visual treatments intentionally diverge from the default light-lavender Workspace rules and are formally approved:

| Epic / Surface | Scoped Exception | Governing Specification |
| :--- | :--- | :--- |
| **Homepage (`/`)** | **1. Vector Wordmark All-Caps:** `public/brand/wordmark.svg` renders `HIEP TRONG` in uppercase display lettering.<br/>**2. 3D WebGL, Starfield & Midnight Galaxy Reveal Choreography:** `earth-scene.ts` renders normalized GLSL `vec3` lighting/atmosphere shaders with 2K WebP textures, `Starfield.tsx` / `starfield-engine.ts` renders a 2D `<canvas>` starfield from `--cosmos-star-*` CSS tokens (`IntersectionObserver` + `visibilitychange` + reduced-motion aware, ref-paused without prop churn), `HomeJourney.tsx` & `HorizontalGallery.tsx` apply compositor-only transforms with native CSS `position: sticky` `.collectionSurface` + `.collectionRevealSpacer` (`400svh`/`320svh`, hidden under reduced motion), bidirectional `stepSmoothProgress` reveal smoothing (`visualRevealProgress` + viewport-locked `anchorOffsetY` `clip-path: circle(...)` + baked-alpha `.midnightStars` gradients without offscreen layers), cached DOM writes (`revealComplete`-only React state updates), `inert` gating, `[data-collection-home]` sticky topbar + `.skipLink`, smooth `HorizontalGallery` boundary reversal without forced layout reads, and WebGL pause while covered, `Intro` uses borderless `Cormorant Garamond` + `Inter` typography with subtle behind-text radial falloff, `CollectionHeader` renders **My *collection*** (`My` + italic `var(--cosmos-accent)` `collection`), and `FeatureCard` keeps stationary hit bounds with per-feature `--card-accent` subtle glow + inner artwork zoom. | [`../homepage/readme.md`](../homepage/readme.md) |
| **Daily Task Management (`/tasks/daily`)** | **1. Celestial Luxury V2 Dark Observatory Theme:** Uses the `--daily-*` midnight-to-twilight sky gradient (`#0D0C1D` → `#1B1638`), frosted glass panels (`backdrop-filter: blur(16px)`), warm amber gold CTAs (`#F0A500`), and antique gold ornaments (`#D4AF37`) instead of the light-lavender `--ws-*` canvas.<br/>**2. Decorative Celestial Artwork:** Renders `DailySky.tsx` (static `svg.stars` with `114` circles + `4` static sparkles, static `g.clouds`, `8` standalone HTML `.twinkle` overlays deferred `180ms` after `useIsTransitioning()` settles, shooting stars, inline `Astrolabe` and `ZodiacCorner` SVGs) and `public/visuals/daily-v2/*.svg` assets on Daily cards, `translateY`-positioned constellation scrollbars, and Overdue headers.<br/>**3. Scoped Task Card Styling:** `daily-task-card.module.css` applies only when `TaskCard` is rendered in `carousel` or `overdue` contexts on `/tasks/daily`. When `TaskCard` is rendered in `/tasks/hub` (`context="hub"`), it retains the clean light-lavender `--ws-*` card design. | [`../tasks/readme.md`](../tasks/readme.md) |

**Current Focus (`/focus`) priority tiers (confirmed 2026-11-19):** the `project` feature theme adds three soft tier colours, defined only in `src/design/tokens.css` under `[data-feature-theme='project']`: `--focus-critical` (cinnabar seal), `--focus-active` (jade) and `--focus-background` (ink wash). They tint the priority tag, the switcher dots and the Priority control in the focus panel; status stays monochrome (signal meter). The tier switcher is a centred pill whose highlight slides with a `transform` transition (reduced motion shortens it), and the focus panel is a centred `85vw` by `85dvh` dialog that is full screen below `760px`. No new raw colour values appear outside `tokens.css`.

**Current Focus (`/focus`) art (confirmed 2026-11-20):** 17 further static fine-line SVGs join the original five in [`public/visuals/project/`](../../../public/visuals/project/), all decorative (`alt=""`, `aria-hidden`, no scripts or external links, hex colours only inside the files). Placements: `ridge-and-rising-sun` masthead (replaces `dragon-over-the-ridge`, now unused); `emblem-seal` / `emblem-bamboo` / `emblem-mountain` for Critical / Active / Background in the tier switcher, tags and priority menu; `bamboo-rule` under the switcher; `lotus-done` / `lotus-current` / `lotus-pending` as roadmap markers, with `summit-pennant` after the last checkpoint (dim until every checkpoint is done); `jade-stamp-check` beside Finished items and in the finished bar; `distant-mountains` as the page footer. Each focus keeps one piece as a watermark in the bottom right of the panel's History column (fixed while the list scrolls, behind the text), chosen by a stable hash of its id (`src/features/projects/focus-art.ts`) from `crane-against-the-moon`, `scholars-pavilion`, `pine-and-full-moon`, `paper-lantern`, `plum-blossom-branch` and `cloud-curls`; an unsaved draft picks one at random. The watermark is hidden below `760px`. The masthead ridge sits in the heading row between the title and New focus, shown from `900px`, so nothing overlaps it. `wooden-training-dummy` stays the empty-state art; `auspicious-cloud-scroll` and `jade-knot-talisman` are unused.

### 12.1 Observed baseline for the November UI/UX plan

The current implementation inspected on 12 November 2026 differs from older descriptive tables above: Daily uses a soft-lavender sky (`--daily-sky-start: #f1ebfc`, `--daily-sky-end: #f8f4ff`) and violet accents (`--daily-accent: #8065e9`). Workspace uses `--ws-bg: #f0eff8`, `--ws-text: #29263b`, and `--ws-accent: #a99aef`. Preserve the current token values; the owner-approved [UI/UX plan](../../../plan.md) does not authorize restoring the older midnight/amber palette.

Observed motion exports are `fast: 0.15`, `base: 0.25`, `layout: 0.28`, `slow: 0.4`, `popoverOpen: 0.22`, `popoverClose: 0.17`, and `drawerClose: 0.18` seconds, with `MOTION_EASE: [0.22, 0.61, 0.36, 1]`. These existing values and Homepage/Cosmic Launch motion remain unchanged in Epic 1. Current feature routes are implemented; the older placeholder catalog above is not a current implementation inventory.

### 12.2 Epic 17 Cross-Feature Verification — 14 November 2026

Cross-feature verification after post-polish button label cleanup (`Add card`, `New deck`, `Add book`, `Add game`, `Add record` next to `<Plus aria-hidden="true" />`) confirmed `public/visuals/` (`14` directories, `72` safe `.svg` files), zero token/monospace/`100vw`/`transition: all` guardrail violations, combined `65/65` passing Vitest suites (`299/299` tests across sandbox + unsandboxed `apcs-boundary.test.ts`), `npm run build` (`38/38` static pages, Next.js `15.5.28`), and live headless Chromium verification (`0` runtime/request errors, `0px` overflow across `1440px`/`375px`/`320px`, `NotificationPopover` isolated in `notification`, `UniverseMenu` theme inheritance, `LargeEditorDialog` two-column geometry vs compact dialogs, and `prefers-reduced-motion` parity on Daily & Hub). See [`review/redesign/epic-17-cross-feature-verification.md`](../../../.local/review/redesign/epic-17-cross-feature-verification.md), [`review/redesign/epic-17/epic17-live-measurements.json`](../../../.local/review/redesign/epic-17/epic17-live-measurements.json), and [`review/redesign/README.md`](../../../.local/review/redesign/README.md).
