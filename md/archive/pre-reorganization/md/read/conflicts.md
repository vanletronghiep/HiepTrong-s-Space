# Markdown Documentation Consistency Audit Report

**Audit Date:** November 6, 2026  
**Scope:** All 17 `*.md` files across the repository (root, `md/`, `public/earth/`, `review/phase01/`, and `sources/img/daily-v2-reference/`).  
**Verification Method:** Cross-referenced against `src/`, `package.json`, `tests/`, and file-system status without modifying existing source code.

---

## Severity Classification
- **High:** Directly causes agent behavioral failure, regression in passing test suites, or conflicting architectural mandates.
- **Medium:** Misleading, conflicting secondary guidance, broken references, or architectural drift that hampers maintenance.
- **Low:** Minor discrepancies, cosmetic inconsistencies, or housekeeping details.

---

## 1. Contradictions

| ID | Severity | Locations Involved | Conflict Description | Recommended Fix |
|---|---|---|---|---|
| **C1** | **High** | `md/ui_readme.md` §14.7 vs `md/DESIGN_SPEC.md` §5–9, `md/agent_readme.md` Phase 2 (§2.4–2.9), `md/context.md` | `ui_readme.md` explicitly forbids "stars on cards, large illustrations, animated sparkles, glowing effects" on workspace pages. Conversely, Phase 2 design specs mandate celestial illustrations (zodiac wheels, spiral galaxies, celestial corner artwork inside task cards, twinkling starfields). Because `ui_readme.md` claims visual precedence (§0.3), agents receive contradictory visual constraints. (The codebase already implements the V2 celestial artwork in `daily-task-card.module.css`). | Update `ui_readme.md` §14.5 and §14.7 to incorporate the Celestial V2 visual design, or formally mark §14.7 as superseded by `DESIGN_SPEC.md` for the `/tasks/daily` workspace. |
| **C2** | **High** | `md/DESIGN_SPEC.md` §3, §5 vs `md/ui_readme.md` §3 and `tests/design/craft-and-architecture-guardrails.test.ts` | `DESIGN_SPEC.md` prescribes uppercase micro-labels (`COSMIC FORECAST`, `PROGRESS`, `DAY ARC`). However, `ui_readme.md` §3 enforces "Sentence case UI... No all-caps navigation, tags, buttons or other headings", and the architectural guardrail test (`craft-and-architecture-guardrails.test.ts`) fails any `uppercase` utility class outside `Wordmark.tsx`. An agent adhering strictly to `DESIGN_SPEC.md` will fail CI/test checks. | Reconcile the naming and styling rule: either explicitly permit uppercase micro-labels with a scoped guardrail exception, or adjust `DESIGN_SPEC.md` to sentence case. |
| **C3** | **High** | `md/context.md` vs `md/agent_readme.md` Phase 2 and `md/current_task.md` | `context.md` outlines an earlier, more conservative redesign brief based on `sources/img/img5` ("no large illustrations", "keep Today column highlight"), whereas `agent_readme.md` and `current_task.md` mandate a much richer celestial overhaul (zodiac wheels, nebula clouds, spiral galaxies). Both exist concurrently in `md/` with no indicator of which is authoritative. | Mark `context.md` as historical/superseded, or archive it to prevent conflicting design briefs. |
| **C4** | **High** | `md/agent_readme.md` §1.4, §4.5 vs `AGENTS.md` `Commit & Pull Request Guidelines` | `agent_readme.md` explicitly directs agents to "create a checkpoint commit" autonomously without user intervention (§0, §4.5). However, `AGENTS.md` defines commit formatting rules without authorizing unprompted autonomous commits. | Clarify git commit permissions in `AGENTS.md` and `agent_readme.md` (e.g. state whether agents should only commit when requested or automatically commit at major checkpoints). |
| **C5** | **Med** | `md/ui_readme.md` §14.5 vs actual implementation & `PROJECT_DESCRIPTION.md` §15.4 | `ui_readme.md` states that the overdue Transfer action "opens a small popover". In the codebase, this is implemented as a full modal dialog (`TransferDialog.tsx`), which `PROJECT_DESCRIPTION.md` §15.4 acknowledges as a deviation. | Update `ui_readme.md` §14.5 to specify a Dialog rather than a Popover. |
| **C6** | **Med** | `AGENTS.md` & `ui_readme.md` §14.2 ("one shared TaskCard") vs `DESIGN_SPEC.md` §11 & `agent_readme.md` §2.7 ("scope Daily-only variants") | All documents emphasize that `TaskCard` is shared between Daily and Tasks Hub, but `DESIGN_SPEC.md` requires applying celestial background art to Daily cards without affecting Hub cards. No documentation describes the exact scoping contract. In code, this is handled via `dailyStyles` module classes. | Document the component variant/scoping pattern (e.g., CSS modules or context prop) in `ui_readme.md` §14.2. |

---

## 2. Outdated Information (Documentation vs. Codebase)

| ID | Severity | Locations Involved | Evidence in Codebase / Filesystem | Recommended Fix |
|---|---|---|---|---|
| **O1** | **High** | `md/agent_readme.md` Phase 1 & Phase 3 (§3.2–3.8) | The mission in `agent_readme.md` instructs agents to implement Phase 3 fixes (global scrollbar suppression, overscroll behavior, removal of Pause control, removal of CTA). In the actual codebase, these are already completed: `src/app/globals.css:80` has `overscroll-behavior-y: none`, `globals.css:93-96` hides native scrollbars, `HomeJourney.tsx` has no Pause control, and the CTA button has already been removed. An agent executing `agent_readme.md` from scratch will attempt redundant or breaking refactors. | Add an explicit status banner at the top of `agent_readme.md` identifying completed phases versus remaining tasks. |
| **O2** | **High** | `AGENTS.md` Line 5 | Links to `md/PROJECT_DESCRIPTION.md`. The actual file was moved to the repository root (`PROJECT_DESCRIPTION.md`), causing broken references for tooling and agents. | Update path in `AGENTS.md` to `PROJECT_DESCRIPTION.md`. |
| **O3** | **High** | `PROJECT_DESCRIPTION.md` §1.2, §16.1; `sources/.../AGENT_PROMPT.md` Line 14 | States that `AGENTS.md` was "revoked and deleted on 3 November 2026" and instructs agents: "Do not resurrect old rules or invent a file". However, `AGENTS.md` currently exists at the root as active workspace policy. | Update `PROJECT_DESCRIPTION.md` §1.2 and §16.1 to reflect that `AGENTS.md` has been re-established and is active. |
| **O4** | **Med** | `ui_readme.md` §6, `PROJECT_DESCRIPTION.md`, `tests/design/craft-and-architecture-guardrails.test.ts` | The guardrail test and documentation cite `src/features/home/Wordmark.tsx` as the single allowed exception for uppercase styling. However, `Wordmark.tsx` does not exist in the codebase; the wordmark is implemented as an SVG image in `src/features/home/HomeJourney.tsx`. | Remove references to `Wordmark.tsx` in `ui_readme.md` and update the test exception to match the current SVG wordmark pattern. |
| **O5** | **Med** | `ui_readme.md` §10 (lines 3, 351); `review/phase01/README.md` | States that the Phase 01 Earth journey is "Target design, agreed 3 November 2026; not yet implemented". In reality, the Three.js Earth journey is fully implemented in `src/features/home/HomeJourney.tsx` and `earth-scene.ts`. | Update the section status from "not yet implemented" to "implemented". |
| **O6** | **Med** | `README.md` ("Built surfaces") | States that the homepage has a "Let's go" button and 2D Canvas starfield only, with no mention of Three.js or Earth. Also claims fonts are "self-hosted" while `src/design/fonts.ts` uses `next/font/google`. | Update `README.md` to describe the 3D Earth homepage and clarify font delivery. |
| **O7** | **Med** | `PROJECT_DESCRIPTION.md` Header & §14.3 | Cites "151 tracked files at HEAD 6fb6488...", "62 tests", "118 src / 18 tests", "sources/ had no files", and mentions the `Forum` font. The repo currently has 0 commits, 22 test files (69 tests), 35 files in `sources/`, and `src/design/fonts.ts` only loads Cormorant Garamond and Inter. | Update test and file metrics in `PROJECT_DESCRIPTION.md` or clearly flag them as historical audit snapshots. Remove mentions of the unused `Forum` font. |
| **O8** | **Med** | `ui_readme.md` §10.1 (line 677); `md/human.md`; `md/agent_readme.md` | Documents mention "five images in `sources/img/` and two videos in `sources/vid/`", and cite `sources/vid/vid3.mp4` for touchpad scroll bugs. In reality, `sources/` contains 10 images and 6 videos (`vid0`, `vid1`, `vid4`, `vid5`, `vid6`, `vid7`); `vid3.mp4` does not exist. | Correct media inventories and update references to point to existing reproduction videos. |
| **O9** | **Med** | `PROJECT_DESCRIPTION.md` §1.2, §16 | References `md/idea_readme.md` for project background and future feature ideas. No such file exists in `md/`. | Remove references to `idea_readme.md` or restore the file. |
| **O10** | **Low** | `README.md` vs `AGENTS.md` | `README.md` instructs running `npm install`, while `AGENTS.md` specifies `npm ci` for locked dependency integrity. | Standardize on `npm ci` across both files. |

---

## 3. Inconsistencies

| ID | Severity | Locations Involved | Inconsistency Description | Recommended Fix |
|---|---|---|---|---|
| **I1** | **High** | `md/agent_readme.md` §2.2, `md/current_task.md` §1, `md/ASSET_GUIDE.md` vs `.gitignore` | Multiple markdown documents instruct agents to perform "Mandatory reference inspection" on files in `sources/img/daily-v2-reference/` and `sources/vid/`. However, `.gitignore` excludes `sources/` and `review/`. In a fresh clone or remote environment, these directories will not exist, causing agents following mandatory inspection steps to fail. | Either preserve a curated set of reference assets outside `.gitignore`, or qualify the prompt instructions that `sources/` and `review/` are local-only and optional. |
| **I2** | **Med** | `md/ui_readme.md` §10.1, §10.5, §10.9 vs `md/agent_readme.md` | `ui_readme.md` contains markdown links to anchors in `agent_readme.md`: `#2-confirmed-decisions`, `#5-scroll-sequence-and-choreography`, and `#8-implementation-stages-and-review-artifacts`, citing user decisions HP-01 through HP-13. `agent_readme.md` was overwritten with a new mission structure and no longer contains those sections, resulting in broken cross-document links. | Restore the confirmed decision record to `agent_readme.md` or update `ui_readme.md` to reference the current documentation structure. |
| **I3** | **Med** | `md/DESIGN_SPEC.md` & `md/ASSET_GUIDE.md` vs `sources/img/daily-v2-reference/` copies | `md/DESIGN_SPEC.md` and `md/ASSET_GUIDE.md` are byte-for-byte duplicates of the files located under `sources/img/daily-v2-reference/`. Having identical documents in two locations creates maintenance drift when updates are made to one copy only. | Consolidate documentation into `md/` and maintain `sources/` strictly for reference media assets. |
| **I4** | **Med** | Across all documents | Inconsistent naming conventions for key views and concepts:  <br>- `Daily Task Management` vs `Daily tasks` vs `Daily Dashboard` vs `DailyBoard`  <br>- `Tasks Hub` vs `Task Hub` vs `HubList`  <br>- `Observatory`, `Cosmic Forecast`, `Day Arc` appear prominently in Phase 2 docs but are absent from `ui_readme.md` and `PROJECT_DESCRIPTION.md`. | Introduce a standardized terminology glossary in `AGENTS.md`. |
| **I5** | **Low** | `README.md` vs `PROJECT_DESCRIPTION.md` §13.4 & `AGENTS.md` | `README.md` promotes `npm run db:migrate`, while `PROJECT_DESCRIPTION.md` §13.4 and `AGENTS.md` warn that the Drizzle CLI uses hardcoded paths that ignore runtime environment overrides (`drizzle.config.ts`). | Add a note in `README.md` advising users and agents to verify migration targets when using custom storage paths. |

---

## 4. Ambiguities & Logical Issues

| ID | Severity | Locations Involved | Description & Agent Risk | Recommended Fix |
|---|---|---|---|---|
| **A1** | **High** | `md/current_task.md`, `md/human.md` vs `md/agent_readme.md` §0 | `current_task.md` and `human.md` contain direct conversational chat prompts directed to an AI assistant (e.g. *"YOUR TASK: Asking me questions for clarification...", "write a comprehensive prompt..."*). Conversely, `agent_readme.md` §0 instructs agents: *"Do not ask the user questions or request approval between phases... This is an end-to-end implementation mission, not a planning-only task"*. An autonomous coding agent inspecting `current_task.md` or `human.md` may halt execution to ask clarifying questions, directly violating `agent_readme.md`. | Clearly label `current_task.md` and `human.md` as human conversational context, and exclude them from autonomous agent task directives. |
| **A2** | **High** | `AGENTS.md` ("Mandatory UI/UX Motion & Transition Rules") | Contains a single abstract rule: *"Every interaction and visual state change must feel exceptionally smooth, fluid, responsive, and professionally polished."* It lacks concrete metrics, allowable curves, maximum durations, or reduced-motion requirements, all of which are documented in `ui_readme.md` §4. Agents reading only `AGENTS.md` have no enforceable motion constraints. | Add a direct reference in `AGENTS.md` to `ui_readme.md` §4 (allowed motion curves, max durations, banned CSS transitions). |
| **A3** | **Med** | `md/agent_readme.md` §1.3 ("Week and Month modes") | Instructs agents to *"Complete the previously planned Week and Month behavior according to the existing implementation plan"*. No such plan exists in the repository, and basic Week/Month views are already implemented and tested in `src/features/tasks/`. This creates ambiguity regarding what remains to be completed. | Clarify specific outstanding functional requirements for Week and Month views, or mark them as complete. |
| **A4** | **Med** | `md/human.md` vs `md/agent_readme.md` §3.2 | `human.md` requests: *"Ban user from scrolling by touch pad when upper or down limit is reached... adjust for the global scale"*. `agent_readme.md` §3.2 clarifies that agents must NOT globally intercept wheel/touch events via JavaScript, but use CSS overscroll containment instead. An agent reading only `human.md` might implement destructive event cancellation. | Note in `human.md` that touchpad boundary management is achieved via CSS `overscroll-behavior-y: none`. |
| **A5** | **Med** | `md/ui_readme.md` §10.6 ("Explore control, heading morph and click behavior") | Specifies an elaborate multi-stage morphing pill button that animates into the Feature Collection heading. `agent_readme.md` §3.6 explicitly orders the removal of this button and all associated transition logic. `ui_readme.md` still reads as an active specification. | Update `ui_readme.md` §10.6 to describe the simplified static collection heading. |
| **A6** | **Low** | `md/agent_readme.md` §4.4 vs `AGENTS.md` | `agent_readme.md` mandates running `npm run build` as part of verification, while `AGENTS.md` and `package.json` define the standard verification gate as `npm run check` (lint, typecheck, test). | Clarify whether `npm run build` is required on every change or only for routing and bundling modifications. |
| **A7** | **Low** | `PROJECT_DESCRIPTION.md` (~152 KB) & `agent_readme.md` (~39 KB) | The extensive size and dual-level structure of these documents consume significant LLM context windows, increasing token cost and risk of truncation or missed instructions. | Maintain a concise agent summary cheatsheet and cross-reference detailed sections as needed. |

---

## 5. Non-Issues & Intentional Distinctions (Confirmed Valid)

- **Reading Depth Separation:** The two-level reading structure (`Level 1` vs `Level 2`) in `PROJECT_DESCRIPTION.md` aligns with `AGENTS.md`.
- **Historical Metrics Attribution:** Historical metrics in `PROJECT_DESCRIPTION.md` §14 are explicitly framed as historical snapshots from the November 2–3 audit.
- **Human Editing Boundary:** The notice in `md/human.md` stating it is edited by a human and should not be edited by agents is respected and consistent.
- **Git Remote Push:** Across all 17 markdown files, there is **zero instruction** ordering agents to automatically push to a remote repository.

---

## 6. File Function & Overview

This section defines the primary role, intended audience, and main function of each of the 17 `*.md` files in the repository:

### Root Documentation
1. **[`AGENTS.md`](AGENTS.md)**:
   - **Primary Function:** High-level project guardrails, architectural layer boundaries, command references, and testing/git conventions for AI agents.
   - **Audience:** AI agents, developers.
2. **[`README.md`](README.md)**:
   - **Primary Function:** General user and developer-facing onboarding, local setup instructions, available scripts, environment variable summaries, and backup/restore steps.
   - **Audience:** Human developers, external readers.
3. **[`PROJECT_DESCRIPTION.md`](PROJECT_DESCRIPTION.md)**:
   - **Primary Function:** Comprehensive engineering reference and system audit documentation. Details technical architecture, contracts, database models, route catalogs, service lifecycles, and known system issues. Divided into Level 1 (Executive Summary) and Level 2 (In-Depth Technical Reference).
   - **Audience:** AI agents, lead engineers.

### Specifications & Context (`md/`)
4. **[`md/ui_readme.md`](md/ui_readme.md)**:
   - **Primary Function:** Master visual and interaction design specification. Defines color tokens, typography scales, motion principles, shared component specs, page wireframes, and design acceptance gates.
   - **Audience:** UI/UX designers, frontend developers, AI coding agents.
5. **[`md/DESIGN_SPEC.md`](md/DESIGN_SPEC.md)**:
   - **Primary Function:** Artistic and decorative specification for the Daily Task Management "Celestial V2" aesthetic upgrade. Outlines region-by-region visual treatments (zodiac wheels, nebulae, galaxies, card corner art).
   - **Audience:** Frontend developers, UI styling agents.
6. **[`md/ASSET_GUIDE.md`](md/ASSET_GUIDE.md)**:
   - **Primary Function:** Placement guide and opacity recommendations for the 11 standalone celestial SVG assets (`assets/*.svg`) used to implement the V2 theme.
   - **Audience:** Frontend developers, UI styling agents.
7. **[`md/agent_readme.md`](md/agent_readme.md)**:
   - **Primary Function:** Multi-phase autonomous execution mission prompt instructing agents on recovering task functionality, applying V2 visuals, and fixing homepage scrolling bugs.
   - **Audience:** Autonomous AI coding agents (execution baseline).
8. **[`md/current_task.md`](md/current_task.md)**:
   - **Primary Function:** Human-authored prompt drafting context and instructions for AI chat assistants to synthesize a comprehensive execution prompt for Codex/agents.
   - **Audience:** Chat assistants / prompt compilers (conversational context).
9. **[`md/human.md`](md/human.md)**:
   - **Primary Function:** Personal human scratchpad of feature priorities, bug reports, visual references, and subjective feedback. Explicitly marked as human-edited only.
   - **Audience:** Human project owner, read-only context for agents.
10. **[`md/context.md`](md/context.md)**:
    - **Primary Function:** Historical prompt context for an earlier, more conservative Daily Task Management redesign based on `sources/img/img5`.
    - **Audience:** Historical reference.
11. **[`md/md_conflicts.md`](md/md_conflicts.md)**:
    - **Primary Function:** Detailed consistency audit report tracking contradictions, outdated items, inconsistencies, ambiguities, and file functions across repository markdown files.
    - **Audience:** Engineers, project maintainers, AI agents.

### Public Assets (`public/earth/`)
12. **[`public/earth/ATTRIBUTION.md`](public/earth/ATTRIBUTION.md)**:
    - **Primary Function:** Legal source attribution, author credits, and CC BY 4.0 licensing declarations for Earth texture maps downloaded from Solar System Scope / NASA.
    - **Audience:** Legal compliance, external contributors.

### Review Artifacts (`review/phase01/`)
13. **[`review/phase01/README.md`](review/phase01/README.md)**:
    - **Primary Function:** Review notes and reproduction guide for Phase 01 Stage 1 static visual proofs (3D Earth rendering, vector wordmark, texture budgets, and software WebGL captures).
    - **Audience:** Reviewers, QA engineers.
14. **[`review/phase01/MOTION.md`](review/phase01/MOTION.md)**:
    - **Primary Function:** Documentation for Phase 01 motion capture review artifacts, recording planned animation behaviors prior to production integration.
    - **Audience:** Reviewers, motion designers.

### Reference Media (`sources/img/daily-v2-reference/`)
15. **[`sources/img/daily-v2-reference/README.md`](sources/img/daily-v2-reference/README.md)**:
    - **Primary Function:** Index and inventory of the Daily V2 reference package (reference mockups, asset guide, and standalone SVGs).
    - **Audience:** Developers referencing source assets.
16. **[`sources/img/daily-v2-reference/AGENT_PROMPT.md`](sources/img/daily-v2-reference/AGENT_PROMPT.md)**:
    - **Primary Function:** Standalone prompt template instructing agents to implement the Daily V2 celestial UI upgrade strictly without functional regressions.
    - **Audience:** AI prompt reference.
17. **`sources/img/daily-v2-reference/DESIGN_SPEC.md` & `ASSET_GUIDE.md`**:
    - **Primary Function:** Direct reference package duplicates of `md/DESIGN_SPEC.md` and `md/ASSET_GUIDE.md` kept alongside the source reference images and SVGs.
    - **Audience:** Source media consumers.

---

## Recommended Priority Action Plan

1. **Immediate Agent Guardrail Fixes:**
   - Correct the link in `AGENTS.md` line 5 from `md/PROJECT_DESCRIPTION.md` to `PROJECT_DESCRIPTION.md`.
   - Update `PROJECT_DESCRIPTION.md` §1.2 and §16.1 to state that `AGENTS.md` is active policy.
   - Resolve the conflict between `DESIGN_SPEC.md` uppercase micro-labels and `craft-and-architecture-guardrails.test.ts` / `ui_readme.md` §3.
2. **Design Authority Alignment:**
   - Formally document in `ui_readme.md` that the Celestial V2 specifications in `DESIGN_SPEC.md` supersede §14.7 for `/tasks/daily`.
   - Update `ui_readme.md` §10.6 to reflect the removal of the morphing Explore button.
3. **Workflow & Status Clarifications:**
   - Add status headers to `agent_readme.md` reflecting that Phase 3 homepage fixes are already implemented in code.
   - Clarify in `current_task.md` and `human.md` that they represent human notes and background context, not direct execution instructions for subagents.
   - Clarify the git commit boundary in `AGENTS.md`.

