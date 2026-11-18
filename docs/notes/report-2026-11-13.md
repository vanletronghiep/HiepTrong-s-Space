# Project file and folder action report

**13 November 2026 — Asia/Saigon. Recommendations only; no cleanup executed.**

This replaces the previous dynamic report at the owner's explicit request. It assesses the actual working tree, including local-only review/reference material. Only report.md is written by this audit. Existing deletions, uncommitted source changes and personal notes are preserved.

## 1. Recommended order and meanings

1. Recover missing canonical documentation from verified sources, preserving originals before rewriting.
2. Reconcile current facts and confirmed requirements in their owning documents. Ask the owner about unresolved product choices.
3. Create one current bug/enhancement disposition register using fresh reproduction and historical evidence.
4. Merge accepted unique content and archive superseded prompts/ledgers with exact-byte preservation.
5. Perform separately approved code/UI adjustments and verification.
6. Consider optional cache/temp cleanup last; deleting generated files does not fix product defects.

**KEEP** retains a file's role; it does not certify defect-free code. **MODIFY** identifies a specific factual/structural update. **MERGE → ARCHIVE** preserves unique accepted content in its canonical owner and retains the original as dated history. **RECOVER → MODIFY** restores a missing file from a verified source before reconciliation. **DELETE CANDIDATE** requires the listed checks and separate authorization. **PROTECT** prohibits editing, moving, publishing or deleting owner context, secrets or runtime data as cleanup.

## 2. Scope and method

All included Markdown text was read for document roles, headings, local link targets and exact duplication. Selected source/configuration/scripts, registry, consumer searches and historical audits were inspected to cross-check concrete claims. Every inventoried file and folder receives a disposition below.

Excluded from per-file enumeration: .git, node_modules, .next and build internals. Their folder policies appear below. External paths such as the APCS archive are outside this workspace audit. Binary media and personal runtime data contents were not semantically inspected. Bulk source-file KEEP decisions are retention judgments, not exhaustive function-by-function correctness or security certification.

No browser sessions, installations, builds, tests, migrations, external URL visits or destructive operations were performed for this documentation-only audit. The surviving 174-test/35-page results are earlier verification records, not fresh passes. Environment values are not printed. A source-name search alone cannot prove absence of dynamic/external consumers.

## 3. Highest-priority findings

| Priority / evidence | Finding | Recommended action |
|---|---|---|
| P1 — working tree/Git deletion list | README.md and PROJECT_DESCRIPTION.md are absent, while AGENTS.md and md/readme.md require them. | RECOVER → MODIFY from available Git versions with separate authorization. Preserve original text before reconciliation. The older 151k-character archive is not a drop-in replacement for the deleted concise reference. |
| P1 — scope links | plan.md and blueprint.md are absent; current specs/review cite plan.md. | Recover approved plan content from the conversation or a verified backup. plan.md is not in the tracked deletion list. Recover blueprint intent from Git and confirm its current authority. Do not invent approvals. |
| P1 — md/agents/tasks/readme.md:3 versus :50–51 and :179 | Top addendum approves HH:MM/no countdown; body still calls seconds/countdown a confirmed target and implementation gap. | Merge the approved addendum into body/acceptance sections; archive retired wording. Preserve clock/timezone calculations. |
| P1 — shared/uiux.md:14 versus :29–30; md/readme.md:10 | Current rollout preserves lavender Daily and feature scopes; older prose describes dark Daily and universally lavender pages/Notifications. | Reconcile default workspace versus feature/portal overrides. Do not recolor current pages from stale descriptions. |
| P2 — AGENTS.md §4 versus drizzle.config.ts | Migration warning claims a hard-coded CLI database path; current config uses resolveDatabasePath(). | Correct the factual warning; explain actual environment loading and target verification. Keep backup checks. No migration is required. |
| P2 — md/progress.md | COMPLETE ledger has old 104-test/clock/theme claims, while current review awaits acceptance. | Archive as a dated milestone record; extract unique open items. Different dated test totals alone are not a bug. |
| P2 — md/task.md | Long inactive SVG recovery prompt occupies the current task slot. | Preserve exact original, review unique unfinished requirements, then archive and replace with an inactive template if authorized. Do not execute it. |
| P2 — audit/report overlap | Old IDs are reused; findings include fixed issues and product-dependent proposals. | Keep original evidence; create one current namespaced source/date/ID register with reproduction, status, priority, acceptance and owner decision. |
| P2 — sources/assets/README.md | Old text says no art is integrated; 26 selected runtime copies and implementation review now exist. | Add a dated current integration/selection addendum while retaining historical approval limits and all originals. |
| P3 — BlankPage consumer search | BlankPage.tsx has no other matching source/test consumer, but docs reference it. | KEEP by default; optional deletion only after fallback intent, imports/routes/docs and regression checks are confirmed. |
| P3 — scripts/phase01 | Scripts import sharp/configurable Playwright; prepare-assets writes public/earth. | Keep historical tooling; document prerequisites and output side effects. Do not rerun as cleanup or add dependencies for this audit. |

## 4. Consolidation ownership

| Source / overlap | Destination | Boundary |
|---|---|---|
| Missing setup/readme and verified recovery notes | Root README.md or a linked docs/runbook.md | Setup, env, backup/restore and verified crash recovery. Never automatically remove lock/WAL/database files. |
| Missing concise engineering reference, registry/contracts/source | Root PROJECT_DESCRIPTION.md | Architecture, implemented catalog, data/API map and one decisions register. Confirm facts and distinguish unresolved choices. |
| Design guide + rollout addendum + old shared tables | md/agents/shared/uiux.md | One visual-system owner: confirmed tokens, typography, motion, accessibility and explicit portal exceptions. |
| Tasks addendum and obsolete body | md/agents/tasks/readme.md | One current behavior contract; retain schedule/deadline/transfer/reminder semantics. |
| Historical findings and progress ledger | Proposed docs/audit/CURRENT_FINDINGS.md | Separately approved new register; reproduce findings and namespace old IDs instead of copying every old bug as open. |
| blueprint/project/user ideas | Confirmed requirements in owning documents | Preserve owner intent; distinguish proposed and approved ideas. User documents remain untouched. |
| Repeated epic verification boilerplate | review/verification.md linked from epic reports | Share environment/check summaries, retain epic-specific files, screenshots, acceptance, assets and approval status. |

## 5. Missing files: recovery versus retirement

These deletions already exist; this audit did not cause or reverse them. Git availability does not establish deletion intent.

| Missing file | Action | Reason / source |
| --- | --- | --- |
| `CODEBASE_DETOX_REPORT.md` | RECOVER → ARCHIVE | Preserve early audit provenance; compare with later detox suite. Git HEAD has 14,972 bytes. |
| `DESIGN_SYSTEM_GUIDE.md` | RECOVER → MERGE → ARCHIVE | Compare unique accepted principles with shared/uiux; avoid a competing token owner. Git HEAD has 15,193 bytes. |
| `ENGINEERING_REMEDIATION.md` | RECOVER → MERGE → ARCHIVE | Extract verified recovery procedure; retain dated checkpoint. Git HEAD has 9,999 bytes. |
| `FLASH_IMPLEMENTATION_PROMPTS.md` | RECOVER → ARCHIVE | Provider-specific inactive assignments; preserve unique acceptance criteria. Git HEAD has 25,275 bytes. |
| `PROJECT_CONTEXT.md` | RECOVER → ARCHIVE | Dated discovery/task context, not active instructions. Git HEAD has 24,062 bytes. |
| `PROJECT_DESCRIPTION.md` | RECOVER → MODIFY | Concise canonical architecture, implemented catalog and open decisions. Git HEAD has 44,134 bytes. |
| `README.md` | RECOVER → MODIFY | Setup and recovery entry point; verify commands/env/backup against current code. Git HEAD has 9,092 bytes. |
| `REMEDIATION_PLAN.md` | RECOVER → REVIEW → ARCHIVE | UI work does not automatically supersede old engineering defects; compare unique unfinished requirements. Git HEAD has 18,174 bytes. |
| `WEBSITE_QUALITY_AUDIT.md` | RECOVER → ARCHIVE | Retain dated findings/evidence under docs/audit; current dispositions separate. Git HEAD has 36,185 bytes. |
| `blueprint.md` | RECOVER → REVIEW | Preserve product intent and confirm active/proposed/superseded sections. Git HEAD has 17,715 bytes. |
| `project.md` | RECOVER → MERGE → ARCHIVE | Preserve owner-language product nuance before consolidation. Git HEAD has 20,400 bytes. |
| `temp.md` | LEAVE REMOVED IF APPROVED | Git version is empty; no content recovery needed. Git HEAD has 0 bytes. |
| `plan.md` | RECOVER VERIFIED SCOPE | Absent, not a tracked deletion. Recover from approved conversation/backup; do not fabricate an exact original. |

## 6. Every Markdown file

All included Markdown documents are listed individually, including installed skill documents and ignored local evidence. Missing counts are local-target occurrences, not automatic repair instructions.

| Document | Action | Reason | Missing local targets |
| --- | --- | --- | --- |
| `.agents/AGENTS.md` | KEEP | Scoped general engineering rules, not competing product specifications. | 0 |
| `.agents/skills/banner-design/references/banner-sizes-and-styles.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/banner-design/SKILL.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/brand/references/approval-checklist.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/brand/references/asset-organization.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/brand/references/brand-guideline-template.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/brand/references/color-palette-management.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/brand/references/consistency-checklist.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/brand/references/logo-usage-rules.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/brand/references/messaging-framework.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/brand/references/typography-specifications.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/brand/references/update.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/brand/references/visual-identity.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/brand/references/voice-framework.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/brand/SKILL.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/brand/templates/brand-guidelines-starter.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design-system/references/component-specs.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design-system/references/component-tokens.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design-system/references/primitive-tokens.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design-system/references/semantic-tokens.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design-system/references/states-and-variants.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design-system/references/tailwind-integration.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design-system/references/token-architecture.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design-system/SKILL.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/banner-sizes-and-styles.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/cip-deliverable-guide.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/cip-design.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/cip-prompt-engineering.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/cip-style-guide.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/design-routing.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/icon-design.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/logo-color-psychology.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/logo-design.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/logo-prompt-engineering.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/logo-style-guide.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/slides-copywriting-formulas.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/slides-create.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/slides-html-template.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/slides-layout-patterns.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/slides-strategies.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/slides.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/references/social-photos-design.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/design/SKILL.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/slides/references/copywriting-formulas.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/slides/references/create.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/slides/references/html-template.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/slides/references/layout-patterns.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/slides/references/slide-strategies.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/slides/SKILL.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/ui-styling/references/canvas-design-system.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/ui-styling/references/shadcn-accessibility.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/ui-styling/references/shadcn-components.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/ui-styling/references/shadcn-theming.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/ui-styling/references/tailwind-customization.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/ui-styling/references/tailwind-responsive.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/ui-styling/references/tailwind-utilities.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/ui-styling/SKILL.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `.agents/skills/ui-ux-pro-max/SKILL.md` | KEEP | Installed skill reference/template; package-local duplication can be intentional. Maintain through tooling. | 0 |
| `AGENTS.md` | MODIFY | Correct resolver warning/missing-doc map; preserve authority, activation, protection and verification rules. | 2 |
| `docs/audit/ARCHITECTURE_AUDIT.md` | KEEP / LINK DISPOSITIONS | Historical architecture/bug/debt/stabilization evidence, not execution authorization; current status separate. | 0 |
| `docs/audit/BUG_INVENTORY.md` | KEEP / LINK DISPOSITIONS | Historical architecture/bug/debt/stabilization evidence, not execution authorization; current status separate. | 0 |
| `docs/audit/STABILIZATION_PLAN.md` | KEEP / LINK DISPOSITIONS | Historical architecture/bug/debt/stabilization evidence, not execution authorization; current status separate. | 0 |
| `docs/audit/TECHNICAL_DEBT.md` | KEEP / LINK DISPOSITIONS | Historical architecture/bug/debt/stabilization evidence, not execution authorization; current status separate. | 0 |
| `md/agents/homepage/readme.md` | KEEP / FACTUAL MODIFY | Keep protected Homepage requirements; verify source facts and fix missing links without redesign authority. | 2 |
| `md/agents/homepage/reports.md` | KEEP | Dated work history; append current evidence/errata without rewriting earlier claims. | 0 |
| `md/agents/shared/uiux.md` | MERGE ADDENDUM → MODIFY | Unify confirmed rollout with body/tables, portal scoping and controls. Preserve retired wording first. | 4 |
| `md/agents/tasks/readme.md` | MERGE ADDENDUM → MODIFY | Unify HH:MM/no countdown, preview/mobile selection, Hub dialogs and sakura Notifications; retain data rules. | 16 |
| `md/agents/tasks/reports.md` | KEEP | Dated work history; append current evidence/errata without rewriting earlier claims. | 0 |
| `md/archive/pre-reorganization/AGENTS.original.md` | KEEP IMMUTABLE | Preserve original bytes/source locations; repair current navigation outside originals. | 2 |
| `md/archive/pre-reorganization/md/agents/agent_readme.md` | KEEP IMMUTABLE | Preserve original bytes/source locations; repair current navigation outside originals. | 0 |
| `md/archive/pre-reorganization/md/agents/ASSET_GUIDE.md` | KEEP IMMUTABLE | Preserve original bytes/source locations; repair current navigation outside originals. | 0 |
| `md/archive/pre-reorganization/md/agents/context.md` | KEEP IMMUTABLE | Preserve original bytes/source locations; repair current navigation outside originals. | 0 |
| `md/archive/pre-reorganization/md/agents/DESIGN_SPEC.md` | KEEP IMMUTABLE | Preserve original bytes/source locations; repair current navigation outside originals. | 0 |
| `md/archive/pre-reorganization/md/agents/ui_ux.md` | KEEP IMMUTABLE | Preserve original bytes/source locations; repair current navigation outside originals. | 7 |
| `md/archive/pre-reorganization/md/read/conflicts.md` | KEEP IMMUTABLE | Preserve original bytes/source locations; repair current navigation outside originals. | 16 |
| `md/archive/pre-reorganization/md/task.md` | KEEP IMMUTABLE | Preserve original bytes/source locations; repair current navigation outside originals. | 0 |
| `md/archive/pre-reorganization/PROJECT_DESCRIPTION.md` | KEEP IMMUTABLE | Preserve original bytes/source locations; repair current navigation outside originals. | 1 |
| `md/archive/pre-reorganization/README.md` | KEEP IMMUTABLE | Preserve original bytes/source locations; repair current navigation outside originals. | 1 |
| `md/archive/pre-reorganization/README.original.md` | KEEP IMMUTABLE | Preserve original bytes/source locations; repair current navigation outside originals. | 0 |
| `md/archive/pre-reorganization/sources/img/daily-v2-reference/AGENT_PROMPT.md` | KEEP IMMUTABLE | Preserve original bytes/source locations; repair current navigation outside originals. | 0 |
| `md/archive/pre-reorganization/sources/img/daily-v2-reference/ASSET_GUIDE.md` | KEEP IMMUTABLE | Preserve original bytes/source locations; repair current navigation outside originals. | 0 |
| `md/archive/pre-reorganization/sources/img/daily-v2-reference/DESIGN_SPEC.md` | KEEP IMMUTABLE | Preserve original bytes/source locations; repair current navigation outside originals. | 0 |
| `md/archive/pre-reorganization/sources/img/daily-v2-reference/README.md` | KEEP IMMUTABLE | Preserve original bytes/source locations; repair current navigation outside originals. | 0 |
| `md/progress.md` | ARCHIVE | Dated COMPLETE ledger with former themes/clock/test count; extract unique open items before retiring. | 0 |
| `md/read/reconstruction.md` | KEEP | Migration/hash/coverage evidence; future reorganizations need a new dated record. | 47 |
| `md/readme.md` | MODIFY | Repair ownership/navigation and relative links; distinguish global defaults, feature scopes, current specs and historical records. | 12 |
| `md/task.md` | ARCHIVE → MODIFY | Preserve SVG prompt before resetting inactive template; future work requires explicit owner activation. | 0 |
| `md/user/user_desc.md` | PROTECT | Read-only owner context. Never edit/move/merge or silently promote ideas to confirmed requirements. | 0 |
| `md/user/user_notes.md` | PROTECT | Read-only owner context. Never edit/move/merge or silently promote ideas to confirmed requirements. | 0 |
| `public/earth/ATTRIBUTION.md` | KEEP | Imagery provenance/licensing belongs beside runtime art. | 0 |
| `report.md` | MODIFY — THIS TASK | Current dynamic audit; recommendations are not implementation approval. | 0 |
| `reports/codebase-detox/CODEBASE_AUDIT.md` | KEEP | Dated audit/change attribution/verification; link unique findings rather than overwrite history. | 0 |
| `reports/codebase-detox/DETOX_CHANGELOG.md` | KEEP | Dated audit/change attribution/verification; link unique findings rather than overwrite history. | 0 |
| `reports/codebase-detox/DOCUMENTATION_AUDIT.md` | KEEP | Dated audit/change attribution/verification; link unique findings rather than overwrite history. | 0 |
| `reports/codebase-detox/VERIFICATION_REPORT.md` | KEEP | Dated audit/change attribution/verification; link unique findings rather than overwrite history. | 0 |
| `review.md` | KEEP / UPDATE AFTER FEEDBACK | Handoff index; preserve dated results, restoration notes and pending owner acceptance. | 0 |
| `review/engineering-baseline/REMEDIATION_PLAN.md` | KEEP HISTORICAL | Local evidence or copied inactive plan; preserve provenance and record errata outside originals. | 3 |
| `review/epic-01-shared-interaction-foundation.md` | KEEP / UPDATE AFTER REVIEW | Retain epic evidence and awaiting-review status; append owner feedback/verified adjustments. | 0 |
| `review/epic-02-daily-task-management.md` | KEEP / UPDATE AFTER REVIEW | Retain epic evidence and awaiting-review status; append owner feedback/verified adjustments. | 0 |
| `review/epic-03-tasks-hub.md` | KEEP / UPDATE AFTER REVIEW | Retain epic evidence and awaiting-review status; append owner feedback/verified adjustments. | 1 |
| `review/epic-04-sakura-notifications.md` | KEEP / UPDATE AFTER REVIEW | Retain epic evidence and awaiting-review status; append owner feedback/verified adjustments. | 1 |
| `review/epic-05-events-and-tracking.md` | KEEP / UPDATE AFTER REVIEW | Retain epic evidence and awaiting-review status; append owner feedback/verified adjustments. | 1 |
| `review/epic-06-ai-engineering-and-apcs.md` | KEEP / UPDATE AFTER REVIEW | Retain epic evidence and awaiting-review status; append owner feedback/verified adjustments. | 1 |
| `review/epic-07-flashcards-and-learning-room.md` | KEEP / UPDATE AFTER REVIEW | Retain epic evidence and awaiting-review status; append owner feedback/verified adjustments. | 1 |
| `review/epic-08-blogs-and-entertainment.md` | KEEP / UPDATE AFTER REVIEW | Retain epic evidence and awaiting-review status; append owner feedback/verified adjustments. | 1 |
| `review/epic-09-projects-milestones-achievements.md` | KEEP / UPDATE AFTER REVIEW | Retain epic evidence and awaiting-review status; append owner feedback/verified adjustments. | 1 |
| `review/phase01/MOTION.md` | KEEP HISTORICAL | Local evidence or copied inactive plan; preserve provenance and record errata outside originals. | 0 |
| `review/phase01/README.md` | KEEP HISTORICAL | Local evidence or copied inactive plan; preserve provenance and record errata outside originals. | 1 |
| `review/quality-audit-2026-11-10/completion-audit.md` | KEEP HISTORICAL | Local evidence or copied inactive plan; preserve provenance and record errata outside originals. | 0 |
| `review/quality-audit-2026-11-10/README.md` | KEEP HISTORICAL | Local evidence or copied inactive plan; preserve provenance and record errata outside originals. | 0 |
| `review/verification.md` | KEEP | Dated tests/browser/performance evidence with explicit limits; append new results, not relabel old passes. | 0 |
| `sources/assets/ai-engineering/README.md` | KEEP / STATUS ADDENDUM | Feature concepts/placements/filenames; keep with 10-asset library/contact sheet. Update selection status only from evidence. | 0 |
| `sources/assets/annual-milestones/README.md` | KEEP / STATUS ADDENDUM | Feature concepts/placements/filenames; keep with 10-asset library/contact sheet. Update selection status only from evidence. | 0 |
| `sources/assets/apcs-hub/README.md` | KEEP / STATUS ADDENDUM | Feature concepts/placements/filenames; keep with 10-asset library/contact sheet. Update selection status only from evidence. | 0 |
| `sources/assets/blogs-hub/README.md` | KEEP / STATUS ADDENDUM | Feature concepts/placements/filenames; keep with 10-asset library/contact sheet. Update selection status only from evidence. | 0 |
| `sources/assets/daily-task-management/README.md` | KEEP / STATUS ADDENDUM | Feature concepts/placements/filenames; keep with 10-asset library/contact sheet. Update selection status only from evidence. | 0 |
| `sources/assets/entertainment-hub/README.md` | KEEP / STATUS ADDENDUM | Feature concepts/placements/filenames; keep with 10-asset library/contact sheet. Update selection status only from evidence. | 0 |
| `sources/assets/events/README.md` | KEEP / STATUS ADDENDUM | Feature concepts/placements/filenames; keep with 10-asset library/contact sheet. Update selection status only from evidence. | 0 |
| `sources/assets/flashcards/README.md` | KEEP / STATUS ADDENDUM | Feature concepts/placements/filenames; keep with 10-asset library/contact sheet. Update selection status only from evidence. | 0 |
| `sources/assets/homepage/README.md` | KEEP / STATUS ADDENDUM | Feature concepts/placements/filenames; keep with 10-asset library/contact sheet. Update selection status only from evidence. | 0 |
| `sources/assets/learning-room/README.md` | KEEP / STATUS ADDENDUM | Feature concepts/placements/filenames; keep with 10-asset library/contact sheet. Update selection status only from evidence. | 0 |
| `sources/assets/notification/README.md` | KEEP / STATUS ADDENDUM | Feature concepts/placements/filenames; keep with 10-asset library/contact sheet. Update selection status only from evidence. | 0 |
| `sources/assets/personal-achievements/README.md` | KEEP / STATUS ADDENDUM | Feature concepts/placements/filenames; keep with 10-asset library/contact sheet. Update selection status only from evidence. | 0 |
| `sources/assets/project/README.md` | KEEP / STATUS ADDENDUM | Feature concepts/placements/filenames; keep with 10-asset library/contact sheet. Update selection status only from evidence. | 0 |
| `sources/assets/README.md` | MODIFY | Keep catalog/validation guidance; date stale planning text and add verified runtime-selection/approval status. | 0 |
| `sources/assets/tasks-hub/README.md` | KEEP / STATUS ADDENDUM | Feature concepts/placements/filenames; keep with 10-asset library/contact sheet. Update selection status only from evidence. | 0 |
| `sources/assets/tracking/README.md` | KEEP / STATUS ADDENDUM | Feature concepts/placements/filenames; keep with 10-asset library/contact sheet. Update selection status only from evidence. | 0 |
| `sources/img/daily-v2-reference/README.md` | KEEP LOCAL | Reference/placement index, distinct from runtime public assets; preserve Daily reference pack. | 0 |

### Exact Markdown duplicates

- `.agents/skills/banner-design/references/banner-sizes-and-styles.md`; `.agents/skills/design/references/banner-sizes-and-styles.md`: **KEEP**. Package-local references or preserved original-location archive copies; equality alone does not justify deletion.
- `.agents/skills/design/references/slides-copywriting-formulas.md`; `.agents/skills/slides/references/copywriting-formulas.md`: **KEEP**. Package-local references or preserved original-location archive copies; equality alone does not justify deletion.
- `.agents/skills/design/references/slides-create.md`; `.agents/skills/slides/references/create.md`: **KEEP**. Package-local references or preserved original-location archive copies; equality alone does not justify deletion.
- `.agents/skills/design/references/slides-html-template.md`; `.agents/skills/slides/references/html-template.md`: **KEEP**. Package-local references or preserved original-location archive copies; equality alone does not justify deletion.
- `.agents/skills/design/references/slides-layout-patterns.md`; `.agents/skills/slides/references/layout-patterns.md`: **KEEP**. Package-local references or preserved original-location archive copies; equality alone does not justify deletion.
- `.agents/skills/design/references/slides-strategies.md`; `.agents/skills/slides/references/slide-strategies.md`: **KEEP**. Package-local references or preserved original-location archive copies; equality alone does not justify deletion.
- `md/archive/pre-reorganization/md/agents/ASSET_GUIDE.md`; `md/archive/pre-reorganization/sources/img/daily-v2-reference/ASSET_GUIDE.md`: **KEEP**. Package-local references or preserved original-location archive copies; equality alone does not justify deletion.
- `md/archive/pre-reorganization/md/agents/DESIGN_SPEC.md`; `md/archive/pre-reorganization/sources/img/daily-v2-reference/DESIGN_SPEC.md`: **KEEP**. Package-local references or preserved original-location archive copies; equality alone does not justify deletion.

## 7. Non-Markdown policies and root files

- **APP — KEEP:** Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements.
- **TEST — KEEP:** Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence.
- **MIG — KEEP:** Coupled migration SQL/journal/snapshot history; do not squash, regenerate, merge or run on user data as cleanup.
- **PUBLIC — KEEP:** Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution.
- **SOURCE — KEEP LOCAL:** Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators.
- **REVIEW — KEEP UNTIL ACCEPTANCE:** Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code.
- **SKILL — KEEP:** Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift.
- **DATA — PROTECT:** Personal persistence/credentials/backup; no disclosure, merge or deletion. DB/WAL/SHM are not independent disposable caches.
- **TEMP — DELETE CANDIDATE:** Confirm no live process, unique evidence, report reference or recovery value before removal.
- **CONFIG — KEEP:** Tooling/configuration; preserve locked reproducibility and architecture guardrails. Root exceptions take precedence.
- **REF — MERGE → KEEP/ARCHIVE:** Design reference URL list; annotate feature/use/provenance in a reference index. URLs were not browsed.
- **INSTALL — MOVE/ARCHIVE CANDIDATE:** Standalone installer outside npm scripts; confirm need/provenance, optionally relocate outside app root. Never execute as cleanup.
- **PLACEHOLDER — KEEP / DELETE CANDIDATE:** No other BlankPage source consumer matched; confirm fallback intent/imports/routes/docs and tests before removal.
- **GENERATED — REGENERATE / OPTIONAL CLEAN:** Compiler declarations/cache; never hand-edit. Stop related processes and respect build prerequisites.
- **OTHER — KEEP / VERIFY OWNER:** No concrete deletion proof; confirm owner/consumer/superseding copy.

| Root file | Action | Reason |
| --- | --- | --- |
| `.env` | PROTECT | Private ignored settings; do not print, merge, publish or remove values. |
| `.env.example` | KEEP / FACTUAL MODIFY | Synchronize safe setup template with supported server/config defaults; Drive remains an explicit stub. |
| `.gitattributes` | KEEP | Line-ending policy; avoid normalization across the dirty tree. |
| `.gitignore` | KEEP | Protect secrets/data/sources/review; do not publish ignored evidence merely to fix links. |
| `.prettierrc` | KEEP | Existing style; no repository-wide formatting for this audit. |
| `antigravity-install.ps1` | MOVE/ARCHIVE CANDIDATE | Standalone installer outside npm scripts; confirm need/provenance, optionally relocate outside app root. Never execute as cleanup. |
| `drizzle.config.ts` | KEEP / DOCUMENT | Shared resolveDatabasePath; correct stale docs and verify environment/target before migration. |
| `eslint.config.mjs` | KEEP | Architecture rules; never weaken to facilitate cleanup. |
| `next-env.d.ts` | KEEP GENERATED | Next declarations; regenerate, never hand-edit. |
| `next.config.ts` | KEEP / DOCUMENT | Existing isolated preview output switch; avoid concurrent writers to the same output tree. |
| `package-lock.json` | KEEP | Reproducible graph paired with package.json; do not hand-merge or delete to fix installs. |
| `package.json` | KEEP | Canonical scripts/dependencies; no unsupported upgrades/removals from string searches. |
| `postcss.config.mjs` | KEEP | Tailwind/PostCSS build integration. |
| `sources.txt` | MERGE → KEEP/ARCHIVE | Design reference URL list; annotate feature/use/provenance in a reference index. URLs were not browsed. |
| `tsconfig.json` | KEEP | Strict compiler/aliases and dual build-output type includes; change only for a demonstrated defect. |
| `tsconfig.tsbuildinfo` | DELETE CANDIDATE | Regenerable incremental cache; stop compiler/build first. Removal is optional, not a product fix. |
| `vitest.config.ts` | KEEP | Test discovery/configuration; preserve meaningful coverage. |

### Retention decisions

- Keep the drive adapter: the factory selects it for the explicit Drive option and tests verify its not-implemented contract. Incomplete capability is not unused-file proof.
- Keep contracts/domain/API validation even when current forms expose fewer fields; removing them changes compatibility.
- Keep all 150 original feature SVGs and 26 selected runtime copies. The source library and public deployment serve different purposes; runtime must not import ignored sources.
- Preserve Homepage, Daily, transitions, Earth imagery/attribution/manifests. Asset preparation writes runtime art; it is not housekeeping.
- Keep review/engineering-baseline copies while review is pending; deduplicating against current src destroys reproducibility.
- Optional candidates: unused-looking placeholder, installer placement, proven disposable caches/temp, and empty editor-tool folders. None is an immediate-delete instruction.

## 8. Every included folder

Recursive counts overlap between parents/children. Empty tool folders may be reserved integration locations; confirm owner/tool need before optional removal.

| Folder | Files | Action | Reason |
| --- | --- | --- | --- |
| `.agents/` | 173 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/` | 172 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/banner-design/` | 2 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/banner-design/references/` | 1 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/brand/` | 18 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/brand/references/` | 11 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/brand/scripts/` | 5 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/brand/scripts/tests/` | 1 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/brand/templates/` | 1 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design/` | 35 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design-system/` | 27 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design-system/data/` | 8 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design-system/references/` | 7 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design-system/scripts/` | 10 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design-system/scripts/tests/` | 1 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design-system/templates/` | 1 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design/data/` | 8 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design/data/cip/` | 4 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design/data/icon/` | 1 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design/data/logo/` | 3 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design/references/` | 18 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design/scripts/` | 8 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design/scripts/cip/` | 4 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design/scripts/icon/` | 1 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/design/scripts/logo/` | 3 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/slides/` | 6 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/slides/references/` | 5 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/ui-styling/` | 16 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/ui-styling/references/` | 7 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/ui-styling/scripts/` | 7 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/ui-styling/scripts/tests/` | 4 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/ui-ux-pro-max/` | 68 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/ui-ux-pro-max/data/` | 39 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/ui-ux-pro-max/data/stacks/` | 22 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/ui-ux-pro-max/scripts/` | 28 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/ui-ux-pro-max/scripts/tests/` | 23 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/ui-ux-pro-max/scripts/tests/fixtures/` | 13 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/` | 10 | KEEP | Installed tool implementation/data; do not merge into application or edit tooling to resolve product-doc drift. |
| `.augment/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.augment/skills/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.claude/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.claude/skills/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.codebuddy/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.codebuddy/skills/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.codewhale/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.codewhale/skills/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.continue/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.continue/skills/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.cursor/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.cursor/skills/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.factory/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.factory/skills/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.gemini/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.gemini/skills/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.github/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.github/prompts/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.kilocode/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.kilocode/skills/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.kiro/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.kiro/steering/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.opencode/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.opencode/skills/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.qoder/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.qoder/skills/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.roo/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.roo/skills/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.trae/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.trae/skills/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.warp/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.warp/skills/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.windsurf/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `.windsurf/skills/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `data/` | 8 | PROTECT | Personal persistence/credentials/backup; no disclosure, merge or deletion. DB/WAL/SHM are not independent disposable caches. |
| `data/media/` | 0 | OPTIONAL DELETE IF UNUSED | Empty local folder; confirm integration/owner need. |
| `docs/` | 4 | KEEP | Dated audit/history; current status separate. |
| `docs/audit/` | 4 | KEEP | Dated audit/history; current status separate. |
| `drizzle/` | 3 | KEEP | Coupled migration SQL/journal/snapshot history; do not squash, regenerate, merge or run on user data as cleanup. |
| `drizzle/meta/` | 2 | KEEP | Coupled migration SQL/journal/snapshot history; do not squash, regenerate, merge or run on user data as cleanup. |
| `md/` | 26 | KEEP / RECONCILE | Apply document-specific actions in section 6. |
| `md/agents/` | 5 | KEEP / RECONCILE | Apply document-specific actions in section 6. |
| `md/agents/homepage/` | 2 | KEEP / RECONCILE | Apply document-specific actions in section 6. |
| `md/agents/shared/` | 1 | KEEP / RECONCILE | Apply document-specific actions in section 6. |
| `md/agents/tasks/` | 2 | KEEP / RECONCILE | Apply document-specific actions in section 6. |
| `md/archive/` | 15 | KEEP IMMUTABLE | Preserved historical originals and locations. |
| `md/archive/pre-reorganization/` | 15 | KEEP IMMUTABLE | Preserved historical originals and locations. |
| `md/archive/pre-reorganization/md/` | 7 | KEEP IMMUTABLE | Preserved historical originals and locations. |
| `md/archive/pre-reorganization/md/agents/` | 5 | KEEP IMMUTABLE | Preserved historical originals and locations. |
| `md/archive/pre-reorganization/md/read/` | 1 | KEEP IMMUTABLE | Preserved historical originals and locations. |
| `md/archive/pre-reorganization/sources/` | 4 | KEEP IMMUTABLE | Preserved historical originals and locations. |
| `md/archive/pre-reorganization/sources/img/` | 4 | KEEP IMMUTABLE | Preserved historical originals and locations. |
| `md/archive/pre-reorganization/sources/img/daily-v2-reference/` | 4 | KEEP IMMUTABLE | Preserved historical originals and locations. |
| `md/read/` | 1 | KEEP / RECONCILE | Apply document-specific actions in section 6. |
| `md/user/` | 2 | PROTECT | Owner context; no movement or rewrite. |
| `public/` | 48 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/brand/` | 1 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/earth/` | 10 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/visuals/` | 36 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/visuals/ai-engineering/` | 2 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/visuals/annual-milestones/` | 2 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/visuals/apcs-hub/` | 2 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/visuals/blogs-hub/` | 2 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/visuals/daily-v2/` | 10 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/visuals/entertainment-hub/` | 2 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/visuals/events/` | 2 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/visuals/flashcards/` | 2 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/visuals/learning-room/` | 2 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/visuals/notification/` | 2 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/visuals/personal-achievements/` | 2 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/visuals/project/` | 2 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/visuals/tasks-hub/` | 2 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `public/visuals/tracking/` | 2 | KEEP | Runtime asset/manifest; dynamic feature paths exist. Source/runtime duplication is intentional; preserve attribution. |
| `reports/` | 4 | KEEP | Dated audit/history; current status separate. |
| `reports/codebase-detox/` | 4 | KEEP | Dated audit/history; current status separate. |
| `review/` | 487 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/` | 239 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/` | 210 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/` | 51 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/(workspace)/` | 15 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/(workspace)/achievements/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/(workspace)/ai-engineering/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/(workspace)/apcs/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/(workspace)/blogs/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/(workspace)/entertainment/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/(workspace)/events/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/(workspace)/flashcards/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/(workspace)/learning-room/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/(workspace)/milestones/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/(workspace)/projects/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/(workspace)/tasks/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/(workspace)/tasks/daily/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/(workspace)/tasks/hub/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/(workspace)/tracking/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/` | 29 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/achievements/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/achievements/[id]/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/ai-engineering/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/apcs/` | 3 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/apcs/file/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/apcs/search/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/blogs/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/blogs/[id]/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/entertainment/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/events/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/events/[id]/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/flashcards/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/health/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/learning-room/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/milestones/` | 3 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/milestones/[id]/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/milestones/[id]/toggle-landmark/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/notifications/` | 4 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/notifications/[id]/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/notifications/[id]/read/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/notifications/[id]/unread/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/notifications/read-all/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/projects/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/projects/[id]/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/tasks/` | 5 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/tasks/[id]/` | 4 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/tasks/[id]/complete/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/tasks/[id]/transfer/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/tasks/[id]/uncomplete/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/api/tracking/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/preview/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/app/preview/home-motion/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/client/` | 17 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/client/queries/` | 13 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/contracts/` | 15 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/design/` | 3 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/domain/` | 10 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/` | 67 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/achievements/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/ai-engineering/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/apcs/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/blank/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/blogs/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/entertainment/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/events/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/flashcards/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/home/` | 13 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/home/feature-collection/` | 6 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/home/starfield/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/learning-room/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/milestones/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/notifications/` | 3 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/projects/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/tasks/` | 23 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/tracking/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/features/transitions/` | 4 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/server/` | 5 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/services/` | 24 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/services/storage/` | 10 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/services/storage/drive/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/services/storage/local/` | 5 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/src/ui/` | 17 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/tests/` | 26 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/tests/client/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/tests/client/queries/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/tests/design/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/tests/domain/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/tests/features/` | 14 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/tests/features/home/` | 3 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/tests/features/notifications/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/tests/features/tasks/` | 8 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/tests/features/transitions/` | 1 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/tests/server/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/tests/services/` | 5 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/engineering-baseline/tests/services/storage/` | 3 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/epic-01-shared-interaction-foundation/` | 2 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/phase01/` | 23 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/quality-audit-2026-11-10/` | 92 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/screenshots/` | 91 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `review/ui-harness/` | 5 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `scripts/` | 3 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `scripts/phase01/` | 3 | KEEP UNTIL ACCEPTANCE | Evidence, fixture or captured baseline. Historical source copies are not duplicate active application code. |
| `sources/` | 250 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/` | 208 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/ai-engineering/` | 13 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/annual-milestones/` | 13 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/apcs-hub/` | 13 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/blogs-hub/` | 13 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/daily-task-management/` | 14 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/entertainment-hub/` | 13 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/events/` | 13 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/flashcards/` | 13 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/homepage/` | 14 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/learning-room/` | 13 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/notification/` | 13 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/personal-achievements/` | 13 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/project/` | 13 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/tasks-hub/` | 13 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/assets/tracking/` | 13 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/html/` | 1 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/img/` | 34 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/img/daily-v2-reference/` | 15 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/img/daily-v2-reference/assets/` | 11 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `sources/vid/` | 7 | KEEP LOCAL | Original art/contact sheet/reference or generation/validation support; do not overwrite hand edits by rerunning generators. |
| `src/` | 219 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/` | 51 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/(workspace)/` | 15 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/(workspace)/achievements/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/(workspace)/ai-engineering/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/(workspace)/apcs/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/(workspace)/blogs/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/(workspace)/entertainment/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/(workspace)/events/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/(workspace)/flashcards/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/(workspace)/learning-room/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/(workspace)/milestones/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/(workspace)/projects/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/(workspace)/tasks/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/(workspace)/tasks/daily/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/(workspace)/tasks/hub/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/(workspace)/tracking/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/` | 29 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/achievements/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/achievements/[id]/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/ai-engineering/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/apcs/` | 3 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/apcs/file/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/apcs/search/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/blogs/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/blogs/[id]/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/entertainment/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/events/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/events/[id]/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/flashcards/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/health/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/learning-room/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/milestones/` | 3 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/milestones/[id]/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/milestones/[id]/toggle-landmark/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/notifications/` | 4 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/notifications/[id]/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/notifications/[id]/read/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/notifications/[id]/unread/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/notifications/read-all/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/projects/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/projects/[id]/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/tasks/` | 5 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/tasks/[id]/` | 4 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/tasks/[id]/complete/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/tasks/[id]/transfer/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/tasks/[id]/uncomplete/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/api/tracking/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/preview/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/app/preview/home-motion/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/client/` | 17 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/client/queries/` | 13 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/contracts/` | 15 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/design/` | 3 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/domain/` | 11 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/` | 71 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/achievements/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/ai-engineering/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/apcs/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/blank/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/blogs/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/entertainment/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/events/` | 3 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/flashcards/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/home/` | 13 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/home/feature-collection/` | 6 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/home/starfield/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/learning-room/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/milestones/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/notifications/` | 3 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/projects/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/tasks/` | 26 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/tracking/` | 2 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/features/transitions/` | 4 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/server/` | 5 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/services/` | 25 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/services/storage/` | 10 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/services/storage/drive/` | 1 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/services/storage/local/` | 5 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `src/ui/` | 20 | KEEP | Application source; retain layer/feature boundaries. Change only for confirmed defects or approved enhancements. |
| `tests/` | 46 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/client/` | 2 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/client/queries/` | 1 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/design/` | 3 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/domain/` | 4 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/features/` | 23 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/features/blogs/` | 1 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/features/entertainment/` | 1 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/features/events/` | 2 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/features/flashcards/` | 1 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/features/home/` | 3 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/features/learning-room/` | 1 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/features/notifications/` | 1 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/features/tasks/` | 11 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/features/transitions/` | 1 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/server/` | 5 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/services/` | 7 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/services/storage/` | 3 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tests/ui/` | 2 | KEEP | Regression coverage/helpers. storage-adapter.contract.ts is imported by local adapter tests; helper naming is not obsolescence. |
| `tmp/` | 2 | DELETE CANDIDATE | Confirm no live process, unique evidence, report reference or recovery value before removal. |
| `tmp/codebase-detox-audit/` | 2 | DELETE CANDIDATE | Confirm no live process, unique evidence, report reference or recovery value before removal. |

| Excluded internals | Action | Conditions |
| --- | --- | --- |
| `.git/` | PROTECT | Version history/index/config; never delete/rewrite as cleanup. |
| `node_modules/` | KEEP / OPTIONAL REINSTALL | Stop dependent processes; confirm locked reinstall is available. No cleanup required here. |
| `.next/` | OPTIONAL CLEAN | Stop its owning Next process and retain diagnostics first. |
| `build/` | OPTIONAL CLEAN | Preview output; deletion removes preview. Confirm owner and ability to rebuild. |

## 9. Missing local link targets

Text scan found **121 absent target occurrences**, including **83 in current/reference docs**. This is not an external URL, anchor or renderer test. Examples and immutable originals are not automatic repair instructions. Investigate each row first.

| Document : line | Absent target | Action |
| --- | --- | --- |
| `AGENTS.md:12` | `PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `AGENTS.md:12` | `PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/homepage/readme.md:5` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/homepage/readme.md:131` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/shared/uiux.md:14` | `../../../plan.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/shared/uiux.md:127` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/shared/uiux.md:189` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/shared/uiux.md:290` | `../../../plan.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:3` | `../../../plan.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:7` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:24` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:42` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:47` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:51` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:179` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:180` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:181` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:183` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:201` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:202` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:203` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:204` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:205` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/agents/tasks/readme.md:206` | `../../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:44` | `../../README.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:45` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:67` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:68` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:69` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:70` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:71` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:72` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:73` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:73` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:74` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:75` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:81` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:82` | `../../README.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:82` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:83` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:106` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:114` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:141` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:149` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:149` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:149` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:151` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:151` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:165` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:165` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:178` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:178` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:184` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:193` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:194` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:194` | `../../README.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:200` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:201` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:201` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:202` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:205` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:208` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:208` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:214` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:216` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:217` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:218` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:219` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:220` | `../../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:235` | `path` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/read/reconstruction.md:235` | `path` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/readme.md:20` | `../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/readme.md:21` | `../README.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/readme.md:21` | `../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/readme.md:22` | `../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/readme.md:29` | `../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/readme.md:39` | `../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/readme.md:40` | `../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/readme.md:41` | `../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/readme.md:42` | `../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/readme.md:54` | `../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/readme.md:58` | `../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |
| `md/readme.md:69` | `../PROJECT_DESCRIPTION.md` | Recover canonical document or repair relative base after checking ownership/content. |

Historical/tooling targets: preserve originals and record errata/current destinations outside them. For installed skills, check optional cross-skill prerequisites through the skill system.

| Historical/tool document | Occurrences |
| --- | --- |
| `.agents/AGENTS.md` | 0 |
| `.agents/skills/banner-design/SKILL.md` | 0 |
| `.agents/skills/banner-design/references/banner-sizes-and-styles.md` | 0 |
| `.agents/skills/brand/SKILL.md` | 0 |
| `.agents/skills/brand/references/approval-checklist.md` | 0 |
| `.agents/skills/brand/references/asset-organization.md` | 0 |
| `.agents/skills/brand/references/brand-guideline-template.md` | 0 |
| `.agents/skills/brand/references/color-palette-management.md` | 0 |
| `.agents/skills/brand/references/consistency-checklist.md` | 0 |
| `.agents/skills/brand/references/logo-usage-rules.md` | 0 |
| `.agents/skills/brand/references/messaging-framework.md` | 0 |
| `.agents/skills/brand/references/typography-specifications.md` | 0 |
| `.agents/skills/brand/references/update.md` | 0 |
| `.agents/skills/brand/references/visual-identity.md` | 0 |
| `.agents/skills/brand/references/voice-framework.md` | 0 |
| `.agents/skills/brand/templates/brand-guidelines-starter.md` | 0 |
| `.agents/skills/design-system/SKILL.md` | 0 |
| `.agents/skills/design-system/references/component-specs.md` | 0 |
| `.agents/skills/design-system/references/component-tokens.md` | 0 |
| `.agents/skills/design-system/references/primitive-tokens.md` | 0 |
| `.agents/skills/design-system/references/semantic-tokens.md` | 0 |
| `.agents/skills/design-system/references/states-and-variants.md` | 0 |
| `.agents/skills/design-system/references/tailwind-integration.md` | 0 |
| `.agents/skills/design-system/references/token-architecture.md` | 0 |
| `.agents/skills/design/SKILL.md` | 0 |
| `.agents/skills/design/references/banner-sizes-and-styles.md` | 0 |
| `.agents/skills/design/references/cip-deliverable-guide.md` | 0 |
| `.agents/skills/design/references/cip-design.md` | 0 |
| `.agents/skills/design/references/cip-prompt-engineering.md` | 0 |
| `.agents/skills/design/references/cip-style-guide.md` | 0 |
| `.agents/skills/design/references/design-routing.md` | 0 |
| `.agents/skills/design/references/icon-design.md` | 0 |
| `.agents/skills/design/references/logo-color-psychology.md` | 0 |
| `.agents/skills/design/references/logo-design.md` | 0 |
| `.agents/skills/design/references/logo-prompt-engineering.md` | 0 |
| `.agents/skills/design/references/logo-style-guide.md` | 0 |
| `.agents/skills/design/references/slides-copywriting-formulas.md` | 0 |
| `.agents/skills/design/references/slides-create.md` | 0 |
| `.agents/skills/design/references/slides-html-template.md` | 0 |
| `.agents/skills/design/references/slides-layout-patterns.md` | 0 |
| `.agents/skills/design/references/slides-strategies.md` | 0 |
| `.agents/skills/design/references/slides.md` | 0 |
| `.agents/skills/design/references/social-photos-design.md` | 0 |
| `.agents/skills/slides/SKILL.md` | 0 |
| `.agents/skills/slides/references/copywriting-formulas.md` | 0 |
| `.agents/skills/slides/references/create.md` | 0 |
| `.agents/skills/slides/references/html-template.md` | 0 |
| `.agents/skills/slides/references/layout-patterns.md` | 0 |
| `.agents/skills/slides/references/slide-strategies.md` | 0 |
| `.agents/skills/ui-styling/SKILL.md` | 0 |
| `.agents/skills/ui-styling/references/canvas-design-system.md` | 0 |
| `.agents/skills/ui-styling/references/shadcn-accessibility.md` | 0 |
| `.agents/skills/ui-styling/references/shadcn-components.md` | 0 |
| `.agents/skills/ui-styling/references/shadcn-theming.md` | 0 |
| `.agents/skills/ui-styling/references/tailwind-customization.md` | 0 |
| `.agents/skills/ui-styling/references/tailwind-responsive.md` | 0 |
| `.agents/skills/ui-styling/references/tailwind-utilities.md` | 0 |
| `.agents/skills/ui-ux-pro-max/SKILL.md` | 0 |
| `docs/audit/ARCHITECTURE_AUDIT.md` | 0 |
| `docs/audit/BUG_INVENTORY.md` | 0 |
| `docs/audit/STABILIZATION_PLAN.md` | 0 |
| `docs/audit/TECHNICAL_DEBT.md` | 0 |
| `md/archive/pre-reorganization/AGENTS.original.md` | 2 |
| `md/archive/pre-reorganization/PROJECT_DESCRIPTION.md` | 1 |
| `md/archive/pre-reorganization/README.md` | 1 |
| `md/archive/pre-reorganization/README.original.md` | 0 |
| `md/archive/pre-reorganization/md/agents/ASSET_GUIDE.md` | 0 |
| `md/archive/pre-reorganization/md/agents/DESIGN_SPEC.md` | 0 |
| `md/archive/pre-reorganization/md/agents/agent_readme.md` | 0 |
| `md/archive/pre-reorganization/md/agents/context.md` | 0 |
| `md/archive/pre-reorganization/md/agents/ui_ux.md` | 7 |
| `md/archive/pre-reorganization/md/read/conflicts.md` | 16 |
| `md/archive/pre-reorganization/md/task.md` | 0 |
| `md/archive/pre-reorganization/sources/img/daily-v2-reference/AGENT_PROMPT.md` | 0 |
| `md/archive/pre-reorganization/sources/img/daily-v2-reference/ASSET_GUIDE.md` | 0 |
| `md/archive/pre-reorganization/sources/img/daily-v2-reference/DESIGN_SPEC.md` | 0 |
| `md/archive/pre-reorganization/sources/img/daily-v2-reference/README.md` | 0 |
| `reports/codebase-detox/CODEBASE_AUDIT.md` | 0 |
| `reports/codebase-detox/DETOX_CHANGELOG.md` | 0 |
| `reports/codebase-detox/DOCUMENTATION_AUDIT.md` | 0 |
| `reports/codebase-detox/VERIFICATION_REPORT.md` | 0 |
| `review/engineering-baseline/REMEDIATION_PLAN.md` | 3 |
| `review/epic-01-shared-interaction-foundation.md` | 0 |
| `review/epic-02-daily-task-management.md` | 0 |
| `review/epic-03-tasks-hub.md` | 1 |
| `review/epic-04-sakura-notifications.md` | 1 |
| `review/epic-05-events-and-tracking.md` | 1 |
| `review/epic-06-ai-engineering-and-apcs.md` | 1 |
| `review/epic-07-flashcards-and-learning-room.md` | 1 |
| `review/epic-08-blogs-and-entertainment.md` | 1 |
| `review/epic-09-projects-milestones-achievements.md` | 1 |
| `review/phase01/MOTION.md` | 0 |
| `review/phase01/README.md` | 1 |
| `review/quality-audit-2026-11-10/README.md` | 0 |
| `review/quality-audit-2026-11-10/completion-audit.md` | 0 |
| `review/verification.md` | 0 |

## 10. Proposed execution sequence — not activated

1. Snapshot dirty Git status/protected hashes; confirm intentional deletions. Recover canonical docs from verified sources without discarding unrelated changes.
2. Reconcile built registry catalog, scoped themes, HH:MM/no countdown, Hub note dialogs, toast lifecycle, database resolver and setup/font/build limits. Keep observed facts distinct from confirmed requirements.
3. Obtain owner decisions on product ambiguity, visual feedback, native zoom/reduced-motion checks and final acceptance. This report is not approval.
4. Create a current register from reproduced/namespaced findings. Separate bugs, enhancements, already-fixed items and open decisions.
5. Merge unique accepted content, preserve exact originals/hashes before retiring specs/prompts, then repair links/ownership maps.
6. For optional deletion, prove no runtime/build/test/dynamic consumer, unique evidence or live process. Act only on specifically authorized paths.
7. Verify documentation links/anchors/coverage/protected hashes. Run code checks only for code changes; also build for routing/assets/dependencies. Record actual results and limits.

## 11. Complete non-Markdown file appendix

Each row maps to its action/reason/gate policy in section 7. Root exceptions take precedence. This is an inventory, not a command list. Dependency/generated internals are covered by folder policy.

### .agents

| File | Policy / action |
| --- | --- |
| `.agents/skills/brand/scripts/extract-colors.cjs` | SKILL — KEEP |
| `.agents/skills/brand/scripts/inject-brand-context.cjs` | SKILL — KEEP |
| `.agents/skills/brand/scripts/sync-brand-to-tokens.cjs` | SKILL — KEEP |
| `.agents/skills/brand/scripts/tests/test_sync_brand_to_tokens.py` | SKILL — KEEP |
| `.agents/skills/brand/scripts/validate-asset.cjs` | SKILL — KEEP |
| `.agents/skills/design-system/data/slide-backgrounds.csv` | SKILL — KEEP |
| `.agents/skills/design-system/data/slide-charts.csv` | SKILL — KEEP |
| `.agents/skills/design-system/data/slide-color-logic.csv` | SKILL — KEEP |
| `.agents/skills/design-system/data/slide-copy.csv` | SKILL — KEEP |
| `.agents/skills/design-system/data/slide-layout-logic.csv` | SKILL — KEEP |
| `.agents/skills/design-system/data/slide-layouts.csv` | SKILL — KEEP |
| `.agents/skills/design-system/data/slide-strategies.csv` | SKILL — KEEP |
| `.agents/skills/design-system/data/slide-typography.csv` | SKILL — KEEP |
| `.agents/skills/design-system/scripts/embed-tokens.cjs` | SKILL — KEEP |
| `.agents/skills/design-system/scripts/fetch-background.py` | SKILL — KEEP |
| `.agents/skills/design-system/scripts/generate-slide.py` | SKILL — KEEP |
| `.agents/skills/design-system/scripts/generate-tokens.cjs` | SKILL — KEEP |
| `.agents/skills/design-system/scripts/html-token-validator.py` | SKILL — KEEP |
| `.agents/skills/design-system/scripts/search-slides.py` | SKILL — KEEP |
| `.agents/skills/design-system/scripts/slide-token-validator.py` | SKILL — KEEP |
| `.agents/skills/design-system/scripts/slide_search_core.py` | SKILL — KEEP |
| `.agents/skills/design-system/scripts/tests/test_validate_tokens.py` | SKILL — KEEP |
| `.agents/skills/design-system/scripts/validate-tokens.cjs` | SKILL — KEEP |
| `.agents/skills/design-system/templates/design-tokens-starter.json` | SKILL — KEEP |
| `.agents/skills/design/data/cip/deliverables.csv` | SKILL — KEEP |
| `.agents/skills/design/data/cip/industries.csv` | SKILL — KEEP |
| `.agents/skills/design/data/cip/mockup-contexts.csv` | SKILL — KEEP |
| `.agents/skills/design/data/cip/styles.csv` | SKILL — KEEP |
| `.agents/skills/design/data/icon/styles.csv` | SKILL — KEEP |
| `.agents/skills/design/data/logo/colors.csv` | SKILL — KEEP |
| `.agents/skills/design/data/logo/industries.csv` | SKILL — KEEP |
| `.agents/skills/design/data/logo/styles.csv` | SKILL — KEEP |
| `.agents/skills/design/scripts/cip/core.py` | SKILL — KEEP |
| `.agents/skills/design/scripts/cip/generate.py` | SKILL — KEEP |
| `.agents/skills/design/scripts/cip/render-html.py` | SKILL — KEEP |
| `.agents/skills/design/scripts/cip/search.py` | SKILL — KEEP |
| `.agents/skills/design/scripts/icon/generate.py` | SKILL — KEEP |
| `.agents/skills/design/scripts/logo/core.py` | SKILL — KEEP |
| `.agents/skills/design/scripts/logo/generate.py` | SKILL — KEEP |
| `.agents/skills/design/scripts/logo/search.py` | SKILL — KEEP |
| `.agents/skills/ui-styling/LICENSE.txt` | SKILL — KEEP |
| `.agents/skills/ui-styling/scripts/requirements.txt` | SKILL — KEEP |
| `.agents/skills/ui-styling/scripts/shadcn_add.py` | SKILL — KEEP |
| `.agents/skills/ui-styling/scripts/tailwind_config_gen.py` | SKILL — KEEP |
| `.agents/skills/ui-styling/scripts/tests/coverage-ui.json` | SKILL — KEEP |
| `.agents/skills/ui-styling/scripts/tests/requirements.txt` | SKILL — KEEP |
| `.agents/skills/ui-styling/scripts/tests/test_shadcn_add.py` | SKILL — KEEP |
| `.agents/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/app-interface.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/catalog-summary.json` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/charts.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/colors.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/data-provenance.json` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/google-font-licenses.json` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/google-fonts.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/icons.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/landing.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/motion.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/phosphor-icons-upstream.json` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/products.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/react-performance.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/angular.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/astro.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/avalonia.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/flutter.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/html-tailwind.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/javafx.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/jetpack-compose.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/laravel.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/nextjs.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/nuxt-ui.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/nuxtjs.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/react-native.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/react.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/shadcn.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/svelte.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/swiftui.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/threejs.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/uno.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/uwp.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/vue.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/winui.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/stacks/wpf.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/styles.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/typography.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/ui-reasoning.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/data/ux-guidelines.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/core.py` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/design_system.py` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/reasoning_contract.py` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/search.py` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/google-api.json` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/google-catalog.json` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/google-existing.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/google-metadata.json` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/google-overrides.json` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/icons-curated.csv` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/phosphor-core.json` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/phosphor-package.json` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/phosphor-react-exports.json` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/phosphor-react-package.json` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/fixtures/relevance-baseline.json` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/fixtures/relevance-cases.json` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/fixtures/relevance-thresholds.json` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/test_catalog_refresh.py` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/test_core.py` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/test_core_data_quality.py` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/test_data_contracts.py` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/test_design_system_mode.py` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/test_native_desktop_stack_freshness.py` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/test_relevance_evaluator.py` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/test_style_taxonomy.py` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/test_text_layout_resilience.py` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/tests/test_web_stack_freshness.py` | SKILL — KEEP |
| `.agents/skills/ui-ux-pro-max/scripts/validate_data.py` | SKILL — KEEP |

### [root]

| File | Policy / action |
| --- | --- |
| `.env` | DATA — PROTECT |
| `.env.example` | CONFIG — KEEP |
| `.gitattributes` | CONFIG — KEEP |
| `.gitignore` | CONFIG — KEEP |
| `.prettierrc` | CONFIG — KEEP |
| `antigravity-install.ps1` | INSTALL — MOVE/ARCHIVE CANDIDATE |
| `drizzle.config.ts` | CONFIG — KEEP |
| `eslint.config.mjs` | CONFIG — KEEP |
| `next-env.d.ts` | GENERATED — REGENERATE / OPTIONAL CLEAN |
| `next.config.ts` | CONFIG — KEEP |
| `package-lock.json` | CONFIG — KEEP |
| `package.json` | CONFIG — KEEP |
| `postcss.config.mjs` | CONFIG — KEEP |
| `sources.txt` | REF — MERGE → KEEP/ARCHIVE |
| `tsconfig.json` | CONFIG — KEEP |
| `tsconfig.tsbuildinfo` | GENERATED — REGENERATE / OPTIONAL CLEAN |
| `vitest.config.ts` | CONFIG — KEEP |

### data

| File | Policy / action |
| --- | --- |
| `data/ai-engineering-data.json` | DATA — PROTECT |
| `data/ai-engineering-data.json.bak` | DATA — PROTECT |
| `data/blogs-articles.json` | DATA — PROTECT |
| `data/events.json` | DATA — PROTECT |
| `data/hiep-trong-space.db` | DATA — PROTECT |
| `data/hiep-trong-space.db-shm` | DATA — PROTECT |
| `data/hiep-trong-space.db-wal` | DATA — PROTECT |
| `data/learning-room-sessions.json` | DATA — PROTECT |

### drizzle

| File | Policy / action |
| --- | --- |
| `drizzle/0000_lush_gravity.sql` | MIG — KEEP |
| `drizzle/meta/0000_snapshot.json` | MIG — KEEP |
| `drizzle/meta/_journal.json` | MIG — KEEP |

### public

| File | Policy / action |
| --- | --- |
| `public/brand/wordmark.svg` | PUBLIC — KEEP |
| `public/earth/asset-manifest.json` | PUBLIC — KEEP |
| `public/earth/earth-clouds-2k.webp` | PUBLIC — KEEP |
| `public/earth/earth-clouds-4k.webp` | PUBLIC — KEEP |
| `public/earth/earth-day-2k.webp` | PUBLIC — KEEP |
| `public/earth/earth-day-4k.webp` | PUBLIC — KEEP |
| `public/earth/earth-night-2k.webp` | PUBLIC — KEEP |
| `public/earth/earth-night-4k.webp` | PUBLIC — KEEP |
| `public/earth/earth-poster-2k.webp` | PUBLIC — KEEP |
| `public/earth/earth-poster-4k.webp` | PUBLIC — KEEP |
| `public/icon.svg` | PUBLIC — KEEP |
| `public/visuals/ai-engineering/mist-layered-ridges.svg` | PUBLIC — KEEP |
| `public/visuals/ai-engineering/trail-cairn.svg` | PUBLIC — KEEP |
| `public/visuals/annual-milestones/champions-cup.svg` | PUBLIC — KEEP |
| `public/visuals/annual-milestones/hall-of-golden-years.svg` | PUBLIC — KEEP |
| `public/visuals/apcs-hub/glacier-shelf.svg` | PUBLIC — KEEP |
| `public/visuals/apcs-hub/snow-fox-rest.svg` | PUBLIC — KEEP |
| `public/visuals/blogs-hub/cabin-lantern.svg` | PUBLIC — KEEP |
| `public/visuals/blogs-hub/woodland-cabin.svg` | PUBLIC — KEEP |
| `public/visuals/daily-v2/card-celestial-corner.svg` | PUBLIC — KEEP |
| `public/visuals/daily-v2/celestial-scroll-thumb.svg` | PUBLIC — KEEP |
| `public/visuals/daily-v2/constellation-sprinkles.svg` | PUBLIC — KEEP |
| `public/visuals/daily-v2/day-arc-decoration.svg` | PUBLIC — KEEP |
| `public/visuals/daily-v2/eclipse-broken-orbit.svg` | PUBLIC — KEEP |
| `public/visuals/daily-v2/moon-phase-divider.svg` | PUBLIC — KEEP |
| `public/visuals/daily-v2/nebula-clouds.svg` | PUBLIC — KEEP |
| `public/visuals/daily-v2/orbiting-moon.svg` | PUBLIC — KEEP |
| `public/visuals/daily-v2/ringed-planet.svg` | PUBLIC — KEEP |
| `public/visuals/daily-v2/spiral-galaxy.svg` | PUBLIC — KEEP |
| `public/visuals/entertainment-hub/dream-city-horizon.svg` | PUBLIC — KEEP |
| `public/visuals/entertainment-hub/dream-console.svg` | PUBLIC — KEEP |
| `public/visuals/events/hermit-shell-haven.svg` | PUBLIC — KEEP |
| `public/visuals/events/jellyfish-lanterns.svg` | PUBLIC — KEEP |
| `public/visuals/flashcards/library-arched-window.svg` | PUBLIC — KEEP |
| `public/visuals/flashcards/reading-corner.svg` | PUBLIC — KEEP |
| `public/visuals/learning-room/bonsai-on-a-stone.svg` | PUBLIC — KEEP |
| `public/visuals/learning-room/meditation-cushion.svg` | PUBLIC — KEEP |
| `public/visuals/notification/fairy-glass-chime.svg` | PUBLIC — KEEP |
| `public/visuals/notification/sakura-branch.svg` | PUBLIC — KEEP |
| `public/visuals/personal-achievements/ceremonial-marble-plinth.svg` | PUBLIC — KEEP |
| `public/visuals/personal-achievements/marble-arcade.svg` | PUBLIC — KEEP |
| `public/visuals/project/dragon-over-the-ridge.svg` | PUBLIC — KEEP |
| `public/visuals/project/wooden-training-dummy.svg` | PUBLIC — KEEP |
| `public/visuals/tasks-hub/quiet-telescope.svg` | PUBLIC — KEEP |
| `public/visuals/tasks-hub/starlight-hourglass.svg` | PUBLIC — KEEP |
| `public/visuals/tracking/garden-watering-can.svg` | PUBLIC — KEEP |
| `public/visuals/tracking/herbal-tea-ritual.svg` | PUBLIC — KEEP |

### review

| File | Policy / action |
| --- | --- |
| `review/browser-layout-before-final.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/browser-layout-evidence.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/carousel-browser-checks.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/component-performance.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/component-scroll-performance.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/dialog-keyboard.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/(workspace)/achievements/page.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/(workspace)/ai-engineering/page.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/(workspace)/apcs/page.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/(workspace)/blogs/page.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/(workspace)/entertainment/page.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/(workspace)/error.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/(workspace)/events/page.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/(workspace)/flashcards/page.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/(workspace)/layout.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/(workspace)/learning-room/page.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/(workspace)/milestones/page.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/(workspace)/projects/page.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/(workspace)/tasks/daily/page.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/(workspace)/tasks/hub/page.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/(workspace)/tracking/page.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/achievements/[id]/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/achievements/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/ai-engineering/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/apcs/file/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/apcs/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/apcs/search/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/blogs/[id]/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/blogs/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/entertainment/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/events/[id]/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/events/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/flashcards/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/health/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/learning-room/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/milestones/[id]/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/milestones/[id]/toggle-landmark/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/milestones/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/notifications/[id]/read/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/notifications/[id]/unread/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/notifications/read-all/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/notifications/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/projects/[id]/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/projects/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/tasks/[id]/complete/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/tasks/[id]/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/tasks/[id]/transfer/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/tasks/[id]/uncomplete/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/tasks/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/api/tracking/route.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/error.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/globals.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/layout.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/not-found.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/page.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/preview/home-motion/page.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/app/providers.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/api-client.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/preferences.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/queries/achievements.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/queries/ai-engineering.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/queries/apcs.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/queries/blogs.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/queries/entertainment.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/queries/events.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/queries/flashcards.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/queries/learning-room.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/queries/milestones.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/queries/notifications.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/queries/projects.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/queries/tasks.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/queries/tracking.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/query-provider.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/client/use-minute-ticker.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/contracts/achievement.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/contracts/ai-engineering.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/contracts/apcs.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/contracts/api.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/contracts/blog.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/contracts/entertainment.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/contracts/event.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/contracts/flashcard.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/contracts/index.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/contracts/learning-room.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/contracts/milestone.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/contracts/notification.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/contracts/project.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/contracts/task.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/contracts/tracking.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/design/fonts.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/design/motion.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/design/tokens.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/domain/clock.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/domain/date-input.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/domain/event-domain.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/domain/milestone-domain.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/domain/notification-rules.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/domain/project-domain.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/domain/reminder.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/domain/task-sort.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/domain/task-status.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/domain/time.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/achievements/achievements.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/achievements/AchievementsView.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/ai-engineering/ai-engineering.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/ai-engineering/AiEngineeringView.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/apcs/apcs.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/apcs/ApcsView.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/blank/BlankPage.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/blogs/writing-room.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/blogs/WritingRoomView.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/entertainment/entertainment.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/entertainment/EntertainmentView.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/events/events.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/events/EventsView.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/flashcards/flashcards.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/flashcards/FlashcardsView.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/home/earth-scene.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/home/feature-collection/CollectionHeader.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/home/feature-collection/FeatureCard.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/home/feature-collection/FeatureCollection.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/home/feature-collection/FeatureThumbnail.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/home/feature-collection/HorizontalGallery.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/home/feature-collection/VerticalGrid.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/home/home-journey.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/home/home-journey.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/home/HomeFooter.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/home/HomeJourney.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/home/starfield/starfield-engine.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/home/starfield/Starfield.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/learning-room/learning-room.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/learning-room/LearningRoomView.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/milestones/milestones.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/milestones/MilestonesView.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/notifications/BellButton.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/notifications/NotificationItem.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/notifications/NotificationPopover.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/projects/projects.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/projects/ProjectsView.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/registry.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/daily-dashboard-time.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/daily-foundation.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/daily-task-card.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/DailyBoard.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/DailyDashboard.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/DailySky.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/day-carousel.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/day-task-list.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/DayCarousel.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/DayTaskList.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/DueSoonDot.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/FinishedCounter.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/HubList.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/month-view.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/MonthView.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/OverdueList.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/PriorityBadge.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/TaskCard.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/TaskForm.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/TaskMenu.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/TransferDialog.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/week-view.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tasks/WeekView.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tracking/tracking.module.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/tracking/TrackingView.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/transitions/CosmicLaunchOverlay.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/transitions/transition-rules.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/transitions/TransitionLink.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/features/transitions/TransitionProvider.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/instrumentation.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/server/api-response.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/server/config.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/server/container.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/server/logger.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/server/scheduler.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/achievement-service.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/ai-engineering-service.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/apcs-service.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/blog-service.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/entertainment-service.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/errors.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/event-service.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/flashcard-service.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/learning-room-service.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/milestone-service.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/notification-service.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/project-service.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/storage/apcs-storage.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/storage/drive/drive-storage-adapter.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/storage/factory.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/storage/json-store.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/storage/local/local-media-storage.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/storage/local/local-notification-repository.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/storage/local/local-storage-adapter.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/storage/local/local-task-repository.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/storage/local/schema.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/storage/storage-adapter.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/task-service.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/services/tracking-service.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/Badge.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/Button.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/Checkbox.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/Chip.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/cn.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/Dialog.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/Drawer.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/EmptyState.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/IconButton.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/Popover.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/SegmentedControl.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/Skeleton.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/StarIcon.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/Toast.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/UniverseMenu.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/use-focus-trap.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/src/ui/WorkspaceShell.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/status-before.txt` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/client/queries/task-queries.test.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/design/craft-and-architecture-guardrails.test.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/design/tokens-guardrail.test.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/domain/task-domain.test.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/domain/time.test.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/features/home/feature-collection.test.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/features/home/home-journey.test.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/features/home/starfield-and-home.test.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/features/notifications/notification-popover.test.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/features/registry.test.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/features/tasks/daily-dashboard-time.test.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/features/tasks/day-carousel.test.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/features/tasks/deadline-identity.test.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/features/tasks/form-draft-session.test.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/features/tasks/hub-list.test.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/features/tasks/month-view.test.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/features/tasks/task-components.test.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/features/tasks/week-view.test.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/features/transitions/cosmic-launch.test.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/server/api-response.test.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/server/config.test.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/services/notification-service.test.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/services/storage/drive-storage-adapter.test.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/services/storage/local-storage-adapter.test.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/services/storage/storage-adapter.contract.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tests/services/task-service.test.ts` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-baseline/tracked-before.patch` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-check.log` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-files.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/engineering-focused.log` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/epic-01-shared-interaction-foundation/protected-baseline.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/epic-01-shared-interaction-foundation/verification.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/epic-report-data.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/event-editor-browser.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/hub-sort-colors.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/list-geometry.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/menu-containing-block-repro.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/note-geometry.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/notification-scope.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/notifications-all-routes.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/palette-contrast.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/personal-documents-final-baseline.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/capture-report.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/compact-logo-desktop.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/compact-logo-phone.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/earth-scene.js` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/globe-desktop.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/globe-phone.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/homepage-collection.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/homepage-opening.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/index.html` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/motion-arrival.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/motion-cta.webp` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/motion-desktop-scroll.webp` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/motion-drag.webp` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/motion-opening.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/motion-phone-opening.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/motion-phone-scroll.webp` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/opening-desktop.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/opening-phone.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/review-gallery.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/view.html` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/phase01/wordmark-detail.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/preservation-audit.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/preview-hit-areas.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/achievement-create.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/achievements-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/achievements-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/achievements-edit.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/ai-engineering-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/ai-engineering-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/ai-note.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/apcs-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/apcs-320-clipped.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/apcs-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/apcs-course-loaded.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/apcs-course-production.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/apcs-course.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/apcs-search-production.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/apcs-search.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/audit-not-found-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/audit-not-found-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/blogs-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/blogs-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/build.log` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/capture.cjs` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/check.log` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/daily-month.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/daily-observatory.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/daily-populated.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/daily-week.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/delivery-verification.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/entertainment-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/entertainment-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/entertainment-book.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/events-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/events-320-clipped.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/events-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/events-create-desktop.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/events-create-mobile.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/events-error.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/events-week.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/final-checks.cjs` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/final-checks.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/flashcard-answer.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/flashcard-create.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/flashcard-study.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/flashcards-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/flashcards-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/followup.cjs` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/followup.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/home-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/home-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/home-pose-0.5.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/home-pose-0.67.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/home-pose-0.83.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/home-pose-1.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/home-vertical.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/interactions.cjs` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/interactions.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/learning-reflection.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/learning-room-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/learning-room-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/manifest.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/milestone-create.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/milestones-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/milestones-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/notifications-overdue-production.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/notifications-populated.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/preview-home-motion-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/preview-home-motion-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/probes.cjs` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/production-checks.cjs` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/production-checks.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/projects-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/projects-320-clipped.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/projects-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/projects-edit.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/routes.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/source-hashes.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/storage-probes.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/task-form.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/tasks-daily-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/tasks-daily-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/tasks-hub-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/tasks-hub-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/tracking-1440.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/tracking-390.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/tracking-sleep.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/undefined-tokens.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/verify-delivery.cjs` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/writing-form.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/writing-reader.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/writing-reference-desktop.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/quality-audit-2026-11-10/writing-reference-mobile.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/runtime-assets.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/achievements-1024.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/achievements-1440.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/achievements-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/achievements-375.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/achievements-768.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/ai-engineering-1024.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/ai-engineering-1440.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/ai-engineering-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/ai-engineering-375.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/ai-engineering-768.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/ai-engineering-mobile-375.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/apcs-1024.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/apcs-1440.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/apcs-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/apcs-375.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/apcs-768.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/apcs-file-details-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/apcs-mobile-375.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/apcs-no-results-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/blogs-1024.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/blogs-1440.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/blogs-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/blogs-375.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/blogs-768.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/blogs-editor-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/blogs-reader-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/component-carousel-desktop.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/component-carousel-mobile.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/daily-desktop.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/entertainment-1024.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/entertainment-1440.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/entertainment-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/entertainment-375.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/entertainment-768.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/events-1024.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/events-1440.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/events-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/events-375.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/events-768.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/events-edit-desktop.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/events-mobile-375.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/flashcards-1024.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/flashcards-1440.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/flashcards-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/flashcards-375.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/flashcards-768.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/flashcards-mobile-375.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/homepage-1440.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/hub-desktop.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/hub-details-desktop.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/hub-keyboard-focus.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/hub-live-details-desktop.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/hub-live-menu-desktop.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/hub-menu-desktop.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/hub-mobile-375.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/learning-quiet-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/learning-room-1024.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/learning-room-1440.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/learning-room-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/learning-room-375.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/learning-room-768.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/learning-room-mobile-375.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/milestones-1024.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/milestones-1440.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/milestones-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/milestones-375.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/milestones-768.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/notifications-home-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/notifications-home-desktop.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/projects-1024.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/projects-1440.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/projects-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/projects-375.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/projects-768.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tasks-daily-1024.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tasks-daily-1440.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tasks-daily-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tasks-daily-375.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tasks-daily-768.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tasks-hub-1024.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tasks-hub-1440.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tasks-hub-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tasks-hub-375.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tasks-hub-768.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/title-validation-desktop.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tracking-1024.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tracking-1440.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tracking-320.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tracking-375.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tracking-768.jpg` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/screenshots/tracking-mobile-375.png` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/text-contrast-before.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/text-contrast-samples.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/title-validation.json` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/ui-harness/image-adapter.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/ui-harness/index.html` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/ui-harness/main.tsx` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/ui-harness/qa.css` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `review/ui-harness/server.mjs` | REVIEW — KEEP UNTIL ACCEPTANCE |

### scripts

| File | Policy / action |
| --- | --- |
| `scripts/phase01/capture-review.mjs` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `scripts/phase01/prepare-assets.mjs` | REVIEW — KEEP UNTIL ACCEPTANCE |
| `scripts/phase01/serve-review.mjs` | REVIEW — KEEP UNTIL ACCEPTANCE |

### sources

| File | Policy / action |
| --- | --- |
| `sources/assets/ai-engineering/contact-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/ai-engineering/contact-sheet.png` | SOURCE — KEEP LOCAL |
| `sources/assets/ai-engineering/contour-field-frame.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/ai-engineering/field-research-notebook.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/ai-engineering/fogbound-pines.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/ai-engineering/ginkgo-stone-seal.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/ai-engineering/mist-layered-ridges.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/ai-engineering/misty-footbridge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/ai-engineering/mountain-reflection.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/ai-engineering/ridge-trail-edge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/ai-engineering/trail-cairn.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/ai-engineering/valley-river-contours.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/annual-milestones/celebration-streamer.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/annual-milestones/champion-star-medallion.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/annual-milestones/champions-cup.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/annual-milestones/contact-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/annual-milestones/contact-sheet.png` | SOURCE — KEEP LOCAL |
| `sources/assets/annual-milestones/golden-hour-pocketwatch.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/annual-milestones/hall-of-golden-years.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/annual-milestones/honor-ribbon.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/annual-milestones/honor-stage-curtains.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/annual-milestones/legacy-gallery-frame.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/annual-milestones/legacy-memory-chest.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/annual-milestones/victory-pennant-edge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/apcs-hub/arctic-field-camp.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/apcs-hub/aurora-silk.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/apcs-hub/contact-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/apcs-hub/contact-sheet.png` | SOURCE — KEEP LOCAL |
| `sources/assets/apcs-hub/frost-fern.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/apcs-hub/frozen-lake-skates.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/apcs-hub/glacier-shelf.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/apcs-hub/ice-window-frame.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/apcs-hub/icicle-edge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/apcs-hub/polar-skyline.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/apcs-hub/snow-crystal-imprint.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/apcs-hub/snow-fox-rest.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/blogs-hub/acorn-imprint.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/blogs-hub/autumn-canopy.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/blogs-hub/cabin-lantern.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/blogs-hub/contact-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/blogs-hub/contact-sheet.png` | SOURCE — KEEP LOCAL |
| `sources/assets/blogs-hub/falling-maple-pair.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/blogs-hub/fern-and-twig-edge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/blogs-hub/rustic-postcard-frame.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/blogs-hub/timber-grain-rule.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/blogs-hub/wild-mushroom-pair.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/blogs-hub/woodland-cabin.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/blogs-hub/woodland-typewriter.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/collection-overview.png` | SOURCE — KEEP LOCAL |
| `sources/assets/daily-task-management/astronomers-resting-chair.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/daily-task-management/celestial-harp.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/daily-task-management/contact-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/daily-task-management/contact-sheet.png` | SOURCE — KEEP LOCAL |
| `sources/assets/daily-task-management/crystal-pendulum.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/daily-task-management/dreamcatcher-prism.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/daily-task-management/floating-sky-ladders.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/daily-task-management/glass-star-terrarium.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/daily-task-management/night-bloom-corner.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/daily-task-management/observatory-note-frame.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/daily-task-management/reference-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/daily-task-management/sky-library-balcony.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/daily-task-management/starlit-thread-divider.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/entertainment-hub/arcade-capsule.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/entertainment-hub/contact-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/entertainment-hub/contact-sheet.png` | SOURCE — KEEP LOCAL |
| `sources/assets/entertainment-hub/dream-city-horizon.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/entertainment-hub/dream-console.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/entertainment-hub/floating-headphones.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/entertainment-hub/hologram-window-frame.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/entertainment-hub/holographic-garden.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/entertainment-hub/iridescent-data-bloom.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/entertainment-hub/pastel-prism-stack.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/entertainment-hub/pixel-waterfall-edge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/entertainment-hub/ribbon-signal.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/events/contact-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/events/contact-sheet.png` | SOURCE — KEEP LOCAL |
| `sources/assets/events/coral-garden.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/events/hermit-shell-haven.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/events/jellyfish-lanterns.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/events/kelp-ribbon-edge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/events/manta-in-the-current.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/events/nautilus-imprint.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/events/pearl-and-oyster.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/events/seahorse-drift.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/events/tidal-lace.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/events/tidepool-window.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/expansion-baseline.json` | SOURCE — KEEP LOCAL |
| `sources/assets/flashcards/antique-library-shelves.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/flashcards/bookmark-ribbon-edge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/flashcards/contact-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/flashcards/contact-sheet.png` | SOURCE — KEEP LOCAL |
| `sources/assets/flashcards/ex-libris-owl.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/flashcards/inkwell-and-nib.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/flashcards/library-arched-window.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/flashcards/library-card-frame.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/flashcards/quill-and-bookmark.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/flashcards/reading-corner.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/flashcards/shelf-of-stories.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/flashcards/stacked-study-volumes.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/generate-assets.py` | SOURCE — KEEP LOCAL |
| `sources/assets/homepage/ascending-beacons.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/homepage/contact-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/homepage/contact-sheet.png` | SOURCE — KEEP LOCAL |
| `sources/assets/homepage/cosmic-antenna.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/homepage/deep-space-transit.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/homepage/folded-starlight-emblem.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/homepage/ion-lantern.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/homepage/mission-capsule.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/homepage/navigation-window-frame.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/homepage/photon-bridge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/homepage/quiet-spaceport.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/homepage/reference-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/homepage/solar-sail-voyager.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/index.html` | SOURCE — KEEP LOCAL |
| `sources/assets/learning-room/bamboo-interval.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/learning-room/bamboo-screen-edge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/learning-room/bonsai-on-a-stone.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/learning-room/contact-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/learning-room/contact-sheet.png` | SOURCE — KEEP LOCAL |
| `sources/assets/learning-room/enso-and-pebble.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/learning-room/incense-and-tea.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/learning-room/lotus-bowl.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/learning-room/meditation-cushion.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/learning-room/raked-sand-ripples.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/learning-room/shoji-paper-frame.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/learning-room/zen-stone-courtyard.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/manifest.json` | SOURCE — KEEP LOCAL |
| `sources/assets/notification/blossom-thread.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/notification/blossom-vine-edge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/notification/butterfly-whisper.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/notification/contact-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/notification/contact-sheet.png` | SOURCE — KEEP LOCAL |
| `sources/assets/notification/dew-drop-lantern.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/notification/fairy-envelope-frame.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/notification/fairy-glass-chime.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/notification/sakura-branch.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/notification/sakura-footbridge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/notification/sakura-petal-current.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/notification/sealed-petal-letter.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/personal-achievements/acanthus-column-edge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/personal-achievements/ceremonial-marble-plinth.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/personal-achievements/contact-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/personal-achievements/contact-sheet.png` | SOURCE — KEEP LOCAL |
| `sources/assets/personal-achievements/curule-chair.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/personal-achievements/forum-colonnade.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/personal-achievements/imperial-eagle-relief.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/personal-achievements/laurel-spray.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/personal-achievements/marble-arcade.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/personal-achievements/marble-inscription-frame.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/personal-achievements/olive-oil-amphora.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/personal-achievements/roman-mosaic-band.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/project/auspicious-cloud-pillar.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/project/auspicious-cloud-scroll.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/project/cloud-dragon-seal.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/project/contact-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/project/contact-sheet.png` | SOURCE — KEEP LOCAL |
| `sources/assets/project/dragon-over-the-ridge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/project/dragon-scale-fan.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/project/jade-knot-talisman.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/project/mountain-temple-eaves.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/project/silk-scroll-frame.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/project/temple-practice-gong.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/project/wooden-training-dummy.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/protected-baseline.json` | SOURCE — KEEP LOCAL |
| `sources/assets/render-review.cjs` | SOURCE — KEEP LOCAL |
| `sources/assets/tasks-hub/celestial-coordinate-rule.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tasks-hub/celestial-mobile.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tasks-hub/contact-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/tasks-hub/contact-sheet.png` | SOURCE — KEEP LOCAL |
| `sources/assets/tasks-hub/meteor-quill.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tasks-hub/meteor-rain-edge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tasks-hub/night-moth-seal.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tasks-hub/night-sky-map-frame.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tasks-hub/observatory-dome.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tasks-hub/quiet-telescope.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tasks-hub/stardust-vial.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tasks-hub/starlight-hourglass.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tracking/botanical-label-frame.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tracking/chamomile-imprint.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tracking/climbing-thyme-edge.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tracking/contact-sheet.html` | SOURCE — KEEP LOCAL |
| `sources/assets/tracking/contact-sheet.png` | SOURCE — KEEP LOCAL |
| `sources/assets/tracking/garden-watering-can.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tracking/herb-drying-rail.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tracking/herbal-tea-ritual.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tracking/mint-herbarium.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tracking/seedling-journal.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tracking/tea-infuser.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/tracking/tea-steam-rule.svg` | SOURCE — KEEP LOCAL |
| `sources/assets/validate-assets.py` | SOURCE — KEEP LOCAL |
| `sources/assets/validation.json` | SOURCE — KEEP LOCAL |
| `sources/assets/verification-summary.json` | SOURCE — KEEP LOCAL |
| `sources/html/sample0.html` | SOURCE — KEEP LOCAL |
| `sources/img/daily-v2-reference/asset-preview.png` | SOURCE — KEEP LOCAL |
| `sources/img/daily-v2-reference/assets/card-celestial-corner.svg` | SOURCE — KEEP LOCAL |
| `sources/img/daily-v2-reference/assets/celestial-scroll-thumb.svg` | SOURCE — KEEP LOCAL |
| `sources/img/daily-v2-reference/assets/constellation-sprinkles.svg` | SOURCE — KEEP LOCAL |
| `sources/img/daily-v2-reference/assets/day-arc-decoration.svg` | SOURCE — KEEP LOCAL |
| `sources/img/daily-v2-reference/assets/eclipse-broken-orbit.svg` | SOURCE — KEEP LOCAL |
| `sources/img/daily-v2-reference/assets/moon-phase-divider.svg` | SOURCE — KEEP LOCAL |
| `sources/img/daily-v2-reference/assets/nebula-clouds.svg` | SOURCE — KEEP LOCAL |
| `sources/img/daily-v2-reference/assets/orbiting-moon.svg` | SOURCE — KEEP LOCAL |
| `sources/img/daily-v2-reference/assets/ringed-planet.svg` | SOURCE — KEEP LOCAL |
| `sources/img/daily-v2-reference/assets/spiral-galaxy.svg` | SOURCE — KEEP LOCAL |
| `sources/img/daily-v2-reference/assets/zodiac-wheel.svg` | SOURCE — KEEP LOCAL |
| `sources/img/daily-v2-reference/daily-current-reference.png` | SOURCE — KEEP LOCAL |
| `sources/img/daily-v2-reference/daily-v2-target-reference.png` | SOURCE — KEEP LOCAL |
| `sources/img/img0.png` | SOURCE — KEEP LOCAL |
| `sources/img/img1.png` | SOURCE — KEEP LOCAL |
| `sources/img/img10.png` | SOURCE — KEEP LOCAL |
| `sources/img/img11.png` | SOURCE — KEEP LOCAL |
| `sources/img/img12.png` | SOURCE — KEEP LOCAL |
| `sources/img/img13.png` | SOURCE — KEEP LOCAL |
| `sources/img/img14.png` | SOURCE — KEEP LOCAL |
| `sources/img/img15.png` | SOURCE — KEEP LOCAL |
| `sources/img/img16.png` | SOURCE — KEEP LOCAL |
| `sources/img/img17.png` | SOURCE — KEEP LOCAL |
| `sources/img/img18.png` | SOURCE — KEEP LOCAL |
| `sources/img/img2.jpg` | SOURCE — KEEP LOCAL |
| `sources/img/img3.jpg` | SOURCE — KEEP LOCAL |
| `sources/img/img4.jpg` | SOURCE — KEEP LOCAL |
| `sources/img/img5.png` | SOURCE — KEEP LOCAL |
| `sources/img/img6.png` | SOURCE — KEEP LOCAL |
| `sources/img/img7.png` | SOURCE — KEEP LOCAL |
| `sources/img/img8.png` | SOURCE — KEEP LOCAL |
| `sources/img/img9.png` | SOURCE — KEEP LOCAL |
| `sources/vid/vid0.mp4` | SOURCE — KEEP LOCAL |
| `sources/vid/vid1.mp4` | SOURCE — KEEP LOCAL |
| `sources/vid/vid4.mp4` | SOURCE — KEEP LOCAL |
| `sources/vid/vid5.mp4` | SOURCE — KEEP LOCAL |
| `sources/vid/vid6.mp4` | SOURCE — KEEP LOCAL |
| `sources/vid/vid7.mp4` | SOURCE — KEEP LOCAL |
| `sources/vid/vid8.mp4` | SOURCE — KEEP LOCAL |

### src

| File | Policy / action |
| --- | --- |
| `src/app/(workspace)/achievements/page.tsx` | APP — KEEP |
| `src/app/(workspace)/ai-engineering/page.tsx` | APP — KEEP |
| `src/app/(workspace)/apcs/page.tsx` | APP — KEEP |
| `src/app/(workspace)/blogs/page.tsx` | APP — KEEP |
| `src/app/(workspace)/entertainment/page.tsx` | APP — KEEP |
| `src/app/(workspace)/error.tsx` | APP — KEEP |
| `src/app/(workspace)/events/page.tsx` | APP — KEEP |
| `src/app/(workspace)/flashcards/page.tsx` | APP — KEEP |
| `src/app/(workspace)/layout.tsx` | APP — KEEP |
| `src/app/(workspace)/learning-room/page.tsx` | APP — KEEP |
| `src/app/(workspace)/milestones/page.tsx` | APP — KEEP |
| `src/app/(workspace)/projects/page.tsx` | APP — KEEP |
| `src/app/(workspace)/tasks/daily/page.tsx` | APP — KEEP |
| `src/app/(workspace)/tasks/hub/page.tsx` | APP — KEEP |
| `src/app/(workspace)/tracking/page.tsx` | APP — KEEP |
| `src/app/api/achievements/[id]/route.ts` | APP — KEEP |
| `src/app/api/achievements/route.ts` | APP — KEEP |
| `src/app/api/ai-engineering/route.ts` | APP — KEEP |
| `src/app/api/apcs/file/route.ts` | APP — KEEP |
| `src/app/api/apcs/route.ts` | APP — KEEP |
| `src/app/api/apcs/search/route.ts` | APP — KEEP |
| `src/app/api/blogs/[id]/route.ts` | APP — KEEP |
| `src/app/api/blogs/route.ts` | APP — KEEP |
| `src/app/api/entertainment/route.ts` | APP — KEEP |
| `src/app/api/events/[id]/route.ts` | APP — KEEP |
| `src/app/api/events/route.ts` | APP — KEEP |
| `src/app/api/flashcards/route.ts` | APP — KEEP |
| `src/app/api/health/route.ts` | APP — KEEP |
| `src/app/api/learning-room/route.ts` | APP — KEEP |
| `src/app/api/milestones/[id]/route.ts` | APP — KEEP |
| `src/app/api/milestones/[id]/toggle-landmark/route.ts` | APP — KEEP |
| `src/app/api/milestones/route.ts` | APP — KEEP |
| `src/app/api/notifications/[id]/read/route.ts` | APP — KEEP |
| `src/app/api/notifications/[id]/unread/route.ts` | APP — KEEP |
| `src/app/api/notifications/read-all/route.ts` | APP — KEEP |
| `src/app/api/notifications/route.ts` | APP — KEEP |
| `src/app/api/projects/[id]/route.ts` | APP — KEEP |
| `src/app/api/projects/route.ts` | APP — KEEP |
| `src/app/api/tasks/[id]/complete/route.ts` | APP — KEEP |
| `src/app/api/tasks/[id]/route.ts` | APP — KEEP |
| `src/app/api/tasks/[id]/transfer/route.ts` | APP — KEEP |
| `src/app/api/tasks/[id]/uncomplete/route.ts` | APP — KEEP |
| `src/app/api/tasks/route.ts` | APP — KEEP |
| `src/app/api/tracking/route.ts` | APP — KEEP |
| `src/app/error.tsx` | APP — KEEP |
| `src/app/globals.css` | APP — KEEP |
| `src/app/layout.tsx` | APP — KEEP |
| `src/app/not-found.tsx` | APP — KEEP |
| `src/app/page.tsx` | APP — KEEP |
| `src/app/preview/home-motion/page.tsx` | APP — KEEP |
| `src/app/providers.tsx` | APP — KEEP |
| `src/client/api-client.ts` | APP — KEEP |
| `src/client/preferences.ts` | APP — KEEP |
| `src/client/queries/achievements.ts` | APP — KEEP |
| `src/client/queries/ai-engineering.ts` | APP — KEEP |
| `src/client/queries/apcs.ts` | APP — KEEP |
| `src/client/queries/blogs.ts` | APP — KEEP |
| `src/client/queries/entertainment.ts` | APP — KEEP |
| `src/client/queries/events.ts` | APP — KEEP |
| `src/client/queries/flashcards.ts` | APP — KEEP |
| `src/client/queries/learning-room.ts` | APP — KEEP |
| `src/client/queries/milestones.ts` | APP — KEEP |
| `src/client/queries/notifications.ts` | APP — KEEP |
| `src/client/queries/projects.ts` | APP — KEEP |
| `src/client/queries/tasks.ts` | APP — KEEP |
| `src/client/queries/tracking.ts` | APP — KEEP |
| `src/client/query-provider.tsx` | APP — KEEP |
| `src/client/use-minute-ticker.ts` | APP — KEEP |
| `src/contracts/achievement.ts` | APP — KEEP |
| `src/contracts/ai-engineering.ts` | APP — KEEP |
| `src/contracts/apcs.ts` | APP — KEEP |
| `src/contracts/api.ts` | APP — KEEP |
| `src/contracts/blog.ts` | APP — KEEP |
| `src/contracts/entertainment.ts` | APP — KEEP |
| `src/contracts/event.ts` | APP — KEEP |
| `src/contracts/flashcard.ts` | APP — KEEP |
| `src/contracts/index.ts` | APP — KEEP |
| `src/contracts/learning-room.ts` | APP — KEEP |
| `src/contracts/milestone.ts` | APP — KEEP |
| `src/contracts/notification.ts` | APP — KEEP |
| `src/contracts/project.ts` | APP — KEEP |
| `src/contracts/task.ts` | APP — KEEP |
| `src/contracts/tracking.ts` | APP — KEEP |
| `src/design/fonts.ts` | APP — KEEP |
| `src/design/motion.ts` | APP — KEEP |
| `src/design/tokens.css` | APP — KEEP |
| `src/domain/activity-days.ts` | APP — KEEP |
| `src/domain/clock.ts` | APP — KEEP |
| `src/domain/date-input.ts` | APP — KEEP |
| `src/domain/event-domain.ts` | APP — KEEP |
| `src/domain/milestone-domain.ts` | APP — KEEP |
| `src/domain/notification-rules.ts` | APP — KEEP |
| `src/domain/project-domain.ts` | APP — KEEP |
| `src/domain/reminder.ts` | APP — KEEP |
| `src/domain/task-sort.ts` | APP — KEEP |
| `src/domain/task-status.ts` | APP — KEEP |
| `src/domain/time.ts` | APP — KEEP |
| `src/features/achievements/achievements.module.css` | APP — KEEP |
| `src/features/achievements/AchievementsView.tsx` | APP — KEEP |
| `src/features/ai-engineering/ai-engineering.module.css` | APP — KEEP |
| `src/features/ai-engineering/AiEngineeringView.tsx` | APP — KEEP |
| `src/features/apcs/apcs.module.css` | APP — KEEP |
| `src/features/apcs/ApcsView.tsx` | APP — KEEP |
| `src/features/blank/BlankPage.tsx` | PLACEHOLDER — KEEP / DELETE CANDIDATE |
| `src/features/blogs/writing-room.module.css` | APP — KEEP |
| `src/features/blogs/WritingRoomView.tsx` | APP — KEEP |
| `src/features/entertainment/entertainment.module.css` | APP — KEEP |
| `src/features/entertainment/EntertainmentView.tsx` | APP — KEEP |
| `src/features/events/event-editor.ts` | APP — KEEP |
| `src/features/events/events.module.css` | APP — KEEP |
| `src/features/events/EventsView.tsx` | APP — KEEP |
| `src/features/flashcards/flashcards.module.css` | APP — KEEP |
| `src/features/flashcards/FlashcardsView.tsx` | APP — KEEP |
| `src/features/home/earth-scene.ts` | APP — KEEP |
| `src/features/home/feature-collection/CollectionHeader.tsx` | APP — KEEP |
| `src/features/home/feature-collection/FeatureCard.tsx` | APP — KEEP |
| `src/features/home/feature-collection/FeatureCollection.tsx` | APP — KEEP |
| `src/features/home/feature-collection/FeatureThumbnail.tsx` | APP — KEEP |
| `src/features/home/feature-collection/HorizontalGallery.tsx` | APP — KEEP |
| `src/features/home/feature-collection/VerticalGrid.tsx` | APP — KEEP |
| `src/features/home/home-journey.module.css` | APP — KEEP |
| `src/features/home/home-journey.ts` | APP — KEEP |
| `src/features/home/HomeFooter.tsx` | APP — KEEP |
| `src/features/home/HomeJourney.tsx` | APP — KEEP |
| `src/features/home/starfield/starfield-engine.ts` | APP — KEEP |
| `src/features/home/starfield/Starfield.tsx` | APP — KEEP |
| `src/features/learning-room/learning-room.module.css` | APP — KEEP |
| `src/features/learning-room/LearningRoomView.tsx` | APP — KEEP |
| `src/features/milestones/milestones.module.css` | APP — KEEP |
| `src/features/milestones/MilestonesView.tsx` | APP — KEEP |
| `src/features/notifications/BellButton.tsx` | APP — KEEP |
| `src/features/notifications/NotificationItem.tsx` | APP — KEEP |
| `src/features/notifications/NotificationPopover.tsx` | APP — KEEP |
| `src/features/projects/projects.module.css` | APP — KEEP |
| `src/features/projects/ProjectsView.tsx` | APP — KEEP |
| `src/features/registry.ts` | APP — KEEP |
| `src/features/tasks/daily-dashboard-time.ts` | APP — KEEP |
| `src/features/tasks/daily-foundation.module.css` | APP — KEEP |
| `src/features/tasks/daily-task-card.module.css` | APP — KEEP |
| `src/features/tasks/DailyBoard.tsx` | APP — KEEP |
| `src/features/tasks/DailyDashboard.tsx` | APP — KEEP |
| `src/features/tasks/DailySky.tsx` | APP — KEEP |
| `src/features/tasks/day-carousel.module.css` | APP — KEEP |
| `src/features/tasks/day-task-list.module.css` | APP — KEEP |
| `src/features/tasks/DayCarousel.tsx` | APP — KEEP |
| `src/features/tasks/DayTaskList.tsx` | APP — KEEP |
| `src/features/tasks/DueSoonDot.tsx` | APP — KEEP |
| `src/features/tasks/FinishedCounter.tsx` | APP — KEEP |
| `src/features/tasks/HubList.tsx` | APP — KEEP |
| `src/features/tasks/month-view.module.css` | APP — KEEP |
| `src/features/tasks/MonthView.tsx` | APP — KEEP |
| `src/features/tasks/OverdueList.tsx` | APP — KEEP |
| `src/features/tasks/PriorityBadge.tsx` | APP — KEEP |
| `src/features/tasks/task-form.module.css` | APP — KEEP |
| `src/features/tasks/task-note-tone.ts` | APP — KEEP |
| `src/features/tasks/task-note.module.css` | APP — KEEP |
| `src/features/tasks/TaskCard.tsx` | APP — KEEP |
| `src/features/tasks/TaskForm.tsx` | APP — KEEP |
| `src/features/tasks/TaskMenu.tsx` | APP — KEEP |
| `src/features/tasks/TransferDialog.tsx` | APP — KEEP |
| `src/features/tasks/week-view.module.css` | APP — KEEP |
| `src/features/tasks/WeekView.tsx` | APP — KEEP |
| `src/features/tracking/tracking.module.css` | APP — KEEP |
| `src/features/tracking/TrackingView.tsx` | APP — KEEP |
| `src/features/transitions/CosmicLaunchOverlay.tsx` | APP — KEEP |
| `src/features/transitions/transition-rules.ts` | APP — KEEP |
| `src/features/transitions/TransitionLink.tsx` | APP — KEEP |
| `src/features/transitions/TransitionProvider.tsx` | APP — KEEP |
| `src/instrumentation.ts` | APP — KEEP |
| `src/server/api-response.ts` | APP — KEEP |
| `src/server/config.ts` | APP — KEEP |
| `src/server/container.ts` | APP — KEEP |
| `src/server/logger.ts` | APP — KEEP |
| `src/server/scheduler.ts` | APP — KEEP |
| `src/services/achievement-service.ts` | APP — KEEP |
| `src/services/ai-engineering-service.ts` | APP — KEEP |
| `src/services/apcs-service.ts` | APP — KEEP |
| `src/services/blog-service.ts` | APP — KEEP |
| `src/services/entertainment-service.ts` | APP — KEEP |
| `src/services/errors.ts` | APP — KEEP |
| `src/services/event-service.ts` | APP — KEEP |
| `src/services/flashcard-service.ts` | APP — KEEP |
| `src/services/learning-room-service.ts` | APP — KEEP |
| `src/services/milestone-service.ts` | APP — KEEP |
| `src/services/notification-service.ts` | APP — KEEP |
| `src/services/project-service.ts` | APP — KEEP |
| `src/services/storage/apcs-storage.ts` | APP — KEEP |
| `src/services/storage/drive/drive-storage-adapter.ts` | APP — KEEP |
| `src/services/storage/factory.ts` | APP — KEEP |
| `src/services/storage/json-store.ts` | APP — KEEP |
| `src/services/storage/local/local-media-storage.ts` | APP — KEEP |
| `src/services/storage/local/local-notification-repository.ts` | APP — KEEP |
| `src/services/storage/local/local-storage-adapter.ts` | APP — KEEP |
| `src/services/storage/local/local-task-repository.ts` | APP — KEEP |
| `src/services/storage/local/schema.ts` | APP — KEEP |
| `src/services/storage/storage-adapter.ts` | APP — KEEP |
| `src/services/task-service.ts` | APP — KEEP |
| `src/services/timed-sources.ts` | APP — KEEP |
| `src/services/tracking-service.ts` | APP — KEEP |
| `src/ui/Badge.tsx` | APP — KEEP |
| `src/ui/Button.tsx` | APP — KEEP |
| `src/ui/Checkbox.tsx` | APP — KEEP |
| `src/ui/Chip.tsx` | APP — KEEP |
| `src/ui/cn.ts` | APP — KEEP |
| `src/ui/Dialog.tsx` | APP — KEEP |
| `src/ui/Drawer.tsx` | APP — KEEP |
| `src/ui/EmptyState.tsx` | APP — KEEP |
| `src/ui/feature-theme.module.css` | APP — KEEP |
| `src/ui/FeatureTheme.tsx` | APP — KEEP |
| `src/ui/IconButton.tsx` | APP — KEEP |
| `src/ui/Popover.tsx` | APP — KEEP |
| `src/ui/SegmentedControl.tsx` | APP — KEEP |
| `src/ui/Skeleton.tsx` | APP — KEEP |
| `src/ui/StarIcon.tsx` | APP — KEEP |
| `src/ui/Toast.tsx` | APP — KEEP |
| `src/ui/UniverseMenu.tsx` | APP — KEEP |
| `src/ui/use-focus-trap.ts` | APP — KEEP |
| `src/ui/use-item-anchor.ts` | APP — KEEP |
| `src/ui/WorkspaceShell.tsx` | APP — KEEP |

### tests

| File | Policy / action |
| --- | --- |
| `tests/client/api-client.test.ts` | TEST — KEEP |
| `tests/client/queries/task-queries.test.tsx` | TEST — KEEP |
| `tests/design/craft-and-architecture-guardrails.test.ts` | TEST — KEEP |
| `tests/design/feature-palette-contrast.test.ts` | TEST — KEEP |
| `tests/design/tokens-guardrail.test.ts` | TEST — KEEP |
| `tests/domain/activity-days.test.ts` | TEST — KEEP |
| `tests/domain/event-calendar.test.ts` | TEST — KEEP |
| `tests/domain/task-domain.test.ts` | TEST — KEEP |
| `tests/domain/time.test.ts` | TEST — KEEP |
| `tests/features/blogs/writing-drafts.test.tsx` | TEST — KEEP |
| `tests/features/entertainment/media-tabs.test.tsx` | TEST — KEEP |
| `tests/features/events/event-editing.test.tsx` | TEST — KEEP |
| `tests/features/events/event-editor.test.ts` | TEST — KEEP |
| `tests/features/flashcards/study-interactions.test.tsx` | TEST — KEEP |
| `tests/features/home/feature-collection.test.tsx` | TEST — KEEP |
| `tests/features/home/home-journey.test.ts` | TEST — KEEP |
| `tests/features/home/starfield-and-home.test.tsx` | TEST — KEEP |
| `tests/features/learning-room/session-accounting.test.tsx` | TEST — KEEP |
| `tests/features/notifications/notification-popover.test.tsx` | TEST — KEEP |
| `tests/features/registry.test.ts` | TEST — KEEP |
| `tests/features/tasks/daily-dashboard-time.test.ts` | TEST — KEEP |
| `tests/features/tasks/day-carousel.test.tsx` | TEST — KEEP |
| `tests/features/tasks/day-task-list.test.tsx` | TEST — KEEP |
| `tests/features/tasks/deadline-identity.test.tsx` | TEST — KEEP |
| `tests/features/tasks/form-draft-session.test.tsx` | TEST — KEEP |
| `tests/features/tasks/hub-list.test.tsx` | TEST — KEEP |
| `tests/features/tasks/month-view.test.tsx` | TEST — KEEP |
| `tests/features/tasks/reduced-motion.test.tsx` | TEST — KEEP |
| `tests/features/tasks/task-components.test.tsx` | TEST — KEEP |
| `tests/features/tasks/task-menu-portal.test.tsx` | TEST — KEEP |
| `tests/features/tasks/week-view.test.tsx` | TEST — KEEP |
| `tests/features/transitions/cosmic-launch.test.tsx` | TEST — KEEP |
| `tests/server/api-response.test.ts` | TEST — KEEP |
| `tests/server/config.test.ts` | TEST — KEEP |
| `tests/server/delete-origin-guards.test.ts` | TEST — KEEP |
| `tests/server/engineering-routes.test.ts` | TEST — KEEP |
| `tests/server/engineering-validation.test.ts` | TEST — KEEP |
| `tests/services/apcs-boundary.test.ts` | TEST — KEEP |
| `tests/services/json-store.test.ts` | TEST — KEEP |
| `tests/services/notification-service.test.ts` | TEST — KEEP |
| `tests/services/storage/drive-storage-adapter.test.ts` | TEST — KEEP |
| `tests/services/storage/local-storage-adapter.test.ts` | TEST — KEEP |
| `tests/services/storage/storage-adapter.contract.ts` | TEST — KEEP |
| `tests/services/task-service.test.ts` | TEST — KEEP |
| `tests/ui/feature-theme.test.tsx` | TEST — KEEP |
| `tests/ui/toast.test.tsx` | TEST — KEEP |

### tmp

| File | Policy / action |
| --- | --- |
| `tmp/codebase-detox-audit/documentation-before.json` | TEMP — DELETE CANDIDATE |
| `tmp/codebase-detox-audit/index-before.txt` | TEMP — DELETE CANDIDATE |

## 12. Audit verification

- Inventory: **1293 files**: **128 Markdown** and **1165 other files**, **338 included folders**, plus four excluded-root policies.
- Every included Markdown was read as text; exact duplicates compared with full SHA-256. Source observations are focused checks, not exhaustive runtime/security certification.
- Other inventoried first-party Markdown, source, tests, migrations, scripts and root configuration were hashed before/after this report write. Protected personal files were preserved. Runtime data was not frozen or mutated; external processes may independently update it.
- Previous dynamic report SHA-256 before replacement: `685880ec86f5c72cbdeccf404301e4596af00b569223e86bf73b213069e553b2`. This records provenance, not an archived-backup claim.
- Verdict: **recover and reconcile first; retain application/data/evidence; approve specific merges and cleanup separately**. No unconditional source/data/evidence deletion is justified.
