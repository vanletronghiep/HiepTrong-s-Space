# Daily Task Management V2 — Pixel-Interpretive Visual Specification

## 0. What the reference images mean

- `daily-v2-target-reference.png`: the **design target**. It is an illustration/render of the desired aesthetic, not a specification for hard-coded data or rewritten product features.
- `daily-current-reference.png`: **actual current UI**. Its controls, app behavior, data bindings and route/layout semantics take precedence over mockup placeholders.
- `asset-preview.png` and `assets/*.svg`: reusable standalone illustrations that convey the target's actual motif shapes to coding agents.

This is a **visual/UI polish iteration only**. Do not implement or redesign the Day/Week/Month dashboard behavior, invent Forecast logic, replace the Day Arc model, or modify unrelated features. Keep the existing carousel, business logic, persistence, APIs, navigation, task records, dates, counts and actions unchanged. Date/time and task content in the mockup are not fixtures to reproduce.

## 1. Overall aesthetic (important)

The intended aesthetic is **luminous lavender celestial editorial UI** — not dark space, not neon cyberpunk, not generic glassmorphism. The canvas is an almost-white lavender sky; dark indigo serif headings have enough contrast. Ornaments are mostly thin violet lines, off-white planetary light, occasional warm lilac-star highlights and delicate nebula cloud haze. There are three optical layers:

1. **Ambient environment** behind everything: a quiet pastel gradient, faint mist, tiny white/violet stars, constellations, two cropped zodiac wheels, a small ringed planet, a gentle spiral galaxy and a lavender-cloud bank near the bottom.
2. **Functional panels**: pale ivory/lavender surfaces with soft elevation, nuanced edge lighting, light-lilac micro-lines and subtle celestial flourishes confined to corners/headers.
3. **Legible content**: dark text, real controls, precise data, accessible hover/focus states. Never fade functional text merely to match a generated picture.

The target is substantially *more illustrated* than the current screenshot, particularly in the large empty background and the interior of the panels. The difference is not achieved by increasing generic shadow or border width.

## 2. Background: exact visual anatomy

- Base background: the existing very light lavender workspace color. Add broad radial mist washes in very pale lilac, with some ivory light around the content center. Keep the brightness consistent while scrolling.
- Top-left: a **large zodiac-wheel fragment** partly outside the viewport. Multiple hairline circles, twelve wedge sectors, tiny tick marks and recognizable zodiac motifs. It is a cropped environmental element, not a contained card or icon.
- Top-middle/right: a pale, softly luminous **spiral-galaxy silhouette** with uneven elliptical rings, blended into the sky. Surround it with micro-stars and a few connected constellation points.
- Upper right edge: a small Saturn-like ringed planet whose ring is diagonal. It should be less prominent than the page title.
- Mid-left and mid-right margins: several delicate 4–6 point constellation paths. Tiny nodes at each bend, very fine violet lines, controlled negative space.
- Bottom-left: an atmospheric planet/orbital curve and fog bank; bottom-right: a large **second cropped zodiac-wheel fragment** with the majority of its circumference outside the viewport. Underneath: a *horizontal lavender nebula bank* with little star specks.
- Do not fill the central text/panel regions with full-opacity stars. Background art must not appear as separate rectangular tiles or snap/chop at component boundaries.

**Suggested layering:** background color; radial haze; `constellation-sprinkles`; off-edge `zodiac-wheel` instances; top `spiral-galaxy` / `ringed-planet`; lower `nebula-clouds`; then content. Only increase opacity enough that environmental ornamentation is visibly richer than the current UI while still background-level.

## 3. Typography, spacing and color behavior

- Preserve the project's actual fonts and dynamic text. Main title: elegant dark near-black serif with a slightly pronounced editorial feeling. Body/task text: crisp, modern sans with dark ink. Micro-labels in violet uppercase: `COSMIC FORECAST`, `PROGRESS`, `DAY ARC`.
- The mockup's wordmark differs slightly from the current branding; preserve the live product's proper wordmark/navigation assets. Do not hardcode the mockup's calendar date or artificial progress numbers.
- Layout should remain responsive. The reference illustration and current screenshot have different viewport aspect ratios: compare **proportional composition, motif position and density**, not exact pixel x-coordinates.
- Maintain panel spacing and current card behavior; enrich visual surfaces within available layout. If visual additions cause overflow, reduce ornament scale before shrinking legible content.
- Use existing CSS tokens. Approximate visual roles: rich violet for decorative stars/short emphasis lines, translucent lilac for geometry, cool white/ivory for panels, blush rose reserved for overdue urgency.

## 4. Header and surrounding frame

- Keep the current sticky nav functional and physically stable. Header wordmark left; date/Universe/notification controls right; view switcher and Observatory control beneath or alongside existing page title as implemented.
- Add only subtle background ornaments: isolated starbursts, a faint linear orbit or tiny compass-star near the title, and environmental constellations behind whitespace.
- Avoid a new opaque navigation strip, colored slab or strong horizontal seam when scrolling. Do not change global navigation behavior within this task.
- `Day / Week / Month` are the correct labels. Their existing functionality, routing and content rendering must remain unchanged.

## 5. Forecast + Progress — surface details

**Cosmic Forecast**: a wide softly rounded rectangle, near-white interior, thin violet-lilac edge, nearly imperceptible cloudy mist at the bottom/right, and an ornamental compass/four-point star inside a faint circular orbit at the left. The label is violet uppercase. Real forecast text should have dark, crisp contrast. Rightmost interior may have a ghosted half-ring planet or luminous arc, roughly 10–20% opacity. The foreground must remain stable as text changes.

**Progress**: matching white-lilac surface, tiny stars or orbit geometry in the upper-right/bottom-right corners; the horizontal progress bar is genuine and remains highest priority. Visual treatment should not mask the colored fill, percentage or count. No decorative fake completion indicators.

In both panels, achieve richness by layered illustrative **corner assets** and low-contrast gradient underlays, not heavy drop shadows or full-panel blur.

## 6. Day Arc — celestial clock, never fake time

Preserve the current functional arc geometry and timing. Decorate its container to resemble a miniature observatory diagram: a clean violet/dashed orbital trajectory; faint sunburst rays centered near midday; a small phase-of-the-moon sequence or star above the middle; tiny scattered orbital dots; luminous moon marker and an emphasized end-of-day star. Let the real arc, current-time point, tick labels and deadline annotation remain data-driven.

Place `day-arc-decoration.svg` *behind* the real arc and labels. Decorative motifs must not change hit areas, dates, animation state or timing calculations.

## 7. Three-day carousel — style existing behavior, don't replace it

The target strongly distinguishes the **large, bright active day** from **receded, softly blurred adjacent previews**. Preserve the current carousel implementation and arrow behavior. Keep whatever drag/swipe support currently exists; do not add new gesture logic as part of this visual task.

**Active day board:**
- Pale violet shell with a soft pearl-lavender aura. Richer than current plain rounded container, yet not a glass slab.
- Define a subtly illuminated edge using a *soft inner shadow/gradient wash* and very fine border. No thick purple outline or hard neon frame.
- Header shows the existing actual weekday, date, done count and Add Task button. Behind/below the header, place a **moon-phase decorative band**: small crescents in a shallow orbit and a little bright central compass star.
- Near panel corners, add low-opacity mist/sparkles. The central list remains legible and the actual card layout is unchanged.
- On side previews: the same astronomical vocabulary, subdued by the existing opacity/blur and reduction. Never permanently blur the active board.
- The inactive side boards may show visible hints of the moon or Saturn artwork as empty-state decoration, but the underlying real task list/empty state decides content.
- Keep navigation arrows outside/near the active area as in existing code; gently theme their border, shadow and hover lighting. Do not add redundant arrows.

**Task cards inside Daily:**
- Rounded ivory / very pale lavender paper surface and subtle elevation. Title dark and prominent; subtitle/deadline/priority content clear.
- At **far-right corners only**, introduce tiny orbital paths, fine constellations or one cropped translucent planet crescent. Restrict ornaments to the free rightmost 15–25% of each card, opacity about 10–20%, fading them before they cross text or controls.
- Preserve checkbox, menu, priority, pin, completion and click semantics; do not allow SVG layers to receive pointer events.
- Use varied but cohesive motifs per card (crescent planet, thin orbit, spiral) rather than copying the identical decoration at identical coordinates onto every task.
- The mockup shows three cards and a partly visible fourth: **do not implement that truncation, fake scrolling, or a new scrollbar solely from this image** if the current product does not already have those interactions. If already implemented, maintain and polish the existing treatment.

## 8. Empty day illustrations

The reference has **large expressive illustrations**, not small generic circles:
- Yesterday: lilac cratered moon with thin elliptical orbital rings, tiny dots and star glints. Show only when that day truly has no tasks.
- Tomorrow: stylized ringed Saturn, pearlescent lavender body and multiple thin, slightly tilted rings.
- Today: a similarly styled celestial empty state if empty; active day remains visually prioritized.

Use `orbiting-moon.svg` and `ringed-planet.svg` as real transparent illustrations where they fit. Allow CSS scaling and adaptive spacing; preserve clear human text like "No tasks for tomorrow."

## 9. Overdue — eclipse + fractured orbit (very restrained)

This section lives **below the day boards**. Keep its current position and tasks, dates and all buttons. The target places a floating pink/lilac eclipse halo near the heading, with subtle broken arcs spreading left/right. Overdue task cards are still almost-white blush surfaces, visibly distinguishable from normal ones by rose labels and soft edges.

Inside each overdue card, put a ghosted eclipse/partial planetary shadow or thin broken constellation at the **upper/right far corner**, never across titles, metadata or Transfer/Delete. Keep overdue text red enough for accessibility; do not introduce warning animation, saturated red glows, fire, animated meteors, or unreadable pink-on-pink.

Use `eclipse-broken-orbit.svg` lightly. If reused inside a card, crop/scale and lower opacity drastically (~8–15%).

## 10. Motion and visual constraints

- Soft star twinkle should be slow, uneven and nearly unnoticeable. Large stars do not pulse in synchrony. Prefer no motion for large planets; tiny idle drift only if already accepted in project.
- Existing board transitions must not become sluggish or janky due to decoration. Use CSS opacity/transform, no expensive scroll listener for each ornament and no canvases for each card.
- Honor `prefers-reduced-motion`. Keep decorative overlays decorative.
- No glassmorphism or thick frame outlines; no full-width purple gradients blocking panel text; no random CSS noise; no new font/dependency just to draw an ornament.
- Review visual quality at width 1440 (desktop), 810 (tablet), 390 and 320 (mobile). Cropped corner art must remain cropped and must not cover controls.

## 11. Implementation boundary + acceptance criteria

Only change styling, asset use, decorative markup and other presentation details on **Daily Task Management**. In shared `TaskCard` or `WorkspaceShell`, use Daily-only scoped variants/selectors to prevent unwanted changes in the Tasks Hub or other pages. Do not touch schemas, service logic, API, notification behavior, other feature dashboards, or Day/Week/Month functionality. Do not hardcode task data, dates or percentages from reference art.

Pass criteria:
1. A user sees materially richer celestial background artwork than in the current screenshot.
2. Panel backgrounds themselves have tasteful orbital/glow details; they no longer look like mostly empty flat white rectangles.
3. A noticeably detailed active board includes moon-phase/astronomical flourishes; side boards recede, as before.
4. Task cards include subtle but discernible right-edge illustrations without losing readability.
5. Overdue styling adds eclipse/fractured-orbit character without weakening warnings.
6. Existing arrow navigation, Day/Week/Month behavior, TaskForm, menus, counts, task actions, query data, focus and scroll all continue to work.
7. No new navbar seam, page overflow, missing assets, mobile overlaps or reduced-motion regressions.
8. Run existing check scripts and, ideally, compare actual screenshots next to both references. Never claim literal pixel equivalence to generated artwork.
