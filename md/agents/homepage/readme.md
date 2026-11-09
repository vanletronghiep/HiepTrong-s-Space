# Homepage / Landing Journey Epic Specification

`md/agents/homepage/readme.md` is the canonical engineering and design specification for the **Homepage / Landing Journey** epic (`/`).

- **Related System Reference:** [`../../../PROJECT_DESCRIPTION.md`](../../../PROJECT_DESCRIPTION.md)
- **Related Shared UI/UX Baseline:** [`../shared/uiux.md`](../shared/uiux.md)
- **Implementation History & Audit Reports:** [`reports.md`](reports.md)
- **Earth Texture License Attribution:** [`../../../public/earth/ATTRIBUTION.md`](../../../public/earth/ATTRIBUTION.md)

---

## 1. Purpose, Scope, and Relationships

### 1.1 Epic Purpose
The Homepage (`/`) is the front door to **Hiep Trong Space** — a contemplative, museum-grade 3D Earth scroll journey ("The Cosmos") that transitions seamlessly into the **Feature Collection** (`Explore my space`), where the user launches into built workspace tools (`/tasks/daily`, `/tasks/hub`) or previews the 11 upcoming personal space modules.

### 1.2 Epic Scope
- **In Scope:**
  - Opening 3D night-side Earth hero stage, vector `HIEP TRONG` wordmark composition, and background starfield canvas.
  - Reversible scroll-driven camera and atmospheric light-flare choreography (`400vh` scroll runway).
  - Interactive Earth rotation (continuous `60s` orbit, pointer drag, and `ArrowLeft`/`ArrowRight` keyboard controls).
  - Feature Collection section (`#features`) with static `Explore my space` heading, persistent `Horizontal` / `Vertical` view mode switcher, 13 bespoke feature cards, and `Cosmic Launch` route navigation.
  - Reduced-motion, WebGL fallback (`earth-poster-4k.webp` / `2k.webp`), and background-tab (`visibilitychange`) resource conservation.
  - Homepage footer with NASA / Solar System Scope attribution.
- **Out of Scope:**
  - Workspace topbar (`WorkspaceShell` and `UniverseMenu` only wrap non-root workspace routes).
  - Task domain state, SQLite queries, or notifications (owned by [`../tasks/readme.md`](../tasks/readme.md)).

---

## 2. Confirmed Requirements and User Flows

### 2.1 Opening Composition & Interactive Earth Flow
1. **Immediate Cosmic Stage (`/`):**
   - Upon loading `/`, the user enters a full-viewport (`100vh` sticky inside a `400vh` scroll stage) deep-space scene.
   - The `HIEP TRONG` vector wordmark ([`public/brand/wordmark.svg`](../../../public/brand/wordmark.svg)) sits cleanly in the upper-middle sky (`top: clamp(18px, 3vh, 42px)`), subtly backlit by a radial warm halo and partially occluded by the rising curvature of the 3D Earth (`z-index` layering: starfield/backlit wordmark behind the Earth silhouette and rim glow).
2. **Retired Legacy Controls (Confirmed Decisions):**
   - **No Opening "Explore my space" CTA Pill / Morph:** Earlier Phase 01 prototypes included a floating "Explore my space" button at the bottom of the opening screen that morphed into the section heading on scroll. By confirmed owner decision, the opening CTA pill and scroll-morph were **removed**. `Explore my space` is rendered strictly as the static section heading (`h2#features-heading`) of the Feature Collection section.
   - **No User-Facing Pause Button:** Earlier specs mentioned a visible Pause button for the starfield/Earth loop. By confirmed owner decision, **no user-facing Pause button exists**. Instead, animations automatically pause when `document.hidden` is `true` (`visibilitychange`) and respect `prefers-reduced-motion: reduce`.
3. **Interactive Earth Rotation:**
   - **Ambient Orbit:** In standard motion mode, the 3D Earth rotates continuously at `2π / 60` radians per second (`60s` per full revolution).
   - **Pointer Drag:** Users can grab and drag horizontally anywhere on the Earth interactive zone (`cursor: grab` / `grabbing`) to spin the globe manually (`0.0055 rad/px`).
   - **Keyboard Control:** Focusing the interactive globe container (`role="application"`, `aria-label="Interactive 3D Earth. Drag horizontally or use Left and Right arrow keys to rotate."`) and pressing `ArrowLeft` or `ArrowRight` rotates the globe in `±0.12 rad` steps.

### 2.2 Reversible Scroll Choreography (`0.00` → `1.00`)
Scrolling down the `400vh` hero stage drives a deterministic, continuous state machine (`computeJourneyState(progress)` in [`src/features/home/home-journey.ts`](../../../src/features/home/home-journey.ts)) smoothed via exponential damping (`dampNormalizedProgress`). Scrolling back up reverses every parameter seamlessly:

| Scroll Progress (`p`) | Phase Name | Visual & Camera Behavior |
| :--- | :--- | :--- |
| **`0.00 – 0.25`** | **Phase 1 — Opening Orbit & Sunrise Rim** | Wordmark gently drifts upward (`translateY` to `-28px`) and fades out by `p = 0.24`. Earth scales up (`1.00` → `1.12`) as the golden horizon flare (`flareIntensity`) builds along the upper limb. |
| **`0.25 – 0.50`** | **Phase 2 — Solar Crest & Bloom** | The sun light source rises over the Earth's curvature; atmospheric rim glow and warm golden bloom (`--journey-flare-gold`) peak around `p = 0.42–0.50` while the camera glides closer (`earthScale` up to `1.34`). |
| **`0.50 – 0.78`** | **Phase 3 — Deep Space Ascent** | The Earth descends below the lower viewport frame (`earthY` shifts downward) and the warm flare recedes into pure deep-space black (`--journey-space-black`), clearing the stage for the Feature Collection. |
| **`0.78 – 1.00`** | **Phase 4 — Feature Collection Reveal** | The sticky 3D stage yields (`stageOpacity` fades toward `0.18`), revealing the `#features` collection section with staggered card entry (`collectionReveal`: `0` → `1`). |

### 2.3 Feature Collection Discovery & Launch Flow
1. **View Mode Switching (`Horizontal` vs. `Vertical`):**
   - A `SegmentedControl` in the collection header toggles between `Horizontal` (default) and `Vertical` layout modes, persisted in `localStorage` via [`src/client/preferences.ts`](../../../src/client/preferences.ts).
2. **Horizontal Mode (`HorizontalGallery.tsx`):**
   - **Desktop (`>= 900px`, standard motion):** Uses a pinned vertical-scroll-to-horizontal-track runway where scrolling down translates the 13 feature cards horizontally across the viewport, paired with Previous/Next `IconButton` controls and a live progress bar.
   - **Compact / Touch / Reduced Motion:** Falls back to a native horizontal scroll-snap track (`scroll-snap-type: x mandatory`).
3. **Vertical Mode (`VerticalGrid.tsx`):**
   - Renders all 13 feature cards in a responsive 2-column grid (`grid-template-columns: repeat(2, minmax(0, 1fr))` on `>= 768px`, 1-column on mobile).
4. **Card Selection & Cosmic Launch:**
   - Clicking any `FeatureCard` triggers `TransitionLink` (`Cosmic Launch`), playing the 4-phase star-warp transition (or `<= 300ms` fade under reduced motion) into the target route (`/tasks/daily`, `/tasks/hub`, or one of the 11 `BlankPage` feature shells).

---

## 3. Epic-Specific UI/UX

### 3.1 Composition & Layering (`HomeJourney.tsx` & `home-journey.module.css`)
- **Viewport Containment:** Global `overscroll-behavior-y: none` in `src/app/globals.css` prevents vertical bounce from disrupting the `position: sticky` `100vh` stage.
- **Wordmark Geometry:** [`public/brand/wordmark.svg`](../../../public/brand/wordmark.svg) (`viewBox="0 0 1200 430"`) is sized with `width: min(88vw, 1180px)` so the letters span majestically across the upper horizon without clipping on narrow screens.
- **3D Earth Shaders & Lighting (`earth-scene.ts`):**
  - Renders an Earth sphere (`64x64` segments) with night city lights (`earth-night-2k.webp` / `4k.webp`), day albedo (`earth-day-2k.webp` / `4k.webp`), an elevated cloud shell (`earth-clouds-2k.webp` / `4k.webp`), and a custom Fresnel atmospheric rim glow shader.
  - Caps pixel ratio at `Math.min(window.devicePixelRatio, 2)` for crisp rendering without GPU thermal throttling.
- **WebGL Fallback Poster:**
  - If WebGL context creation fails or while textures stream in, a high-resolution static WebP poster (`/earth/earth-poster-4k.webp` on wide/HiDPI displays, `/earth/earth-poster-2k.webp` on mobile) renders in place with matching CSS transforms.

### 3.2 Background Starfield (`Starfield.tsx` & `starfield-engine.ts`)
- Fixed full-viewport `<canvas>` behind the homepage (`z-index: 0`, `pointer-events: none`).
- Generates deterministic multi-depth star layers (`180` stars on desktop, scaled by viewport area) with subtle twinkle modulation and gentle pointer parallax (`±8px`).
- Automatically pauses its `requestAnimationFrame` loop when `document.hidden` is true or when `prefers-reduced-motion: reduce` is active (rendering a single static starry frame).

### 3.3 Feature Collection Cards (`FeatureCard.tsx` & `FeatureThumbnail.tsx`)
- **Section Header (`CollectionHeader.tsx`):**
  - Renders `h2#features-heading` with text `Explore my space` in `var(--font-display)` (`clamp(34px, 4.3vw, 60px)`, weight `500`, sentence case) and the `Horizontal` / `Vertical` segmented control.
- **Card Anatomy (`FeatureCard.tsx`):**
  - Dark translucent cosmic glass surface (`background: var(--cosmos-surface)`, `border: 1px solid var(--cosmos-border)`, `border-radius: var(--radius-xl)`).
  - Top artwork frame: `<FeatureThumbnail />` rendering bespoke celestial/domain vector art for each of the 13 features (`constellation-arc`, `dual-orbit`, `meridian-grid`, `neural-lattice`, `manuscript-lines`, `academic-compass`, `paired-cards`, `harmonic-waves`, `pulse-timeline`, `blueprint-vectors`, `summit-trajectory`, `focus-aperture`, `zenith-crown`).
  - Metadata row: category label and a `Soon` badge (`Badge variant="cosmos"`) when `feature.status === 'blank'`.
  - Title (`h3` in `--font-display`, `24px`).
  - Hover/focus elevation: `translateY(-4px)` with `--cosmos-accent` border glow.

---

## 4. Current Implementation and Relevant Code Locations

| File Path | Key Exports / Symbols | Role in Homepage Epic |
| :--- | :--- | :--- |
| [`src/app/page.tsx`](../../../src/app/page.tsx) | `HomePage` | Root App Router entry point; mounts `<HomeJourney />`. |
| [`src/features/home/HomeJourney.tsx`](../../../src/features/home/HomeJourney.tsx) | `HomeJourney` | Orchestrates `<Starfield />`, sticky `400vh` scroll stage, `/brand/wordmark.svg`, WebGL Earth mount + poster fallback, pointer/keyboard globe rotation, `<FeatureCollection />`, and `<HomeFooter />`. |
| [`src/features/home/home-journey.ts`](../../../src/features/home/home-journey.ts) | `computeJourneyState`, `dampNormalizedProgress`, `selectPosterSource`, `JourneyState` | Pure math and scroll-choreography state machine tested directly by unit tests. |
| [`src/features/home/earth-scene.ts`](../../../src/features/home/earth-scene.ts) | `createEarthScene`, `EarthSceneController` | Three.js scene, camera, Fresnel atmosphere shader, cloud layer, texture loader, and disposal lifecycle. |
| [`src/features/home/home-journey.module.css`](../../../src/features/home/home-journey.module.css) | CSS Module classes | Layout, sticky viewport stage, wordmark positioning, flare overlays, and responsive rules. |
| [`src/features/home/starfield/Starfield.tsx`](../../../src/features/home/starfield/Starfield.tsx) & [`starfield-engine.ts`](../../../src/features/home/starfield/starfield-engine.ts) | `Starfield`, `createStarfieldEngine` | 2D canvas starfield renderer with visibility and reduced-motion lifecycle hooks. |
| [`src/features/home/feature-collection/FeatureCollection.tsx`](../../../src/features/home/feature-collection/FeatureCollection.tsx) | `FeatureCollection` | Reads `FEATURE_REGISTRY` (`src/features/registry.ts`) and `preferences.ts`, rendering `CollectionHeader` + `HorizontalGallery` or `VerticalGrid`. |
| [`src/features/home/feature-collection/CollectionHeader.tsx`](../../../src/features/home/feature-collection/CollectionHeader.tsx) | `CollectionHeader` | Renders static `h2#features-heading` (`Explore my space`) and the `Horizontal` / `Vertical` `SegmentedControl`. |
| [`src/features/home/feature-collection/HorizontalGallery.tsx`](../../../src/features/home/feature-collection/HorizontalGallery.tsx) | `HorizontalGallery` | Pinned scroll-driven horizontal track on desktop; native snap carousel on mobile/reduced-motion. |
| [`src/features/home/feature-collection/VerticalGrid.tsx`](../../../src/features/home/feature-collection/VerticalGrid.tsx) | `VerticalGrid` | 2-column responsive card grid (1-column on `< 768px`). |
| [`src/features/home/feature-collection/FeatureCard.tsx`](../../../src/features/home/feature-collection/FeatureCard.tsx) | `FeatureCard` | Individual feature card wrapped in `TransitionLink`. |
| [`src/features/home/feature-collection/FeatureThumbnail.tsx`](../../../src/features/home/feature-collection/FeatureThumbnail.tsx) | `FeatureThumbnail` | 13 bespoke vector SVG illustrations for the feature cards. |
| [`src/features/home/HomeFooter.tsx`](../../../src/features/home/HomeFooter.tsx) | `HomeFooter` | Minimal cosmic footer crediting NASA Visible Earth and Solar System Scope (CC BY 4.0). |
| [`tests/features/home/home-journey.test.ts`](../../../tests/features/home/home-journey.test.ts), [`feature-collection.test.tsx`](../../../tests/features/home/feature-collection.test.tsx), [`starfield-and-home.test.tsx`](../../../tests/features/home/starfield-and-home.test.tsx) | Vitest suites | Unit tests for scroll-state math and component tests for `FeatureCollection` mode switching, `Starfield`, and card links. |

---

## 5. Acceptance Criteria

1. **Opening Visual Fidelity:** Loading `/` displays the deep-space starfield, the backlit `HIEP TRONG` vector wordmark (`/brand/wordmark.svg`), and the 3D night-side Earth (or high-res WebP poster fallback before WebGL readiness) with zero layout shift or horizontal overflow.
2. **No Legacy Opening CTA or Pause Button:** Neither a floating opening "Explore my space" button nor a visible Pause button is rendered anywhere on `/`.
3. **Smooth Reversible Scroll Journey:** Scrolling from top to bottom of the `400vh` hero stage smoothly progresses through all 4 choreography phases (`computeJourneyState`), and scrolling back to the top restores the opening wordmark and horizon state without visual glitches.
4. **Globe Interactivity:** Dragging horizontally with a pointer or pressing `ArrowLeft` / `ArrowRight` while focused on the globe rotates the Earth smoothly.
5. **Feature Collection & Persistence:** `Explore my space` renders in sentence case (`h2#features-heading`) above all 13 features from `FEATURE_REGISTRY`. Switching between `Horizontal` and `Vertical` modes updates the layout immediately and persists across page reloads via `localStorage`.
6. **Accessibility & Resource Hygiene:** Background tabs (`document.hidden === true`) pause WebGL and canvas animation loops; `prefers-reduced-motion: reduce` disables continuous rotation/scroll pinning; WebGL geometries, materials, and textures are disposed on unmount.

---

## 6. Open Decisions and Supporting References

### 6.1 Open Decisions Touching Homepage
- **Guardrail Test Stale `Wordmark.tsx` Exception Path ([`OD-04`](../../../PROJECT_DESCRIPTION.md#od-04)):** [`tests/design/craft-and-architecture-guardrails.test.ts`](../../../tests/design/craft-and-architecture-guardrails.test.ts) (line 23) still lists `src/features/home/Wordmark.tsx` as the uppercase exception file path even though `Wordmark.tsx` was replaced by `/brand/wordmark.svg` in `HomeJourney.tsx`.
- **Minor Audit Findings ([`docs/audit/BUG_INVENTORY.md`](../../../docs/audit/BUG_INVENTORY.md)):**
  - `C13` (Low): `Starfield.tsx` reads `window.matchMedia` inside an effect without subscribing to runtime `change` events if the OS reduced-motion setting is toggled mid-session (`HomeJourney.tsx` already subscribes to `change`).
  - `S05` (Suspected): Rapid unmount before async Three.js texture loads finish relies on `disposed` flag cleanup in `earth-scene.ts`.

### 6.2 Supporting References & Local Media Inventory
- **Texture Attribution (Committed):** [`../../../public/earth/ATTRIBUTION.md`](../../../public/earth/ATTRIBUTION.md)
- **Phase 01 Review Evidence (Local `review/` directory, preserved read-only):**
  - [`../../../review/phase01/README.md`](../../../review/phase01/README.md) — Stage 1 static review packet and verification metrics.
  - [`../../../review/phase01/MOTION.md`](../../../review/phase01/MOTION.md) — Stage 2 motion choreography curves and review harness notes.
- **Local Reference Media (`sources/`, gitignored):**
  - HTML prototype: `sources/html/sample0.html` (opening wordmark + Earth horizon reference).
  - Images: `sources/img/img0.png`, `img1.png`, `img2.jpg`, `img3.jpg`, `img4.jpg`, `img5.png`, `img6.png`, `img7.png`, `img8.png`, `img9.png`.
  - Videos: `sources/vid/vid0.mp4` (3D Earth scroll inspiration), `vid1.mp4` (horizontal card gallery reference), `vid4.mp4` (starfield motion), `vid5.mp4` (Cosmic Launch warp inspiration), `vid6.mp4`, `vid7.mp4`. *(Note: `vid2.mp4` and `vid3.mp4` are not present in `sources/vid/`.)*
