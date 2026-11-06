# ABOUT
- This file is edited by human. Agent can read but has no permission to edit. 

# FEATURES

## Priority

### PRIMARY
DAILY TASK MANAGEMENT $\rightarrow$ TASK HUB $\rightarrow$ NOTIFICATION HUB $\rightarrow$ EVENTS $\rightarrow$ IN PROGRESS PROJECT $\rightarrow$ ANNUAL MILESTONE $\rightarrow$ APCS HUB $\rightarrow$ LEARNING ROOM.
### SECONDARY
TRACKING $\rightarrow$ AI ENGINEERING $\rightarrow$ FLASH CARD $\rightarrow$ ACHIEVEMENTS $\rightarrow$ ENTERTAINMENT HUB

## Daily Task Management 
- Priority: No 1 Priority
- Behavior:
    - Default mode is a 3 consecutive day (yesterday, today, tomorrow) tasks list.
    - I can change the display: Week/ Months
    - Adding task can only exists in the today, tomorrow tab.
    - Every task has a 3 dots (Editting) to open edit tab of that task.
    - Overdue task can be transfered to the Today/Tomorrow/ Specified Date.
    - Deleting Task button.
    - When choosing a Date, are allowed to type the new deadline time (24h). Date with this pattern: Day/Month
    - Add task button, allow user to add task with following features:
        - Task title
        - Deadline with particular date, time.
        - Piority - Urgent/ Normal/ Optional
        - Description - User Description about the task, they type in
        - Pinned option
    - Each task has these features:
        - If overdue, changes the color to color (red color family)
    - Finished Task 
        - Completed tasks once ticked by user (marking finished) will be push to the bottom (including smooth transition)
        - A light color strikethrough to mark completed task, with italic.
        - There will be a small box represents number of finished task that day.
    - Overdue List:
        - Under the main daily task management space, there will be a Overdue Task list which let user know which task is overdue. Its representation is the same with daily task, it is the box (describe particularly in the `ui_readme.md`). 
        - Also there will be a button that allow user to transfer the overdue task to another date
        - Deleting Task Button
- Statistics: This is a statistics building for Task Managment, this feature will be describe later.

## Tasks Hub
- Its features likely same with the **Daily Task Management**
- Adding task button - 100% same with **Daily Task Management**
- Connect with **Notification Hub**, notify one day before the task deadline, if the task deadline - present < 1 day => notify before 1/4 time. Such as: 12h left => Notify when it is 3h left.
    - Tag in notification hub: Due Soon
- Allow to connect with **Daily Task Management**, when user expand one task, there will have an option to for user to add it to Today/Tomorrow/Date.
    - When a task a ticked finished (in the Daily Task Management) it automatically sync with the Tasks Hub to remove that task.
    - Vice versa, when click finished/ Deleted in a Task Hub, the task in the **Daily Task Management** will also be impacted.
- When click finished in the Task Hub. 

## Notification Hub
- Clear notifications >= 7 days ago
- A small text denotes N days ago in the corner of the bottom right corner of the notification message.
- Read box ticked, user can tick to turn off red point (show that user already read that notification)
- A notification message should include these: Title, Read-check, days ago, time-left, tag (because there are many type of notifications so different in color, tag will help user identify more easily)

## Events (Blank Page)
- I use this tab to save following Events: School Offline/ Online Events, Meeting, Exam Date (High Priority, should be treated as a special zone in the Events Hub)
- Leave this Page empty, i will adjust later
## AI Engineering (Blank Page)
- Roadmap
- My seperate study space about my career, AI Engineer
- Connect with Notion notes
    - Import Notes to website.
## Blogs Hub (Blank Page)
- My random writing (Draft/ Writing Mode)
    - Domino Procrastination
    - How long a human brain can focus intensively?
## APCS Hub - University (Blank Page)
- Self-study Progress
- Subject sources
    - Support uploading data
    - Subject Notes
## Flashcard System (Blank Page)
- English flashcard with multiple topics, groups
- Ctrl+S to save when finish typing
## Entertainment Hub (Blank Page)
- Music Hub
    - Connect with Youtube Music, or sth
- Game Hub
    - No idea
- Library
    - Reading Book
## Tracking (Blank Page)
- Daily Habits
- Sleep Calculator
- Sleep Tracking
- Screen Time
    - User input every screen time
    - Analyzes data, create chart, diagram, ... for statistics
    - Phone using Tendency
## In Progress Project (Blank Page)
- Go Game Project
- Task Management Project
## Annual Milestone (Blank Page)
- Master Git
- Learn Transformer
....

## Learning Room (Blank Page)
- Import from Today Task
- 10mintues warm up
- Promodo
## Personal Achievements (Blank Page)
- Contest registered, results
    - What I have learned from this contest
    - Image gallery
    - Stages (Elementary to Universtiy)
    - Lists

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

<!-- - Feature Collection section header lacks adequate spacing above the content body.
    - Current Behavior: Header elements sit too close to the feature items, degrading layout hierarchy.
    - Visual Reference: "sources\img\img7.png"
    - **Expected Behavior:** A distinct vertical gap separating the section title block from the feature collection.
     -->

# UNSATISFACTION
## Homepage
- Font family of the header "Explore my space"
    - You should select font family, font size, weights that match to the theme, homepage represetation.
- "Explore my space" button, transition
    - Eradicate the code related to the button, no transition, transform, blue, opacity, ..., "Explore my space" is only positioned in the header part of feature collection.
- Pause button is unecessary - Remove it
- Scroll bar
    - I don't need the default scroll bar in every page inclduing homepage. Just hide or delete it.
# NEW IDEA
## Homepage





# TASK DESCRIPTION
- Currently, I'm working on a web-based self managment project named Hiep Trong's Space. I want you to give me some adjustment to the display of the page, then form a comprehensive prompt that instruct agent to do the task

## Files description:
- `ver0.png` - This image show how current code is.
- `ver1.html` - Second version in HTML file. You should focus on the UI, the code provided in the HTML is not correct totally.
- `ver2.png` - Third version
- Both ver1 and ver2 hasn't implemented yet.

## How you use ver0
- This version is a current version, therefore, based on this version you can create a comprehensive prompt for agent, because you know the current context, you can instruct agent more easily.

## Version 1
- Keep everything, I will instruct you to modify each detail.


## Version 2
- This version is not the version you should modify, version1 is the version that you do adjustment on. This version will be use for reference, features, details, extraction to complete version 1.

## Modification
### Day mode
- The task dashboard of each day (yesterday, today, tommorow), task-preview behavior inside each board - for all boards (including side preview boards when they are expanded/active):
    - Font family: Based on the version 0, don't adjust the font family if that feature is not new.
    - Task box: The display in the version 1 is disgusting. Version 0 has beautiful task box display so you don't have to change, except for box size different, you can change for better representation.
    - Empty task dashboard: Take the concepts from the version2, it used planet, universe, zodiac, galaxy, ... theme details and I love that idea.
    - Take this idea from version 1: Every board (today, yesterday, tommorow) only display 3 task, the 4th task only show half, then blur. Provide a small statement somewhere to guide user to scroll for more. The scroll bar of this shouldn't be basic default scroll bar, it should match the theme of zodiac, stars, constellation, galaxy, ... Because the version 1 display is so poor, so you should base on those idea to make a better version.
### Other component
- Overdue Tasks: Take the representation identical to the version 0, while adding background low-opacity elements (matched the theme concepts) like the way the version 1 have done. Because the version 1 display is so poor, so you should base on those idea to make a better version.
- Upon task dashboard: Identical 100% to the idea from version 2, version 1 is so bad in representation. 
- Background: The background should include themed-details (low-opacity detail) like the version 2. I really like the background details (stars, zodiac, universe, cloud, zodiac, constellation, ...) in the version 2. If it possible, applying all those details.
- Every box: Should include some low-opacity details, with beautiful color matched the theme idea. But don't make it unreadable, overlap information.
### Compulsory
- Every elements are in correct position, no overlap, no crooked.
- Every click, scroll, ... are in super smooth transition.

# YOUR TASK
- Asking me questions for clarification, feel free to ask for clarification.
- After asking me many questions, give me a preview of final version, i will check it carefully.
- If there is any adjustment I need to do, I will tell you.
- If I agree with the adjustment, I will tell you to proceed. Then create a comprehensive prompt to instruct agent to adjust the code to meet the page idea requirements.


Understanding:
The Version 0 is the core/original version, my project source code is in that version.
1/ Day / Week / Month
2/ Static copy
3/ Day arc: It show a live clock with seconds and the countdown to the 23:59 deadline, with the moon moving along the arc as in Version 2.
4/ It ideas and representation identical to the version2, however, the backend processing should include, it is not a static progress 0% every time.
5/ Task box height: Version 0’s box is taller, with the title, then the pill and deadline row. Keep that design and pick a fixed height so that exactly 3 boxes plus half of a 4th fit in the board.
6/ Scroll hint: The hint sit at the bottom of the faded area, with text like “✦ Scroll for more” that disappears at the end of the list. However, lower the opacity for better representation.
7/ Custom scrollbar: Thin track styled as a faint constellation line, with a glowing star-shaped thumb.
8/ Scrolling snap per task (one card at a time, very smooth).
9/ Empty states: Use a different scene for each day: yesterday gets a planet with a moon, tomorrow gets a ringed planet, and today gets a small galaxy or zodiac wheel.
10/ Background motion: Should the stars twinkle subtly and the nebula clouds drift very slowly - I Agree
11/ Box decorations: My plan is faint constellations or planets in the corners of the main boards and Overdue cards, kept off the text area and below about 15% opacity. - I agree
12/ Description below
13/ Don't touch the tech stark, you just describe, let agent choose the tech stark.
14/ Let agent do it.

# WEEK
- The image provided shows the week layout of version 0. It looks disguting.
- The header only show: Date , for example: Thu 5/11
- The content of each day shows task statistic.
    - Done/ Total Tasks
    - Number of urgent/normal/optional tasks
    - Progress (Percentage)
    - Number of task that has deadline that day
    - The display, representations you can decide. Requirements: Match the provided theme.
    - Empty states: Identical to Day mode with low-opacity details.
# MONTH
- Identical to the version 0. However adjust these:
- Done/ Total Tasks
- Number of urgent/normal/optional tasks (Display by colors or icons that matched the theme, without using text)
- When click to a date, it display a right panel (Like the version 0). Because this already existed, so don't describe or tell agent to delete it.
- Adding low-opacity details that match the theme.

# ADDITIONAL DESCRIPTION
- Your task is reading this carefully, after that, create a preview (don't include smooth motion, transition in this preview for efficient token usage).
- Keep asking me questions for clarification.