# Homepage / Landing Journey Epic Specification

`md/agents/homepage/readme.md` is the canonical engineering and design specification for the **Homepage / Landing Journey** epic (`/`).

- **Related System Reference:** [`../../../PROJECT_DESCRIPTION.md`](../../../PROJECT_DESCRIPTION.md)
- **Related Shared UI/UX Baseline:** [`../shared/uiux.md`](../shared/uiux.md)
- **Implementation History & Audit Reports:** [`reports.md`](reports.md)
- **Earth Texture License Attribution:** [`../../../public/earth/ATTRIBUTION.md`](../../../public/earth/ATTRIBUTION.md)

---

## 1. Purpose, Scope, and Relationships

### 1.1 Epic Purpose
The Homepage (`/`) is the front door to **Hiep Trong Space** — a contemplative, museum-grade 3D Earth scroll journey ("The Cosmos") that transitions via the **Midnight Galaxy collection reveal** into **My *collection*** (`#features`), where the user launches into Daily Task Management (`/tasks/daily`) or previews the 11 upcoming personal space modules.

### 1.2 Epic Scope
- **In Scope:**
  - Opening 3D night-side Earth hero stage, vector `HIEP TRONG` wordmark composition, top-right `BellButton` (`tone="cosmos"` opening the isolated Sakura `NotificationPopover`), background starfield canvas, and keyboard `Skip to collection` link (`.skipLink`).
  - Reversible scroll-driven Earth, wordmark, flare, and borderless editorial personal introduction choreography (`500svh` desktop / `420svh` `< 768px` scroll runway when reveal is active, falling back to `400svh` / `320svh` under reduced motion or unsupported `clip-path`, non-overlapping across `desktop`, `stacked`, and `landscape-compact` layouts).
  - Reversible circular **Midnight Galaxy collection reveal** expanding from the bottom-left corner `(0px, 100vh)` across the `100svh` reveal window (`revealRadiusEase`) over the stationary Earth/intro/collection before cleanly handing over scroll at `#features`.
  - Interactive Earth rotation (continuous `60s` orbit, pointer drag, and `ArrowLeft`/`ArrowRight` keyboard controls, locked while partially revealed or covered).
  - Feature Collection section (`#features`) with sticky `.collectionTopbar` (`Hiep Trong` `[data-collection-home]` signature button aligned with `BellButton`), `My collection` editorial heading (`My` + italic `collection`) + `COLLECTION_SUBTITLE_COPY`, persistent `Horizontal` / `Vertical` view mode switcher, 12 bespoke feature cards (excluding Tasks Hub only from this collection) with stationary hit bounds and per-feature `--card-accent` feedback, and `Cosmic Launch` route navigation.
  - Reduced-motion, WebGL fallback (`/earth/earth-poster-2k.webp`), active WebGL pause (`earthOpacity <= 0.005` / offscreen / hidden), `IntersectionObserver` starfield pause, and `visibilitychange` resource conservation (2K WebP Earth textures loaded cleanly while 4K assets remain on disk in `public/earth/`).
  - Homepage footer (`HomeFooter`) with NASA / Solar System Scope attribution.
- **Out of Scope:**
  - Workspace topbar (`WorkspaceShell` and `UniverseMenu` only wrap non-root workspace routes).
  - Task domain state, SQLite queries, or notifications (owned by [`../tasks/readme.md`](../tasks/readme.md)).

---

## 2. Confirmed Requirements and User Flows

### 2.1 Opening Composition, Personal Intro & Interactive Earth Flow
1. **Immediate Cosmic Stage (`/`):**
   - Upon loading `/`, the user enters a full-viewport (`100svh` sticky inside a `500svh` desktop / `420svh` `<768px` reveal-enabled scroll stage; `400svh` / `320svh` fallback) deep-space scene with keyboard `.skipLink` (`Skip to collection`) and top-right `BellButton` (`tone="cosmos"`).
   - The `HIEP TRONG` vector wordmark ([`public/brand/wordmark.svg`](../../../public/brand/wordmark.svg)) opens centered in the upper horizon above the curved Earth limb and tucks smoothly into the compact top-left slot during initial scroll, while the borderless `Cormorant Garamond` + `Inter` personal introduction (`HOME_INTRO_COPY`: `"Hi! I'm Hiep."` ...) enters cleanly alongside or below the full globe without overlap (`desktop` `>=1024px`, `stacked` `<1024px` portrait, `landscape-compact` short landscape e.g. `640x360`).
2. **Retired Legacy Controls (Confirmed Decisions):**
   - **No Opening "Explore my space" CTA Pill / Morph:** Earlier Phase 01 prototypes included a floating "Explore my space" button at the bottom of the opening screen that morphed into the section heading on scroll. By confirmed owner decision, the opening CTA pill and scroll-morph were **removed**. `/` renders `My collection` (with `My` + italic `collection`) and `COLLECTION_SUBTITLE_COPY` inside `#features`, while `/preview/home-motion` (`<HomeJourney preview />`) retains the `Explore my space` preview heading.
   - **No User-Facing Pause Button:** Earlier specs mentioned a visible Pause button for the starfield/Earth loop. By confirmed owner decision, **no user-facing Pause button exists**. Instead, animations automatically pause when `document.hidden` is `true` (`visibilitychange`), when offscreen or scrolled past the Earth stage, and respect `prefers-reduced-motion: reduce`.
3. **Interactive Earth Rotation:**
   - **Ambient Orbit:** In standard motion mode while Earth is active (`earthOpacity > 0.005`), the 3D Earth rotates continuously at `2π / 60` radians per second (`60s` per full revolution, `EARTH_SPEED`).
   - **Pointer Drag:** Users can grab and drag horizontally anywhere on the Earth interactive zone (`cursor: grab` / `grabbing`), rotating yaw proportionally across viewport width (`(dx / width) * Math.PI`) with smooth orbit resumption `800ms` after release.
   - **Keyboard Control:** Focusing the interactive globe container (`role="group"`, `aria-label="Earth. Drag horizontally or use Left and Right arrow keys to rotate."`) and pressing `ArrowLeft` or `ArrowRight` rotates the globe in `±0.12 rad` steps.

### 2.2 Reversible Scroll Choreography (`0.00` → `1.00`)
Scrolling down the intro runway drives continuous normalized progress (`heroEarthPose(width, height, progress, introHeight)` and `getHomeViewportMode` in [`src/features/home/home-journey.ts`](../../../src/features/home/home-journey.ts)) smoothed visually in `HomeJourney.tsx` via bounded passive-scroll `rAF` exponential interpolation (`alpha = 1 - Math.pow(1 - 0.22, Math.max(0.25, dtMs / 16.6667))`) without intercepting native wheel/trackpad/scrollbar scrolling. Scrolling back up reverses every transform seamlessly, and `prefers-reduced-motion: reduce` snaps in one frame with zero continuous `rAF` loops:

| Scroll Progress (`progress`) | Phase Band | Observed Visual & Rendering Behavior |
| :--- | :--- | :--- |
| **`0.00 – 0.44` (`p1`)** | **Phase 1 — Opening Orbit & Wordmark Tuck** | Wordmark scales/translates via GPU `--logo-x/y/scale` from center hero into the compact top-left position while `.flare` recedes (`--flare-opacity`), and Earth settles from its opening horizon crop (`openingDiameter`) toward its responsive resting diameter (`heroEarthPose`). |
| **`0.44 – 0.78` (`p2`)** | **Phase 2 — Full Globe & Borderless Intro Reveal** | Earth shifts to its non-overlapping `desktop`, `stacked`, or `landscape-compact` resting pose as `--intro-opacity` / `--intro-shift-y` reveal `.introColumn` (`data-home-intro-visible="true"`) in borderless `Cormorant Garamond` + `Inter`. |
| **`0.78 – 1.00` + `100svh` Reveal Window** | **Phase 3 — Midnight Galaxy Circular Reveal & Seamless Handoff** | Intro settles cleanly beside the globe during `0.78–1.00`, `--nav-scrim` softens the top bar without snapping across `revealStart`, and `.collectionSurface[data-reveal-enabled='true']` pins natively via CSS `position: sticky; top: 0` (`margin-top: -500svh` desktop / `-420svh` `<768px`) paired with a trailing `.collectionRevealSpacer` (`400svh` / `320svh`, eliminating main-thread `translate3d` counter-scroll and keeping GPU raster tiles warm). Across `[revealStart, revealEnd]`, `HomeJourney.tsx` advances `visualRevealProgress` bidirectionally via frame-rate-independent `stepSmoothProgress` (`REVEAL_SMOOTH_FACTOR = 0.28`) to expand `clip-path: circle(r at 0px vh + anchorOffsetY)` (`revealRadiusEase`, with `anchorOffsetY = Math.max(0, scroll - revealEnd)` and `.stage` `translate3d` hold if smoothing finishes past `revealEnd`), caches DOM writes across `tick()`, and triggers React state updates only on `revealComplete` / `revealEnabled` / `scrollStartOffset` changes (zero re-renders on `hidden <-> revealing`). While `hidden` or `revealing`, `.collectionSurface` stays `inert` / `aria-hidden="true"`, Earth drag/keyboard lock cleanly, and `Starfield` pauses via `engineRef` (`setPaused`). At `p >= 1` (`revealed`), inline `clip-path` clears seamlessly at `scrollY = revealEnd`, `[data-earth-hidden="true"]` pauses WebGL `renderer.render()`, and scrolling back up restores WebGL cleanly (`wasEarthActive`). Under `prefers-reduced-motion: reduce`, `.collectionSurface` returns to `position: relative; margin-top: 0` and `.collectionRevealSpacer` collapses (`display: none; height: 0`) for unclipped `400svh` / `320svh` flow. |

### 2.3 Feature Collection Discovery & Launch Flow
1. **View Mode Switching (`Horizontal` vs. `Vertical`):**
   - A `SegmentedControl` in `CollectionHeader` toggles between `Horizontal` (default) and `Vertical` layout modes, hydrated via `useIsomorphicLayoutEffect` and persisted in `localStorage` (`hts.featureCollection.layout`) via [`src/client/preferences.ts`](../../../src/client/preferences.ts). When `scrollStartOffset` (`revealEnd`) is active, layout switches anchor via `window.scrollTo({ top: scrollStartOffset, behavior: 'auto' })` so switching modes never drifts back into the reveal range.
   - Sticky `.collectionTopbar` aligns the `Hiep Trong` `[data-collection-home]` signature button (`64px` band) with `BellButton`; activating it clears `#features`, scrolls to `top: 0`, and moves focus to `<main tabIndex={-1}>` so `Tab` flows directly to `.skipLink`.
2. **Horizontal Mode (`HorizontalGallery.tsx`):**
   - **Desktop (`>= 1024px`, height `>= 520px`, fine pointer, motion enabled):** Uses a pinned vertical-scroll-to-horizontal-track runway (`features.length - 1` = `11` gap spacing initialized in `useIsomorphicLayoutEffect` via `buildInitialStageMetrics` + `recalculate`), gated at `translate3d(0px, 0, 0)` while `!revealComplete` and anchored to `scrollStartOffset`. Split `useIsomorphicLayoutEffect` hooks (`[scrollStartOffset, recalculate]` vs `[revealComplete]` via `handleScrollRef`) prevent toggling `revealComplete` from forcing `getComputedStyle` or layout reads; translating `[data-testid="horizontal-pinned-track"]` via `rAF`-interpolated `translate3d(...)` and `.progressFill` via `scaleX(...)` uses cached `outerTopRef` (zero per-frame `getBoundingClientRect`), `visibilitychange` pause/resume, smooth `rAF` glide back to `0` on rapid upward reversals inside `inNeighborhood` (immediate reset on far jumps), and `keepFocusedCardVisible` keyboard `Tab` scroll sync.
   - **Compact / Touch / Reduced Motion:** Falls back to an unclipped native horizontal scroll-snap track (`data-testid="horizontal-native-gallery"`, `scroll-snap-type: x proximity`) with zero `rAF` pinning loop.
3. **Vertical Mode (`VerticalGrid.tsx`):**
   - Renders all 12 collection feature cards in a responsive 2-column grid (`grid-cols-1 md:grid-cols-2`, content height only, `viewport={{ once: true, amount: 0.12 }}` with `(index % 2) * 0.08` stagger delay).
4. **Card Selection & Cosmic Launch:**
   - Clicking any `FeatureCard` triggers `TransitionLink` (`Cosmic Launch`), playing the 4-phase star-warp transition (or `<= 300ms` fade under reduced motion) into the target route (`/tasks/daily` or one of the 11 other feature routes; `/tasks/hub` remains available through Universe and the Daily shortcut, while `/notifications` stays in Bell/Universe).

---

## 3. Epic-Specific UI/UX

### 3.1 Composition, Borderless Personal Intro & Earth Rendering (`HomeJourney.tsx` & `home-journey.module.css`)
- **Viewport Containment & Compositor-Only Transforms:** Global `overscroll-behavior-y: none` in `src/app/globals.css` prevents vertical bounce from disrupting the `position: sticky` `100svh` stage. When hydrated (`[data-home-hydrated="true"]`), `.poster`, `.globeInput`, `.flare`, `.wordmark`, and `.introColumn` position exclusively with `translate3d`, `scale`, and `opacity` CSS custom properties (`--earth-tx/ty/scale`, `--poster-tx/ty/scale`, `--flare-tx/ty/scale`, `--logo-x/y/scale`, `--intro-opacity`, `--intro-shift-y`) with zero scroll-frame `left`/`top`/`width` layout mutations.
- **Borderless Editorial Introduction (`.introColumn`):** Uses `Cormorant Garamond` (`.introHeading`, `.introLead`, `.introClosing`) paired with `Inter` body text (`.introBody`) over a subtle behind-text radial ambient falloff (`.introColumn::before`), with zero container card borders, zero `backdrop-filter`, and zero `mask-image`. Hidden intro DOM remains `pointer-events: none; user-select: none` until `data-home-intro-visible="true"`. Responsive rules frame Earth and intro without overlap in `desktop` (`>= 1024px`), `stacked` (`< 1024px` portrait), and `landscape-compact` (`width >= 560 && height < 520`, e.g., `640x360`) modes.
- **Wordmark Geometry:** [`public/brand/wordmark.svg`](../../../public/brand/wordmark.svg) (`viewBox="0 0 1200 430"`) transitions smoothly from centered hero prominence to the tucked top-left corner on scroll without horizontal overflow.
- **3D Earth Shaders & Textures (`earth-scene.ts`):**
  - Renders a 3-mesh globe (`surfaceGeometry` `96x64` desktop / `64x44` phone `<768px`; `auraGeometry` `72x48` desktop / `48x32` phone) with 2K WebP textures (`/earth/earth-day-2k.webp`, `/earth/earth-night-2k.webp`, `/earth/earth-clouds-2k.webp`), `renderer.setPixelRatio(1)`, `anisotropy = 1`, `powerPreference: 'high-performance'`, custom Fresnel atmospheric rim glow shader, and guarded integer resize updates.
  - WebGL rendering pauses whenever `earthOpacity <= 0.005`, the intro section leaves the viewport, or `document.hidden` is true.
- **WebGL Fallback Poster:** Renders `/earth/earth-poster-2k.webp` in `.poster` with matching transforms until `data-webgl="ready"` activates or when WebGL is unavailable.

### 3.2 Background Starfield (`Starfield.tsx` & `starfield-engine.ts`)
- Fixed full-viewport `<canvas>` behind the homepage (`pointer-events: none`) reading star palette tokens (`--cosmos-star-white`, `--cosmos-star-pale`, `--cosmos-star-blue`) via `getComputedStyle`.
- Scales target star count dynamically via `computeTargetStarCount(width, height, hardwareConcurrency)` (`800` / `1500` / `2500` baseline bands adjusted by area ratio and CPU count).
- Automatically pauses its `requestAnimationFrame` loop via `IntersectionObserver` (`inViewport`), `document.hidden` (`visibilitychange`), `setPaused`, or `prefers-reduced-motion: reduce` (including live `MediaQueryList` `'change'` listener in `Starfield.tsx`, rendering a single static frame when reduced motion is enabled).

### 3.3 Feature Collection Cards (`FeatureCard.tsx`, `FeatureThumbnail.tsx` & `feature-collection.module.css`)
- **Section Header & Ambient Backdrop (`CollectionHeader.tsx`, `FeatureCollection.tsx`):**
  - Renders `h2#features-heading` (**My *collection*** — `My` + italic `var(--cosmos-accent)` `collection`) in `.collectionHeading` (`var(--font-display)`, `clamp(2.15rem, 4.4vw, 3.4rem)`, weight `500`, sentence case), `COLLECTION_SUBTITLE_COPY` (`.collectionSubtitle`), and the `Horizontal` / `Vertical` `SegmentedControl`.
  - `.collectionSurface` provides the opaque Midnight Galaxy surface (`--cosmos-navy-0` -> `--cosmos-navy-1` -> `--cosmos-bg-1` + `.midnightStars` prime-tiled pinpoints with `0.72` alpha baked directly into all 7 `color-mix()` radial-gradient stops to avoid offscreen SaveLayer compositing), while `.collectionAmbient` (`inset: 0`) layers pre-blended radial washes behind cards without runtime blur filters.
- **Card Anatomy & Stationary Feedback (`FeatureCard.tsx` & `FeatureThumbnail.tsx`):**
  - Each `TransitionLink` card receives a registry-mapped `--card-accent` CSS token via `FEATURE_ACCENT_VARS` / `getFeatureAccentVar(feature)`.
  - Outer card hit bounds remain completely stationary across `:hover`, `:focus-visible`, and `:active` (zero card translation/tilt or idle motion).
  - Top artwork frame: `<FeatureThumbnail />` renders the 13 bespoke celestial/domain vector presets (`constellation-arc`, `dual-orbit`, `meridian-grid`, `neural-lattice`, `manuscript-lines`, `academic-compass`, `paired-cards`, `harmonic-waves`, `pulse-timeline`, `blueprint-vectors`, `summit-trajectory`, `focus-aperture`, `zenith-crown`) with `.thumbGlow`, `.thumbHairlineBase`, and `.thumbHairlineAccent` inset hairline overlays.
  - Footer metadata: category pill (`.categoryPill`), sentence-case title (`h3.cardTitle`), and `ArrowUpRight` (`.cardArrow`). Equivalent feedback across `@media (hover: hover)`, `:focus-visible` (plus `2px solid var(--cosmos-focus)` outline with `4px` offset), and `:active` (`--dur-instant`) illuminates `.thumbGlow` / `.thumbHairlineAccent`, subtly scales inner `.thumbArtwork` (`scale(1.035)`), tints title/pill, and nudges `.cardArrow` (`translate3d(3px, -3px, 0)`), while `@media (prefers-reduced-motion: reduce)` eliminates transitions and inner artwork/arrow motion.

---

## 4. Current Implementation and Relevant Code Locations

| File Path | Key Exports / Symbols | Role in Homepage Epic |
| :--- | :--- | :--- |
| [`src/app/page.tsx`](../../../src/app/page.tsx) | `HomePage` | Root App Router entry point; mounts `<HomeJourney />`. |
| [`src/features/home/HomeJourney.tsx`](../../../src/features/home/HomeJourney.tsx) | `HomeJourney` | Orchestrates `.skipLink`, ref-paused `<Starfield />`, sticky intro stage (`500svh`/`420svh` reveal, `400svh`/`320svh` fallback), `/brand/wordmark.svg`, `BellButton`, WebGL Earth mount + 2K poster fallback, pointer/keyboard globe rotation, borderless `.introColumn`, native sticky Midnight Galaxy `.collectionSurface` + `.collectionRevealSpacer` + `.collectionTopbar` (`[data-collection-home]`), bidirectional `stepSmoothProgress` reveal smoothing with viewport-locked `anchorOffsetY`, cached DOM writes with `revealComplete`-only React state updates, `<FeatureCollection />`, and `<HomeFooter />` (plus `{ preview }` branch for `/preview/home-motion`). |
| [`src/features/home/home-journey.ts`](../../../src/features/home/home-journey.ts) | `HOME_INTRO_COPY`, `COLLECTION_SUBTITLE_COPY`, `REVEAL_SMOOTH_FACTOR`, `stepSmoothProgress`, `getHomeViewportMode`, `heroEarthPose`, `earthPose`, `revealRadiusEase`, `getRevealMaxRadius`, `getRevealRadius`, `formatRevealClipPath`, `computeCollectionRevealState`, `supportsCollectionReveal`, `clamp`, `ease`, `mix` | Pure scroll-pose math, non-overlapping viewport classifier (`desktop`/`stacked`/`landscape-compact`), circular reveal geometry/state machine, frame-rate-independent bidirectional `stepSmoothProgress` smoothing, viewport-locked `anchorOffsetY` clip formatting, capability check, and verbatim copy constants. |
| [`src/features/home/earth-scene.ts`](../../../src/features/home/earth-scene.ts) | `createEarthScene`, `EarthScene` | Three.js 2K WebP Earth scene, camera, Fresnel atmosphere & cloud shaders, `anisotropy = 1`, resize guard, and disposal lifecycle. |
| [`src/features/home/home-journey.module.css`](../../../src/features/home/home-journey.module.css) | CSS Module classes | Compositor-only hydrated stage, wordmark tuck, flare, borderless `.introColumn`, `.skipLink`, native sticky `.collectionSurface` (`-500svh`/`-420svh`) + `.collectionRevealSpacer` (`400svh`/`320svh`), baked-alpha `.midnightStars` (zero element `opacity`), `.collectionTopbar`, responsive `desktop` / `stacked` / `landscape-compact` layout rules, and reduced-motion unclipped fallbacks (`position: relative`, hidden spacer). |
| [`src/features/home/starfield/Starfield.tsx`](../../../src/features/home/starfield/Starfield.tsx) & [`starfield-engine.ts`](../../../src/features/home/starfield/starfield-engine.ts) | `Starfield`, `StarfieldEngine`, `computeTargetStarCount` | 2D canvas starfield engine with CSS-token palette, `IntersectionObserver` offscreen pause, visibility, guarded optional `paused` prop (`paused !== undefined`), and live reduced-motion listeners. |
| [`src/features/home/feature-collection/FeatureCollection.tsx`](../../../src/features/home/feature-collection/FeatureCollection.tsx) | `FeatureCollection` | Accepts reveal progression props (`revealState`, `revealComplete`, `scrollStartOffset`), reads `FEATURE_REGISTRY` (`src/features/registry.ts`) and `preferences.ts` via `useIsomorphicLayoutEffect`, anchors layout switches to `scrollStartOffset`, and renders `.collectionAmbient` + `HorizontalGallery` or `VerticalGrid`. |
| [`src/features/home/feature-collection/feature-collection.module.css`](../../../src/features/home/feature-collection/feature-collection.module.css) | CSS Module classes | `.collectionHeading`, `.collectionHeadingEmphasis`, `.collectionSubtitle`, `.collectionAmbient` (`inset: 0`), `.progressTrack`/`.progressFill`, stationary `.featureCard`, `--card-accent` hover/focus/active states, and reduced-motion fallbacks. |
| [`src/features/home/feature-collection/CollectionHeader.tsx`](../../../src/features/home/feature-collection/CollectionHeader.tsx) | `CollectionHeader` | Renders `h2#features-heading` (**My *collection***), `COLLECTION_SUBTITLE_COPY`, and the `Horizontal` / `Vertical` `SegmentedControl`. |
| [`src/features/home/feature-collection/HorizontalGallery.tsx`](../../../src/features/home/feature-collection/HorizontalGallery.tsx) | `HorizontalGallery` | Compositor `translate3d` / `scaleX` pinned horizontal runway (`features.length - 1`, gated until `revealComplete`, anchored at `scrollStartOffset`, cached `outerTopRef`, split `[scrollStartOffset, recalculate]` and `[revealComplete]` effects avoiding forced layout reads, smooth `inNeighborhood` upward boundary reversal vs far-jump immediate reset, keyboard focus sync) with native snap fallback on compact/touch/reduced-motion viewports. |
| [`src/features/home/feature-collection/VerticalGrid.tsx`](../../../src/features/home/feature-collection/VerticalGrid.tsx) | `VerticalGrid` | 2-column responsive card grid (1-column on `< 768px`) deferring `whileInView` entrance reveal until `revealComplete` (immediate under reduced motion). |
| [`src/features/home/feature-collection/FeatureCard.tsx`](../../../src/features/home/feature-collection/FeatureCard.tsx) | `FeatureCard`, `getFeatureAccentVar` | Individual destination card wrapped in `TransitionLink` with `--card-accent` token binding. |
| [`src/features/home/feature-collection/FeatureThumbnail.tsx`](../../../src/features/home/feature-collection/FeatureThumbnail.tsx) | `FeatureThumbnail` | 13 bespoke vector SVG illustrations for feature cards with `.thumbGlow` and `.thumbHairline*` overlays. |
| [`src/features/home/HomeFooter.tsx`](../../../src/features/home/HomeFooter.tsx) | `HomeFooter` | Minimal cosmic footer crediting NASA Visible Earth and Solar System Scope (CC BY 4.0). |
| [`tests/features/home/home-journey.test.ts`](../../../tests/features/home/home-journey.test.ts), [`feature-collection.test.tsx`](../../../tests/features/home/feature-collection.test.tsx), [`starfield-and-home.test.tsx`](../../../tests/features/home/starfield-and-home.test.tsx) | Vitest suites (`30` tests across these 3 suites; `36` total across `5` files in `tests/features/home/`) | Unit/component tests covering `heroEarthPose` non-overlap, reveal geometry/ease math, `REVEAL_SMOOTH_FACTOR` & bidirectional `stepSmoothProgress` (frame-rate independence, `<0.0002` settle, direction reversal), `formatRevealClipPath` `anchorOffsetY`, `HomeJourney` sticky `.collectionSurface` + `.collectionRevealSpacer`, rapid bidirectional reversals without overshoot or `revealStart` snap, `inert`/focus guards, `#features` direct entry & `[data-collection-home]` focus reset, `StarfieldEngine` pause/resume, `FeatureCollection` `revealComplete`/`scrollStartOffset` gating without forced `getComputedStyle`/layout reads, smooth `HorizontalGallery` boundary reversal vs far-jump reset, `VerticalGrid` deferred `whileInView`, `--card-accent` feedback, focus sync, and `clip-path`/reduced-motion fallbacks. |

---

## 5. Acceptance Criteria

1. **Opening Visual Fidelity & Borderless Introduction:** Loading `/` displays the deep-space starfield, `HIEP TRONG` wordmark (`/brand/wordmark.svg`), `.skipLink`, `BellButton` (opening isolated Sakura `NotificationPopover` above hero and collection layers without changing `<main data-theme="cosmos">`), and 2K WebP 3D night-side Earth (or `/earth/earth-poster-2k.webp` fallback), transitioning into borderless `Cormorant Garamond` + `Inter` personal intro copy without Earth/text overlap or horizontal overflow across `320px`–`1440px` and `640x360` compact landscape viewports.
2. **No Legacy Opening CTA or Pause Button:** Neither a floating opening "Explore my space" button nor a visible Pause button is rendered anywhere on `/`.
3. **Midnight Galaxy Reveal & Smooth Reversal:** Scrolling across `[revealStart, revealEnd]` expands the native sticky Midnight Galaxy `.collectionSurface` (paired with `.collectionRevealSpacer`, `0px` vertical jitter) cleanly from `(0px, 100vh)` over stationary Earth, intro, and collection via bidirectional `stepSmoothProgress` (`0` drift when scroll stops, `0px` jump at completion), keeping `.collectionSurface` `inert` until `p >= 1`, locking Earth input while covered, pausing WebGL & starfield once covered, and reversing smoothly (including smooth `HorizontalGallery` boundary glide and WebGL re-entry) on upward scroll.
4. **Globe Interactivity:** Dragging horizontally with a pointer or pressing `ArrowLeft` / `ArrowRight` while focused on `.globeInput` rotates the Earth smoothly when unrevealed.
5. **Feature Collection & Stationary Card Feedback:** **My *collection*** renders in sentence case (`h2#features-heading`) alongside `COLLECTION_SUBTITLE_COPY`, sticky `[data-collection-home]` signature navigation, and 12 `FEATURE_REGISTRY` destinations, filtering out only `tasks-hub` at the collection boundary. The canonical registry, Tasks Hub route, and Universe destination remain intact. Horizontal/Vertical toggles anchor cleanly and persist across reloads (`hts.featureCollection.layout`). Cards preserve stationary hit bounds and provide equivalent `--card-accent` hairline glow + inner artwork feedback across `:hover`, `:focus-visible` (`2px` `--cosmos-focus` + `Tab` scroll sync), and `:active` touch press.
6. **Accessibility & Resource Hygiene:** Background tabs (`document.hidden === true`) and offscreen starfield (`IntersectionObserver`) pause animation loops; `prefers-reduced-motion: reduce` removes pinning, hover scaling/transitions, and continuous `rAF` loops; WebGL geometries, materials, and textures are disposed cleanly on unmount.

---

## 6. Open Decisions and Supporting References

### 6.1 Open Decisions & Audit Status Touching Homepage
- **Guardrail Test Stale `Wordmark.tsx` Exception Path ([`OD-04`](../../../PROJECT_DESCRIPTION.md#od-04)):** [`tests/design/craft-and-architecture-guardrails.test.ts`](../../../tests/design/craft-and-architecture-guardrails.test.ts) (line 23) still lists `src/features/home/Wordmark.tsx` as the uppercase exception file path even though `Wordmark.tsx` was replaced by `/brand/wordmark.svg` in `HomeJourney.tsx`.
- **Audit Findings ([`docs/audit/BUG_INVENTORY.md`](../../../docs/audit/BUG_INVENTORY.md)):**
  - `C13` (*Resolved*): `Starfield.tsx` subscribes to `window.matchMedia('(prefers-reduced-motion: reduce)')` `'change'` events and updates `StarfieldEngine.setReducedMotion` dynamically (verified in `tests/features/home/starfield-and-home.test.tsx`).
  - `S05` (*Suspected / mitigated*): Async Three.js texture loads in `earth-scene.ts` check `signal.aborted` and dispose loaded textures + `renderer` if aborted before completion.

### 6.2 Supporting References & Local Media Inventory
- **Texture Attribution (Committed):** [`../../../public/earth/ATTRIBUTION.md`](../../../public/earth/ATTRIBUTION.md)
- **Phase 01 Review Evidence (Local `review/` directory, preserved read-only):**
  - [`../../../review/phase01/README.md`](../../../review/phase01/README.md) — Stage 1 static review packet and verification metrics.
  - [`../../../review/phase01/MOTION.md`](../../../review/phase01/MOTION.md) — Stage 2 motion choreography curves and review harness notes.
- **Local Reference Media (`sources/`, gitignored):**
  - HTML prototype: `sources/html/sample0.html` (opening wordmark + Earth horizon reference).
  - Images: `sources/img/img0.png`, `img1.png`, `img2.jpg`, `img3.jpg`, `img4.jpg`, `img5.png`, `img6.png`, `img7.png`, `img8.png`, `img9.png`.
  - Videos: `sources/vid/vid0.mp4` (3D Earth scroll inspiration), `vid1.mp4` (horizontal card gallery reference), `vid4.mp4` (starfield motion), `vid5.mp4` (Cosmic Launch warp inspiration), `vid6.mp4`, `vid7.mp4`. *(Note: `vid2.mp4` and `vid3.mp4` are not present in `sources/vid/`.)*
