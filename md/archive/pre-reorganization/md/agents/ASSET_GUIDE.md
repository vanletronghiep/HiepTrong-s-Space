# Hiep Trong Space — Celestial UI Asset Guide

These **11 original, transparent SVG illustrations** are provided as modular implementation aids, not as screenshots to paste behind the page. They are deliberately separated so a coding agent can position, scale and tone them responsively. They are inspired by the supplied target mockup; they do not replace its more richly painted nebula texture.

## Installation

1. Keep `daily-v2-target-reference.png`, `daily-current-reference.png`, and this guide under `sources/img/daily-v2-reference/` for comparison.
2. The `assets/` directory contains the actual artwork. Copy approved SVG files to `public/visuals/daily-v2/` when used by the Next.js app. `sources/` is not automatically a public asset directory.
3. Refer to an asset as `/visuals/daily-v2/<filename>.svg` in CSS/background image or Next/React `<img>` as appropriate. Or convert the artwork into an inline SVG component for fine styling.
4. All decorative images must be `aria-hidden` / `alt=""`, have `pointer-events: none`, and stay behind functional content. Do not apply blur to text to create a preview effect.
5. Asset opacity is a **starting range**, not a requirement to stack every ornament on one view. Prefer thoughtful composition and readable content.

## Placement map

| File | Primary use | Suggested placement and opacity |
| --- | --- | --- |
| `constellation-sprinkles.svg` | Distributed starfield, delicate connected constellations | Page-wide noninteractive backdrop; 30–60% (asset is already lightly drawn). |
| `zodiac-wheel.svg` | Large thin-lined 12-sign zodiac disk | Cropped behind top-left and bottom-right viewport edges, 24–44%; do not repeat more than twice prominently. |
| `spiral-galaxy.svg` | Soft nested elliptic galaxy near upper center | Background above content, off-axis and subtle; 20–42%. |
| `nebula-clouds.svg` | Dreamy lavender cloud bank | Across lower page edges and around the active board footer, 20–60%; do not block controls. |
| `ringed-planet.svg` | Saturn-style ringed lavender sphere | Top-right decorative corner; Tomorrow empty-state illustration; 45–80% depending on role. |
| `orbiting-moon.svg` | Cratered lilac planet with elliptical orbits | Yesterday empty-state illustration; optionally lower-left decorative corner; 45–85%. |
| `moon-phase-divider.svg` | Phase-of-moon ornaments and central compass star | In the active day board *decorative header band*, below or behind the actual controls; 30–60%. |
| `card-celestial-corner.svg` | Faint corner constellation and orbital rings | Right edge of task cards / forecast panel; 12–25%, cropped and never over text. |
| `day-arc-decoration.svg` | Sunrise rays and faint astronomical micro-decoration | Behind existing working Day Arc, 18–36%; **do not replace actual time curve/markers**. |
| `eclipse-broken-orbit.svg` | Lavender/pink eclipse and broken-orbit arcs | Center above Overdue section or ghosted at far-right of overdue cards, 8–35%. |
| `celestial-scroll-thumb.svg` | Small compass-star accent | Optional decoration attached to a **real scrollbar** or scroll track; not a replacement for wheel/touch scroll. |

## Important design rules

- Use theme variables from `src/design/tokens.css`. Do **not** copy the screenshot's approximate hex colors into code when existing CSS tokens express the same color.
- Prefer CSS `opacity`, `transform` and normal background layers. Avoid heavy `backdrop-filter`, busy gradient borders, thick glow, or a dense animation library.
- Maintain high contrast of task title, date, priority, counts, icon and button text. Decorations should be nearly invisible behind text content.
- A background should be **continuous while scrolling**. Use one coherent page background/backdrop, not a new randomly seeded starfield within each card.
- Preserve the functional Today/Yesterday/Tomorrow carousel behavior and existing Day/Week/Month implementations. Decorative assets should not force rewrites or hard-coded dashboard states.
- Avoid applying global TaskCard styles that unintentionally change Tasks Hub; scope enhancements to the Daily page or an existing context prop.
- Verify no broken zodiac symbol glyphs: the zodiac SVG has vector paths, not externally loaded icon fonts.
- Preserve reduced-motion and mobile usability.
