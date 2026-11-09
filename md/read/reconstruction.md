# Documentation Reconstruction, Migration & Conflict Disposition Report

`md/read/reconstruction.md` is the permanent audit trail for the **7 November 2026 Documentation Reconstruction**. It records the complete inventory of all 23 pre-existing Markdown files and all newly created canonical files, SHA-256 preservation verification, section-by-section migration maps for all rewritten and retired documents, the final disposition of all 29 conflict items (`C1`–`C6`, `O1`–`O10`, `I1`–`I5`, `A1`–`A7`) plus additional confirmed decisions, and the Open Decisions Register summary (`OD-01`–`OD-05`).

---

## 1. Complete File Inventory & SHA-256 Ledger

### 1.1 Pre-Existing Markdown Files (23 Files)

Every rewritten or retired file was copied byte-for-byte into [`../archive/pre-reorganization/`](../archive/pre-reorganization/) before any edit or removal took place. Every preserved read-only file remained untouched in place with zero byte modifications.

| # | Original Path | Action Taken | Archive Path (`md/archive/pre-reorganization/...`) | Original Size (Bytes) | Original & Verified SHA-256 |
| :---: | :--- | :--- | :--- | ---: | :--- |
| 1 | `AGENTS.md` | **Archived & Rewritten** | [`../archive/pre-reorganization/AGENTS.original.md`](../archive/pre-reorganization/AGENTS.original.md) | `3,170` | `e4391183c0f90ed6c68f9a9f59a7a58aff37b18ebab2851ff981d316d4b05080` |
| 2 | `README.md` | **Archived & Rewritten** | [`../archive/pre-reorganization/README.original.md`](../archive/pre-reorganization/README.original.md) | `5,545` | `e53e64e04b663693d2b1b9d6c08b9ca7cceef2a14932ebfd74f41ea5ea530307` |
| 3 | `PROJECT_DESCRIPTION.md` | **Archived & Rewritten** | [`../archive/pre-reorganization/PROJECT_DESCRIPTION.md`](../archive/pre-reorganization/PROJECT_DESCRIPTION.md) | `152,320` | `7bfcf053bc5d637d7421236a48e5f43951894b9e0762a23e157f09923fe02846` |
| 4 | `md/task.md` | **Archived & Reset to Template** | [`../archive/pre-reorganization/md/task.md`](../archive/pre-reorganization/md/task.md) | `24,134` | `4154d7ac24504b78f3788b355a205e968bd8bc0575aaebb3530401954566c523` |
| 5 | `md/agents/ui_ux.md` | **Archived & Retired** | [`../archive/pre-reorganization/md/agents/ui_ux.md`](../archive/pre-reorganization/md/agents/ui_ux.md) | `66,521` | `301d2c222e5d679d2babfd5759f8b38a671ea95fe1b98d5d90f6cde6944b636a` |
| 6 | `md/agents/DESIGN_SPEC.md` | **Archived & Retired** | [`../archive/pre-reorganization/md/agents/DESIGN_SPEC.md`](../archive/pre-reorganization/md/agents/DESIGN_SPEC.md) | `13,753` | `2e2bb79bbcb44366698107dc1593b138dc210bf7c4f8a668a962c68dabac2c40` |
| 7 | `md/agents/ASSET_GUIDE.md` | **Archived & Retired** | [`../archive/pre-reorganization/md/agents/ASSET_GUIDE.md`](../archive/pre-reorganization/md/agents/ASSET_GUIDE.md) | `4,313` | `2a219ec6ca14532617e7bfdbedce276996b9a5fa4e1566a4f77a4fe0ee72fe56` |
| 8 | `md/agents/context.md` | **Archived & Retired** | [`../archive/pre-reorganization/md/agents/context.md`](../archive/pre-reorganization/md/agents/context.md) | `10,443` | `5a610bac0f5b3f8554a1cb6fbaea87719b4d97c0bc6d82aa441d033ca71ca81d` |
| 9 | `md/agents/agent_readme.md` | **Archived & Retired** | [`../archive/pre-reorganization/md/agents/agent_readme.md`](../archive/pre-reorganization/md/agents/agent_readme.md) | `39,042` | `e0ae56a9f8cd64fd4ffaa34f973ecca7f191c6e598683fcc87b758d08c8a40b1` |
| 10 | `md/read/conflicts.md` | **Archived & Retired** | [`../archive/pre-reorganization/md/read/conflicts.md`](../archive/pre-reorganization/md/read/conflicts.md) | `22,314` | `2a44a2a67d95ee84ff66a5af6a8e992a9d7105fd20b7f8d774368275014b2025` |
| 11 | `sources/img/daily-v2-reference/README.md` | **Archived & Rewritten** | [`../archive/pre-reorganization/sources/img/daily-v2-reference/README.md`](../archive/pre-reorganization/sources/img/daily-v2-reference/README.md) | `1,443` | `9f5858d0e55e7ea10814a372d741e83da60bae5bea385f0aa578ef54c6b3157e` |
| 12 | `sources/img/daily-v2-reference/DESIGN_SPEC.md` | **Archived & Retired** | [`../archive/pre-reorganization/sources/img/daily-v2-reference/DESIGN_SPEC.md`](../archive/pre-reorganization/sources/img/daily-v2-reference/DESIGN_SPEC.md) | `13,753` | `2e2bb79bbcb44366698107dc1593b138dc210bf7c4f8a668a962c68dabac2c40` |
| 13 | `sources/img/daily-v2-reference/ASSET_GUIDE.md` | **Archived & Retired** | [`../archive/pre-reorganization/sources/img/daily-v2-reference/ASSET_GUIDE.md`](../archive/pre-reorganization/sources/img/daily-v2-reference/ASSET_GUIDE.md) | `4,313` | `2a219ec6ca14532617e7bfdbedce276996b9a5fa4e1566a4f77a4fe0ee72fe56` |
| 14 | `sources/img/daily-v2-reference/AGENT_PROMPT.md` | **Archived & Retired** | [`../archive/pre-reorganization/sources/img/daily-v2-reference/AGENT_PROMPT.md`](../archive/pre-reorganization/sources/img/daily-v2-reference/AGENT_PROMPT.md) | `9,640` | `d959447b386adcb79dc06b647456ba82eb8cf3769e27ef67b80e57680f23bdd8` |
| 15 | [`md/user/user_desc.md`](../user/user_desc.md) | **Preserved Read-Only** | *(In place — untouched)* | `13,291` | `b0f368e019cbc977a36b6cb38569576250c6faeefd6ebb1ceaa4454e826c38fe` |
| 16 | [`md/user/user_notes.md`](../user/user_notes.md) | **Preserved Read-Only** | *(In place — untouched)* | `878` | `6803bd1ae2e9031c902785334a1087fa7e92e5c9a1eec9f0fcd9ab417d0b82c4` |
| 17 | [`docs/audit/ARCHITECTURE_AUDIT.md`](../../docs/audit/ARCHITECTURE_AUDIT.md) | **Preserved Read-Only** | *(In place — untouched)* | `19,262` | `1067c21b42b39043e76befaaec655a64cd7eeb475972bfe3b85dec681728d678` |
| 18 | [`docs/audit/BUG_INVENTORY.md`](../../docs/audit/BUG_INVENTORY.md) | **Preserved Read-Only** | *(In place — untouched)* | `27,233` | `d133bbaa2bc3cd022f4d829686f1c260f3ca8ddb2d0bdd97b13132d1d9f936e5` |
| 19 | [`docs/audit/STABILIZATION_PLAN.md`](../../docs/audit/STABILIZATION_PLAN.md) | **Preserved Read-Only** | *(In place — untouched)* | `15,612` | `b6239ad882fd51114886cd13426a74cfe2372af0d82325d99e19ed430f847328` |
| 20 | [`docs/audit/TECHNICAL_DEBT.md`](../../docs/audit/TECHNICAL_DEBT.md) | **Preserved Read-Only** | *(In place — untouched)* | `15,434` | `f03afc6069816d9a76adca9ab980fd41e7efb559b2faec01dccfb4c50e057341` |
| 21 | [`public/earth/ATTRIBUTION.md`](../../public/earth/ATTRIBUTION.md) | **Preserved Read-Only** | *(In place — untouched)* | `2,171` | `74bcb00d3569f52fcf6bdbf9837f1470ff577a2a3f1ebd6266dec2b86b0de262` |
| 22 | [`review/phase01/MOTION.md`](../../review/phase01/MOTION.md) | **Preserved Read-Only** | *(In place — untouched)* | `1,556` | `77ff24409d254deea36767ef665f69fd4bbebe1bfaf7391cc87c97019e72def3` |
| 23 | [`review/phase01/README.md`](../../review/phase01/README.md) | **Preserved Read-Only** | *(In place — untouched)* | `6,183` | `8e1a8c90c8b7b0611507a90a428ea69b7d314442e1be7af14e7d3aa7b1c71207` |

### 1.2 Newly Created & Rewritten Canonical Files (13 Active Files)

| Canonical Path | Status | Primary Responsibility |
| :--- | :--- | :--- |
| [`../../AGENTS.md`](../../AGENTS.md) | **Rewritten** | Concise agent operating rules, documentation authority order, epic selection table, and task workflow. |
| [`../../README.md`](../../README.md) | **Rewritten** | Human-facing quickstart, technology stack, command reference, and documentation map. |
| [`../../PROJECT_DESCRIPTION.md`](../../PROJECT_DESCRIPTION.md) | **Rewritten** | System-wide engineering reference: purpose, terminology, layered architecture, shared data/domain rules, 13-feature route catalog, change map, audit baseline, and Open Decisions Register (`OD-01`–`OD-05`). |
| [`../readme.md`](../readme.md) | **Created** | Master index and navigation guide for the `md/` documentation system. |
| [`../agents/shared/uiux.md`](../agents/shared/uiux.md) | **Created** | Project-wide UI/UX baseline: tokens, typography, motion, icons, guardrails, responsive, accessibility, `src/ui/` components, Cosmic Launch, `WorkspaceShell`, and scoped exceptions. |
| [`../agents/homepage/readme.md`](../agents/homepage/readme.md) | **Created** | Canonical specification for the Homepage / Landing Journey epic (`/`). |
| [`../agents/homepage/reports.md`](../agents/homepage/reports.md) | **Created** | Dated implementation, review, and audit log for the Homepage epic. |
| [`../agents/tasks/readme.md`](../agents/tasks/readme.md) | **Created** | Canonical specification for the Tasks epic (`/tasks/daily`, `/tasks/hub`, and Notification Center). |
| [`../agents/tasks/reports.md`](../agents/tasks/reports.md) | **Created** | Dated implementation, V2 upgrade, and audit log for the Tasks epic. |
| [`../../sources/img/daily-v2-reference/README.md`](../../sources/img/daily-v2-reference/README.md) | **Rewritten** | Concise index of local V2 mockups and the 11 SVG assets mapped to `public/visuals/daily-v2/`. |
| [`../archive/pre-reorganization/README.md`](../archive/pre-reorganization/README.md) | **Created** | Archive manifest and SHA-256 verification ledger for all 14 archived files. |
| [`reconstruction.md`](reconstruction.md) | **Created** | This comprehensive migration, conflict disposition, and verification report. |
| [`../task.md`](../task.md) | **Rewritten (Final Step)** | Reset to an inactive task template after archiving the original assignment brief. |

---

## 2. Section-by-Section Coverage Maps

Every top-level section of every rewritten or retired document is mapped below to its canonical destination or formal disposition (**Migrated**, **Preserved as historical evidence**, **Superseded by confirmed decision**, or **Represented by an open decision**).

### 2.1 Original `PROJECT_DESCRIPTION.md` (152,320 bytes — Archived at `md/archive/pre-reorganization/PROJECT_DESCRIPTION.md`)

| Original Section | Disposition | Canonical Destination / Notes |
| :--- | :--- | :--- |
| **Level 1 — Quick Navigation & Orientation (`§0`)** | **Migrated** | [`../../AGENTS.md`](../../AGENTS.md), [`../readme.md`](../readme.md), and [`../../PROJECT_DESCRIPTION.md#6-implementation--change-impact-map`](../../PROJECT_DESCRIPTION.md#6-implementation--change-impact-map) |
| **§1. Executive Overview & Product Vision** | **Migrated** | [`../../PROJECT_DESCRIPTION.md#1-purpose--scope`](../../PROJECT_DESCRIPTION.md#1-purpose--scope) |
| **§2. Architectural Philosophy & Layer Boundaries** | **Migrated** | [`../../PROJECT_DESCRIPTION.md#3-system-architecture--layer-boundaries`](../../PROJECT_DESCRIPTION.md#3-system-architecture--layer-boundaries) |
| **§3. Complete Directory & File Inventory** | **Migrated** | [`../../PROJECT_DESCRIPTION.md#6-implementation--change-impact-map`](../../PROJECT_DESCRIPTION.md#6-implementation--change-impact-map), [`../agents/homepage/readme.md#4-current-implementation-and-relevant-code-locations`](../agents/homepage/readme.md#4-current-implementation-and-relevant-code-locations), [`../agents/tasks/readme.md#4-current-implementation-and-relevant-code-locations`](../agents/tasks/readme.md#4-current-implementation-and-relevant-code-locations) |
| **§4. Data Model, SQLite Schema & Persistence** | **Migrated** | [`../../PROJECT_DESCRIPTION.md#4-shared-data-concepts--domain-rules`](../../PROJECT_DESCRIPTION.md#4-shared-data-concepts--domain-rules) |
| **§5. Domain Rules & Pure Business Logic** | **Migrated** | [`../../PROJECT_DESCRIPTION.md#4-shared-data-concepts--domain-rules`](../../PROJECT_DESCRIPTION.md#4-shared-data-concepts--domain-rules) and [`../agents/tasks/readme.md#1-purpose-scope-and-relationships`](../agents/tasks/readme.md#1-purpose-scope-and-relationships) |
| **§6. Service Layer & Storage Adapters** | **Migrated** | [`../../PROJECT_DESCRIPTION.md#3-system-architecture--layer-boundaries`](../../PROJECT_DESCRIPTION.md#3-system-architecture--layer-boundaries) and [`../../PROJECT_DESCRIPTION.md#4-shared-data-concepts--domain-rules`](../../PROJECT_DESCRIPTION.md#4-shared-data-concepts--domain-rules) |
| **§7. JSON API Contracts & Route Handlers** | **Migrated** | [`../../PROJECT_DESCRIPTION.md#5-route--feature-catalog`](../../PROJECT_DESCRIPTION.md#5-route--feature-catalog) (`§5.2 JSON API Endpoints`) |
| **§8. Client Layer, TanStack Query & Local Preferences** | **Migrated** | [`../../PROJECT_DESCRIPTION.md#6-implementation--change-impact-map`](../../PROJECT_DESCRIPTION.md#6-implementation--change-impact-map) and [`../agents/tasks/readme.md#4-current-implementation-and-relevant-code-locations`](../agents/tasks/readme.md#4-current-implementation-and-relevant-code-locations) |
| **§9. Design System, Tokens, Typography & Motion** | **Migrated** | [`../agents/shared/uiux.md`](../agents/shared/uiux.md) (`§§1–8`) |
| **§10. Shared UI Component Library (`src/ui/`)** | **Migrated** | [`../agents/shared/uiux.md#9-shared-ui-components-srcui`](../agents/shared/uiux.md#9-shared-ui-components-srcui) |
| **§11. Cosmic Launch Route Transition & Workspace Shell** | **Migrated** | [`../agents/shared/uiux.md#10-cosmic-launch-route-transition-srcfeaturestransitions`](../agents/shared/uiux.md#10-cosmic-launch-route-transition-srcfeaturestransitions) and [`§11`](../agents/shared/uiux.md#11-workspace-shell-universe-menu--blank-pages) |
| **§12. Homepage / Cosmos Journey (`src/features/home/`)** | **Migrated** | [`../agents/homepage/readme.md`](../agents/homepage/readme.md) (`§§1–5`) |
| **§13. Tasks & Notifications Features (`src/features/tasks/`, `notifications/`)** | **Migrated** | [`../agents/tasks/readme.md`](../agents/tasks/readme.md) (`§§1–5`) |
| **§14. Testing Architecture & Guardrails** | **Migrated** | [`../../PROJECT_DESCRIPTION.md#7-verification--audit-baseline`](../../PROJECT_DESCRIPTION.md#7-verification--audit-baseline) and [`../agents/shared/uiux.md#6-craft-rules--automated-guardrails`](../agents/shared/uiux.md#6-craft-rules--automated-guardrails) |
| **§15. Build, Runtime, Environment & Operations** | **Migrated** | [`../../README.md`](../../README.md) and [`../../PROJECT_DESCRIPTION.md#3-system-architecture--layer-boundaries`](../../PROJECT_DESCRIPTION.md#3-system-architecture--layer-boundaries) |
| **§16. Historical Implementation Log & Verification Snapshots** | **Preserved as historical evidence & Migrated** | [`../agents/homepage/reports.md`](../agents/homepage/reports.md), [`../agents/tasks/reports.md`](../agents/tasks/reports.md), and [`../../PROJECT_DESCRIPTION.md#7-verification--audit-baseline`](../../PROJECT_DESCRIPTION.md#7-verification--audit-baseline) |

### 2.2 Original `md/agents/ui_ux.md` (66,521 bytes — Archived at `md/archive/pre-reorganization/md/agents/ui_ux.md`)

| Original Section | Disposition | Canonical Destination / Notes |
| :--- | :--- | :--- |
| **§0. Quick Lookup & Navigation** | **Migrated** | [`../readme.md`](../readme.md) and [`../agents/shared/uiux.md`](../agents/shared/uiux.md) intro |
| **§1. Brand & Visual Identity** | **Migrated** | [`../agents/shared/uiux.md#1-identity-themes--precedence`](../agents/shared/uiux.md#1-identity-themes--precedence) |
| **§2. Color System & Design Tokens** | **Migrated** | [`../agents/shared/uiux.md#2-design-tokens-srcdesigntokenscss`](../agents/shared/uiux.md#2-design-tokens-srcdesigntokenscss) |
| **§3. Typography System** | **Migrated & Updated (`C2`, `O4`, `O6`)** | [`../agents/shared/uiux.md#3-typography`](../agents/shared/uiux.md#3-typography) (Sentence-case rule, `/brand/wordmark.svg` sole all-caps exception, retired `Forum` font removed) |
| **§4. Spacing, Grid & Layout Rhythm** | **Migrated** | [`../agents/shared/uiux.md#2-design-tokens-srcdesigntokenscss`](../agents/shared/uiux.md#2-design-tokens-srcdesigntokenscss) (`§2.2`) & [`§7`](../agents/shared/uiux.md#7-responsive-system) |
| **§5. Elevation, Borders & Glass Surfaces** | **Migrated** | [`../agents/shared/uiux.md#2-design-tokens-srcdesigntokenscss`](../agents/shared/uiux.md#2-design-tokens-srcdesigntokenscss) & [`§12`](../agents/shared/uiux.md#12-scoped-visual-exceptions) |
| **§6. Motion & Choreography System** | **Migrated & Updated (`A4`, `O1`)** | [`../agents/shared/uiux.md#4-motion-system-srcdesignmotionts`](../agents/shared/uiux.md#4-motion-system-srcdesignmotionts) |
| **§7. Iconography, Illustrations & Media** | **Migrated & Updated (`I1`, `O8`)** | [`../agents/shared/uiux.md#5-imagery-icons--local-reference-media`](../agents/shared/uiux.md#5-imagery-icons--local-reference-media) |
| **§8. Anti-Slop Craft Rules & Guardrails** | **Migrated** | [`../agents/shared/uiux.md#6-craft-rules--automated-guardrails`](../agents/shared/uiux.md#6-craft-rules--automated-guardrails) |
| **§9. Responsive Design System** | **Migrated** | [`../agents/shared/uiux.md#7-responsive-system`](../agents/shared/uiux.md#7-responsive-system) |
| **§10. Accessibility & Keyboard Contract** | **Migrated** | [`../agents/shared/uiux.md#8-accessibility-baseline`](../agents/shared/uiux.md#8-accessibility-baseline) |
| **§11. Shared UI Primitives (`src/ui/`)** | **Migrated** | [`../agents/shared/uiux.md#9-shared-ui-components-srcui`](../agents/shared/uiux.md#9-shared-ui-components-srcui) |
| **§12. Form Controls & Validation Patterns** | **Migrated** | [`../agents/shared/uiux.md#9-shared-ui-components-srcui`](../agents/shared/uiux.md#9-shared-ui-components-srcui) |
| **§13. Overlays: Dialog, Drawer, Popover, Toast** | **Migrated** | [`../agents/shared/uiux.md#8-accessibility-baseline`](../agents/shared/uiux.md#8-accessibility-baseline) & [`§9`](../agents/shared/uiux.md#9-shared-ui-components-srcui) |
| **§14. Homepage (`/`): 3D Earth Journey & Feature Collection** | **Migrated & Updated (`A5`, `O1`)** | [`../agents/homepage/readme.md`](../agents/homepage/readme.md) (`§§2–3`; retired opening Explore CTA morph and retired Pause button documented) |
| **§15. Cosmic Launch Route Transition & Workspace Shell** | **Migrated** | [`../agents/shared/uiux.md#10-cosmic-launch-route-transition-srcfeaturestransitions`](../agents/shared/uiux.md#10-cosmic-launch-route-transition-srcfeaturestransitions) & [`§11`](../agents/shared/uiux.md#11-workspace-shell-universe-menu--blank-pages) |
| **§16. Tasks Epic UI (`DailyBoard`, `HubList`, `NotificationPopover`)** | **Migrated & Updated (`C1`–`C6`, `O2`, `O3`, `O5`, `O7`, `O9`)** | [`../agents/tasks/readme.md`](../agents/tasks/readme.md) (`§§2–4`) |
| **§17. Future Placeholder Routes (`BlankPage`)** | **Migrated** | [`../agents/shared/uiux.md#11-workspace-shell-universe-menu--blank-pages`](../agents/shared/uiux.md#11-workspace-shell-universe-menu--blank-pages) and [`../../PROJECT_DESCRIPTION.md#5-route--feature-catalog`](../../PROJECT_DESCRIPTION.md#5-route--feature-catalog) |

### 2.3 Original `md/agents/DESIGN_SPEC.md` & `sources/img/daily-v2-reference/DESIGN_SPEC.md` (13,753 bytes — Identical files archived under `md/archive/pre-reorganization/`)

| Original Section | Disposition | Canonical Destination / Notes |
| :--- | :--- | :--- |
| **§0. Overview & Aesthetic Direction ("Celestial Luxury")** | **Migrated (`C1`, `C6`)** | [`../agents/tasks/readme.md#3-epic-specific-uiux`](../agents/tasks/readme.md#3-epic-specific-uiux) and [`../agents/shared/uiux.md#12-scoped-visual-exceptions`](../agents/shared/uiux.md#12-scoped-visual-exceptions) |
| **§1. Color Palette & CSS Custom Properties** | **Migrated** | [`../agents/shared/uiux.md#2-design-tokens-srcdesigntokenscss`](../agents/shared/uiux.md#2-design-tokens-srcdesigntokenscss) (`--daily-*` tokens) |
| **§2. Typography & Hierarchy** | **Migrated & Superseded in part (`C2`, `O6`, `OD-04`)** | [`../agents/shared/uiux.md#3-typography`](../agents/shared/uiux.md#3-typography) (`Forum` font superseded by `Cormorant Garamond`; uppercase eyebrow spec superseded by sentence-case rule + [`OD-04`](../../PROJECT_DESCRIPTION.md#od-04)) |
| **§3. Background Sky, Stars & Astrolabe (`DailySky`)** | **Migrated** | [`../agents/tasks/readme.md#3-epic-specific-uiux`](../agents/tasks/readme.md#3-epic-specific-uiux) |
| **§4. Top Navigation Bar (`WorkspaceShell` Daily mode)** | **Migrated** | [`../agents/shared/uiux.md#11-workspace-shell-universe-menu--blank-pages`](../agents/shared/uiux.md#11-workspace-shell-universe-menu--blank-pages) |
| **§5. Observatory / Daily Dashboard (`Cosmic forecast`, `Progress`, `Day arc`)** | **Migrated (`A2`, `OD-02`, `OD-03`)** | [`../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows`](../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows) (`§2.1.B`) |
| **§6. Day Columns vs. Active-Board Carousel** | **Superseded by Confirmed Decision (`C3`)** | [`../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows`](../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows) (`§2.1.C`: Active-board carousel is canonical) |
| **§7. Task Card Redesign (`daily-task-card.module.css`)** | **Migrated (`C6`)** | [`../agents/tasks/readme.md#3-epic-specific-uiux`](../agents/tasks/readme.md#3-epic-specific-uiux) (Scoped strictly to Daily `carousel`/`overdue` contexts) |
| **§8. Custom Scrollbar & 3.5-Card Viewport** | **Migrated (`C4`)** | [`../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows`](../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows) (`§2.1.C.3`: DOM-measured `ResizeObserver` 3.5-card viewport) |
| **§9. Empty States (`DayEmpty`)** | **Migrated (`O5`)** | [`../agents/tasks/readme.md#3-epic-specific-uiux`](../agents/tasks/readme.md#3-epic-specific-uiux) |
| **§10. Overdue Section ("Broken Orbit / Eclipse")** | **Migrated (`C5`)** | [`../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows`](../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows) (`§2.1.F`: Modal `TransferDialog`) |
| **§11. Animations & Micro-Interactions** | **Migrated** | [`../agents/shared/uiux.md#4-motion-system-srcdesignmotionts`](../agents/shared/uiux.md#4-motion-system-srcdesignmotionts) and [`../agents/tasks/readme.md#3-epic-specific-uiux`](../agents/tasks/readme.md#3-epic-specific-uiux) |

### 2.4 Original `md/agents/ASSET_GUIDE.md` & `sources/img/daily-v2-reference/ASSET_GUIDE.md` (4,313 bytes — Identical files archived)

| Original Section | Disposition | Canonical Destination / Notes |
| :--- | :--- | :--- |
| **11 SVG Asset Inventory & Placement Rules** | **Migrated** | [`../agents/tasks/readme.md#3-epic-specific-uiux`](../agents/tasks/readme.md#3-epic-specific-uiux) (`§3.2 Celestial V2 SVG Asset Placement Guide`) and [`../../sources/img/daily-v2-reference/README.md`](../../sources/img/daily-v2-reference/README.md) |

### 2.5 Original `sources/img/daily-v2-reference/AGENT_PROMPT.md` (9,640 bytes — Archived)

| Original Section | Disposition | Canonical Destination / Notes |
| :--- | :--- | :--- |
| **§§1–7. One-off V2 Implementation Prompt & Checklist** | **Preserved as historical evidence & Migrated** | Completed V2 implementation is documented in [`../agents/tasks/readme.md`](../agents/tasks/readme.md) and [`../agents/tasks/reports.md`](../agents/tasks/reports.md); original prompt archived at [`../archive/pre-reorganization/sources/img/daily-v2-reference/AGENT_PROMPT.md`](../archive/pre-reorganization/sources/img/daily-v2-reference/AGENT_PROMPT.md). |

### 2.6 Original `md/agents/agent_readme.md` (39,042 bytes) & `md/agents/context.md` (10,443 bytes) — Archived

| Original Content Area | Disposition | Canonical Destination / Notes |
| :--- | :--- | :--- |
| **Agent Onboarding, Hard Constraints & Architecture Rules (`agent_readme.md` §§0–2)** | **Migrated & Updated (`I2`, `A6`)** | [`../../AGENTS.md`](../../AGENTS.md) and [`../../PROJECT_DESCRIPTION.md#3-system-architecture--layer-boundaries`](../../PROJECT_DESCRIPTION.md#3-system-architecture--layer-boundaries) |
| **Phase 01–Phase 3 Delivery Log & Historical Context (`agent_readme.md` §3, `context.md` §§1–8)** | **Preserved as historical evidence & Migrated** | [`../agents/homepage/reports.md`](../agents/homepage/reports.md) and [`../agents/tasks/reports.md`](../agents/tasks/reports.md) |
| **Daily Carousel & V2 Task Hand-off Notes (`agent_readme.md` §4, `context.md` §§9–11)** | **Migrated** | [`../agents/tasks/readme.md`](../agents/tasks/readme.md) and [`../agents/tasks/reports.md`](../agents/tasks/reports.md) |

### 2.7 Preserved User & Audit Files (`md/user/*`, `docs/audit/*`, `review/phase01/*`, `public/earth/ATTRIBUTION.md`)

| File | Disposition | How Represented in Canonical Docs |
| :--- | :--- | :--- |
| [`md/user/user_desc.md`](../user/user_desc.md) | **Preserved Read-Only** | Planned 13-feature vision cataloged in [`../../PROJECT_DESCRIPTION.md#5-route--feature-catalog`](../../PROJECT_DESCRIPTION.md#5-route--feature-catalog); unbuilt analytics & forecast questions captured in [`OD-01`](../../PROJECT_DESCRIPTION.md#od-01) and [`OD-02`](../../PROJECT_DESCRIPTION.md#od-02). |
| [`md/user/user_notes.md`](../user/user_notes.md) | **Preserved Read-Only** | Owner visual and workflow notes integrated into [`../agents/homepage/readme.md`](../agents/homepage/readme.md) and [`../agents/tasks/readme.md`](../agents/tasks/readme.md). |
| [`docs/audit/*.md`](../../docs/audit/) | **Preserved Read-Only** | Indexed in [`../../PROJECT_DESCRIPTION.md#7-verification--audit-baseline`](../../PROJECT_DESCRIPTION.md#7-verification--audit-baseline), [`../agents/homepage/reports.md`](../agents/homepage/reports.md), [`../agents/tasks/reports.md`](../agents/tasks/reports.md), and [`OD-05`](../../PROJECT_DESCRIPTION.md#od-05). |
| [`review/phase01/*.md`](../../review/phase01/) & [`public/earth/ATTRIBUTION.md`](../../public/earth/ATTRIBUTION.md) | **Preserved Read-Only** | Linked from [`../agents/homepage/readme.md#6-open-decisions-and-supporting-references`](../agents/homepage/readme.md#6-open-decisions-and-supporting-references) and [`../agents/homepage/reports.md`](../agents/homepage/reports.md). |

---

## 3. Complete Disposition of All 29 Conflict-Report Items (`md/read/conflicts.md`)

Every item from the retired [`../archive/pre-reorganization/md/read/conflicts.md`](../archive/pre-reorganization/md/read/conflicts.md) (`C1`–`C6`, `O1`–`O10`, `I1`–`I5`, `A1`–`A7`) plus the additional confirmed product/workflow decisions is resolved below:

### 3.1 Direct Contradictions (`C1`–`C6`)

| ID | Topic | Confirmed Resolution | Canonical Documentation Location |
| :---: | :--- | :--- | :--- |
| **`C1`** | Daily Task Management theme: Light Lavender vs. Celestial Luxury V2 Dark | **Celestial Luxury V2 dark observatory theme** (`--daily-*` tokens) is the canonical visual direction for `/tasks/daily`, documented as a formal scoped exception to the light-lavender Workspace default. | [`../agents/shared/uiux.md#12-scoped-visual-exceptions`](../agents/shared/uiux.md#12-scoped-visual-exceptions), [`../agents/tasks/readme.md#3-epic-specific-uiux`](../agents/tasks/readme.md#3-epic-specific-uiux) |
| **`C2`** | Casing rule: All-caps eyebrow labels vs. strict sentence case | **Sentence case** is mandatory (`Cosmic forecast`, `Progress`, `Day arc`, `Explore my space`). All-caps is reserved strictly for the homepage `HIEP TRONG` wordmark (`/brand/wordmark.svg`). Current CSS `font-variant-caps: all-small-caps` on `.eyebrow` is tracked in [`OD-04`](../../PROJECT_DESCRIPTION.md#od-04). | [`../agents/shared/uiux.md#3-typography`](../agents/shared/uiux.md#3-typography), [`../../PROJECT_DESCRIPTION.md#od-04`](../../PROJECT_DESCRIPTION.md#od-04) |
| **`C3`** | Daily Day view layout: Flat 3-column grid vs. Active-board carousel | **Active-board carousel** (`DayCarousel.tsx`) with `Today` centered and `Yesterday`/`Tomorrow` as scaled, dimmed preview boards is canonical. | [`../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows`](../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows) (`§2.1.C`) |
| **`C4`** | Day board task list height: Fixed `420px`/`380px` vs. Measured 3.5-card viewport | **DOM-measured 3.5-card viewport** (`ResizeObserver` in `DayTaskList.tsx` when `count > 3`) with custom constellation scrollbar is canonical. | [`../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows`](../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows) (`§2.1.C.3`) |
| **`C5`** | Overdue Transfer interaction: Inline popover vs. Modal dialog | **Modal `TransferDialog`** (`Dialog` component) is the canonical interaction pattern. | [`../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows`](../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows) (`§2.1.F`) |
| **`C6`** | Task card styling scope: Shared across Daily and Hub vs. Scoped to Daily | **Scoped to Daily (`carousel` and `overdue` contexts):** `daily-task-card.module.css` and celestial SVG watermarks apply only on `/tasks/daily`. `/tasks/hub` (`context="hub"`) uses the light-lavender Workspace card style. | [`../agents/shared/uiux.md#12-scoped-visual-exceptions`](../agents/shared/uiux.md#12-scoped-visual-exceptions), [`../agents/tasks/readme.md#3-epic-specific-uiux`](../agents/tasks/readme.md#3-epic-specific-uiux) |

### 3.2 Outdated Claims vs. Current Code (`O1`–`O10`)

| ID | Topic | Confirmed Resolution | Canonical Documentation Location |
| :---: | :--- | :--- | :--- |
| **`O1`** | Homepage Pause button & native scrollbars | **No user-facing Pause button exists** on `/`; reduced-motion and `document.hidden` pausing are preserved. Global CSS hides native scrollbars while `DayTaskList` provides a custom constellation scrollbar. | [`../agents/homepage/readme.md#2-confirmed-requirements-and-user-flows`](../agents/homepage/readme.md#2-confirmed-requirements-and-user-flows), [`../agents/shared/uiux.md#4-motion-system-srcdesignmotionts`](../agents/shared/uiux.md#4-motion-system-srcdesignmotionts) |
| **`O2`** | Week view card anatomy | **Rich summary card** (weekday + `DD/MM`, circular progress ring, priority planet counts, independent `{due} due this day` counter) + right-side inspection `Drawer` on click. | [`../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows`](../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows) (`§2.1.D`) |
| **`O3`** | Month view cell anatomy | **42-cell Monday-first calendar grid** with overdue dot, priority counts (`1 urgent` desktop / `1U` mobile), completion badge (`done/total`), and day inspection `Drawer`. | [`../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows`](../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows) (`§2.1.E`) |
| **`O4`** | Homepage Wordmark implementation & guardrail test path | Wordmark is rendered via `/brand/wordmark.svg` in `HomeJourney.tsx`; `Wordmark.tsx` was retired. The stale `src/features/home/Wordmark.tsx` string in `craft-and-architecture-guardrails.test.ts` is documented and tracked in [`OD-04`](../../PROJECT_DESCRIPTION.md#od-04). | [`../agents/shared/uiux.md#6-craft-rules--automated-guardrails`](../agents/shared/uiux.md#6-craft-rules--automated-guardrails), [`../../PROJECT_DESCRIPTION.md#od-04`](../../PROJECT_DESCRIPTION.md#od-04) |
| **`O5`** | Daily empty-state illustrations (`DayEmpty`) | Documented accurately: `Yesterday` uses `/visuals/daily-v2/orbiting-moon.svg`, `Today` uses inline spiral/orbit SVG, and `Tomorrow` uses `/visuals/daily-v2/ringed-planet.svg`. | [`../agents/tasks/readme.md#3-epic-specific-uiux`](../agents/tasks/readme.md#3-epic-specific-uiux) |
| **`O6`** | Font loading (`next/font/google` vs. offline fallbacks; `Forum` font removal) | Distinguished build-time `next/font/google` compilation from runtime CSS fallback stacks (`Cormorant Garamond` → `Georgia`, `Inter` → `system-ui`). Removed all claims that `Forum` is loaded. | [`../agents/shared/uiux.md#3-typography`](../agents/shared/uiux.md#3-typography) |
| **`O7`** | Focus trap implementation (`useFocusTrap`) | Documented the stacked `activeTrapStack` implementation in `src/ui/shared/use-focus-trap.ts` that coordinates nested modals/drawers cleanly. | [`../agents/shared/uiux.md#8-accessibility-baseline`](../agents/shared/uiux.md#8-accessibility-baseline) |
| **`O8`** | Reference video inventory (`sources/vid/vid3.mp4` missing) | Updated media inventory in [`../agents/homepage/readme.md`](../agents/homepage/readme.md) to list only existing files (`vid0`, `vid1`, `vid4`, `vid5`, `vid6`, `vid7`) and explicitly note that `vid2.mp4` and `vid3.mp4` do not exist. | [`../agents/homepage/readme.md#6-open-decisions-and-supporting-references`](../agents/homepage/readme.md#6-open-decisions-and-supporting-references) |
| **`O9`** | Public V2 SVG count (`10` in `public/visuals/daily-v2/` vs `11` in `sources/`) | Documented accurately: 10 SVGs are copied to `public/visuals/daily-v2/`, while the 11th (`zodiac-wheel.svg`) is rendered inline as `Astrolabe` and `ZodiacCorner` in `DailySky.tsx`. | [`../agents/tasks/readme.md#3-epic-specific-uiux`](../agents/tasks/readme.md#3-epic-specific-uiux), [`../../sources/img/daily-v2-reference/README.md`](../../sources/img/daily-v2-reference/README.md) |
| **`O10`** | Test file / test count drift | Historical counts (`21 test files / 86 tests`) are recorded strictly as dated snapshots (`4–6 Nov 2026`), never as timeless static guarantees. | [`../../PROJECT_DESCRIPTION.md#7-verification--audit-baseline`](../../PROJECT_DESCRIPTION.md#7-verification--audit-baseline) |

### 3.3 Internal / Cross-File Inconsistencies (`I1`–`I5`)

| ID | Topic | Confirmed Resolution | Canonical Documentation Location |
| :---: | :--- | :--- | :--- |
| **`I1`** | Broken links after `md/` reorganization & gitignored `sources/`/`review/` | Updated all links across `AGENTS.md`, `README.md`, `PROJECT_DESCRIPTION.md`, and `md/**` to valid relative paths; documented `sources/` and `review/` as local-only directories. | [`../readme.md`](../readme.md), [`../agents/shared/uiux.md#5-imagery-icons--local-reference-media`](../agents/shared/uiux.md#5-imagery-icons--local-reference-media) |
| **`I2`** | Active task location & status | `md/task.md` is the sole active task brief entry point and is reset to an inactive template when no task is active. | [`../../AGENTS.md`](../../AGENTS.md), [`../readme.md`](../readme.md), [`../task.md`](../task.md) |
| **`I3`** | Duplicate `DESIGN_SPEC.md` and `ASSET_GUIDE.md` in two directories | Consolidated into [`../agents/tasks/readme.md`](../agents/tasks/readme.md) and [`../../sources/img/daily-v2-reference/README.md`](../../sources/img/daily-v2-reference/README.md); all 4 duplicate files archived and retired from active paths. | [`../archive/pre-reorganization/README.md`](../archive/pre-reorganization/README.md) |
| **`I4`** | Naming drift (`Daily Task Management` vs `Daily Todo-List`, `Tasks Hub` vs `Task Hub`, `Observatory`) | Established canonical terminology table mapping every user-facing name to its code symbols and banning retired aliases. | [`../../PROJECT_DESCRIPTION.md#2-standardized-terminology`](../../PROJECT_DESCRIPTION.md#2-standardized-terminology) |
| **`I5`** | SQLite path discrepancy (`./data/app.db` vs `./data/hieptrong.db`) | Documented both the runtime default (`DATABASE_URL=./data/app.db` in `src/server/env.ts`) and the CLI config discrepancy (`./data/hieptrong.db` in `drizzle.config.ts`, Audit item `C10`). | [`../../PROJECT_DESCRIPTION.md#3-system-architecture--layer-boundaries`](../../PROJECT_DESCRIPTION.md#3-system-architecture--layer-boundaries), [`../../README.md`](../../README.md) |

### 3.4 Ambiguities & Previously Unconfirmed Decisions (`A1`–`A7` + Additional Confirmed Decisions)

| ID | Topic | Confirmed Resolution | Canonical Documentation Location |
| :---: | :--- | :--- | :--- |
| **`A1`** | Tasks sorting rules across Daily vs. Hub | Canonical sort (`sortTasksCanonical`: incomplete → overdue → due-soon → priority → deadline → created → id) is the default, while `/tasks/hub` exposes explicit sort overrides (`default`, `created_desc`, `deadline_asc`, `priority_desc`). | [`../../PROJECT_DESCRIPTION.md#4-shared-data-concepts--domain-rules`](../../PROJECT_DESCRIPTION.md#4-shared-data-concepts--domain-rules) (`§4.3`) |
| **`A2`** | Day Arc clock & timezone behavior | Confirmed target requirement: real-time `HH:mm:ss` clock in `Asia/Ho_Chi_Minh` (`UTC+07:00`) + countdown to `00:00` next day. Observed `HH:mm` implementation gap is documented and tracked in [`OD-03`](../../PROJECT_DESCRIPTION.md#od-03). | [`../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows`](../agents/tasks/readme.md#2-confirmed-requirements-and-user-flows) (`§2.1.B.3`), [`../../PROJECT_DESCRIPTION.md#od-03`](../../PROJECT_DESCRIPTION.md#od-03) |
| **`A3`** | Notification `due_24h` vs `due_quarter` & completion replacement | Confirmed: `due_24h` fires only when total task duration `>= 24h`; `due_quarter` fires in the final 25% of duration; completing a task deletes its prior deadline/overdue notifications and inserts one `completed` notification; retention is 7 days. | [`../../PROJECT_DESCRIPTION.md#4-shared-data-concepts--domain-rules`](../../PROJECT_DESCRIPTION.md#4-shared-data-concepts--domain-rules) (`§4.4`) |
| **`A4`** | Global `overscroll-behavior-y: none` in `src/app/globals.css` | Confirmed intentional across the application to prevent vertical rubber-band bounce. | [`../agents/shared/uiux.md#4-motion-system-srcdesignmotionts`](../agents/shared/uiux.md#4-motion-system-srcdesignmotionts) (`§4.3`) |
| **`A5`** | Homepage opening "Explore my space" CTA morph | Confirmed retired and removed. `Explore my space` is rendered exclusively as the static section heading (`h2#features-heading`) of the Feature Collection. | [`../agents/homepage/readme.md#2-confirmed-requirements-and-user-flows`](../agents/homepage/readme.md#2-confirmed-requirements-and-user-flows) (`§2.1.2`) |
| **`A6`** | Verification policy for code vs. docs changes | Confirmed: code/test/config changes require `npm run check` (and `npm run build` when relevant); documentation-only changes require link/hash/git-status verification without running application test suites. | [`../../AGENTS.md`](../../AGENTS.md), [`../../PROJECT_DESCRIPTION.md#7-verification--audit-baseline`](../../PROJECT_DESCRIPTION.md#7-verification--audit-baseline) |
| **`A7`** | Role of `md/read/conflicts.md` | Retired as an active guide, archived byte-for-byte under `md/archive/pre-reorganization/md/read/conflicts.md`, and replaced by this permanent reconstruction report (`md/read/reconstruction.md`). | [`../archive/pre-reorganization/README.md`](../archive/pre-reorganization/README.md), [`reconstruction.md`](reconstruction.md) |
| **Extra 1** | General vs. epic UI/UX precedence | Confirmed: shared rules live in `md/agents/shared/uiux.md`; epic overrides live in the epic `readme.md` and are cross-registered in [`md/agents/shared/uiux.md#12-scoped-visual-exceptions`](../agents/shared/uiux.md#12-scoped-visual-exceptions). | [`../agents/shared/uiux.md#1-identity-themes--precedence`](../agents/shared/uiux.md#1-identity-themes--precedence) |
| **Extra 2** | Future unbuilt epics (`sport`, `English`, `nutrition`, `diary`, etc.) | Do not create premature `md/agents/<epic>/` folders for unbuilt features; catalog them centrally in [`../../PROJECT_DESCRIPTION.md#5-route--feature-catalog`](../../PROJECT_DESCRIPTION.md#5-route--feature-catalog). | [`../../PROJECT_DESCRIPTION.md#5-route--feature-catalog`](../../PROJECT_DESCRIPTION.md#5-route--feature-catalog), [`../readme.md`](../readme.md) |

---

## 4. Open Decisions Summary (`OD-01`–`OD-05`)

Five open decisions were identified during the reconstruction where product intent or code stabilization priorities require future owner confirmation. Full context, options, and recommendations are maintained in the canonical [**Open Decisions Register (`PROJECT_DESCRIPTION.md#8-open-decisions-register`)**](../../PROJECT_DESCRIPTION.md#8-open-decisions-register):

1. **[`OD-01`](../../PROJECT_DESCRIPTION.md#od-01):** Daily Header `Observatory` Button vs. `Statistics` Drawer & Future Analytics Scope
2. **[`OD-02`](../../PROJECT_DESCRIPTION.md#od-02):** Dynamic vs. Curated `Cosmic forecast` Copy in Daily Task Management
3. **[`OD-03`](../../PROJECT_DESCRIPTION.md#od-03):** Day Arc Real-Time `HH:mm:ss` Clock & Midnight Countdown Implementation Alignment
4. **[`OD-04`](../../PROJECT_DESCRIPTION.md#od-04):** Sentence-Case Rule vs. CSS `all-small-caps` on `.eyebrow` Labels (and stale `Wordmark.tsx` guardrail test reference)
5. **[`OD-05`](../../PROJECT_DESCRIPTION.md#od-05):** Remediation Priority & Behavioral Contracts for Confirmed Audit Defects (`C01`–`C14`)

---

## 5. Verification Log

The following automated checks were executed on 7 November 2026 upon completing the reconstruction:

1. **Archive Integrity Verification (`14 / 14` files):**
   - Computed SHA-256 hashes of all 14 files in `md/archive/pre-reorganization/` and verified `100%` byte-for-byte identity against the pre-reconstruction baseline hashes recorded in Section 1.1.
2. **Read-Only Markdown Preservation Verification (`9 / 9` files):**
   - Verified that `md/user/user_desc.md`, `md/user/user_notes.md`, `docs/audit/ARCHITECTURE_AUDIT.md`, `docs/audit/BUG_INVENTORY.md`, `docs/audit/STABILIZATION_PLAN.md`, `docs/audit/TECHNICAL_DEBT.md`, `public/earth/ATTRIBUTION.md`, `review/phase01/MOTION.md`, and `review/phase01/README.md` have identical SHA-256 hashes and byte lengths to the pre-work baseline (`0` bytes changed).
3. **Codebase & Asset Non-Modification Verification (`593 / 593` non-Markdown files):**
   - Verified every non-Markdown file across `src/`, `tests/`, `public/`, `drizzle/`, `scripts/`, `sources/`, `review/`, and root configuration files against the pre-work SHA-256 baseline (`0` files modified, added, or deleted outside the scoped Markdown targets).
4. **Markdown Link & Anchor Resolution Check:**
   - Parsed every relative Markdown link (`[label](path)` and `[label](path#anchor)`) across all 13 active canonical Markdown documents (`AGENTS.md`, `README.md`, `PROJECT_DESCRIPTION.md`, `md/readme.md`, `md/task.md`, `md/agents/shared/uiux.md`, `md/agents/homepage/readme.md`, `md/agents/homepage/reports.md`, `md/agents/tasks/readme.md`, `md/agents/tasks/reports.md`, `md/read/reconstruction.md`, `md/archive/pre-reorganization/README.md`, `sources/img/daily-v2-reference/README.md`) and verified `0` broken file paths and `0` missing heading anchors.
