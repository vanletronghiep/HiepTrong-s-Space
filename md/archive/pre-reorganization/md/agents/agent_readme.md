# Mission: Complete Hiep Trong's Space — Daily Task Management V2 and Homepage Stabilization

## 0. Autonomous Execution Instructions — Read First

You are working on **Hiep Trong's Space**, an existing local-first personal management web application built with Next.js, React, TypeScript, Tailwind CSS, Motion, and SQLite.

This is an **end-to-end implementation mission**, not a planning-only task.

The owner will be unavailable during execution. You are explicitly authorized to make reasonable technical and design decisions independently within the scope below.

### Critical execution rules

1. **Do not ask the user questions or request approval between phases.** Resolve ordinary ambiguities using the current source code, project documentation, supplied references, and sound engineering judgment.
2. **Complete all three phases sequentially.** Do not stop after producing a plan, explanation, or partial implementation.
3. **Recover and continue existing work.** Do not restart a task that was partially implemented before the previous Codex session reached its usage limit.
4. **Use the latest source code as the implementation baseline.** Documentation may be outdated.
5. **Preserve all working functionality**, application architecture, user data, and unrelated changes.
6. **Investigate root causes.** Avoid quick CSS patches that merely hide symptoms.
7. **Implement, test, inspect, refine, and revalidate.** A successful compilation alone does not establish visual or interaction correctness.
8. **Make progress independently.** If one approach fails, diagnose the failure and try a safe alternative.
9. **Maintain a detailed execution checklist** and update it as each phase progresses.
10. **Do not claim success without evidence.** If a genuine technical limitation prevents an operation, explain it in the final report, complete the remaining independent work when safe, and identify what remains.

Do not perform destructive repository operations, overwrite unrelated work, or delete user data.

### Required execution order

**PHASE 1:** Recover and complete the unfinished Daily Task Management functionality.

**PHASE 2:** Apply the complete Celestial V2 visual redesign.

**PHASE 3:** Fix homepage/global scrolling bugs and implement the requested homepage refinements.

**FINAL:** Run regression checks, perform browser-based visual verification, refine remaining issues, and produce a comprehensive completion report.

Do not change this order.

---

# PHASE 1 — Recover and Complete the Interrupted Codex Work

## 1.1 Background

Approximately one hour before this instruction, Codex reached its usage limit while working on the remaining Daily Task Management functionality.

The previous implementation may be partially completed.

Your first responsibility is to **resume that unfinished work from its actual current state**, rather than beginning a new implementation.

## 1.2 Recover the previous working context

Before editing any files:

1. Inspect the latest repository state and working-tree changes.
2. Recover any accessible previous Codex plan, task checklist, conversation context, or implementation notes.
3. Read `PROJECT_DESCRIPTION.md`, relevant documents under `md/`, and any current applicable agent instructions.
4. Inspect the implemented Daily Task Management components and tests.
5. Identify functionality that was completed, partially implemented, or not yet started.
6. Determine which changes belong to the interrupted task and which are unrelated user modifications.

Prioritize actual source-code evidence over outdated documentation.

The previously revoked historical `AGENTS.md` instructions described in `PROJECT_DESCRIPTION.md` must not be treated as active policy. If a newer `AGENTS.md` exists, follow its currently applicable instructions.

Do not overwrite or discard partially completed work.

### Relevant implementation areas

Start with the existing source files and trace their current dependencies:

- `src/features/tasks/DailyBoard.tsx`
- Day carousel components
- `src/features/tasks/WeekView.tsx`
- `src/features/tasks/MonthView.tsx`
- `src/features/tasks/OverdueList.tsx`
- `src/features/tasks/TaskCard.tsx`
- `src/features/tasks/TaskForm.tsx`
- `src/client/queries/tasks.ts`
- Related design components, tests, and styles

Do not assume filenames or component responsibilities are unchanged if the previous session refactored them.

## 1.3 Finish the remaining task functionality

Continue the previous implementation plan until the intended Daily Task Management features are complete.

Ensure that the currently agreed behaviors are implemented correctly.

### Day mode

The Day dashboard must preserve its distinctive three-day carousel:

- Yesterday, Today, and Tomorrow are the three available boards.
- Today is initially the largest active board in the center.
- The neighboring boards remain partially visible with gradual fade and blur.
- Switching the active day smoothly expands the selected board into the dominant position and moves the other boards away.
- Hide unnecessary navigation arrows at the first and last day.
- Preserve horizontal drag/swipe and supported trackpad navigation.
- On mobile, show only the active board, with swipe navigation.
- Avoid unwanted navigation when interacting with task controls or vertically scrolling task lists.

### Task-list presentation

For each day board:

- Display three complete task cards within the initial viewport when at least three tasks exist.
- If more than three tasks exist, reveal approximately half of the fourth card with a subtle lower fade.
- Make the list genuinely vertically scrollable.
- Display a small "Scroll for more" hint only when additional content exists.
- Use a celestial-themed scrolling indicator rather than an ordinary browser scrollbar.
- Maintain accessible scrolling through touch, wheel, trackpad, and keyboard.
- Calculate the visual limit using the actual rendered card sizes rather than relying on arbitrary assumptions about fixed card heights.

These rules apply whenever a board becomes active.

Inactive previews may display a condensed representation, but must not accidentally expose working controls through blur or clipping.

### Week and Month modes

Complete the previously planned Week and Month behavior according to the existing implementation plan and project specifications.

Preserve:

- Correct task dates and time-zone behavior
- Task grouping and sorting
- Existing task interactions
- Existing completion-state behavior
- Navigation and date selection
- Responsive usability
- Shared task records across views

Do not invent unrelated dashboard features simply to fill unused space.

### Existing functionality

Preserve all current task-management operations, including creation, editing, completion, reopening, deleting, scheduling, overdue transfers, notifications, and shared state with Tasks Hub.

Maintain the distinction between `scheduledDate` and `deadlineAt`.

Do not duplicate task stores or introduce a second source of truth.

## 1.4 Validate Phase 1

Before beginning the visual redesign:

- Run relevant automated tests.
- Run `npm run check`.
- Run `npm run build` if supported by the environment.
- Test the completed interactions in the browser.
- Verify desktop, tablet, and mobile behavior.
- Test rapid carousel navigation and scrolling.
- Verify no regressions in task operations.

Fix failures caused by the implementation.

If Git is operational and the changes can be isolated safely, create a checkpoint commit for the completed functional work.

Do not include unrelated user modifications in that commit.

If Git metadata is unavailable or the working-tree state prevents a safe commit, preserve the code and record that limitation. Do not reset, clean, or overwrite user work merely to manufacture a clean checkpoint.

**Phase 1 exit condition:** The previously interrupted work is recovered, the intended functionality is complete to the extent supported by available specifications, and the functional baseline has been validated.

---

# PHASE 2 — Daily Task Management V2: Celestial Visual Fidelity Upgrade

## 2.1 Objective

Enhance the existing Daily Task Management interface to closely match the detailed celestial design supplied by the owner.

The target design combines:

- A luminous light-lavender atmosphere
- Elegant zodiac artwork
- Constellation patterns
- Spiral galaxies
- Planetary illustrations
- Delicate orbital geometry
- Soft nebula clouds
- Refined celestial ornaments inside UI components
- Premium editorial typography
- Smooth, restrained interactions

The current application already has a usable foundation.

Your objective is not to rebuild it, but to transform its visual presentation into a richer, more sophisticated celestial environment.

**Phase 2 is exclusively a visual/UI/UX enhancement phase.**

All functionality completed in Phase 1 must remain intact.

## 2.2 Mandatory reference inspection

Before modifying the design, carefully inspect:

- `PROJECT_DESCRIPTION.md`
- `md/DESIGN_SPEC.md`
- `md/ASSET_GUIDE.md`
- `src/design/tokens.css`
- Existing Daily Task Management components and styles
- The supplied target and current-state screenshots
- The supplied celestial SVG assets

The design documentation files are located in the `md/` directory.

Search the repository for the image references and assets, especially:

- `sources/img/daily-v2-reference/`
- `sources/img/daily-v2-reference/assets/`

Expected target reference names may include:

- `daily-v2-target-reference.png`
- `daily-current-reference.png`

Resolve the actual filenames and paths from the repository rather than assuming every suggested path exists.

If an expected filename differs, use the appropriate existing asset.

The **target image is the primary artistic reference**. `md/DESIGN_SPEC.md` provides the detailed visual interpretation.

Study the individual visual regions instead of treating the image as one undifferentiated screenshot.

## 2.3 Visual fidelity principles

This project should feel like a premium celestial productivity application.

The visual direction is:

**Soft, elegant, astronomical, artistic, luminous, and highly detailed without sacrificing readability.**

Avoid:

- Generic SaaS dashboard styling
- Plain white boxes with minimal artwork
- Excessive shadows
- Heavy decorative borders
- Saturated neon glows
- Generic glassmorphism
- Unnecessary 3D effects
- Overly dark backgrounds
- Busy decoration behind important text
- Uncontrolled animations

The goal is not to increase visual noise.

The goal is to **introduce carefully composed artistic detail**.

Do not attempt to reproduce the image solely by adding a large background image or increasing the number of random stars.

The artwork must be distributed across meaningful visual layers.

---

## 2.4 Background reconstruction — highest priority

Maintain the original light-lavender workspace theme.

Reconstruct the target's layered celestial atmosphere.

### Upper-left region

Add a large, partially cropped zodiac wheel.

The illustration should include:

- Multiple concentric circles
- Thin radial divisions
- Subtle zodiac symbols
- Delicate astronomical ticks
- Soft lavender outlines
- Low-opacity orbital details

The wheel should extend beyond the viewport rather than appearing as an ordinary centered illustration.

Use `zodiac-wheel.svg` if available.

### Upper-center region

Introduce a softly luminous spiral galaxy.

The artwork should consist of:

- Translucent elliptical rings
- A faintly glowing center
- Tiny stars surrounding the structure
- Pale lavender atmospheric haze
- Subtle depth through overlapping gradients

Use `spiral-galaxy.svg` where appropriate.

It should remain a decorative element, never a competing focal point.

### Upper-right region

Add a small Saturn-inspired planet.

The planet should have:

- A pale violet surface
- Delicate angled rings
- Restrained shading
- Faint orbital particles
- A subtle glow

Use `ringed-planet.svg`.

### Side margins

Introduce small constellations and scattered celestial details.

Use deliberate compositions rather than uniform random distributions:

- Connected star clusters
- Four-point sparkles
- Tiny points of light
- Thin orbital arcs
- Faint diagonal constellation lines
- Occasional brighter but still subtle stars

Use `constellation-sprinkles.svg` where appropriate.

### Lower-page environment

The reference contains substantial visual depth toward the bottom.

Recreate this with:

- Pale violet nebula clouds
- Soft atmospheric gradients
- Partially cropped planetary illustrations
- Curving orbital paths
- Small glowing star clusters
- A large zodiac-wheel fragment toward the lower-right corner

Use `nebula-clouds.svg` and other suitable supplied assets.

### Background implementation rules

Use independent decorative layers positioned behind real content.

Make the artwork responsive and noninteractive.

Avoid:

- Visible image seams
- Sudden changes in background color
- Abrupt decorative clipping
- Repeating patterns that resemble wallpaper
- Fixed decorations covering important UI
- Expensive per-frame rendering logic

The atmosphere must feel continuous while scrolling.

If supplied SVG assets are visually insufficient, refine them or compose them with restrained CSS gradients and additional lightweight SVG details.

Do not treat the original assets as an upper limit on quality.

---

## 2.5 Richer internal decoration for all major panels

The target design includes celestial details **inside the content panels**, not just in the surrounding background.

This is a particularly important fidelity requirement.

### Shared panel treatment

Enhance applicable surfaces using combinations of:

- Pale ivory/lavender gradients
- Delicate corner illustrations
- Subtle inner atmospheric illumination
- Faint constellation nodes
- Tiny compass-star symbols
- Thin orbital curves
- Soft nebula haze near corners
- Refined shadows
- Elegant rounded geometry

Decorations must never interfere with text selection, focus states, buttons, or mouse interactions.

Do not simply add thicker borders to create a more detailed appearance.

### Cosmic Forecast

Enhance the panel with:

- An elegant luminous compass star on the left
- Circular astronomical ornamentation surrounding the star
- Faint lavender cloud textures
- A ghosted planetary or orbital illustration on the right
- Small scattered sparkles

Preserve the actual forecast text and data behavior.

### Progress

Keep the progress indicator clean and clearly readable.

Introduce only restrained celestial details:

- A faint orbit near a corner
- Small star particles
- Soft lavender atmospheric shading
- A delicate astronomical line or small motif near the progress bar

Do not interfere with the percentage, count, or progress calculation.

### Day Arc

Preserve the real timeline and time calculations.

Enhance its astronomical identity using:

- A refined orbital arc
- Faint secondary orbital curves
- Small star nodes
- Moon-phase illustrations
- A soft midday sunburst
- A luminous moon-like current-time marker
- A distinctive end-of-day marker

Use `day-arc-decoration.svg` if available.

The decoration must sit behind or around the functional timeline.

Never replace the working timeline with static artwork.

---

## 2.6 Active day board: celestial observatory styling

The active day board is the centerpiece of the Daily Task Management page.

Its appearance should be richer than the neighboring boards while remaining clean and functional.

### Board surface

Create a softly luminous lavender panel featuring:

- A pale violet surface
- Very restrained internal glow
- Subtle cloud and nebula ornamentation
- Tiny star details
- Delicate edge highlights
- Soft visual depth
- Refined shadows

Avoid thick borders and glassmorphism.

### Header decoration

Add a sophisticated moon-phase illustration around the board header.

The composition should include:

- A central compass star
- Small crescent moons
- Thin orbital curves
- Symmetrical astronomical details
- Subtle star particles

Use `moon-phase-divider.svg` where appropriate.

The illustration should feel integrated with the board rather than pasted above it.

Do not obscure the date, completion count, or Add Task button.

### Existing carousel preservation

Keep the carousel behavior implemented and validated in Phase 1.

Do not reset its dimensions or positioning just to accommodate the new artwork.

Maintain the dominant central board, partially visible side previews, smooth transitions, and boundary navigation rules.

The neighboring boards should retain the current scale, blur, and fade logic while inheriting the richer visual design.

---

## 2.7 Task card decorations

The target task cards are not simply plain white rectangles.

They contain subtle astronomical illustrations embedded near their edges.

Enhance Daily task cards with variations of:

- Ghosted orbital rings
- Partially cropped lavender planets
- Faint spiral galaxies
- Small constellation clusters
- Tiny starbursts
- Elegant planetary arcs

Use `card-celestial-corner.svg` and other relevant assets.

### Placement

Position decorative artwork mainly within the rightmost 15–25% of the card.

Allow some illustrations to be partially cropped.

Keep contrast low enough that titles, descriptions, metadata, checkboxes, badges, and menus remain clearly readable.

Vary artwork subtly across cards while maintaining consistency.

Avoid random or excessively colorful decoration.

### Strict functionality preservation

Do not change task-completion behavior, menus, edit actions, deadlines, card expansion, or persistence.

Where TaskCard is shared with other features, apply scoped styling or suitable visual variants rather than unintentionally changing Tasks Hub.

---

## 2.8 Yesterday and Tomorrow empty-state artwork

Enhance the empty-state illustrations.

### Yesterday

Use a softly shaded moon or orbiting planet featuring:

- Delicate elliptical orbit rings
- Small crater details
- Tiny surrounding stars
- Orbital particles
- Restrained lavender gradients

Use `orbiting-moon.svg` if available.

### Tomorrow

Use a graceful Saturn-like planet featuring:

- Multiple delicate rings
- Soft violet shading
- Small accompanying stars
- Thin orbital paths
- Atmospheric highlights

Use `ringed-planet.svg` if available.

Both illustrations should feel sophisticated and intentional.

Preserve the actual empty-state conditions and text.

---

## 2.9 Overdue section: eclipse and fractured-orbit theme

Redesign the decorative appearance of the Overdue section using the agreed combination:

**Eclipse warning + fractured orbital geometry.**

Preserve all existing overdue functionality.

### Section-level composition

Introduce a faint eclipse illustration near the heading.

Use incomplete orbital arcs or fragmented constellation lines to suggest that the task has moved beyond its intended schedule.

### Individual overdue cards

Maintain the current soft pink/red warning palette.

Add subtle elements such as:

- Faint eclipse crescents
- Fragmented orbital lines
- Light red-lavender constellation traces
- Soft planetary shadows

Use `eclipse-broken-orbit.svg` where appropriate.

Ensure:

- Overdue information remains prominent
- Urgency indicators remain readable
- Transfer/Delete controls remain unobstructed
- Task interactions remain unchanged

Avoid aggressive animation, bright red glows, or overly dramatic warning graphics.

---

## 2.10 Motion and responsive design

All visual transitions must feel exceptionally smooth and intentional.

Preserve the existing motion system.

Use gentle opacity and transform animations for decorations where useful.

Do not introduce excessive continuous animation.

Prefer lightweight rendering and avoid unnecessary JavaScript animation loops.

Respect `prefers-reduced-motion`.

For mobile and tablet:

- Reposition or simplify oversized ornaments
- Prevent horizontal overflow
- Preserve button and text readability
- Maintain all task interactions
- Keep decorative layers behind content

Purely decorative artwork must be noninteractive and hidden from assistive technology.

---

## 2.11 Asset integration and technical boundaries

Prefer existing SVG assets and lightweight CSS gradients.

Copy selected artwork into an appropriate publicly served location, such as:

`public/visuals/daily-v2/`

Alternatively, adapt suitable illustrations into reusable inline SVG components.

Do not rely on `sources/` as a runtime public asset directory.

Reuse the existing theme tokens in `src/design/tokens.css`.

Do not introduce heavy dependencies unless necessary.

Do not modify the database, service layer, API contracts, task business logic, or unrelated features during this phase.

If UI restructuring is necessary, preserve the validated behavior from Phase 1.

---

## 2.12 Mandatory visual verification

After implementation, compare actual browser screenshots with the target and current-state references.

Inspect:

1. Background decorative density and composition
2. Zodiac-wheel placement and detail
3. Spiral galaxy and ringed-planet appearance
4. Lower-page nebula atmosphere
5. Celestial ornamentation inside Cosmic Forecast, Progress, and Day Arc
6. Active-day board richness
7. Moon-phase header illustration
8. Individual task card decoration
9. Yesterday/Tomorrow empty-state illustrations
10. Eclipse artwork around Overdue
11. General visual hierarchy and readability
12. Desktop, tablet, and mobile layouts

If the page still looks sparse or flat compared with the target, refine it.

Do not declare the design complete merely because the provided SVG files appear somewhere on the page.

**Phase 2 exit condition:** The Daily Task Management interface has been visually enhanced to closely match the supplied celestial reference while preserving Phase 1 functionality.

---

# PHASE 3 — Global Scrolling Stabilization and Homepage Refinements

## 3.1 Objective

After completing the Daily Task Management redesign, resolve the reported scrolling bugs and homepage design issues.

This phase covers:

- Global vertical overscroll behavior
- Rapid consecutive scrolling stability
- Horizontal Feature Collection rendering issues
- Homepage headline typography
- Removal of the Explore CTA and associated animations
- Removal of the Pause control
- Global hiding of default browser scrollbars

The supplied videos and screenshot are essential reproduction references.

Inspect them before modifying code.

---

## 3.2 Bug A — White space when overscrolling

### References

- `sources/vid/vid3.mp4`
- `sources/img/img6.png`

### Observed problem

When the user repeatedly scrolls upward using the laptop touchpad after reaching the top of the homepage, unwanted white or blank space appears beyond the intended page boundary.

A similar problem may occur when scrolling beyond the lower limit.

The owner wants this corrected **globally across the application**, not only on the homepage.

### Expected behavior

When the document reaches the top or bottom boundary:

- Continued touchpad gestures must not reveal unwanted blank space.
- The page must not visually detach from its background.
- No abrupt white region should appear.
- The document must remain stable during repeated boundary gestures.
- Ordinary scrolling must remain fully functional.

### Investigation

Inspect:

- Root HTML/body overflow styles
- Document height and viewport sizing
- Background coverage
- Browser overscroll behavior
- Fixed/sticky elements
- Scroll event listeners
- Existing wheel/touch handlers
- Page-level overflow containers

### Recommended implementation direction

Prefer native browser scrolling with appropriate global CSS safeguards.

Evaluate:

- `overscroll-behavior`
- Root/background continuity
- Consistent `html`, `body`, and root layout sizing
- Existing overflow containment
- Browser-specific bounce behavior

Use `overscroll-behavior-y: none` or another appropriate native strategy where it provides the intended behavior.

Ensure the root document and viewport background remain visually consistent.

**Do not globally intercept and cancel every wheel or touch event.**

Do not disable legitimate scrolling or break nested scrollable areas such as task lists, drawers, and galleries.

If a particular browser's native overscroll behavior cannot be fully suppressed through standard application styling, use the safest compatible behavior and report the limitation rather than introducing brittle global event interception.

### Scope

Apply the solution consistently across the website.

Do not limit the fix to the homepage.

---

## 3.3 Bug B — Unstable scrolling during repeated rapid gestures

### References

- `sources/vid/vid4.mp4` — Current website with problematic scrolling
- `sources/vid/vid5.mp4` — Example of the desired smooth scrolling experience

### Observed problem

When the user repeatedly scrolls upward and downward, especially with rapid direction changes, the website can behave inconsistently.

Possible visible symptoms include stuttering, irregular movement, unstable transitions, rendering artifacts, and scroll-linked animations that do not respond smoothly to gesture reversal.

Determine which symptoms are actually present in the supplied video.

### Expected behavior

The website must remain smooth and responsive even under rapid, repeated scrolling.

The interaction should demonstrate:

- Stable scroll-linked positioning
- Immediate response to direction reversal
- Smooth visual interpolation
- No excessive animation lag
- No accumulating scroll animation delays
- No abrupt snapping or jumping
- No unstable layout measurements
- No unintended overlapping elements

### Investigation

Inspect the homepage scrolling architecture, especially:

- `src/features/home/HomeJourney.tsx`
- `src/features/home/home-journey.ts`
- `src/features/home/feature-collection/HorizontalGallery.tsx`
- Relevant Motion hooks
- Scroll-linked transformations
- Sticky sections
- Scroll damping/easing
- Layout measurement logic
- Resize observers
- Render/update frequency

Identify whether instability originates from scroll handling, animation calculations, layout shifts, expensive rendering, or a combination.

### Implementation principles

Prefer native scroll behavior and continuous scroll-linked transforms.

Avoid:

- Competing wheel listeners
- Nested scroll hijacking
- Excessive JavaScript layout calculations
- Repeated synchronous layout reads/writes
- Unbounded animation loops
- Excessive smoothing that makes the interface lag behind user input
- Animation state that behaves incorrectly when scroll direction reverses

Optimize smoothness while preserving responsiveness.

Do not simply increase every animation duration.

Smooth scrolling should feel controlled, not artificially slow or disconnected from the user's gestures.

### Verification

Perform repeated scrolling tests:

- Slow downward scrolling
- Slow upward scrolling
- Fast downward scrolling
- Fast upward scrolling
- Rapid alternating directions
- Repeated gestures near the top and bottom boundaries
- Transition into and out of the Feature Collection

Compare the behavior against the supplied sample video.

---

## 3.4 Bug C — Black rendering overlap in Horizontal Feature Collection

### Reference

` sources/vid/vid6.mp4 `

### Observed problem

When the user rapidly scrolls upward through the horizontal Feature Collection, black overlapping regions or visual artifacts appear repeatedly.

The effect is especially noticeable during fast reverse scrolling.

### Expected behavior

The Feature Collection must render continuously and correctly regardless of scrolling speed or direction.

There must be:

- No black overlapping patches
- No temporary black rectangles
- No visual tearing
- No abrupt background discontinuities
- No card flickering
- No overlapping sticky layers
- No unstable horizontal positioning

### Investigation

Inspect:

- `HorizontalGallery.tsx`
- Sticky container geometry
- Horizontal track transforms
- Scroll progress mapping
- Background layers and clipping
- Stacking contexts
- Z-index relationships
- Overflow boundaries
- GPU compositing/repainting
- Transform-related containing blocks
- Resize/recalculation behavior

Use the reference video to determine the artifact's appearance before choosing a fix.

### Implementation principles

Fix the actual rendering or layout cause.

Ensure that fast scroll reversal cannot produce visible gaps or expose unintended dark layers.

Review background continuity and the horizontal track's calculated travel distance.

Use compositor-friendly transforms appropriately, but do not apply excessive `will-change` or GPU promotion to every element.

Preserve the existing reversible horizontal-gallery interaction.

Do not replace it with an unrelated carousel or change the gallery's core interaction model unless the current implementation genuinely requires a narrowly scoped structural correction.

### Verification

Stress-test:

- Fast forward scrolling
- Fast backward scrolling
- Rapid direction reversals
- Repeated entry and exit
- Browser resizing
- Desktop and fallback layouts

Confirm that the artifact no longer appears in browser testing.

---

# PHASE 3B — Homepage Design Refinements

## 3.5 Improve the "Explore my space" heading typography

The owner is dissatisfied with the current heading typography.

Choose a font family, size, and weight that fit the overall theme.

Desired qualities:

- Elegant
- Soft
- Refined
- Premium
- Suitable for an astronomical/celestial website
- Consistent with the Hiep Trong's Space identity
- Readable across desktop and mobile

Consider existing project fonts, including Cormorant Garamond and Forum, before introducing new fonts.

Evaluate candidate typography visually.

Do not select a typeface solely because it looks decorative.

Use suitable responsive sizing, spacing, and line-height.

**The final "Explore my space" heading must exist only in the Feature Collection header.**

---

## 3.6 Completely remove the old "Explore my space" CTA and its transition system

### Owner requirement

The old "Explore my space" button and its related animation behavior are no longer wanted.

Remove the button and the code exclusively responsible for it.

This includes obsolete behavior such as:

- Hero CTA rendering
- CTA opacity animations
- CTA border/fill transformations
- CTA text movement
- CTA blur effects
- CTA scroll-triggered transitions
- CTA-to-collection heading handoff
- CTA click-to-scroll handling
- Unused state, effects, refs, and helpers associated solely with this CTA

### Expected result

"Explore my space" should appear **only as a normal heading inside the Feature Collection section**.

It must no longer exist as:

- A floating hero button
- A moving hero label
- A duplicated heading
- A scroll-linked text transition
- A fading CTA

Preserve:

- Earth rendering
- Starfield
- Native scrolling
- Feature Collection layouts
- Homepage navigation
- Notification controls
- Existing unrelated animations

When removing obsolete logic, ensure the remaining homepage scroll and heading positioning still work correctly.

Do not remove shared motion utilities that are used by unrelated features.

---

## 3.7 Remove the Pause button

The Pause control on the homepage is unnecessary.

Remove:

- The visible Pause button
- Its event handler
- State and UI code used exclusively for the Pause feature
- Unused imports and styling associated with it

Do not accidentally disable the Earth's normal rotation or the starfield animations.

Preserve performance optimizations such as pausing hidden-tab rendering and respecting reduced-motion preferences.

Remove only the user-facing Pause functionality and code that is no longer needed.

---

## 3.8 Hide default browser scrollbars globally

### Owner requirement

The default browser scrollbar should not be visible anywhere in the application, including the homepage.

### Expected behavior

- Hide the native vertical document scrollbar.
- Hide native horizontal scrollbars where they would otherwise appear.
- Preserve normal scrolling through wheel, touchpad, touch, and keyboard.
- Do not disable document overflow simply to make the scrollbar disappear.
- Preserve functional nested scrolling.

### Implementation direction

Implement a consistent global scrollbar-hiding policy using suitable cross-browser CSS.

Consider:

- `scrollbar-width: none` for Firefox
- `::-webkit-scrollbar` styling for Chromium/WebKit
- Appropriate legacy fallbacks if necessary

Do not set `overflow: hidden` globally as a substitute for scrollbar hiding.

### Important distinction

The owner previously requested a **custom celestial scrolling indicator** for Daily Task Management task boards.

Preserve any intentional custom themed indicator.

Only remove the generic browser scrollbar appearance.

If scrollable regions would become difficult to discover, retain appropriate contextual hints or custom indicators.

Do not sacrifice usability or accessibility.

---

# PHASE 4 — Comprehensive Final Validation

After completing all three implementation phases, perform a final quality review.

## 4.1 Functional regression testing

Verify:

- Daily Task Management remains fully functional.
- Day/Week/Month interactions continue working.
- Task CRUD operations remain correct.
- Shared task state remains consistent.
- Notifications still work.
- Homepage navigation works.
- Feature Collection links and layout switching remain functional.
- Cosmic Launch navigation remains intact.
- Mobile interactions remain usable.

Do not silently replace working functionality with static decorations.

## 4.2 Scrolling regression testing

Check:

- Top-boundary overscroll
- Bottom-boundary overscroll
- Slow and rapid scroll gestures
- Rapid direction reversals
- Horizontal-gallery fast reversal
- Nested task-list scrolling
- Touchpad and wheel behavior
- Touch scrolling where applicable
- Browser back/forward behavior when relevant

Confirm that the homepage changes do not break the newly completed Daily Task Management interactions.

## 4.3 Visual verification

Compare the redesigned Daily Task Management page against the target image.

Review the homepage against its intended layout after removal of the redundant CTA and Pause button.

Test appropriate viewport widths, including:

- 320px
- 390px
- 768px
- 1024px
- 1440px

Inspect actual browser screenshots if browser tooling is available.

Check for:

- Overflow
- Clipped UI
- Missing decorations
- Unintended overlays
- Incorrect stacking
- Text contrast problems
- Visual inconsistencies
- Animation jitter
- Performance regressions

Refine visible problems before finishing.

## 4.4 Automated checks

Run:

```bash
npm run check
npm run build
```

Also run relevant targeted tests where necessary.

Add or update regression tests for meaningful behavior changes.

Do not modify tests merely to silence failures.

If a visual problem cannot be fully validated by automated tests, verify it directly in a browser when available.

## 4.5 Git checkpoints

When Git is operational, create meaningful commits at stable milestones if this can be done safely.

Suggested checkpoints:

1. Completed Daily Task Management functionality
2. Celestial V2 visual redesign
3. Homepage and global scrolling fixes

Stage only files belonging to the work you performed.

Preserve unrelated user changes.

Do not rewrite existing history, force-push, reset, or perform destructive cleanup.

## 4.6 Final report

When implementation is finished, provide a structured report containing:

### Completed work
Summarize the implementation results for Phases 1, 2, and 3.

### Files changed
List the important modified or added files and explain their purpose.

### Bugs resolved
Explain the root cause and implemented correction for each of the scrolling issues.

### Visual improvements
Explain the major celestial design enhancements.

### Validation
Report actual lint, TypeScript, test, build, and browser-verification outcomes.

### Remaining limitations
Describe anything that could not be completed or conclusively verified.

Do not claim that a bug is fixed unless the relevant code changes and available verification support that conclusion.

---

# Final Execution Directive

You have permission to independently execute the entire workflow described above.

**Do not stop after planning Phase 1.**

Recover the interrupted work, complete it, validate it, proceed to the V2 visual redesign, then resolve the homepage and global scrolling problems.

Use sensible engineering judgment to resolve ambiguities without asking the owner for confirmation.

If an implementation attempt fails, diagnose the problem and pursue a safer alternative.

Prefer correctness, maintainability, and visual fidelity over superficial speed.

Avoid unrelated changes and destructive operations.

Maintain an execution checklist so work can be recovered accurately if the environment or session is interrupted.

Your mission is complete only when:

- The unfinished Daily Task Management functionality has been addressed.
- The Celestial V2 design has been implemented and visually reviewed.
- The reported scrolling problems have been investigated and corrected to the extent technically feasible.
- The requested homepage controls and animations have been removed.
- Native scrollbars have been hidden without disabling scrolling.
- Relevant functionality has been tested for regressions.
- A final implementation report documents the actual outcomes.

**Begin by inspecting the repository and recovering the interrupted Codex work. Then implement the remaining phases autonomously.**