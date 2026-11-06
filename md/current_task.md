Okay, give me a full comprehensive prompt that include these information.
- Firstly, 1h ago Codex hit limit while running the finish the rest task, therefore I want Codex to continue Implement the work
- Secondly, your earlier prompt description 
```
# Task: Daily Task Management V2 — Celestial Visual Fidelity Upgrade

## Objective

Enhance the **existing Daily Task Management UI** to closely match the detailed celestial design provided in the reference image.

The current implementation already contains the basic layout, components, task functionality and celestial theme. However, its visual presentation is significantly less detailed than the target.

Your responsibility is to reproduce the target's **artistic richness, atmosphere, decorative layering and component-level details** without rebuilding existing functionality.

**This is strictly a UI/UX enhancement task. Do not implement, redesign or modify Day/Week/Month dashboard functionality or unrelated features.**

## 1. Mandatory reference inspection

Before modifying any code, carefully read and inspect:

- `PROJECT_DESCRIPTION.md`
- The current Daily Task Management components and styling
- `src/design/tokens.css`
- `sources/img/daily-v2-reference/daily-v2-target-reference.png`
- `sources/img/daily-v2-reference/daily-current-reference.png`
- `sources/img/daily-v2-reference/DESIGN_SPEC.md`
- `sources/img/daily-v2-reference/ASSET_GUIDE.md`
- All SVG assets in `sources/img/daily-v2-reference/assets/`

The target screenshot is the **primary visual reference**. The current screenshot represents the implemented application whose functionality must be preserved.

The supplied `DESIGN_SPEC.md` contains detailed descriptions of individual UI regions, decorative placement, visual layering and acceptance criteria. Read it completely.

The SVG assets are provided specifically to improve visual fidelity. Use the appropriate assets in the actual implementation rather than relying entirely on invented CSS shapes.

## 2. Preserve all existing functionality

Maintain the existing functionality and behavior of:

- Yesterday / Today / Tomorrow carousel
- Carousel navigation and animations
- Day / Week / Month controls
- Cosmic Forecast
- Progress
- Day Arc
- Task cards, menus, completion and CRUD operations
- Overdue section
- Responsive layouts and navigation

Do not introduce new task-management behavior based on the generated image.

In particular, do not implement new dashboard modes, custom task scrolling rules or carousel gestures unless those behaviors already exist in the current source.

The reference contains illustrative content and dates. Always preserve the application's real dynamic content.

## 3. Background reconstruction — highest visual priority

Recreate the target's beautifully layered, light-lavender celestial environment.

Maintain the current pastel workspace background while adding much richer decorations:

**Upper-left:** A very large, partially cropped zodiac wheel with concentric circles, sector divisions, fine tick marks and zodiac symbols.

**Upper-center:** A translucent spiral galaxy with softly luminous elliptical rings, surrounded by small stars and nebula haze.

**Upper-right:** A delicate ringed planet with a softly shaded lavender surface.

**Side margins:** Connected constellation paths, scattered star particles, four-point sparkles and fine orbit fragments.

**Lower region:** Lavender nebula clouds, planetary-orbit illustrations, tiny star glints and another large zodiac wheel partially outside the bottom-right edge.

Use supplied assets such as:

- `zodiac-wheel.svg`
- `spiral-galaxy.svg`
- `ringed-planet.svg`
- `constellation-sprinkles.svg`
- `nebula-clouds.svg`

Compose them into independent, responsive decorative layers.

Avoid simply using one flat background image covering the entire interface.

The background should remain continuous while scrolling, without visible rectangular boundaries, abrupt color changes or decorative elements that overlap important controls.

## 4. Richer decoration inside UI panels

The target's boxes are more atmospheric than the current application's mostly plain white panels.

Enhance their surfaces using subtle combinations of:

- Extremely soft lavender/ivory gradients
- Delicate internal corner illustrations
- Faint orbital curves
- Small starbursts and constellation nodes
- Subtle celestial light and nebula haze
- Refined hairline accents and soft shadows

The effect must remain elegant and readable.

Do not compensate for missing artwork using thick borders, generic neon glow, excessive shadows or glassmorphism.

### Cosmic Forecast

Add an elegant compass star and surrounding circular astronomical ornament.

Introduce subtle cloudy haze and a ghosted planetary/orbital illustration near the right edge.

Keep all existing text and functional behavior.

### Progress

Add minimal star and orbit details near the corners.

Maintain clear visibility of the actual progress bar, percentage and task completion count.

### Day Arc

Maintain the existing working timeline and calculations.

Use `day-arc-decoration.svg` to introduce a faint midday sunburst, orbital geometry and astronomical micro-details behind the real arc.

Enhance the apparent celestial character of the current-time and end-of-day markers only through visual styling.

Never replace the functional timeline with a static illustration.

## 5. Active day board redesign

The active day board should become the visual centerpiece of the page.

Preserve its existing size behavior and all interaction logic.

Introduce:

- A pale, luminous lavender container
- Refined inner atmospheric lighting
- Subtle nebula textures in the panel corners
- Tiny celestial sparkles
- A decorative moon-phase arc around the header
- An elegant central star/compass illustration
- Light, smooth visual elevation

Use `moon-phase-divider.svg` as a starting point for the decorative header artwork.

The active board should look richer and more visually prominent than the inactive neighboring previews.

Do not allow decorative layers to obscure the actual day title, date, completion count or Add Task control.

## 6. Task card illustrations

This is an important distinction between the current and target design.

The target task cards are not plain white rectangles. Each includes subtle astronomical artwork embedded into its background.

Enhance Daily task cards with decorative motifs such as:

- Ghosted orbital rings
- A partially cropped lavender planet
- A soft spiral-galaxy silhouette
- Small constellation linework
- Tiny celestial sparkles

Use `card-celestial-corner.svg` and relevant planet/orbit assets.

Place illustrations mainly within the rightmost 15–25% of the card.

Keep opacity low enough that titles, descriptions, deadlines, checkboxes, badges and menus remain completely readable.

Vary motifs slightly while maintaining a consistent design language.

Do not change task click, edit, completion or menu behavior.

Scope visual changes appropriately so that other shared TaskCard consumers, particularly Tasks Hub, are not unintentionally redesigned.

## 7. Yesterday and Tomorrow illustrations

Improve the existing empty-state artwork to match the target.

**Yesterday:** A soft cratered moon with elliptical orbit rings, surrounding particles and star glints. Use `orbiting-moon.svg`.

**Tomorrow:** A graceful Saturn-inspired planet with delicate multiple rings and soft lavender shading. Use `ringed-planet.svg`.

Make these illustrations visually richer than the current minimal circular icons.

Maintain the existing empty-state conditions and text.

Inactive day previews should continue to be softened by the existing carousel effects.

## 8. Overdue visual enhancement

Use the combination of **eclipse warning + fractured orbital geometry**.

Preserve the existing overdue cards and all functionality.

Add a faint eclipse illustration near the section heading and low-opacity orbital fragments near the far-right corners of individual overdue cards.

Use `eclipse-broken-orbit.svg`.

Maintain the current light pink/red warning palette.

Preserve accessible contrast for overdue labels, timestamps, buttons and actions.

Avoid dramatic red glows, aggressive animations or decorative elements crossing functional text.

## 9. Motion and responsiveness

Retain the project's established smooth-motion language.

Decorative elements may use extremely subtle opacity changes or nearly imperceptible movement.

Avoid fast twinkling, synchronized flashing, expensive rendering effects or excessive animation.

All purely decorative layers must be noninteractive and hidden from assistive technologies.

Respect reduced-motion preferences.

On mobile, reduce or reposition large celestial ornaments rather than allowing them to overlap controls or cause horizontal overflow.

## 10. Technical boundaries

Reuse existing architectural conventions and styling infrastructure.

Prefer local SVG assets, CSS gradients and lightweight decorative components.

Copy selected supplied SVG files into `public/visuals/daily-v2/` for runtime use, or adapt them into reusable inline SVG components.

Do not treat `sources/` as a publicly served asset directory.

Avoid unnecessary dependencies.

Do not modify database schemas, services, API contracts, persistence, business logic, notifications, other dashboard features or unrelated navigation behavior.

Use existing theme variables from `src/design/tokens.css`.

## 11. Mandatory visual verification

After implementing the visual changes, compare actual browser screenshots against both supplied references.

Pay particular attention to:

- Density and distribution of background stars and constellations
- Size and positioning of zodiac wheels
- Presence of the upper spiral galaxy and lower nebula clouds
- Celestial decorations **inside** the Forecast, Progress and Day Arc panels
- Richness of the active day board
- Moon-phase header artwork
- Planetary and orbital details within individual task cards
- Quality of Yesterday/Tomorrow illustrations
- Eclipse styling in the Overdue area
- Overall visual harmony, readability and spacing

If the page still looks sparse, flat or minimally decorated compared with the target, refine the background composition and panel ornaments.

Do not attempt to solve visual fidelity problems merely by increasing border thickness, shadows or blur.

Verify desktop, tablet and mobile layouts.

Run applicable project tests, linting and type checking. Report which files were modified and which checks passed.

## Expected outcome

The final result must look like the **existing, functional Daily Task Management page transformed into the rich celestial environment shown in the reference image**.

It should exhibit noticeably more detailed zodiac artwork, softly illuminated planetary illustrations, nebula atmospherics, constellation patterns and astronomical ornamentation throughout the page.

Preserve the original usability, data behavior, application structure and all existing functionality.

**Scope reminder: visual/UI/UX fidelity only. Do not proceed with the separate Day/Week/Month dashboard feature implementation.**
```
However because the rest of Task (relating to Day/Week/Month dashboard) will be done before, so I told you to change the prompt. And your answer is:
```
## Important: Implementation Order and Scope

This task begins **after the remaining Daily Task Management functionality has been completed, tested, and committed to Git**.

Before making changes:

1. Read `PROJECT_DESCRIPTION.md` and inspect the **latest source code**, not just the historical project description.
2. Identify all completed Day/Week/Month functionality, carousel interactions, scrolling behavior, and responsive features.
3. Treat the latest working implementation as the functional baseline.
4. Apply the supplied V2 design references, SVG assets, and `DESIGN_SPEC.md` to the existing UI.

### Strict boundaries

- This phase is exclusively for **visual redesign, styling, decorative details, and animation refinement**.
- Preserve all completed functionality, component interactions, and data behavior.
- Do not rebuild or reimplement Day/Week/Month features.
- Do not change business logic, APIs, database schemas, or unrelated components.
- If a visual improvement requires restructuring a component, preserve its existing behavior and test it afterward.
- Compare the result against the supplied reference images and refine until the intended visual details are faithfully represented.

**Goal:** Transform the fully functional Daily Task Management page into the celestial V2 design without introducing functional regressions.
```

- Thirdly, after Agent finish those task, I want you to do write the prompt to fix these bugs, and fulfill what I had unsatisfied:
```
# BUGS
## Homepage
- When user scroll by touch pad upper and upper, the web show white space. 
    - Visual Reference: `sources\vid\vid3.mp4`, `sources\img\img6.png` 
    - Ban user from scrolling by touch pad when upper or down limit is reached.
        - Not only in homepage but also in every page, so adjust for the global scale

- Scrolling consecutively: In many big website, they optimize scrolling experience, even though when user scroll up and down many times (spam sroll) - it is still stable, smooth.
    - Visual Reference 1: `sources\vid\vid4.mp4` - Current website scrolling error
    - Visual Reference 2: `sources\vid\vid5.mp4` - Sample website that has smooth scrolling transition.

- Horizontal Fast Scrolling: When user do fast scrolling upward in the Feature Collection (Horizontal), there is some thing that overlap (black) appear continuously.
    - Visual Reference: `sources\vid\vid6.mp4`
# UNSATISFACTION
## Homepage
- Font family of the header "Explore my space"
    - You should select font family, font size, weights that match to the theme, homepage represetation.
- "Explore my space" button, transition
    - Eradicate the code related to the button, no transition, transform, blue, opacity, ..., "Explore my space" is only positioned in the header part of feature collection.
- Pause button is unecessary - Remove it
- Scroll bar
    - I don't need the default scroll bar in every page inclduing homepage. Just hide or delete it.
```
- You have to write a comprehensive prompt to describe these problems, and instruct agent to solve these problem base on my ideas.

# YOUR TASK
- I will let Agent run continuously without asking me anything, because I will take a nap.
- Agent has to implement the task by itself, if there is anything ambiguous and need for clarification, agent has to decide best options.
- Agent has to finish all the task at once, pursuing the goal.
- Your task is write a comprehensive prompt that describe my target include 3 points I mentioned upon. The first task is continuous the work, the second is rewrite the exact prompt, the last task is fixing the bugs I mentioned and unsatisfied points (based on my solution to describe)
- I put the `DESIGN_SPEC.md`, `ASSET_GUIDE.md` file in the `md` folder
