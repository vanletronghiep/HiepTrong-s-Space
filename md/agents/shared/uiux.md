# Shared UI/UX & Design System Specification

`md/agents/shared/uiux.md` is the canonical specification for project-wide visual foundations, CSS design tokens, typography, motion, imagery, craft guardrails, responsive layout, accessibility, shared `src/ui/` components, the Cosmic Launch route transition, and the `WorkspaceShell` / `UniverseMenu` chrome.

- **Epic-specific UI/UX lives in the epic documents:**
  - Homepage 3D Earth journey, starfield, and feature collection gallery → [`../homepage/readme.md`](../homepage/readme.md)
  - Daily Task Management (Celestial Luxury V2 observatory), Tasks Hub, and Notification Center → [`../tasks/readme.md`](../tasks/readme.md)
- **Precedence Rule:** General cross-project visual rules live in this file. Epic-specific overrides live in the respective epic `readme.md` and **must** also be registered in [Section 12: Scoped Visual Exceptions](#12-scoped-visual-exceptions) so the shared baseline and epic specifications never silently contradict each other.

---

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
| `--text-2xl` | `clamp(1.75rem, 2.6vw, 2.375rem)` | Workspace page titles (`Daily Task Management`, `Tasks Hub`) |
| `--text-xl` | `1.375rem` (`22px`) | Section headings (`Explore my space`, `Overdue`, Drawer titles) |
| `--text-lg` | `1.125rem` (`18px`) | Card titles, prominent controls |
| `--text-md` | `1rem` (`16px`) | Primary body copy, task titles, form inputs |
| `--text-sm` | `0.875rem` (`14px`) | Secondary metadata, buttons, segmented controls |
| `--text-xs` | `0.75rem` (`12px`) | Badges, chips, timestamps, helper text |

### 3.3 Casing & Numeral Rules

1. **Sentence-Case Mandate:** All workspace headings, section labels, buttons, badges, and navigation items must use **sentence case** (e.g., `Cosmic forecast`, `Progress`, `Day arc`, `Explore my space`, `Schedule today`).
2. **No `text-transform: uppercase`:** CSS `text-transform: uppercase` is banned across `src/` by [`tests/design/craft-and-architecture-guardrails.test.ts`](../../../tests/design/craft-and-architecture-guardrails.test.ts).
3. **Sole All-Caps Exception:** Only the homepage `HIEP TRONG` brand wordmark (rendered via vector asset [`public/brand/wordmark.svg`](../../../public/brand/wordmark.svg)) uses all-caps lettering. *(See also [`OD-04`](../../../PROJECT_DESCRIPTION.md#od-04) regarding `font-variant-caps: all-small-caps` on `.eyebrow` in Daily V2.)*
4. **Tabular Numerals & No Monospace:** All dates, clocks (`HH:mm:ss`), percentages, and counters use `--font-sans` (`Inter`) with `font-variant-numeric: tabular-nums`. Monospace fonts are never used in user-facing UI.

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
- **Local-Only Reference & Review Directories (`sources/` and `review/`):**
  - Both `sources/` and `review/` are ignored by `.gitignore` and exist on the local development machine as design inspiration and Phase 01 visual review evidence.
  - Because `sources/` is gitignored, canonical documentation in `md/` describes all visual requirements in self-contained prose so contributors never depend on gitignored binaries to understand a requirement.

---

## 6. Craft Rules & Automated Guardrails

Two automated test suites in `tests/design/` enforce design-system integrity:

1. **Token Purity ([`tests/design/tokens-guardrail.test.ts`](../../../tests/design/tokens-guardrail.test.ts)):**
   - Scans every `.ts`, `.tsx`, and `.css` file under `src/ui/` and `src/features/` to ensure zero raw `#hex`, `rgb()`, `rgba()`, `hsl()`, or `hsla()` literals appear outside [`src/design/tokens.css`](../../../src/design/tokens.css).
   - **Documented allowlist in the test:** `src/features/home/feature-collection/FeatureThumbnail.tsx` (bespoke SVG artwork), `src/features/home/starfield/Starfield.tsx` & `starfield-engine.ts` (2D canvas star palette), `src/features/home/HomeJourney.tsx` & `earth-scene.ts` (Three.js WebGL shaders/lights), and `src/features/tasks/DailySky.tsx` (inline SVG gradients).
2. **Craft & Architecture Guardrails ([`tests/design/craft-and-architecture-guardrails.test.ts`](../../../tests/design/craft-and-architecture-guardrails.test.ts)):**
   - Forbids `transition: all` across `src/`.
   - Forbids `text-transform: uppercase` across `src/`. *(Note: line 23 of the test still checks `rel !== 'src/features/home/Wordmark.tsx'` from before `Wordmark.tsx` was replaced by `/brand/wordmark.svg`; see [`OD-04`](../../../PROJECT_DESCRIPTION.md#od-04)).*
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
2. **Immediate Focus Rings:** `:focus-visible` outlines (`2px solid var(--ws-accent)` or `--cosmos-accent` with `2px` offset) appear instantaneously (`0ms` delay) on keyboard navigation.
3. **Stacked Modal Focus Trapping ([`src/ui/use-focus-trap.ts`](../../../src/ui/use-focus-trap.ts)):**
   - Supports nested overlays (e.g., opening a `Dialog` or `TransferDialog` on top of a `Drawer`) via a module-level `activeTrapStack`.
   - Only the topmost trap intercepts `Tab`, `Shift+Tab`, and `Escape`.
   - Restores focus to the triggering element when the overlay closes.
4. **Non-Color Status Encoding:** Priority and urgency are never communicated by color alone — they pair color tokens with distinct shapes/icons (`PriorityBadge` / `PriorityPlanet`) and text badges (`Urgent`, `Overdue`, `Due soon`).
5. **Global Keyboard Shortcuts:**
   - `Ctrl+K` / `Cmd+K`: Toggle `UniverseMenu` in any workspace route.
   - `Escape`: Close the topmost active `Dialog`, `Drawer`, `Popover`, or `UniverseMenu`.
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
| **`SegmentedControl`** | [`src/ui/SegmentedControl.tsx`](../../../src/ui/SegmentedControl.tsx) | Accessible radiogroup/tab switcher used for `Horizontal / Vertical` gallery mode and `Day / Week / Month` views. |
| **`Checkbox`** | [`src/ui/Checkbox.tsx`](../../../src/ui/Checkbox.tsx) | Animated SVG checkmark control with optional visible label and strikethrough coordination. |
| **`Dialog`** | [`src/ui/Dialog.tsx`](../../../src/ui/Dialog.tsx) | Portal-rendered modal dialog (`role="dialog"`, `aria-modal="true"`) with backdrop blur and focus trap. |
| **`Drawer`** | [`src/ui/Drawer.tsx`](../../../src/ui/Drawer.tsx) | Portal slide-over panel from the right edge (`max-width: 520px`) used for Week/Month day drawers and `Statistics`. |
| **`Popover`** | [`src/ui/Popover.tsx`](../../../src/ui/Popover.tsx) | Anchored floating panel with outside-click and `Escape` dismissal (used by `NotificationPopover`). |
| **`ToastProvider` / `useToast`** | [`src/ui/Toast.tsx`](../../../src/ui/Toast.tsx) | Stacking bottom-right notification toasts (`info`, `success`, `error`) with `aria-live="polite"`. |
| **`Skeleton` & `EmptyState`** | [`src/ui/Skeleton.tsx`](../../../src/ui/Skeleton.tsx), [`src/ui/EmptyState.tsx`](../../../src/ui/EmptyState.tsx) | Shimmer loading placeholders and centered empty-state callouts with icon, title, description, and optional action slot. |

---

## 10. Cosmic Launch Route Transition (`src/features/transitions/`)

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

---

## 11. Workspace Shell, Universe Menu & Blank Pages

### 11.1 `WorkspaceShell` (`src/ui/WorkspaceShell.tsx`)
Wraps all non-home workspace routes ([`src/app/(workspace)/layout.tsx`](../../../src/app/(workspace)/layout.tsx)):
- **Sticky Topbar:**
  - Left: **Universe** trigger button (`Ctrl+K` badge) + breadcrumb link back to `Tasks Hub` when inside `/tasks/daily`.
  - Right: Route-specific date readout (on `/tasks/daily`, shows `Asia/Ho_Chi_Minh` weekday and date) + `<NotificationPopover />` bell button ([`BellButton.tsx`](../../../src/features/notifications/BellButton.tsx)).
- **Route-Aware Theme Branching:** When `usePathname() === '/tasks/daily'`, `WorkspaceShell` applies `.shellDaily` (dark Celestial V2 chrome), renders `<DailySky />` behind the page content, and swaps `StarIcon` for `<OrbitPlanetIcon />`. All other routes receive the light-lavender `.shell` chrome.

### 11.2 `UniverseMenu` (`src/ui/UniverseMenu.tsx`)
- Modal launcher toggled via the **Universe** topbar button or `Ctrl+K` / `Cmd+K`.
- Provides a live search input, a direct `Return to Cosmos (/)` action, and a grid of all 13 features from [`FEATURE_REGISTRY`](../../../src/features/registry.ts) showing built vs. `Soon` status badges.

### 11.3 `BlankPage` (`src/features/blank/BlankPage.tsx`)
- Renders inside `WorkspaceShell` for the 11 unbuilt feature routes (`/events`, `/ai-engineering`, `/blogs`, `/apcs`, `/flashcards`, `/entertainment`, `/tracking`, `/projects`, `/milestones`, `/learning-room`, `/achievements`).
- Displays the feature's title, label, a calm cosmic illustration, the required message `"Blank page — waiting for future features."`, and a `TransitionLink` back to `/`.

---

## 12. Scoped Visual Exceptions

In accordance with the Precedence Rule, the following epic-specific visual treatments intentionally diverge from the default light-lavender Workspace rules and are formally approved:

| Epic / Surface | Scoped Exception | Governing Specification |
| :--- | :--- | :--- |
| **Homepage (`/`)** | **1. Vector Wordmark All-Caps:** `public/brand/wordmark.svg` renders `HIEP TRONG` in uppercase display lettering.<br/>**2. WebGL / Canvas Color Literals:** `earth-scene.ts`, `HomeJourney.tsx`, `Starfield.tsx`, and `FeatureThumbnail.tsx` use calibrated RGB/hex values for 3D shaders, star temperatures, and bespoke feature illustrations. | [`../homepage/readme.md`](../homepage/readme.md) |
| **Daily Task Management (`/tasks/daily`)** | **1. Celestial Luxury V2 Dark Observatory Theme:** Uses the `--daily-*` midnight-to-twilight sky gradient (`#0D0C1D` → `#1B1638`), frosted glass panels (`backdrop-filter: blur(16px)`), warm amber gold CTAs (`#F0A500`), and antique gold ornaments (`#D4AF37`) instead of the light-lavender `--ws-*` canvas.<br/>**2. Decorative Celestial Artwork:** Renders `DailySky.tsx` (starfield, shooting stars, inline `Astrolabe` and `ZodiacCorner` SVGs) and `public/visuals/daily-v2/*.svg` assets on Daily cards, scrollbars, and Overdue headers.<br/>**3. Scoped Task Card Styling:** `daily-task-card.module.css` applies only when `TaskCard` is rendered in `carousel` or `overdue` contexts on `/tasks/daily`. When `TaskCard` is rendered in `/tasks/hub` (`context="hub"`), it retains the clean light-lavender `--ws-*` card design. | [`../tasks/readme.md`](../tasks/readme.md) |
