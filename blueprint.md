# Hiep Trong Space — Product Blueprint

A personal space for organizing life, learning deeply, and turning ideas into real projects.

## 1. Vision and document purpose

Hiep Trong Space is a local-first personal life-management web app for Hiep, a first-year student in the Advanced Program in Computer Science at HCMUS. It brings daily responsibilities, university learning, projects, personal writing, wellbeing, and ambitions into one coherent home. Initial use is by one person on Windows, using free tools.

The app should be useful enough to return to every day and personal enough to feel like Hiep's own space. Building it is also an opportunity to learn through creating a modular application with AI assistance.

This blueprint expresses the intended product experience. It evolves the existing application and preserves valuable behavior and previous fixes. It is not an implementation plan, agent assignment, or claim that every feature already exists.

**Reading guide**
- **Confirmed:** Requirements from [Hiep's description](md/user/user_desc.md) and subsequent conversation.
- **Proposed:** Creative additions for areas Hiep delegated, open to revision.
- **Recommended default:** A recommendation adopted under Hiep's instruction to proceed without asking about routine choices.

The individual page themes below reflect Hiep's confirmed direction, replacing the older product assumption that every inner page must be lavender. Existing engineering specifications will need to be reconciled during future implementation; this blueprint does not silently rewrite them.

## 2. One home, distinct spaces

**Confirmed:** Each area has its own atmosphere while sharing soft colors, readable content, smooth transitions, and understandable interactions. Personality should support the activity rather than overwhelm it. Avoid flashy effects, rigid generic layouts, and excessive decoration. Typography may vary where it improves the result and fits the page.

Navigation labels should be clear. More expressive language can appear in page headings and descriptions. Keep the names **APCS Hub**, **Milestone**, and **Tracking**.

| Space | Visual direction |
| --- | --- |
| Homepage | Cosmos, rotating Earth, stars, and a soft nebula gallery |
| Daily Task Management | Existing celestial workspace, with the requested decoration cleanup |
| Tasks Hub | Related to Daily Task Management, with restrained borrowing |
| Notifications | A readable shared surface that fits its surrounding workspace |
| Events | Soft green, forest, trees, and grass |
| AI Engineering | Proposed: a calm technical study space with subtle network motifs |
| The Writing Room | Wood, trees, warmth, maturity, and quiet |
| APCS Hub | Sea, blue, and sky |
| Flashcards | Ancient history, Viking influences, and European historical imagery |
| Entertainment Hub | Proposed: a relaxed personal lounge |
| Tracking | Japanese cultural influences and restrained visual detail |
| Projects | Computer science, computers, the internet, and gaming |
| Milestone | Proposed: a quiet horizon and a path of meaningful landmarks |
| Learning Room | Cozy, focused, and comfortable for sustained study |
| Achievements | A personal portfolio; proposed: a tasteful gallery of experiences |

**Recommended default:** Retain the existing shared navigation and familiar controls across these themes. Support keyboard use, smaller screens, and reduced motion so visual ambition does not obstruct everyday use.

## 3. How the spaces connect

**Confirmed:** Connect related information where useful while retaining distinct spaces.

- Daily Task Management and Tasks Hub remain two views of the same tasks.
- Events can link to preparation tasks; projects and milestones can link to relevant work or learning.
- Hiep chooses which task or project deadlines also appear in Events.
- **Every item with a deadline or explicit scheduled time connects to the shared notification system**, regardless of whether it appears in Events.
- Notifications operate inside the app first, including appropriate missed reminders when Hiep returns. Use sensible defaults with individual timing adjustments or muting.

**Recommended default:** Linking an item should preserve its identity and original context. A deadline shown in several places should not require repeated editing or generate duplicate reminders for the same occurrence. Completed, cancelled, or rescheduled items should no longer produce obsolete reminders.

## 4. Homepage: an introduction and an invitation

**Confirmed:** Build on the existing homepage, retaining its opening experience and the gallery's horizontal and vertical modes.

### Phase 1 — Approach Earth

Preserve the current scrolling journey until the Earth reaches the state identified in `sources/img/img10.png`.

### Phase 2 — Meet Hiep

Earth stays the same size, keeps rotating, and gradually shifts left with scrolling. The introduction appears on the right through a smooth reveal progressing from right to left, rather than fading in the entire text uniformly.

Use Hiep's introduction, with a minor grammatical polish:

> Hi! I'm Hiep.
>
> A first-year student in the Advanced Program in Computer Science at HCMUS.
>
> Passionate about AI, Machine Learning, and their applications. I enjoy solving problems, exploring new technologies, and turning ideas into real projects.
>
> **Less talk. More action. Keep building.**

The final line is the closing emphasis. Exact composition may adapt to the viewport.

Reference intent: `img11.png` shows the composition and transition positions; `img12.png` illustrates the final state; `sources/vid/vid8.mp4` demonstrates the desired motion. These are visual references, not rigid pixel coordinates.

### Phase 3 — Enter the feature gallery

**Confirmed direction: Soft nebula.** Continued scrolling gradually reveals muted lavender and blue clouds and the feature gallery.

**Proposed treatment:** Earth recedes from visual prominence while a softly lit nebula becomes the gallery background. Restrained stars and gently differentiated card backgrounds suggest destinations within Hiep's space. Keep text and navigation clear. Preserve both horizontal scrolling and vertical browsing.

## 5. Daily responsibilities

### Daily Task Management

**Confirmed:** Keep the current experience and functionality, addressing the requested visual bugs without expanding the feature scope. Preserve the existing day, week, month, and overdue workflows.

Reduce unnecessary decoration in the background and Day arc. Specifically address the named eclipse, spiral galaxy, Day arc decoration, and moon-phase divider artwork where Hiep identified it, the unwanted yellow line with two yellow dots, and the zodiac wheel at the bottom right. Do not indiscriminately remove useful icons elsewhere.

### Tasks Hub

**Confirmed:** The current Tasks Hub is satisfactory. Keep it as the broader task collection and draw selectively from Daily Task Management's theme, interaction, and detail. Maintain the shared task identity between the two spaces.

### Notifications

**Confirmed:** Extend the shared notification experience across every applicable feature.

Each notification should communicate:
- The item title and a clear type/category tag with distinguishable color.
- A read checkbox; marking it read clears its unread indication.
- Relative age in the lower-right corner, using days where appropriate.
- Time remaining, or a meaningful state such as due now or overdue.

Clear notifications aged **seven days or more**. Individual reminder defaults can be adjusted or muted. Opening a notification should lead to its related item.

**Recommended default:** Match reminder behavior to the activity: an exam or meeting needs advance notice and a start-time cue; an unfinished deadline needs approaching-due and overdue awareness. Show useful catch-up information on return without flooding the center with every obsolete reminder. Desktop alerts and delivery while the app is closed are outside the initial scope.

### Events

**Confirmed:** A soft green space for school events, online or offline meetings, exams, and deadline entries. Support both one-time and recurring events, including regular classes and meetings.

The page contains:
- A concise overview of important event statistics.
- Event cards showing essential information such as title, location, and time.
- A switchable week/month calendar, inspired by the task calendar but with its own visual identity.
- Today's date and current time without seconds, plus relative time until events.

Distinguish deadline entries from events with a start time through clear labels and color. Opening a card reveals notes and details in a centered window, dismissible through a visible control or Escape.

Exams are high priority and deserve special prominence.

**Proposed:** An **Upcoming exams** section within Events, with countdowns and optional links to preparation tasks. Overview statistics focus on upcoming events, events this week, and approaching exams. Recurring events should allow an individual occurrence to be changed without forcing a change to the entire series.

## 6. Projects and longer-term direction

### Projects

**Confirmed:** A space for projects such as Go Game and Hiep Trong Space. Each project has a title, deadline where relevant, relative time remaining, manually recorded progress, an overview, and current problems or blockers.

**Proposed:** A compact project collection leading to a focused project overview. Keep the next meaningful step visible and allow links to related tasks and milestones. Manual progress remains available rather than being forced to equal task completion percentages.

### Milestone

**Confirmed:** Keep the name **Milestone** and allow any timeframe, not only annual goals.

**Proposed:** A calm map of meaningful ambitions and the landmarks toward them: finishing a significant project, reaching a learning goal, or preparing for an important opportunity. Each milestone can include its meaning, an optional target date, a short progress reflection, and links to relevant projects or learning.

Milestone expresses what Hiep is working toward. Achievements records what happened and what he learned. Avoid duplicating the daily task list.

### Achievements

**Confirmed:** A portfolio-like record of contest registrations, results, and lessons learned, organized across stages from elementary school to university. Provide a viewing mode and an editing/admin mode.

**Proposed:** Use the clear controls **View** and **Edit**, with entries that tell the story of the experience rather than displaying only awards. Keep future contest dates connected to notifications.

**Recommended default:** These modes belong to the existing single-user app. Public publishing and a separate multi-user administration system are not implied.

## 7. Learning and university

### APCS Hub

**Confirmed:** Keep the name **APCS Hub**. Use a sea, blue, and sky theme with restrained SVG decoration. Present the university materials in `D:\APCS\University\Year I` more clearly.

Browse, search, and open the existing files without moving or reorganizing them on disk.

**Proposed:** Present the collection through semester and subject views where supported by the actual folders. Clearly distinguish any organizational labels in the app from the files' real locations.

### AI Engineering

**Confirmed:** A dedicated study space for Hiep's AI engineering career, with a roadmap and access to Notion notes.

**Proposed:** Organize learning around topics, related notes, and practical projects. Make it easy to see the current topic and a useful next learning step without turning the roadmap into a rigid course.

**Recommended default:** Import reading copies of selected Notion notes, maintain the originals in Notion, and refresh the copies manually. Keep the source connection visible. Live two-way synchronization is not part of this initial concept.

### Learning Room

**Confirmed:** A cozy focus space with Pomodoro support and attractive statistics for focus, study, and pause time.

**Proposed:** Choose a study intention or related task, subject, or project; start a Pomodoro or uninterrupted focus session; take breaks; then review the session. Present a simple picture of study time and focus patterns through readable charts. Keep the active session visually quiet.

### Flashcards

**Confirmed:** English flashcards grouped by topics, with an ancient/Viking/European-history atmosphere. Allow typed card creation and **Ctrl+S** to save while editing. Brainscape is a reference for usability, not a design to copy.

**Proposed:** Separate card writing from review. Use a straightforward prompt-and-answer flow and simple confidence feedback to prioritize cards that need more practice.

## 8. Writing, wellbeing, and leisure

### The Writing Room

**Recommended name:** The Writing Room, replacing the working label Blogs Hub.

**Confirmed:** A calm, wood-and-tree-inspired writing space with soft music, restrained decoration, drafts, and basic rich-text tools. Advanced code and LaTeX tools are unnecessary.

Use two main categories:
- **Personal Stories:** Hiep's experiences, memories, and personal reflections.
- **Ideas & Perspectives:** Hiep's thoughts or explanations about a topic, plus saved writing from other authors.

Examples include domino procrastination, sustained attention, and why some conversations feel unengaging. Optional topic tags such as Habits, Human Behavior, Communication, and Learning describe the subject.

Authorship is separate from category. Show the original author and source for saved writing, and distinguish Hiep's added commentary from the original article.

**Proposed:** A **By me / Saved from others** filter and an uncluttered writing mode. Keep music optional and user-controlled. Writing remains personal/local unless public sharing is requested later.

### Tracking

**Confirmed:** Keep the name **Tracking** and its Japanese cultural direction. Include daily habits, a sleep calculator, sleep tracking, and manually entered screen-time records. Use charts to reveal patterns, including phone-use tendencies.

**Proposed:** Simple daily check-ins and weekly reflections, with calm feedback rather than guilt-driven scores. Treat sleep calculations as planning aids, and make manual entry quick enough to sustain.

### Entertainment Hub

**Confirmed:** Include music, games, and a reading library. YouTube Music or another music connection is an idea rather than a settled integration.

**Proposed:** Begin with a relaxed collection of music links, books, and games, with a small “continue enjoying” area. Use external music links initially; richer playback integrations depend on what the selected service supports. Keep game discovery and organization modest until there is a clearer need.

## 9. Priorities and requested refinements

**Confirmed primary order:**

Homepage → Daily Task Management → Tasks Hub → Notifications → Events → Projects → Milestone → APCS Hub → Learning Room.

**Confirmed secondary order:**

Tracking → AI Engineering → Flashcards → Achievements → Entertainment Hub.

The Writing Room was described without a position in either sequence. **Recommended default:** Include it in the whole-product vision and place it after the primary sequence, before the secondary sequence, without changing either sequence's internal order.

The immediate visual corrections are:
- Remove the unwanted border around the Universe navigation search field; reference: `sources/img/img13.png`.
- Apply the scoped Daily Task Management decoration cleanup; reference: `sources/img/img14.png`.
- The named artwork is `eclipse-broken-orbit.svg`, `spiral-galaxy.svg`, `day-arc-decoration.svg`, and `moon-phase-divider.svg` under `sources/img/daily-v2-reference/assets/`.

## 10. What a successful product feels like

Hiep can understand today's commitments, prepare for upcoming events, study with focus, move projects forward, and record ideas or experiences without maintaining disconnected copies of the same information.

The homepage feels personal. Each destination has an appropriate identity. Related commitments remain connected, timed items produce useful reminders, and decoration leaves room for the content.

This blueprint is comprehensive enough to preserve the vision and concise enough to revise. Proposed concepts can evolve without being mistaken for requirements Hiep explicitly supplied.

