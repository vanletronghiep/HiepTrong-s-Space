# PROJECT OVERVIEW 
**Hiep Trong Space is a local-first personal life-management web app for one user.** It helps the owner organize tasks, deadlines, learning, projects, and ambitions while gaining experience building a modular application with AI assistance. Initial use is local on Windows, using free tools.

# HOMEPAGE
- Based on current code.
## NEW IDEA
- Keep scrolling, when it reach a state like the `sources\img\img10.png`. It will transfer into a new scrolling phase.
- **PHASE 1:** Keeping previous scrolling style until reach state `sources\img\img10.png`.
- **PHASE 2:** When reaching this state.
    - The earth will remain the same size, keep rotating.
    - The earth gradually shift to a new position instead of middle with respect to the user's scrolling
    - While the earth is shifting to left position, the right paragraph will gradually appearing (from 0 opacity smoothly transiting 100% opacity). I don't mean the whole text will gradually appear, it slowly increasing the opacity from the right to left beautifully.
    - Sources for better visualization: I will give you sources (img/vid) for reference:
        - `sources\img\img10.png` - The scrolling state that start the phase 2 state
        - `sources\img\img11.png` - The position of the each object.
            - This is the state between 2 phases, the frame (red, blue, green) is the object segmentation. Red shows the current state, green shows the final state after transition, blue shows the text/heading will appear after transition.
        - `sources\img\img12.png` - The final PHASE 2 state after transition, however, you only look at its idea, components. The exact position might be difference
        - `sources\vid\vid8.mp4` - The video for reference, it shows how the motion, transition, content should behave.
        
- **PHASE 3:** After reach the final state of PHASE 2, user are able to continue the scrolling. When scrolling new background will gradually appear with respect to user scrolling then it opens a brand new background to show the feature gallery. You can brainstorm a crazy ideas, which is modern, beautiful. At first I only can brainstorm this idea, the exact may be depends on Agent idea, so provide me some idea for it.
    - The new background of the feature gallery must match the theme I set before (zodiac, universe, planets, stars, ...) you can refer to other UI/UX ideas. 
    - The color must be soft
    - You can redesigned the features collection, each item background,..
    - But how it works (horizontal scroll, vertical should be keep).
## REQUIREMENTS
- The agent don't delete the old version, it should decide to keep/modify/delete wisely, avoiding affecting the bugs that have already fixed before.
- You can determine to you which fonts, you can use available or even download on the internet, i'm free. I just care the UI results. The font family should be match with the page, fit, and beautiful.


# Priority

### PRIMARY
HOMEPAGE $\rightarrow$ DAILY TASK MANAGEMENT $\rightarrow$ TASK HUB $\rightarrow$ NOTIFICATION HUB $\rightarrow$ EVENTS $\rightarrow$ IN PROGRESS PROJECT $\rightarrow$ ANNUAL MILESTONE $\rightarrow$ APCS HUB $\rightarrow$ LEARNING ROOM.
### SECONDARY
TRACKING $\rightarrow$ AI ENGINEERING $\rightarrow$ FLASH CARD $\rightarrow$ ACHIEVEMENTS $\rightarrow$ ENTERTAINMENT HUB

## Daily Task Management 
- Fix the bugs I mentioned below, at the moment, there is no addition adjustment.

## Tasks Hub
- The task hub look good right now
- Because they are all task system, the task hub can take the idea from the daily task management. From theme, how it work, to the decoration details (don't take too much).

## Notification Hub
- Clear notifications >= 7 days ago
- A small text denotes N days ago in the corner of the bottom right corner of the notification message.
- Read box ticked, user can tick to turn off red point (show that user already read that notification)
- A notification message should include these: Title, Read-check, days ago, time-left, tag (because there are many type of notifications so different in color, tag will help user identify more easily)

## Events
- I use this tab to save following Events: School Offline/ Online Events, Meeting, Exam Date (High Priority, should be treated as a special zone in the Events Hub)
- You can freestyle for this tab! However following these constraints below
- You know, I want to make the theme of every page is different but same style with the Task Management, so the theme I want here is GREEN. It means forest, tree, grass. You should ask agent to generate the svg icon for the background.
- The color strength should be soft like the Task system.
- The event page should show these: 
    - At the beginning of the page, it shows the general statistics of events
    - Then it show boxs of events.
    - The content under the boxes are week/month calendar event, switch mode.
- You can design freely, but following UIUX general rules.
- Showing how many relatively how many day left (for long), how many hours left
- Showing the date today with exact time (don't count second)
### Event statistics
- It only show important statistics like: How many events, how many this week, or anything else you can brainstorm for primary statistics.
### Box of events
- The box shows only show general information, an when user click to the box, open a small window showing the events details notes, ..... That window is in the center of the screen, user can turn it off when click to some button (also give a shortcut like Esc for quicker exit)
- The box only shows the main information like title, location, time, ...
- There are 2 kind of events that is Deadline and real event (meeting, exam, date, ...)
- There are 2 kind therefore the box colors should be different
### Calendar
- Switch mode between week and month
- I like the idea in the task management, you can refer to it, but brainstorm for better and more different.

## AI Engineering (Blank Page)
- Roadmap
- My seperate study space about my career, AI Engineer
- Connect with Notion notes
    - Import Notes to website.
## Blogs Hub 
- My random writing (Draft/ Writing Mode)
    - Domino Procrastination
    - How long a human brain can focus intensively?
- Give me a soft place with soft music to free style my writing
- There are 2 main idea, one for personal note and one for not. So you brainstorm the best way to construct it properly.
- Support many basic, primary tools like notion (I don't use latex, code ,....)
- The theme in this page is wood, tree, which shows the characteristic of humble, calm, ... of a mature person.
- Show who is author of that writing post, because sometime I will clone a post from other people 
- Give some decoration details but not overwhelmed
## APCS Hub - University
- Theme: sea, blue, sky.
- Allowed decoration details svg
- Study documents: take the folder D:\APCS\University\Year I. But redecorate it, for better represents
-  At first, this is my idea, i will add later.
## Flashcard System
- Theme: Acient, Viking, History of europe
- English flashcard with multiple topics, groups
- Allowing user to type flashcard
- Take the idea from Brainscape but don't copy their idea, just for reference
- Ctrl+S to save when finish typing
## Entertainment Hub (Blank Page)
- Music Hub
    - Connect with Youtube Music, or sth
- Game Hub
    - No idea
- Library
    - Reading Book
## Tracking
- Theme: Japan Culture, Signature, ...
- Daily Habits
- Sleep Calculator
- Sleep Tracking
- Screen Time
    - User input every screen time
    - Analyzes data, create chart, diagram, ... for statistics
    - Phone using Tendency
## In Progress Project 
- Theme: Computer Science, Computer, Interent, Gaming.
- Go Game 
- Hiep Trong Space
- Every project will be an overview of each project contains title, deadline, support relative deadline, progress (writing by user), writing from user for project overview details, current problem, ...

## Learning Room
- Theme: Focus, Cozy
- I have no idea now, but I want to implement it right now.
- Some feature I need: Promodo, ...
- Design like a learning room platform
- Statistics for Focus, Study time, Pause time, using diagram, map, .... everything else to represents beautifully.
## Personal Achievements
- Contest registered, results
    - What I have learned from this contest
    - Stages (Elementary to Universtiy)
- Create the 2 mode for admin and viewing
- Idea like a beautiful portfolio
- Allowing user to switch to admin mode for editting.
# BUGS
## BUG 01
- Where: Every feature page from now on
- When I click to the Universe - shortcut to jump to another feature page, it shows a search bar for faster jump, however it shows a border line cover the search bar, I don't like it so just remove that border line.
- Source: `sources\img\img13.png`
## BUG 02
- In the Daily Task Management page, there is a svg is too unecessary causing dense details. I only mean remove them if they appear in the background, day arc.
- Remove these svg: `sources\img\daily-v2-reference\assets\eclipse-broken-orbit.svg`, `sources\img\daily-v2-reference\assets\spiral-galaxy.svg`, `sources\img\daily-v2-reference\assets\day-arc-decoration.svg`, sources\img\daily-v2-reference\assets\moon-phase-divider.svg
- Also I found a unecessary detail, but I couldn't find the svg of it so it give you the image of that detail in the website. This detail is a weird yello straightline with two yellow dots. Source: `sources\img\img14.png`
- Also remove the zodiac wheel in the bottom right corner.

# UIUX general rules
- Every transition must be supper smooth
- The theme color must be soft
- Every UI UX idea must be match the theme, idea don't create flashy, AI slop, rigid idea.
- Agent can be creative but don't exceed the theme idea
- Each page can be a different idea, not same idea like universe, zodiac, ... user will tell the main idea in each page description.