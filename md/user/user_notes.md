# OVERALL
Hello Codex, I want you to colab with you to make a comprehensive plan. Then we will give this plan to Antigravity, let it handle the coding phase. After our discussion for clarification, you should give a detailed plan.md file for agy, the plan will be split into few phase, each phase is an epic. Then agy will read it, do the i task, until reach the goal, after finish coding,agy should follow up information in the review.md, I will check for the website UI, review then do some adjustment. After finish the adjustments, I will tell agent to proceed the next step if possible.
Scope: Entire website

# OVERALL THEME
Homepage:
Daily Task Management: soft lavender, universe, zodiac, celestial, galaxy, stars, planets, moonlight, cosmic, dreamy fantasy. Keep it as it is, don't touch anything in this page.
Tasks Hub: Identical theme with the Daily Task Mangement.
Notification: soft pink, sakura, blossom, floral, fairy, dreamy.
Events: Soft blue, ocean waves, marine life, sea creatures, coral reefs, seashells, coastal breeze, underwater world, peaceful aquatic atmosphere.
AI Engineering: misty, calm, fog, mountain, minimalist nature
Blogs hub: wood, woodland, rustic, earthy, autumn, cozy, natural textures, cabin life, vintage nature
APCS Hub: winter, ice, snow, frost, glacier, arctic, frozen, polar, crystal, northern lights, winter wonderland, icy landscape
Flashcard system: library, books, reading, literature, cozy corner, knowledge, study, vintage
Entertainment Hub: soft cyberpunk, pastel neon, digital world, hologram, future tech, cyber aesthetic, dreamcore
Tracking: mint, tea, botanical, herb garden, floral, vintage, peaceful
Project: dragon, kung fu, martial arts, legend, strength, Eastern mythology
Learning Room: zen, meditation, mindfulness, bonsai, harmony, inner peace, tranquility
Personal Achievements: Roman Empire, imperial Rome, marble, laurel wreath, senate, classical architecture, ancient power, luxury empire.

# ASSET CREATION

Based on the **OVERALL THEME** defined above, independently design and generate a collection of original, production-ready SVG decorations for each feature.

## Reference
Inspect all SVG files in `sources/img/daily-v2-reference/`.

Learn their **technical structure, visual softness, and craftsmanship**, but never copy their concepts, shapes, or compositions.

## Design Requirements
- Create diverse, original concepts that reflect each feature's individual theme.
- Maintain a **soft, elegant, subtle, and cohesive aesthetic**.
- Use muted colors, gentle gradients, delicate strokes, and controlled opacity.
- Ensure each asset harmonizes naturally with its feature's color palette.
- Avoid harsh contrasts, excessive details, and visually distracting elements.
- Use genuine, lightweight, scalable SVG vectors with transparent backgrounds.
- Give each asset a distinct composition and decorative purpose.
- Maintain visual consistency within each feature while preserving distinct identities across features.

## Directory Structure
Store all generated assets under `sources/assets/`, organized into **one dedicated folder per feature**.

```text
sources/
└── assets/
    ├── homepage/
    ├── daily-task-management/
    ├── tasks-hub/
    ├── notification/
    ├── events/
    ├── ai-engineering/
    ├── blogs-hub/
    ├── apcs-hub/
    ├── flashcards/
    ├── entertainment-hub/
    ├── tracking/
    ├── project/
    ├── learning-room/
    └── personal-achievements/
```

**Organization Rules:**
- Each folder contains only assets belonging to its corresponding feature.
- Use descriptive, consistent `kebab-case` filenames.
- Keep SVG assets independent, reusable, and production-ready.
- Store each feature's contact sheet inside its corresponding folder.
- Do not duplicate assets unnecessarily across feature folders.
- **Preserve existing Daily Task Management assets and UI unchanged.** Use them only as stylistic references unless explicitly instructed otherwise.

## Workflow
1. Analyze each feature's theme and inspect reference SVGs.
2. Independently brainstorm and select suitable asset concepts for each feature.
3. Generate optimized, standalone `.svg` files in their respective feature folders.
4. Validate rendering, transparency, clipping, and visual consistency.
5. Create a separate contact sheet for each feature.
6. Review the entire collection for cross-feature consistency and thematic differentiation.

## Deliverables
- Individual SVG files organized under `sources/assets/<feature-name>/`.
- One contact sheet per feature for visual evaluation.
- Brief asset descriptions and suggested UI placements.
- A summary of generated assets grouped by feature.

**Do not integrate generated assets into the website until user review and approval.**

# DETAILED DESCRIPTION + ENHANCEMENT + FIX BUGS
This is the detailed description, also the enhancement for each page.
## FOR ALL
- Optimize all UI transitions for ultra-smooth, responsive, and natural motion. Target **120 FPS on capable devices** (minimum 60 FPS), **interaction feedback <100ms**, and **200–400ms transitions** with appropriate easing. Eliminate input lag, stuttering, abrupt jumps, and unnecessary delays. Prefer GPU-accelerated `transform` and `opacity` animations, and avoid layout thrashing.
- Remove the default browser focus outline (rectangular border) from all input fields across the website, including search bars and textareas. Ensure no unwanted focus rings or borders appear when clicked or focused. Replace them with a subtle, theme-consistent focus indicator that preserves accessibility without disrupting the UI design. Source: `sources\img\img13.png`.
- Redesign hover transitions across all website cards and boxes, especially task cards. The current hover effects cause unwanted upward movement and blur, making interactions feel visually distracting. Refer to the installed **ui-ux-pro-max** skill to explore and select more elegant, subtle, and theme-consistent hover interactions. Prioritize smoothness, visual stability, responsiveness, and consistency across the website.
## HOMEPAGE
- Keep it as it is, I will enhance it later.
## DAILY TASK MANAGEMENT
- In the day arc, only display HH:MM (hour, mintues)
- Inside the New Task tab, there is 2 buttons, those are choosing Today and Tommorow, I think those are unecessary. Just remove it.
- Improve the **New Task** form validation UX. Reserve a fixed space beneath the Title field for validation messages to prevent layout shifts (CLS = 0). When the title is missing, display a subtle, theme-consistent error message with a gentle fade-in and brief attention animation (e.g., soft shake or highlight). Ensure the feedback is noticeable but not distracting, and disappears smoothly once corrected.
- Fix the excessive empty space in the **Daily Task Management** task list when scrolling. Currently, users can scroll far beyond the last task card until reaching the container's scroll limit, leaving a large, unnecessary blank area. This makes the scrolling behavior feel unnatural and visually unbalanced. The issue should be addressed across all applicable task views. `sources\img\img17.png`
- Improve the **Daily Task Management** day navigation (Yesterday / Today / Tomorrow). Currently, users can only switch between day panels using arrow buttons. Allow users to navigate by clicking directly on the corresponding side panel instead. Remove the navigation arrows entirely while preserving smooth transitions, existing swipe/drag interactions, and the active panel's expanded layout.
- The notification for "Task remove, task deleted, ...." should be notify in quick, just about 1s.
## TASKS HUB
- Current, there is no assets. Add corresponding assets to this page
- I want each task box should be a moderately tall portrait-oriented rectangle with balanced proportions, slightly taller than it is wide. Also 
- Redesign each **Tasks Hub task card** as a soft, elegant sticky note with balanced portrait proportions. Use a **darker, contrasting header color** for the title section, ensuring excellent text readability, and a **lighter, harmonious shade** for the task details. Assign each note a distinct color from a curated soft pastel palette, allowing colors to repeat cyclically. Display each task detail on a separate line with comfortable vertical spacing and subtle color differentiation. **Preserve all existing task information and functionality exactly as they are**, without adding or removing any fields, don't show full description, show about 2-3 lines then using ... 
    - User will click into the note for more information, they will be provided 4 options like previous version to shift the date, remove.
    - The show up full task description will be in the middle of the page, user are allow to click to outer space to exit. 
- Investigate and fix all interaction issues with the **three-dot menu (...)** on Tasks Hub task cards. Currently, clicking the menu causes noticeable delays, inconsistent responses, or fails to open entirely. Identify and resolve the root causes rather than applying temporary workarounds. Ensure **instant feedback (<100ms)**, smooth opening/closing animations, reliable click handling, and consistent behavior across all task cards. Preserve existing menu functionality and verify all interactions after fixing.
## OTHER FEATURES
- Applying the ui-ux-pro-max skills I gave you to enhanced UI/UX interfaces. I had no idea right now.

## REQUIREMENTS
- Applying all the assets in the `sources\assets` with respect to feature page, put it in suitable position.
