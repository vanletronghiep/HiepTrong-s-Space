# Task: Reconstruct project documentation into a coherent epic-based system

## 1. Context, objective, and boundaries

**Project:** Hiep Trong’s Space  
**Repository:** `D:\Vibe Coding\HiepTrong's Space`  
**Assignment file:** `md/task.md`  
**Scope:** Documentation reconstruction only.

All relative paths in this assignment are relative to the repository above. The earlier workspace path `D:\Vibe Coding\Task Management` is outdated.

The application is a local-first personal management system built with Next.js, React, TypeScript, and SQLite. Its implemented surfaces include the homepage, Daily Task Management, Tasks Hub, and in-app notifications. Other destinations are mostly placeholders.

Its documentation accumulated across several design and implementation phases. Consequently, it mixes:

- The owner’s original ideas and personal notes.
- General engineering and visual rules.
- Detailed feature specifications.
- Earlier execution prompts.
- Historical implementation reports.
- Conflicting descriptions of desired behavior.
- Descriptions that no longer match the source.

The owner wants a small shared foundation and comprehensive descriptions organized by epic. This assignment incorporates decisions already confirmed with the owner. Another agent should be able to execute it without reading the preceding conversation.

### Required outcome

Produce a navigable documentation system that:

1. Gives every requirement a clear home.
2. Provides sufficient context for agents working on an epic.
3. Preserves the owner’s words and historical evidence.
4. Distinguishes confirmed requirements, observed implementation, and unresolved decisions.
5. Removes superseded prompts and duplicate specifications from the active reading set.
6. Provides a complete migration and verification report.

### Scope restrictions

- Do not change production code, tests, dependencies, configuration, APIs, schemas, database contents, or application behavior.
- Do not implement bugs or missing features discovered while documenting.
- Do not edit either user-owned file.
- Do not reset, restore, stage, commit, or push existing changes as part of this task.
- Do not interpret an archived implementation prompt as authorization to perform its work.
- Do not resolve new product ambiguities by silently choosing whichever document is newer or more specific.

The repository already contains user-created file moves and uncommitted changes. Historical paths such as `md/human.md`, `md/ui_readme.md`, and `md/current_task.md` may appear deleted in Git while their replacements exist elsewhere. Preserve that work. Inspect the current filesystem before acting.

---

## 2. Target structure, ownership, and reading rules

### Target structure

```text
D:\Vibe Coding\HiepTrong's Space\
├── AGENTS.md
├── README.md
├── PROJECT_DESCRIPTION.md
├── md\
│   ├── readme.md
│   ├── task.md
│   ├── agents\
│   │   ├── shared\
│   │   │   └── uiux.md
│   │   ├── homepage\
│   │   │   ├── readme.md
│   │   │   └── reports.md
│   │   └── tasks\
│   │       ├── readme.md
│   │       └── reports.md
│   ├── read\
│   │   └── reconstruction.md
│   ├── user\
│   │   ├── user_desc.md
│   │   └── user_notes.md
│   └── archive\
│       └── pre-reorganization\
│           ├── README.md
│           └── original documents under their former relative paths
├── docs\audit\
│   └── existing audit reports
├── review\phase01\
│   └── existing review evidence
├── sources\img\daily-v2-reference\
│   ├── README.md
│   └── existing images and artwork
└── public\earth\ATTRIBUTION.md
```

Do not create folders for every future feature. Maintain a planned-feature catalog in the engineering reference. Create a new epic folder when its requirements are being developed.

### Exact responsibility boundaries

| Document | Content it owns | Content it should link to |
|---|---|---|
| Root `AGENTS.md` | Agent working rules, ownership protections, clarification requirements, verification policy, and task activation rules. | Documentation reading map, architecture details, UI rules, epic specifications. |
| Root `README.md` | GitHub introduction, installation, configuration, running the app, and practical operating instructions. | Detailed architecture, UI specifications, audit reports. |
| Root `PROJECT_DESCRIPTION.md` | Concise engineering overview, architecture, shared data concepts, implementation map, implemented/planned feature catalog, terminology, and Open decisions register. | Feature-specific behavior, visual details, historical audit findings. |
| `md/readme.md` | Concise project idea/theme, documentation roles, reading paths, maintenance rules, and conflict handling. | Detailed engineering and shared visual references. |
| `md/agents/shared/uiux.md` | Shared typography, colors, motion, accessibility, responsive behavior, reusable controls, and explicit scope of approved visual exceptions. | Epic-specific layouts and interactions. |
| Epic `readme.md` | Comprehensive epic purpose, requirements, behavior, UI/UX, implementation references, acceptance criteria, and relevant open-decision links. | Shared rules and detailed reports. |
| Epic `reports.md` | Compact dated records of work, validation, outstanding issues, and links to detailed reports. | Long analyses in `md/read/` and preserved historical evidence. |
| `md/read/reconstruction.md` | Migration inventory, requirement coverage, conflict disposition, verification results, and remaining questions for the owner. | Canonical requirements and archived sources. |
| `md/user/user_desc.md` | The owner’s plain-language project description and ideas. | Read-only input to reconstruction. |
| `md/user/user_notes.md` | The owner’s free-form notes. | Read-only context; new ideas require confirmation before adoption. |
| `md/task.md` | The explicitly assigned current task. | Relevant permanent documentation. |

The general guide should remain concise through links and clear ownership, rather than through deleting useful requirements.

### Epic organization

The **Tasks epic** includes:

- Daily Task Management.
- Tasks Hub.
- Task-related notifications.

These share task records and lifecycle rules. Describe shared semantics once, then explain each surface’s behavior.

The **Homepage epic** includes:

- Earth and starfield presentation.
- Feature collection.
- Homepage scrolling and interaction.
- Homepage-specific accessibility and rendering fallbacks.

Shared navigation, controls, motion foundations, and cross-epic architecture belong in their shared references.

Each epic README must contain:

1. Purpose, scope, and relationships.
2. Confirmed requirements and user flows.
3. Epic-specific UI/UX.
4. Current implementation and relevant code locations.
5. Acceptance criteria.
6. Open decisions and supporting references.

Combine epic UI/UX into its README. Do not create separate epic `uiux.md` files during this reconstruction.

### Authority and maintenance

Use explicit labels:

- **Confirmed requirement:** an approved intended behavior.
- **Observed implementation:** what source inspection or executed validation establishes.
- **Open decision:** a question that requires the owner’s answer.

The confirmed choices in this assignment resolve the corresponding older contradictions. Preserve conflicting historical wording in the archive and explain its disposition.

If another conflict appears:

1. Show the competing statements and their sources.
2. Explain the practical difference.
3. Recommend an option.
4. Ask the owner before finalizing the affected requirement.
5. Continue independent work where possible.

A specific epic rule must not silently override a general rule. Approved exceptions must be represented consistently in both the shared reference and the epic.

Agents may maintain confirmed documentation and implementation facts as part of authorized work. They must ask before introducing or changing product rules.

A task file becomes active only when the owner explicitly directs an agent to follow it. Its presence alone does not activate it.

---

## 3. Confirmed product and workflow decisions

Carry these decisions into the relevant canonical documents. Do not ask the owner to decide them again unless new evidence creates a material contradiction.

### Product decisions

| Area | Confirmed requirement |
|---|---|
| Daily aesthetic | Celestial V2 with rich but subdued zodiac, galaxy, nebula, panel, and card artwork. Preserve the light lavender theme, readability, and working controls. |
| Daily versus Hub cards | Share behavior and controls. Apply Daily-specific decorative styling without automatically extending it to Hub. |
| Typography | Use sentence case for labels, including Cosmic forecast, Progress, and Day arc. Retain the existing homepage vector-logo capital treatment. |
| Daily layout | Use the active-board carousel, with Today initially active and larger, and neighboring day previews. |
| Task-list sizing | Measure rendered card heights to show three complete cards and half of a fourth. Do not turn this into a rigid fixed-height requirement. |
| Week view | Show daily completion, priority, progress, and deadline summaries. Open the day’s tasks in a drawer. |
| Overdue Transfer | Use a modal dialog with date/time entry and validation. |
| Ambient Daily motion | Permit gentle star twinkling and slow nebula drift. Respect reduced motion and keep readable content and controls stable. |
| Day Arc clock | Display `HH:mm:ss`. |
| Day Arc countdown | Show time remaining until midnight, resetting for the next day. This supersedes the ambiguous “until 23:59” wording. |
| Explore my space | Keep it only as a normal Feature Collection heading. Retire the opening CTA and morphing-control requirements. |
| Homepage Pause | Keep the visible Pause control removed. Preserve reduced-motion behavior and visibility-based animation pausing. |

The current Day Arc implementation displays minutes while its arc uses seconds. Record the confirmed target and the observed gap separately. Do not implement that change during this assignment.

Retain coherent existing requirements not superseded above. Where their authority or meaning is genuinely unclear, record and ask rather than inventing a replacement.

### Workflow decisions

- Archive superseded material first; do not permanently delete the only copy.
- Personal notes provide context. Confirm new ideas before promoting them to requirements.
- Agents may maintain confirmed facts and approved requirements.
- Local commits require explicit authorization from the owner or an explicitly activated assignment.
- Documentation-only changes receive documentation, link, and integrity checks.
- Code changes receive relevant tests and standard checks.
- Production builds are required when relevant to routing, bundling, dependencies, assets, or release readiness.
- Reference images and videos remain local. Do not change `.gitignore` or add a reference-media publishing workflow.
- If an essential reference is missing, explain the dependency and ask the owner. Continue independent work.
- Future epics remain in a central catalog until their requirements are developed.
- Epic reports are compact dated logs; detailed analyses belong in `md/read/`.

---

## 4. Exact migration and conflict-handling instructions

### Archive procedure

Use `md/archive/pre-reorganization/` as the archive root.

For each rewritten or retired source:

1. Copy its original bytes into the archive before changing it.
2. Preserve its former repository-relative path beneath the archive root.
3. Record its original and archived path and SHA-256 hash.
4. Verify the copy before removing the original active file.
5. Reuse an existing archive copy only if its hash matches. Never overwrite a different historical copy; investigate the collision.

**Special case:** archive root `AGENTS.md` as `AGENTS.original.md` beneath the archive root. Do not introduce an archived file named `AGENTS.md` that could act as nested agent instructions.

Create an archive README stating that its contents are historical evidence and do not authorize work. Preserve archived source bytes; put explanatory metadata in the index rather than inserting banners into every source.

### Source-to-destination map

| Current source | Action | Content destination |
|---|---|---|
| `AGENTS.md` | Archive and rewrite | Short working rules and links. |
| `README.md` | Archive and rewrite | Public introduction and verified operating instructions. |
| `PROJECT_DESCRIPTION.md` | Archive and rewrite | Concise engineering reference; distribute feature details to epic READMEs and visual foundations to the shared UI reference. |
| `md/task.md` | Archive the assigned brief | After successful completion, replace with the inactive task template described below. |
| `md/user/user_desc.md` | Preserve exactly | Consult as owner-authored context. Do not edit or relocate. |
| `md/user/user_notes.md` | Preserve exactly | Consult as notes. Do not edit or relocate. |
| `md/agents/ui_ux.md` | Archive and retire | Shared rules → shared UI reference; task details → Tasks; homepage details → Homepage. |
| `md/agents/DESIGN_SPEC.md` | Archive and retire | Daily V2 requirements → Tasks, adjusted by confirmed decisions. |
| `md/agents/ASSET_GUIDE.md` | Archive and retire | Asset placement and integration guidance → Tasks reference section. |
| `md/agents/context.md` | Archive and retire | Preserve compatible requirements in Tasks; record superseded or disputed requirements in the reconstruction report. |
| `md/agents/agent_readme.md` | Archive and retire | Preserve durable confirmed requirements in shared/epic descriptions. Retire its old execution sequence and blanket autonomous-work instructions. |
| `md/read/conflicts.md` | Archive and retire | Record every item’s disposition in the reconstruction report; unresolved questions also enter the engineering reference’s Open decisions section. |
| `sources/img/daily-v2-reference/README.md` | Archive and rewrite | Asset index linking to canonical Tasks documentation and available reference media. |
| `sources/img/daily-v2-reference/DESIGN_SPEC.md` | Archive and retire | Consolidate with the canonical Tasks specification. |
| `sources/img/daily-v2-reference/ASSET_GUIDE.md` | Archive and retire | Consolidate with Tasks asset guidance. |
| `sources/img/daily-v2-reference/AGENT_PROMPT.md` | Archive and retire | Preserve relevant confirmed visual requirements in Tasks; retire its historical execution instructions. |
| `review/phase01/README.md` | Preserve exactly | Dated review evidence; link when needed. |
| `review/phase01/MOTION.md` | Preserve exactly | Dated motion-review evidence; link when needed. |
| `public/earth/ATTRIBUTION.md` | Preserve exactly | Asset credits and licensing record. |
| `docs/audit/ARCHITECTURE_AUDIT.md` | Preserve exactly | Dated engineering evidence. |
| `docs/audit/BUG_INVENTORY.md` | Preserve exactly | Dated findings, with their evidence qualifications. |
| `docs/audit/TECHNICAL_DEBT.md` | Preserve exactly | Dated maintainability assessment. |
| `docs/audit/STABILIZATION_PLAN.md` | Preserve exactly | Proposed recovery work, not an active implementation assignment. |

Create the new general guide, shared UI reference, two epic READMEs, two epic report logs, archive index, and reconstruction report.

For every additional Markdown file discovered at execution time, determine whether it is a preserved record or fits an existing destination. If its intended role is unclear, ask before moving or rewriting it.

### Conflict report disposition

Use the IDs from the original Markdown conflict report. These are distinct from similarly named findings in the codebase bug inventory.

| IDs | Required treatment |
|---|---|
| C1, C3 | Document the approved Daily V2 direction and scope. Retire conflicting earlier decoration restrictions and briefs. |
| C2 | Use sentence case. No application or test changes are authorized. |
| C4 | Document explicit commit authorization. Note that missing authorization in a style guide was not itself a direct contradiction. |
| C5 | Specify the modal Transfer dialog. |
| C6 | Explain shared task behavior with Daily-specific visual decoration. |
| O1 | Archive the old mission. Verify current implementation before describing status; do not replay completed phases. |
| O2 | Correct active links to the actual engineering reference and new document locations. |
| O3 | Remove obsolete instruction-revocation claims from active guidance. Preserve them in historical sources. |
| O4 | Verify the current vector wordmark implementation and update documentation references. Record stale test wording without editing tests. |
| O5 | Distinguish implemented homepage code from dated review-stage records. Preserve those records unchanged. |
| O6 | Correct stale homepage descriptions. Verify font delivery carefully; `next/font/google` alone does not establish that fonts are fetched by the browser from Google. |
| O7 | Preserve historical metrics as dated evidence. Verify current facts when needed; do not copy the report’s “zero commits” claim without checking. Avoid embedding unnecessary changing counts in permanent guidance. |
| O8 | Inventory actual reference paths. Mark missing historical media explicitly; do not guess replacement videos. |
| O9 | Remove active reliance on the missing idea document. Link to the existing owner description and notes without inventing lost content. |
| O10 | Standardize reproducible installation guidance on `npm ci`. |
| I1 | State that references may be local-only. Ask when an essential asset is missing. |
| I2 | Repair active links and anchors. Do not invent missing HP decision records. Use verifiable source passages and the decisions in this assignment. |
| I3 | Consolidate duplicate specifications and archive both original copies. |
| I4 | Define terminology in the engineering reference: Tasks epic; Daily Task Management; Tasks Hub; notification center. Distinguish user-facing names from component names. |
| I5 | Explain the existing CLI/runtime database-path mismatch and the need to verify migration targets. Do not modify configuration or run user-data migrations. |
| A1 | Make task activation explicit, protect user notes, and retire old blanket “do not ask” mission instructions. |
| A2 | Point working guidance to the detailed shared motion rules, including approved exceptions and reduced-motion behavior. |
| A3 | Replace vague unfinished-work instructions with explicit requirements and observed implementation status. Do not declare Week/Month complete merely because components exist. |
| A4 | Preserve the intended scrolling outcome and document observed CSS overscroll handling. Do not reinterpret it as permission to disable wheel/touch scrolling globally. |
| A5 | Specify the normal collection heading and retire the morphing Explore control. |
| A6 | Apply the confirmed change-appropriate verification/build policy. |
| A7 | Use concise entry points, selective reading paths, and detailed epic references. |

Also record the additional decisions discovered during clarification: Pause removal, Day Arc seconds and midnight countdown, carousel layout, Week summaries, measured card sizing, and ambient motion.

### Source coverage

The reconstruction report must account for meaningful sections of the large source documents—not just filenames. Each section should be marked:

- Migrated to a named canonical section.
- Preserved as historical evidence.
- Superseded by a specific confirmed decision.
- Represented by an open question.

Archiving an entire document is not sufficient justification for silently omitting a still-relevant requirement from the active documentation.

Keep the Open decisions section as the canonical list of unresolved questions. The reconstruction report and epic documents should link to those entries rather than maintaining competing question lists.

---

## 5. Execution sequence, verification, and completion

### Execution sequence

1. **Inspect current state.** Read applicable instructions, this assignment, current document locations, and Git status. Do not assume the handoff’s inventory is still exact.
2. **Capture preservation evidence.** Hash both user-owned files, unchanged audit/review/credit files, and production/configuration/test files. Record pre-existing working-tree changes.
3. **Read and map sources.** Build the migration and requirement-coverage inventories. Verify implementation claims through selective source inspection.
4. **Clarify new conflicts.** Ask contextual questions with recommendations. Do not re-ask choices already confirmed here. If meaningful content has no clear destination, ask.
5. **Archive originals.** Verify byte-identical preservation before rewriting or retiring active files.
6. **Write canonical documents.** Follow the ownership boundaries and confirmed decisions above. Use relative links inside repository documentation so it remains portable.
7. **Update the reference index and reports.** Keep asset references discoverable. Add honest documentation-reconstruction entries to epic logs; do not imply feature implementation or runtime validation occurred.
8. **Verify the result.** Perform all checks below and correct documentation defects.
9. **Finish the task brief.** Only after successful completion, replace the active assignment with an inactive template containing status, objective, scope, constraints, acceptance criteria, and relevant references.
10. **Deliver the handoff report.** Summarize the resulting structure, preservation evidence, conflict dispositions, validation, and unresolved decisions.

### Required checks

- Both user-owned files have unchanged SHA-256 hashes.
- Preserved audit, review, and attribution files have unchanged hashes.
- Every archived original matches its baseline hash.
- Every original Markdown file is accounted for.
- Meaningful source sections have recorded destinations or dispositions.
- Active internal file links and heading anchors resolve.
- Missing local-only references are explicitly identified, not presented as available.
- Historical links inside byte-preserved records are distinguished from active-document link failures.
- No active guide requires reading an archived execution prompt as instructions.
- Shared and epic requirements agree, including all confirmed exceptions.
- No application, test, dependency, configuration, API, or schema changes appear in the diff.
- Pre-existing user changes remain intact.
- No commits or pushes have been created.

Do not rerun application tests or builds solely to validate Markdown changes. Report previous test results only as dated evidence. The reconstruction report must state exactly which checks were executed during this task.

### Completion report

The final report to the owner must identify:

- The new documentation entry point and epic documents.
- Which files were retained, rewritten, created, and archived.
- Confirmation that personal files and application files were preserved.
- The disposition of every original conflict-report item.
- Any newly discovered unresolved decisions, with context and recommendations.
- Verification results and any remaining limitations.

Success means another agent can find the relevant requirements, understand their authority and status, and perform an assigned task without reconstructing this conversation or making undocumented product decisions.
