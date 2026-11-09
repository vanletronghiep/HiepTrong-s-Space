# Documentation System Guide (`md/readme.md`)

## 1. Project Idea & Theme

**Hiep Trong Space** is a local-first, single-user personal universe designed to bring daily tasks, deadlines, reminders, university studies, projects, habits, and long-term ambitions into one cohesive web application.

Visually and conceptually, the application pairs two related themes within one design family:

- **Cosmos (dark):** The homepage (`/`) and Cosmic Launch route transition present a deep-space environment featuring a forward-moving starfield, a custom geometric vector wordmark (`HIEP TRONG / SPACE`), and a rotating night-Earth scene that scrolls into the 13-destination Feature Collection.
- **Workspace (light lavender):** All inner working pages (`/tasks/daily`, `/tasks/hub`, and future feature spaces), drawers, dialogs, and the notification popover use a calm, high-contrast light lavender canvas (`--ws-bg`) designed for all-day readability. Within the workspace, **Daily Task Management** uses an approved richer **Celestial V2** artistic treatment (zodiac wheels, spiral galaxy, nebula clouds, observatory panels, and subtle card-corner illustrations) while keeping controls, data, and text crisp.

---

## 2. Document Ownership & Roles

Each document owns a distinct slice of project knowledge so requirements are never duplicated or contradicted across files:

| Document | Primary Role & Content Owned | Links To |
|---|---|---|
| [`AGENTS.md`](../AGENTS.md) | Root agent working rules, ownership protections, task activation rules, verification gates, and Git commit policy. | This reading map, [`PROJECT_DESCRIPTION.md`](../PROJECT_DESCRIPTION.md), [`md/agents/shared/uiux.md`](agents/shared/uiux.md), epic READMEs. |
| [`README.md`](../README.md) | Public repository introduction, reproducible Windows setup (`npm ci`), scripts, `.env` reference, and backup/restore runbook. | [`PROJECT_DESCRIPTION.md`](../PROJECT_DESCRIPTION.md), [`md/agents/shared/uiux.md`](agents/shared/uiux.md), [`docs/audit/`](../docs/audit/ARCHITECTURE_AUDIT.md). |
| [`PROJECT_DESCRIPTION.md`](../PROJECT_DESCRIPTION.md) | Concise engineering reference: architecture, layer boundaries, shared data models (`TaskRecord`, `NotificationRecord`), API/service map, implemented vs. planned feature catalog, terminology glossary, and the canonical **Open decisions register**. | Epic specifications, shared UI rules, and dated audit findings in [`docs/audit/`](../docs/audit/ARCHITECTURE_AUDIT.md). |
| `md/readme.md` *(this file)* | Project theme, document ownership boundaries, selective reading paths, authority labels, maintenance rules, and conflict-handling protocol. | Root references, shared UI foundation, epic folders, user files, and archive. |
| [`md/agents/shared/uiux.md`](agents/shared/uiux.md) | Shared visual system: color/spacing/radius/shadow tokens, typography (`Cormorant Garamond` & `Inter`), motion system, accessibility, responsive breakpoints, reusable `src/ui/` controls, Cosmic Launch, Workspace shell, Blank Page, and explicit scope of approved visual exceptions. | [`md/agents/homepage/readme.md`](agents/homepage/readme.md) and [`md/agents/tasks/readme.md`](agents/tasks/readme.md). |
| [`md/agents/homepage/readme.md`](agents/homepage/readme.md) | **Homepage epic specification:** purpose, confirmed requirements, Earth/wordmark/scroll choreography, Feature Collection modes, homepage accessibility/fallbacks, implementation map, acceptance criteria, and open decisions. | [`md/agents/shared/uiux.md`](agents/shared/uiux.md), [`md/agents/homepage/reports.md`](agents/homepage/reports.md), [`public/earth/ATTRIBUTION.md`](../public/earth/ATTRIBUTION.md). |
| [`md/agents/homepage/reports.md`](agents/homepage/reports.md) | Compact dated log of Homepage work, verification evidence, and outstanding issues. | [`review/phase01/README.md`](../review/phase01/README.md), [`review/phase01/MOTION.md`](../review/phase01/MOTION.md), [`docs/audit/`](../docs/audit/BUG_INVENTORY.md), [`md/read/reconstruction.md`](read/reconstruction.md). |
| [`md/agents/tasks/readme.md`](agents/tasks/readme.md) | **Tasks epic specification:** shared task/notification lifecycle, Daily Task Management (Celestial V2 visuals, Day carousel, 3.5-card list, Week summaries, Month calendar, Overdue lane, Transfer modal), Tasks Hub, Notification Center, code map, acceptance criteria, and open decisions. | [`md/agents/shared/uiux.md`](agents/shared/uiux.md), [`md/agents/tasks/reports.md`](agents/tasks/reports.md), [`sources/img/daily-v2-reference/README.md`](../sources/img/daily-v2-reference/README.md). |
| [`md/agents/tasks/reports.md`](agents/tasks/reports.md) | Compact dated log of Tasks epic work, validation, known defects, and links to detailed analyses. | [`docs/audit/BUG_INVENTORY.md`](../docs/audit/BUG_INVENTORY.md), [`docs/audit/STABILIZATION_PLAN.md`](../docs/audit/STABILIZATION_PLAN.md), [`md/read/reconstruction.md`](read/reconstruction.md). |
| [`md/read/reconstruction.md`](read/reconstruction.md) | Documentation migration inventory, SHA-256 preservation proofs, section-level source coverage, disposition of all 29 conflict-report items, verification results, and open questions linked to [`PROJECT_DESCRIPTION.md`](../PROJECT_DESCRIPTION.md#8-open-decisions-register). | Canonical documents and [`md/archive/pre-reorganization/README.md`](archive/pre-reorganization/README.md). |
| [`md/user/user_desc.md`](user/user_desc.md) | Owner-authored plain-language description of the `md/` hierarchy. **Read-only; never edit or move.** | Context for documentation organization. |
| [`md/user/user_notes.md`](user/user_notes.md) | Owner-authored scratchpad of feature priorities, ideas, and feedback. **Read-only; never edit or move.** | Unconfirmed ideas require owner approval before becoming canonical requirements. |
| [`md/task.md`](task.md) | Explicitly assigned current task brief (or inactive template when no task is active). | Relevant canonical docs for the assigned scope. |

---

## 3. Selective Reading Paths

1. **Starting any agent session:** Read [`AGENTS.md`](../AGENTS.md) → this file (`md/readme.md`) → check whether the owner explicitly activated [`md/task.md`](task.md).
2. **Working on the Homepage, Earth scene, Starfield, or Feature Collection:** Read [`PROJECT_DESCRIPTION.md`](../PROJECT_DESCRIPTION.md) (§1–§2, §5–§8) → [`md/agents/shared/uiux.md`](agents/shared/uiux.md) → [`md/agents/homepage/readme.md`](agents/homepage/readme.md) → [`md/agents/homepage/reports.md`](agents/homepage/reports.md).
3. **Working on Daily Task Management, Tasks Hub, or Notifications:** Read [`PROJECT_DESCRIPTION.md`](../PROJECT_DESCRIPTION.md) (§1–§4, §6–§8) → [`md/agents/shared/uiux.md`](agents/shared/uiux.md) → [`md/agents/tasks/readme.md`](agents/tasks/readme.md) → [`md/agents/tasks/reports.md`](agents/tasks/reports.md).
4. **Working on backend persistence, APIs, or bug stabilization:** Read [`PROJECT_DESCRIPTION.md`](../PROJECT_DESCRIPTION.md) → [`md/agents/tasks/readme.md`](agents/tasks/readme.md) (§1–§2, §4) → [`docs/audit/ARCHITECTURE_AUDIT.md`](../docs/audit/ARCHITECTURE_AUDIT.md), [`docs/audit/BUG_INVENTORY.md`](../docs/audit/BUG_INVENTORY.md), and [`docs/audit/STABILIZATION_PLAN.md`](../docs/audit/STABILIZATION_PLAN.md).
5. **Developing a new future epic:** Consult the [Planned Feature Catalog in `PROJECT_DESCRIPTION.md`](../PROJECT_DESCRIPTION.md#5-route--feature-catalog) and [`md/user/user_notes.md`](user/user_notes.md). Do **not** create a new `md/agents/<epic>/` folder until the owner authorizes developing that epic's requirements.

---

## 4. Authority Labels, Exceptions & Conflict Handling

### Explicit status labels

All specifications and engineering references use three explicit labels to prevent confusion between target design and current code:

- **Confirmed requirement:** Product behavior or visual design explicitly approved by the owner.
- **Observed implementation:** What direct source-code inspection or executed verification establishes in the current repository (including any known gaps relative to confirmed requirements).
- **Open decision:** An unresolved question requiring the owner's choice, tracked canonically in [`PROJECT_DESCRIPTION.md` §8]( ../PROJECT_DESCRIPTION.md#8-open-decisions-register).

### General vs. epic rules

- Shared rules in [`PROJECT_DESCRIPTION.md`](../PROJECT_DESCRIPTION.md) and [`md/agents/shared/uiux.md`](agents/shared/uiux.md) apply across all surfaces unless an **approved exception** is explicitly documented in **both** [`md/agents/shared/uiux.md`](agents/shared/uiux.md#12-scoped-visual-exceptions) and the relevant epic README.
- Never silently override a shared rule inside an epic document, and never use an older general rule to revert an explicitly approved epic exception (such as Homepage 3D Earth textures/wordmark capitals or Daily Task Management Celestial V2 artwork).

### Conflict & maintenance protocol

- **Routine maintenance:** Agents may update **Observed implementation** facts and record completed work in epic `reports.md` files as part of authorized tasks.
- **No silent product decisions:** Never resolve a newly discovered contradiction by silently picking whichever document or source file looks newer.
- **When a conflict or ambiguity arises:**
  1. Cite the competing statements and their exact file/line sources.
  2. Explain the practical difference for users or code.
  3. Provide a clear recommendation.
  4. Record or link the item in [`PROJECT_DESCRIPTION.md` §8 (Open decisions register)](../PROJECT_DESCRIPTION.md#8-open-decisions-register) and ask the owner before finalizing the affected requirement.
  5. Continue independent work that does not depend on the unresolved choice.
- **Archiving before retiring:** Whenever a specification or prompt is superseded during future reorganizations, copy its exact original bytes into `md/archive/` and verify its SHA-256 hash before removing or rewriting the active file.

