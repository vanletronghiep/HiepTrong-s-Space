# AGY plan: Midnight Galaxy collection reveal

## Summary

Keep the homepage and collection on `/`, with one pre-rendered collection instance. After Earth and About Me settle, continued scrolling reveals the collection through a circle expanding from the viewport’s bottom-left corner.

Confirmed choices:

- Hold Earth and About Me beneath the reveal.
- Complete the reveal over one viewport-height of scrolling on desktop and mobile.
- Use quiet navy, soft lavender/blue gradients, and sparse static stars.
- Use the feature-page signature logo and existing notification component; no Universe menu.
- Reduced motion uses ordinary scrolling without the radial transition or extra scroll distance.

The reference video informs seamless coverage and reversibility. Its bottom-center moving panel will not be reproduced.

## Milestone 1 — Scroll and reveal integration

- Introduce a coordinated scroll stage that holds the final homepage composition and the collection’s opening viewport stationary throughout the reveal.
- Keep the existing collection mounted; do not duplicate cards, introduce another route, or load it on demand.
- Calculate normalized progress from native document scroll over one stable viewport-height. Map progress directly to radius using `0.85p + 0.15p²`; do not apply time-based smoothing, springs, or automatic completion.
- Anchor the circle at viewport coordinates `(0, height)`, with maximum radius `hypot(width, height) + 2px`. Its center must not depend on the collection’s full content height.
- At completion, remove clipping and release the collection into its existing scrolling behavior without a positional jump. Reverse these steps when scrolling upward.
- Freeze decorative scene motion during partial coverage so only the boundary changes. Preserve the settled Earth pose, introduction styling, and normal homepage behavior outside this phase.

**Integration gate:** prove stationary content, exact stopping, reversible coverage, and a seamless handoff before visual polish. Avoid transformed or scrolling ancestors that alter the gallery’s sticky positioning.

## Milestone 2 — Collection atmosphere and header

- Scope the opaque Midnight Galaxy background to the collection and footer, using existing navy, lavender, blue, and text tokens. Keep the homepage’s black cosmos treatment.
- Preserve all card artwork, individual accents, static borders, hover feedback, cursor glow, proportions, and route transitions. Do not restore either rejected border animation.
- Change the heading to **“My collection”**, matching Tracking’s title sizing, spacing, and regular/italic composition: regular “My,” italic accent-colored “collection.”
- Add the editable placeholder: “A collection of the spaces, ideas, and projects that shape my journey.”
- Use the feature-page italic signature and star. Its home action returns to the opening homepage within the same document.
- Layer the two logo treatments within their respective surfaces so the reveal replaces the homepage logo naturally. Retain one shared notification component above the transition; preserve its notification theme and portal behavior.

## Milestone 3 — Interaction and accessibility handoff

- Start desktop horizontal-gallery travel at **reveal completion**, rather than consuming reveal scrolling. Preserve its existing smoothing and keyboard focus handling afterward.
- Preserve mobile horizontal swiping, vertical-grid scrolling, layout preference persistence, and collection animations.
- During partial coverage, disable collection pointer interaction and keyboard focus. Defer card entrance animations until full coverage; then retain their existing behavior.
- Anchor layout switches to the fully revealed collection start, preventing an accidental return into the wipe.
- Preserve `#features`; direct entry and keyboard skip navigation must land on the fully revealed collection. Restore intermediate scroll positions without replaying a timed animation.
- For reduced motion or unavailable clipping support, render ordinary document flow with no reveal spacer or hidden collection.
- Use passive scroll listeners, cached measurements, and at most one pending animation frame. Recalculate geometry on meaningful resize, orientation, font, and layout changes. Do not introduce a scrolling library or intercept wheel/touch input.

No backend, storage schema, route, or external API changes are required. Internal interfaces may expose reveal completion and the gallery’s scroll-start offset.

## Verification and acceptance

- Test progress endpoints, monotonic easing, full corner coverage, reversal, and unchanged radius while scrolling is stopped.
- Verify both layouts remain stationary during partial reveal and work normally afterward, including switching layouts, pointer glow, keyboard navigation, and Cosmic Launch.
- Check wheel, trackpad, touch, scrollbar, and keyboard scrolling; fast jumps; reverse scrolling; reload/restoration; `#features`; and an open notification popover.
- Review 320px–1440px widths, short landscape, mobile browser chrome changes, and reduced motion. Check Chromium, Firefox, and Safari/iOS where available; explicitly report unavailable coverage.
- Require no uncovered corner, duplicate header, horizontal overflow, hidden focus target, boundary jump, or collection remount at handoff. Profile clipping on mobile rather than assuming GPU acceleration.
- Run focused regression tests and `npm run check`; then run a production build sequentially and verify the production preview.
- Preserve unrelated changes and deletions. Update only the relevant confirmed specifications after implementation; do not update `report.md`, commit, migrate, or deploy without authorization.
