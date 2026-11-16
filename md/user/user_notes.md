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

# HTS v2.0
- This is the version 2 of the website, with many adjustments.
- The lastest version is an awesome version that quite satisfied me. You have to maintain, do not modify anything that affect the current structure, only focus on what I telling you to do, don't create conflicts.
## MODIFICATION
- This is the modification part, which describe unwanted (not bugs) section.
### Collection end scrolling
- Where: My Collection - Feature Collection page
- Current status: When user scroll until the last feature box (Personal Achievement), if user continue to scrolling down, it will show the footer.
- Revised version: I want that this feature collection page doesn't display the footer, when user scrolling to the end of the features - that is the end. Don't pull user to the footer (delete the footer section).
- Sources:
    - End state should behave: `sources\img\img23.png`
### Collection scrollback - begin feature
**Where:** My Collection – Feature Collection (Horizontal Scroll)
**Important Notes**: This is the responsive problem, some device with smaller screen will behave like what I described below. For example: My laptop standard 14inch has this error. However, the "additional backward scrolling should initially have no effect" is still applying globally not only responsive.
**Requested behavior:**

- **Scroll-back limit:** When scrolling backward, the first feature card must stop at the position shown in `sources\img\img24.png`. Do not allow the excessive empty space on the left shown in the current version.
- **Scroll resistance:** Once this limit is reached, additional backward scrolling should initially have no effect. The user must scroll backward a little further before the transition back to the homepage begins.
- **Purpose:** Prevent users from accidentally returning to the homepage when scrolling backward quickly to find previous feature cards.
- **Smoothness:** Keep the scrolling and transition smooth, without abrupt jumps or noticeable stuttering.

### Smooth transition - swapping display
- **Where:** My Collection – Feature Collection (View Mode Switching).
- **Requested behavior:** Switching between Horizontal and Vertical modes must be ultra-smooth, with seamless layout transitions, no abrupt jumps, flickering, or noticeable stuttering.
- **Constraint:** Preserve the current design, functionality, and scroll behavior of both modes.

### Daily Task Managment
#### Remove - Eradicate
- Eradicate 2 yellow assets as the image described, positin bottom of the page. Sources: sources\img\img14.png, sources\img\img25.png
- Eradicate (means not only delete on specific region but also deactivate it every has this image) the sources\img\daily-v2-reference\assets\eclipse-broken-orbit.svg, sources\img\daily-v2-reference\assets\spiral-galaxy.svg
- Remove the svg vector in the COSMIC FORCAST. Only remove it from the box, not totally eradicate it.
- Because there is some components, boxes still using those svg, hence, you have to merge the previous svg with the new svg you created (I suggest reconstruct the folder directory for every related, merging the previous assets in sources\img\daily-v2-reference to the sources\assets\daily-task-management and sources\assets\tasks-hub), therefore there is more choices for boxes, components which are using svg for decoration (such as daily task box, overdue box)
#### Changing date
- When changing date (Week/Month mode) using the arrow < and >. The arrow will not be fixed, it changes with respect to the string length. I don't want it, because user have to move the pointer every time the length is different. Hence, make the arrow fixed (not too far from the date, but no overlap text).
#### Task Detail
- For now, each task in the Daily Task Management doesn't allow user to see Task Description, I suggest when user clicking the task, it shows a 75% centralized dashboard that show everything user wrote in that task.
#### Misaligned
- **Where:** Daily Task Management – Task Cards.
- **Reference:** `sources/img/img26.png`
- **Issue:** Task titles, descriptions, and metadata are visually misaligned, with inconsistent indentation and spacing.
- **Required fix:** Align all text elements to a consistent left edge, establish proper vertical spacing and hierarchy, and ensure long content truncates gracefully without disrupting the layout.
- **Constraint:** Preserve the existing card design, dimensions, colors, and functionality. Only adjust text alignment, spacing, and positioning.
### Task Hub
- The same misaligned problem with the Daily Task Management – Task Cards. This happens to the title of each task box. Also the number of Task, as you can see there is a misaligned with the Due Soon and Number 3. **Source**: sources\img\img27.png
<!-- - Increase the width to 120%. -->
- The height now is too high, I want you to only display maximum 2 description lines, if the description longer - give ... Smaller the height but every box must have the same size.
- The dot before the time left is unecessary
- Always display the Completed Task. The button showing "completed Task" is unecessary because people have to scroll back then scroll down to see. I suggest always display the completed task, it should behave like a dropdown menu (but not design like that - the text behave like the completed task showing button), only display the completed task box once user click.
- Also when removing the Show Completed button, that position will be empty, I think shifting the Add Task button to that position is a nice choice.
- The search bar having duplicated X, only keep the right one, the left colored one doesn't match the theme. **Source**: 
- Re-format the task date: It should display hour:min /dot day of week (abbreviation Mon, Tue, ...). /dot date (don't include year)
- When the task title is longer than its expected size, don't increase the title part, I think only one line should be displayed, if the length is longer - using ..., user will click to see the task details.
- Right now, except Completed Task, there is 3 category: Later, Due Soon, Overdue. This is so anoying, only display Overdue, On-going.
#### Task Box Details – UI/UX Issues

**Where:** Daily Task Management – Task Details Popup

**Reference:** `sources/img/img30.png`

**Issues & Expected Behavior:**

1. **Unnatural Title Wrapping:** The title breaks awkwardly in the middle of words. Prefer natural word-boundary wrapping, only splitting excessively long words when necessary to prevent overflow.
2. **Inconsistent Left Alignment:** The Normal, Active, Date, and Overdue metadata are slightly shifted to the right. Align them consistently with the main content.
3. **Excessive Vertical Spacing:** The gap between the description and metadata is unnecessarily large. Adjust spacing for a more compact, balanced layout.
4. **Weak Metadata Hierarchy:** Priority, status, deadline, and overdue information feel disconnected. Improve their visual grouping and spacing.
5. **Unclear Action Hierarchy:** The date-transfer buttons and task-management buttons lack clear visual separation. Improve their grouping without changing functionality.
6. **Potentially Confusing Actions:** The distinction between "Add to today/tomorrow" and "Transfer..." is unclear. Review their purposes and ensure users can distinguish them.

**Constraints:** Preserve the existing visual theme, content, and functionality. Focus on alignment, spacing, readability, and visual hierarchy without unnecessary redesign.
### Events
- Currently, when I exit the edit mode, there will be a warning panel, however there exists these problems:
    - First the UI error, the 3 button is not aligned, they should be aligned. **Source**:
    - The second is, I don't like the saving draft mechanism like this, I want a button, when user click to that "Draft" button, it shows user on the main dashboard the events in draft version, user can see, edit or delete those events.
- As the past events increasingly, showing all of them is not a good choice, use the scrolling mechanism with ultra smooth scrolling transition philosophy like the Daily Task Management.
- The time format must be 24h
- The assets is overlapped, shift it furthur to the left. Source: sources\img\img28.png
- In the event description (source: sources\img\img29.png) - you should split time to a seperate line, the day of week (Sun, Mon,... - abbreviation version) instead of all in one line like that.
### OVERALL
- Every notes/description text box must support: Bold - strong text and support bullet points (as usual editor, user using - + space -> bullet point, enter for next bullet point)
- The default checkbox, calendar, choosing time, category options right now is so boring, you have to base on the theme of each pages, create a corresponding soft color, beautiful that match the theme, satisfies the core idea of the page also following ui-ux-pro-max skill.

