# TASK: High-Fidelity SVG Asset Recovery & Conditional Website Integration

Act as a Senior SVG Engineer, Computer Vision Specialist, and Frontend Design Engineer with strong expertise in visual asset reconstruction, vector geometry, and pixel-level visual verification.

## Context

IMAGE SOURCE: sources\img\img9.png

I am developing a cosmic-themed personal management website with two relevant features:

- **Daily Task Management (DTM)**
- **Task Hub**

I have provided:

1. An original reference screenshot showing the desired cosmic visual design.
2. Several previously extracted SVG assets demonstrating the expected output format and separation of decorative elements.

The existing SVG files are **NOT reliable references for visual accuracy**. Many are incomplete, inaccurate, oversimplified, or contain hallucinated details.

Treat the original screenshot as the **sole authoritative visual reference**. Use the existing SVG files only to understand the intended asset separation, naming conventions, and technical format.

Your mission consists of two strictly separated phases.

- **PHASE A:** Recover and verify all identifiable decorative assets as independent SVG files.
- **PHASE B:** Integrate the approved SVG assets into the website.

**MANDATORY: Do not begin Phase B without explicit user approval of Phase A.**

---

# PHASE A — FORENSIC SVG ASSET RECOVERY

## 1. Fundamental Objective

Recover EVERY identifiable decorative element from the original screenshot into independent, reusable, high-fidelity SVG assets.

The resulting SVG assets must visually match the source elements as closely as the screenshot's available information permits.

This is NOT a request to:

- Crop rectangular images from the screenshot.
- Embed PNG/JPEG data inside SVG containers.
- Create visually similar decorations from imagination.
- Generate new cosmic artwork.
- Replace detailed illustrations with generic SVG shapes.
- Beautify, modernize, reinterpret, or simplify the original design.

The intended output is **genuine vector geometry derived from the visible source artwork**.

Reconstruct the visible contours, paths, gradients, strokes, opacity relationships, and geometry using native SVG primitives.

An SVG must contain actual vector definitions, such as paths, circles, ellipses, gradients, masks, and filters, rather than an embedded raster image.

### Accuracy Requirements

Prioritize, in order:

1. Geometric fidelity
2. Shape and silhouette accuracy
3. Completeness of visible details
4. Relative proportions and positioning
5. Color and gradient accuracy
6. Transparency and opacity accuracy
7. Glow, blur, and lighting fidelity

Do not prioritize visual attractiveness over source accuracy.

Do not invent details merely to make an asset appear more polished.

True mathematical recovery of the original vectors may be impossible from a flattened screenshot. In those cases, reconstruct only what the visual evidence supports and clearly label uncertain regions.

---

## 2. Inspect All Available References

Before producing any SVG:

1. Examine the original screenshot at its native resolution.
2. Inspect all previously provided SVG examples.
3. Compare their visible geometry against the corresponding screenshot regions.
4. Identify missing features, incorrect shapes, altered proportions, inaccurate colors, and hallucinated details.
5. Inspect the project structure and existing asset conventions.
6. Identify whether related original source assets already exist in the repository.

If authentic source SVG files already exist and genuinely match the reference, reuse those rather than reconstructing them.

Never assume the previously extracted SVGs are correct simply because they already exist.

### Exhaustive Asset Discovery

Systematically inspect the entire image, including its corners, edges, background, panels, and tiny decorative details.

Consider at least the following categories:

**Celestial objects**
- Ringed planets
- Moons and orbiting moons
- Spiral galaxies
- Eclipse-like ornaments
- Small celestial bodies
- Planetary rings and orbital trails

**Astronomical decorations**
- Zodiac wheels
- Constellations
- Moon-phase symbols
- Celestial arcs
- Star clusters
- Sparkles and radiant stars
- Decorative orbital paths
- Astronomical symbols

**Atmospheric elements**
- Nebula clouds
- Cosmic haze
- Cloud ornaments
- Light rays
- Glowing highlights
- Decorative luminous particles

**Interface-integrated artwork**
- Cosmic Forecast ornaments
- Day Arc decorations
- Decorative motifs inside task cards
- Board corner ornaments
- Decorative dividers
- Scrollbar celestial ornaments
- Progress section decorations
- Decorative flourishes surrounding the Overdue section

These categories are not a complete inventory. Independently discover anything missing.

Pay special attention to subtle, low-opacity elements that may be overlooked during ordinary visual inspection.

**No identifiable decorative element should be silently omitted.**

---

## 3. Determine Correct Asset Boundaries

Each SVG must contain a coherent, independently reusable visual element.

Use the following principles:

- Extract an individual planet separately from unrelated background decorations.
- Keep a planet and its inseparable ring system together.
- Keep connected constellation lines and their corresponding stars together when they form one illustration.
- Separate unrelated stars, moons, and decorative ornaments when appropriate.
- Preserve complex visual motifs as unified assets when splitting them would destroy their composition.
- Do not merge unrelated artwork into one giant SVG merely because the elements appear close to each other.
- Do not include surrounding UI panels, text, or unrelated background details.

SVG canvases must have clean, appropriate `viewBox` dimensions with sufficient room for visible glows and extended strokes.

Every SVG must have a transparent background.

Transparent background means the original artwork itself is isolated, not that a screenshot crop has simply been placed inside an SVG file.

### Overlapping or Occluded Elements

If an ornament is obscured by a card, text, or another element:

- Recover only geometry that can be justified by visible evidence.
- Use symmetry or geometric continuation only when strongly supported by the original design.
- Do not invent hidden decorations.
- Mark any speculative geometry explicitly.
- Prefer preserving an incomplete but faithful original over producing a complete but hallucinated version.

---

## 4. Native SVG Construction

For each discovered asset, construct an accurate SVG using appropriate vector primitives.

Examples include:

- `<path>` for irregular contours and precise geometry.
- `<circle>` and `<ellipse>` for celestial shapes and orbital structures.
- `<linearGradient>` and `<radialGradient>` for atmospheric color transitions.
- `<mask>` and `<clipPath>` for correct layered compositions.
- `<filter>` for glow, blur, and soft illumination.
- Stroke properties for constellation lines and decorative arcs.

Technical requirements:

- Preserve fine details rather than collapsing them into crude shapes.
- Use curves that reproduce the original silhouettes.
- Match original stroke thickness, opacity, and spacing.
- Match the original gradient distribution.
- Preserve subtle layers and overlapping transparent regions.
- Avoid arbitrary hard edges in originally soft artwork.
- Avoid generic filters that distort the source appearance.
- Avoid excessive SVG complexity without visual benefit.

The SVG should remain scalable, valid, and browser-compatible.

Do not use external raster references or embedded base64 images.

---

## 5. Anti-Hallucination Protocol

This is a critical requirement.

Previous extraction attempts introduced artwork that did not actually exist in the reference image.

You must actively prevent this.

For every detail you intend to include, ask:

1. Can this feature actually be observed in the source?
2. Is its shape supported by visible geometry?
3. Is its color supported by the screenshot?
4. Is its position consistent with the original?
5. Am I reconstructing evidence or inventing a decoration?

If a detail is unsupported, DO NOT add it.

### Strict Rules

- Do not invent additional stars.
- Do not invent new constellation connections.
- Do not add planetary rings absent from the source.
- Do not introduce arbitrary texture.
- Do not replace a galaxy with a generic spiral.
- Do not redesign zodiac symbols.
- Do not exaggerate glows.
- Do not change decorative arrangements.
- Do not alter colors for stylistic reasons.
- Do not simplify elaborate shapes into visibly inaccurate approximations.

If fidelity cannot be achieved for an asset, record it as unresolved rather than silently producing a misleading replacement.

---

## 6. Iterative Visual Verification

Do NOT generate all SVGs in a single pass and assume they are correct.

Perform iterative verification for every asset.

### Verification Loop

1. Identify the asset in the source screenshot.
2. Determine its exact bounding region.
3. Construct the initial SVG.
4. Render the SVG at the same dimensions as the original region.
5. Align the rendered SVG against its corresponding original artwork.
6. Compare contours, proportions, colors, gradients, opacity, and internal details.
7. Identify visual discrepancies.
8. Revise the SVG.
9. Repeat until no meaningful supported improvement remains.

Use computational image comparisons when useful, but account for background compositing, antialiasing, opacity uncertainty, and filtering differences.

Do not interpret raw pixel differences as definitive evidence of vector accuracy when the source artwork is blended into a complex background.

### Special Attention

Inspect at both:

- Original display scale.
- Enlarged scale for detailed geometric evaluation.

Inspect the actual browser-rendered results rather than relying exclusively on SVG source code.

### Validation Criteria

An acceptable asset must:

- Match the original silhouette.
- Preserve all identifiable visible details.
- Contain no unsupported embellishments.
- Have appropriately matched colors and transparency.
- Have no unrelated screenshot background.
- Render cleanly and independently.
- Use genuine vector geometry.
- Be reusable in the website without unintended clipping.

If the result is visibly inconsistent with the reference, revise it before marking it ready.

---

## 7. Completeness Audit

After generating the assets, perform a second independent inspection of the original screenshot.

Assume the initial extraction missed important elements.

Revisit every region of the image systematically.

Create an annotated reference screenshot that highlights:

- Every identified decorative asset.
- Its corresponding SVG filename.
- Any missing or unresolved decorations.
- Any partially reconstructed asset.

Compare the inventory against the original screenshot.

Check that small stars, constellation patterns, corner decorations, celestial symbols, and background ornaments have not been overlooked.

Review existing SVG examples again to ensure their intended visual subjects have been accounted for, while not preserving hallucinated details from those examples.

---

## 8. Output Structure

Organize the generated assets in a dedicated project directory.

Use the repository's established conventions where appropriate.

Suggested organization:

```text
cosmic-assets/
├── planets/
├── moons/
├── galaxies/
├── zodiac/
├── constellations/
├── stars/
├── clouds/
├── ornaments/
├── interface-decorations/
└── verification/
    ├── asset-gallery.html
    ├── annotated-reference.png
    ├── asset-manifest.json
    └── fidelity-report.md
```

All recovered artwork must be saved as independent `.svg` files.

Do not modify the website's functional components during Phase A.

---

# MANDATORY USER VERIFICATION GATE

## 9. Build a Visual Asset Review Gallery

Before touching the Daily Task Management or Task Hub implementation, create a review interface that allows me to visually inspect EVERY extracted SVG.

The review gallery must provide:

### For Each Asset

- The extracted SVG rendered on a transparent checkerboard.
- The corresponding cropped source region shown as a visual reference.
- An overlay comparison, where feasible.
- An enlarged preview.
- The SVG filename.
- Its original location in the screenshot.
- A short fidelity assessment.
- Any uncertainty or unrecoverable detail.

Show SVGs at their natural proportions, without stretching.

### Gallery Requirements

- Group assets by category.
- Provide a comprehensive overview of all extracted assets.
- Support easy visual comparison between original and extracted artwork.
- Clearly indicate incomplete or low-confidence assets.
- Provide a way to inspect tiny decorative elements at enlarged scale.
- Make it easy to identify missing assets.

The gallery may be implemented as a local HTML page or an appropriate development preview inside the existing project.

### Important

I must be able to inspect the results before accepting them.

Once Phase A is complete:

1. Present the asset gallery.
2. Present the completeness and fidelity report.
3. Summarize any limitations.
4. Explicitly ask for my approval.

**STOP EXECUTION HERE.**

Do not proceed to website integration automatically.

Wait for my explicit confirmation that the extracted SVGs are satisfactory.

If I reject certain assets, revise those assets and present the updated gallery for another review.

Approval of the extraction phase is the only authorization to begin Phase B.

---

# PHASE B — WEBSITE INTEGRATION

**EXECUTE ONLY AFTER EXPLICIT USER APPROVAL.**

## 10. Inspect the Existing Website

Before making changes:

- Read the project instructions and relevant `AGENTS.md` files.
- Inspect the current architecture and styling conventions.
- Examine the Daily Task Management implementation.
- Examine the Task Hub implementation.
- Identify existing decorative assets and how they are rendered.
- Understand existing responsive behavior and animations.
- Identify the safest integration strategy.

Do not blindly replace current elements.

Preserve the existing working functionality and architecture.

---

## 11. Daily Task Management Integration

The original reference screenshot primarily represents the desired Daily Task Management visual identity.

Therefore, this page is the highest priority.

Integrate the approved SVGs into the appropriate locations according to the reference image.

### Visual Fidelity

- Follow the original composition as closely as possible.
- Preserve the relative positioning and scale of celestial decorations.
- Match opacity, gradients, and layering.
- Integrate planetary artwork into corresponding UI regions.
- Place subtle constellation and star ornaments where they belong.
- Preserve the cosmic atmosphere without obstructing content.

Pay attention to:

- Main background decoration.
- Header and upper-page celestial motifs.
- Cosmic Forecast.
- Progress section.
- Day Arc.
- Yesterday / Today / Tomorrow boards.
- Individual task cards.
- Scrollbar ornaments.
- Overdue section.
- Lower-page decorative elements.

Use native SVG assets without unnecessary rasterization.

### Functional Preservation

Do not break:

- Task creation, editing, deletion, or completion.
- Day / Week / Month switching.
- Yesterday / Today / Tomorrow carousel navigation.
- Task card interactions.
- Overdue task operations.
- Existing task data or persistence.
- Responsive behavior.
- Existing accessibility and navigation.

Avoid unnecessary changes to unrelated code.

---

## 12. Task Hub Integration

Task Hub should share the same visual language as Daily Task Management, but it does not need to copy the exact reference composition.

Use the approved SVG assets creatively **in their placement and composition only**, not by changing their visual artwork.

Apply critical design judgment.

### Design Principles

1. Maintain consistency with the cosmic theme.
2. Preserve Task Hub's existing structure and usability.
3. Reuse relevant planets, galaxies, constellations, stars, and ornamental assets.
4. Prefer subtle, intentional decoration over visual clutter.
5. Use coherent visual hierarchy.
6. Keep task information easy to read.
7. Ensure decoration does not compete with interactive controls.
8. Maintain consistency in color, opacity, scale, and spacing with DTM.

### Suggested Placement

Consider decorative assets for:

- Page header.
- Empty states.
- Task grouping sections.
- Section dividers.
- Background atmosphere.
- Card corners.
- Non-interactive decorative regions.

However, these are suggestions, not mandatory placements.

Inspect the actual Task Hub UI and independently determine where each asset belongs.

Do not force every SVG asset into Task Hub.

Use only decorations that genuinely improve visual coherence and quality.

---

## 13. Motion and Interaction Quality

All introduced transitions should feel exceptionally smooth and consistent with the existing website.

Requirements:

- No abrupt appearance or disappearance of decorative elements.
- Avoid visual jitter or layout shifts.
- Preserve consistent animation timing and easing.
- Use subtle ambient motion only when suitable.
- Avoid excessive animation that distracts from tasks.
- Respect reduced-motion preferences.
- Maintain smooth scrolling and carousel interaction.
- Avoid unnecessary performance-heavy SVG filters or animations.

Do not add complex motion merely because SVG supports animation.

**Visual elegance should come from precision, restraint, and smoothness.**

---

## 14. Integration Verification

After integration, verify both pages.

Check:

- Original functionality remains intact.
- SVG assets render correctly.
- Responsive layouts remain usable.
- No content is obscured by decorations.
- Interactive controls remain clickable.
- No unexpected clipping or overflow.
- No excessive SVG filter performance costs.
- Animations remain smooth.
- No new TypeScript errors.
- Existing tests and production build still pass.

Use Playwright screenshots or available visual testing tools to review the actual website.

Perform visual inspection at desktop and mobile viewport sizes.

Fix integration issues without unnecessarily modifying the approved SVG artwork.

---

# FINAL EXECUTION RULES

1. The original screenshot is the visual source of truth.
2. Existing SVG samples are imperfect examples, not authoritative geometry.
3. Recover ALL identifiable decorative elements.
4. Generate genuine transparent SVG assets.
5. Do not use raster images disguised as SVGs.
6. Do not hallucinate missing visual details.
7. Do not redesign or stylistically reinterpret source assets.
8. Verify each asset against the original screenshot.
9. Perform an independent completeness audit.
10. Provide a comprehensive visual review gallery.
11. **STOP and request explicit user approval after extraction.**
12. Never begin website integration before approval.
13. After approval, prioritize high-fidelity DTM integration.
14. Adapt the approved decorative assets thoughtfully to Task Hub.
15. Preserve functionality, performance, and responsive behavior.

## Success Criteria

The task is successful only when:

- All identifiable decorative assets have been inventoried.
- Every recoverable asset is represented as an independent SVG.
- Extracted SVGs visually correspond to their actual source artwork.
- Unsupported artistic inventions have been eliminated.
- Every SVG has a transparent background.
- The user has reviewed and approved the extraction results.
- The approved assets are integrated into DTM faithfully.
- Task Hub uses the same assets in a coherent, attractive, restrained manner.
- Both pages retain their original functionality.

**Begin with Phase A. Stop at the mandatory approval gate.**