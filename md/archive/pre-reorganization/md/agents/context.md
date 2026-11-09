# Task: Redesign Daily Task Management with Celestial UI Enhancements

## 1. Objective

Redesign the existing **Daily Task Management** page using the reference image located at `sources/img/img5`.

The goal is to transform the current minimal lavender interface into a more elegant, immersive, universe-inspired experience while **preserving the original light theme, existing functionality, and overall design architecture**.

The reference image represents the target visual direction, not an instruction to rebuild the page from scratch.

**Core design principle:** Preserve the original interface's simplicity and usability while introducing refined celestial details inspired by stars, constellations, planets, orbital structures, and zodiac symbolism.

The result should feel like a professionally designed, premium personal productivity application—not an excessively decorated fantasy website.

## 2. Reference and Source Inspection

Before implementing changes:

1. Locate and inspect `sources/img/img5` (including its image extension if applicable).
2. Examine the existing Daily Task Management implementation, relevant components, styling, animations, and shared design tokens.
3. Read `AGENTS.md` and any relevant project documentation or development rules.
4. Identify existing functionality, reusable components, responsive behavior, and animation conventions.
5. Compare the existing interface with the reference to determine which visual elements need modification.

Treat the supplied image as the primary visual reference for the desired result.

**Do not blindly reproduce the screenshot.** Preserve the application's actual task data, dynamic states, controls, and functionality.

## 3. Background and Celestial Decorations

**Critical: Do not replace the existing light lavender background with a dark universe background.**

Preserve the original background color, brightness, and general appearance.

Enhance it using decorative elements inspired by the reference:

- Small, scattered stars with varied sizes and subtle purple tones.
- Delicate constellations connected by thin, low-opacity lines.
- Elegant zodiac wheel illustrations, partially visible near page corners.
- Thin orbital paths and planetary rings.
- Small celestial sparkles and star clusters.
- Extremely subtle lavender nebula-like gradients or atmospheric glows.

### Visual constraints

- Background decorations should remain secondary to functional content.
- Concentrate larger illustrations around page edges, corners, and empty spaces.
- Avoid placing distracting elements behind readable text.
- Preserve generous whitespace.
- Use consistent lavender, violet, and muted purple tones.
- Avoid excessive bloom, saturated colors, heavy shadows, or visually noisy textures.
- Keep background decorations visually continuous throughout the page, including when scrolling.

Prefer lightweight SVGs and CSS for crisp line illustrations. Reuse existing assets where appropriate.

## 4. Yesterday / Today / Tomorrow Section

Preserve the existing three-column layout and all task-management behavior.

### Empty-state illustrations

Replace the current simple circular empty-state icons with more sophisticated celestial illustrations inspired by the reference.

**Yesterday:**
- An elegant orbiting planet or moon illustration.
- Delicate elliptical orbital rings.
- Small surrounding stars and orbital particles.
- Soft lavender outlines and subtle gradients.

**Today:**
- Use a similarly styled celestial empty-state illustration when no tasks exist.
- Maintain a visually distinguishable highlighted Today column.

**Tomorrow:**
- A graceful Saturn-inspired planet with multiple delicate rings.
- Small stars or orbital particles for additional visual depth.
- Match Yesterday's illustration in visual weight, size, and complexity.

These illustrations must communicate empty states without overwhelming the interface.

Use subtle idle animations only where they enhance the experience. The illustrations should remain readable and attractive without animation.

### Existing task cards

Preserve:

- Task titles and descriptions.
- Priority indicators.
- Deadlines and overdue status.
- Task completion checkboxes.
- Add Task buttons.
- Edit menus.
- Existing task actions and business logic.

Refine spacing, colors, borders, shadows, and hover effects only as necessary to match the target design.

The Today column should remain recognizable through a soft lavender highlight, without excessive glow or contrast.

## 5. Cosmic Forecast, Progress, and Day Arc

Retain the existing **Cosmic Forecast**, **Progress**, and **Day Arc** features where they currently exist.

Do not remove or replace them merely because they are absent from the original screenshot.

Enhance their appearance to match the celestial visual language.

**Cosmic Forecast**
- Preserve the feature and its current data behavior.
- Introduce restrained celestial decorative elements.
- Maintain excellent text readability.

**Progress**
- Preserve the existing completion calculations and indicators.
- Keep the progress bar clean, minimal, and clearly readable.
- Use the established lavender palette.

**Day Arc**
- Preserve its functional timeline, markers, and time calculations.
- Refine the orbital arc and celestial markers where appropriate.
- Use subtle gradients and smooth motion without interfering with timeline accuracy.

All three sections should visually integrate with the upgraded background and the rest of the page.

## 6. Overdue Tasks

Preserve the current Overdue section, its positioning within the page structure, and all existing functionality.

Maintain its soft pink/red visual language to distinguish overdue items from regular tasks.

Apply only restrained refinements:

- Consistent card radius and spacing.
- Subtle shadows and borders.
- Improved visual hierarchy.
- Smooth hover transitions.
- Consistent styling for Transfer, Delete, and Edit actions.

Do not make overdue cards visually compete with the celestial background.

## 7. Animation and Interaction Requirements

Follow the project's existing smooth-transition rules in `AGENTS.md`.

All added animations must feel fluid, subtle, and intentional.

Use the following motion principles:

- **Stars:** Occasional, gentle twinkling with smooth opacity changes. Avoid synchronized or aggressive flashing.
- **Planets:** Extremely slow, nearly imperceptible rotation or floating motion.
- **Orbiting particles:** Smooth continuous movement along orbital paths, without abrupt resets.
- **Hover effects:** Subtle elevation, color shifts, or soft glow with elegant easing.
- **Page scrolling:** Decorative elements should move naturally without jitter, flashing, or sudden color changes.
- **State transitions:** Smoothly interpolate visual changes without creating unnecessary delays in task operations.

Avoid excessive parallax, dramatic scaling, large movements, or animations that distract from productivity.

Use compositor-friendly CSS transforms and opacity where possible. Ensure animations remain performant and support `prefers-reduced-motion`.

## 8. Responsive Design and Performance

The updated interface must work across desktop, tablet, and mobile layouts.

Requirements:

- Prevent decorative elements from covering interactive components.
- Adapt oversized zodiac illustrations for smaller screens.
- Prevent horizontal overflow.
- Preserve legibility and usability at different viewport sizes.
- Keep decorative layers non-interactive using appropriate pointer-event behavior.
- Avoid expensive continuous rendering or unnecessary JavaScript animation loops.
- Reuse existing components and project conventions.

Do not introduce additional dependencies unless genuinely necessary.

## 9. Implementation Constraints

This is primarily a **visual enhancement task**, not a functional rewrite.

You must:

1. Preserve the existing technology stack and project architecture.
2. Reuse existing components and styling conventions whenever possible.
3. Keep all current task-management behavior intact.
4. Avoid changing database schemas, APIs, routing, or task logic unless a genuine technical necessity is discovered.
5. Avoid unrelated refactoring.
6. Ensure every new decorative component is maintainable and reusable.
7. Follow existing project rules and coding standards.

Do not replace real UI components with a static screenshot or a single image covering the interface. All functional controls must remain genuine interactive elements.

## 10. Validation and Final Review

After implementation, carefully compare the resulting page against `sources/img/img5`.

Evaluate:

- Fidelity to the reference's celestial visual language.
- Preservation of the original light background.
- Quality of constellation, star, zodiac, and orbital decorations.
- Visual balance and hierarchy.
- Appearance of Yesterday, Today, and Tomorrow empty states.
- Consistency across Cosmic Forecast, Progress, Day Arc, and Overdue sections.
- Smoothness and restraint of animations.
- Responsive behavior.
- Readability and accessibility.
- Preservation of existing task functionality.

Run relevant project checks and tests. If browser preview or screenshot tooling is available, inspect the rendered page at desktop and mobile sizes and refine obvious visual discrepancies.

Fix identified issues before finishing.

## 11. Expected Outcome

The final design should feel like the original Daily Task Management interface has naturally evolved into an elegant celestial workspace.

It should combine:

**Original design:** Minimalism, pastel lavender colors, clarity, practicality, and familiar functionality.

**Reference design:** Constellations, stars, celestial line art, zodiac ornaments, orbital illustrations, and refined cosmic atmosphere.

Prioritize visual harmony and functionality over decoration.

**Success criterion:** A user should immediately recognize the original Daily Task Management page, but perceive it as substantially more polished, atmospheric, and visually distinctive.

Implement the changes directly in the existing project, then provide a concise summary of modified files, major visual improvements, and validation results.