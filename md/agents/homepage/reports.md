# Homepage Epic — Implementation & Verification Reports

`md/agents/homepage/reports.md` records the dated implementation milestones, visual review packets, and audit snapshots for the **Homepage / Landing Journey** epic (`/`). For current requirements and architecture, see [`readme.md`](readme.md).

---

## 1. Phase 01 Stage 1 & Stage 2 Visual Review (3–4 November 2026)

- **Scope:** Built the Three.js night-side Earth scene, custom Fresnel atmosphere shader, `/brand/wordmark.svg` hero composition, and 4-phase scroll choreography (`0.00` → `1.00`), verified first in the standalone `review/phase01/` harness and then integrated into `src/features/home/`.
- **Evidence Preserved:**
  - [`../../../.local/review/phase01/README.md`](../../../.local/review/phase01/README.md) (Stage 1 static composition metrics across `1920x1080`, `1440x900`, `768x1024`, `390x844`).
  - [`../../../.local/review/phase01/MOTION.md`](../../../.local/review/phase01/MOTION.md) (Stage 2 scroll timeline and reduced-motion verification).
  - [`../../../public/earth/ATTRIBUTION.md`](../../../public/earth/ATTRIBUTION.md) (NASA Visible Earth & Solar System Scope CC BY 4.0 attribution).

---

## 2. Phase 3 Homepage Integration & Control Refinement (4–6 November 2026)

- **Scope:**
  - Integrated `HomeJourney.tsx`, `earth-scene.ts`, `home-journey.ts`, `Starfield.tsx`, `FeatureCollection.tsx`, `HorizontalGallery.tsx`, `VerticalGrid.tsx`, `FeatureCard.tsx`, `FeatureThumbnail.tsx`, and `HomeFooter.tsx` into the Next.js App Router root (`/`).
  - Retired the opening floating "Explore my space" CTA morph pill so `Explore my space` is rendered exclusively as the static section heading (`h2#features-heading`) in `CollectionHeader.tsx`.
  - Retired the user-facing Pause button in favor of automatic `document.hidden` (`visibilitychange`) pausing and `prefers-reduced-motion: reduce` support.
  - Added global `overscroll-behavior-y: none` on `html` (`src/app/globals.css`) to prevent rubber-band bounce from disturbing the sticky `100vh` scroll stage.
- **Verification Snapshot (4–6 Nov 2026):**
  - `tests/unit/home-journey.test.ts` and `tests/ui/home-collection.test.tsx` passing as part of the 21-file / 86-test Vitest suite.

---

## 3. Forensic Architecture & Bug Audit Snapshot (6 November 2026)

- **Scope:** Repository-wide static and behavioral audit recorded in [`../../../docs/audit/`](../../../docs/audit/).
- **Homepage Findings:**
  - Confirmed clean separation between pure choreography math (`home-journey.ts`), WebGL imperative controller (`earth-scene.ts`), and React view orchestration (`HomeJourney.tsx`).
  - Logged minor defect `C13` in [`../../../docs/audit/BUG_INVENTORY.md`](../../../docs/audit/BUG_INVENTORY.md) (`Starfield.tsx` checks `prefers-reduced-motion` on mount without a live `change` event listener) and suspected edge case `S05` (unmount during pending async texture load).

---

## 4. Documentation Reconstruction & Consolidation (7 November 2026)

- **Scope:** Consolidated homepage documentation from the retired `PROJECT_DESCRIPTION.md` (legacy monolithic version), `md/agents/ui_ux.md` (Section 14), `md/agents/agent_readme.md`, and `md/agents/context.md` into [`readme.md`](readme.md) and this report log.
- **Archive & Audit Trail:** See [`../../read/reconstruction.md`](../../read/reconstruction.md) and [`../../archive/pre-reorganization/README.md`](../../archive/pre-reorganization/README.md).

---

## 5. Stabilization Plan Execution (`C13`, `D09`) (7 November 2026)

- **Scope:**
  - Updated [`StarfieldEngine`](../../../src/features/home/starfield/starfield-engine.ts) (`C13`) so `start()` records the desired running state even when initialized under `reducedMotion: true`, allowing `setReducedMotion(false)` to resume scheduling `requestAnimationFrame` frames automatically without requiring a second `start()` call.
  - Added regression coverage in [`starfield-and-home.test.tsx`](../../../tests/features/home/starfield-and-home.test.tsx) and stubbed `HTMLCanvasElement.prototype.getContext` in [`cosmic-launch.test.tsx`](../../../tests/features/transitions/cosmic-launch.test.tsx) (`D09`) to eliminate jsdom canvas stderr noise.
- **Verification:** `npm run check` passed across all 25 test files (`104` tests).

---

## 6. v3.2 Feature Collection Polish (18 November 2026)

- **Scope:**
  - Renamed the first feature from "Daily Task Management" to **Task Management** in [`registry.ts`](../../../src/features/registry.ts) (card, `/tasks/daily` metadata, route loader), the Daily board `<h1>`, and the workspace shell shortcut tooltip. The route `/tasks/daily` and id `daily-tasks` are unchanged; the homepage pilot preview fixtures were left as-is.
  - Smoothed the zodiac hover glow in [`FeatureThumbnail.tsx`](../../../src/features/home/feature-collection/FeatureThumbnail.tsx) / [`feature-collection.module.css`](../../../src/features/home/feature-collection/feature-collection.module.css): the animated `filter: drop-shadow` on `.zodiacInset` (re-rasterized every frame, causing a late start and choppy fade) was replaced by a pre-glowed `.zodiacHalo` copy whose `opacity` alone animates (rise `--dur-base`, settle `--dur-slow`). Ambient glow and accent hairline now share that timing.
  - Replaced the collection's `SegmentedControl` with a single morphing [`LayoutToggle.tsx`](../../../src/features/home/feature-collection/LayoutToggle.tsx) (Gallery / Grid), designed with the ui-ux-pro-max guidance (glass pill, 44px target, visible focus, decorative icons hidden, reduced motion). The shared `SegmentedControl` is untouched.
- **Verification:** `npm run check` passed (`77` files, `433` tests), including new tests for the toggle's label/icon/accessible-name flip and the halo layer. Live dev-server check at `1024px` and `320px`: halo opacity `1` on hover with `0.25s` rise and `0.4s` settle and no filter on the base artwork; toggle switches to Grid, persists `hts.featureCollection.layout`, keeps focus, and fits at `320px` without horizontal overflow; `/tasks/daily` shows "Task Management" in the tab title and header.

## 7. v3.2 Loader v2 (18 November 2026)

- **Scope:** estimate-paced route loader (`load-estimate.ts`, cold/warm history, fast vs draw path, fast-forward when ready early), per-feature background matching the collection card, "Loading {title}" in Cormorant italic with looping dots, text-only loader for routes without a zodiac, hard-load/refresh coverage with a server-rendered overlay, and zodiac-data warming on link hover/focus. See `md/agents/shared/uiux.md` §10.0.1.
- **Not implemented:** reading TanStack Query cache state into the estimate (the loader cannot know which queries a route uses); the moving average already reflects cached repeat visits.
- **Verification:** `npm run check` and `npm run build` pass. Live dev and production checks: cold visit draws and records a cold sample, repeat visit takes the fast path (~230ms), an early-ready page dismisses without waiting, server HTML contains the overlay on feature routes but not on Home, and a production hard load of `/tasks/hub` dismissed after ~350ms. In `next dev`, first-compile delays can exceed the 10s failsafe on a hard load; production is unaffected.

