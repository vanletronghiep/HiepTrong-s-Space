# Pre-Reorganization Documentation Archive

> **Historical Evidence Only — Does Not Authorize Work**
>
> All files in `md/archive/pre-reorganization/` are byte-identical snapshots of repository documentation captured on **7 November 2026** immediately before the epic-based documentation reconstruction.
>
> - **Do not** treat any prompt, mission brief, or checklist in this archive as an active task assignment.
> - **Do not** treat superseded design rules or revoked instruction claims in this archive as current workspace policy.
> - **Do not** edit archived source files; their exact original bytes are preserved so SHA-256 verification remains reproducible.
>
> For active instructions and canonical specifications, start at root [`AGENTS.md`](../../../AGENTS.md), [`md/readme.md`](../../readme.md), and [`PROJECT_DESCRIPTION.md`](../../../PROJECT_DESCRIPTION.md). For full section-by-section migration mapping and conflict dispositions, see [`md/read/reconstruction.md`](../../read/reconstruction.md).

---

## Archived File Index

| Former Repository Path | Archived Path (relative to this folder) | Action Taken | Bytes | SHA-256 | Notes |
|---|---|---|---:|---|---|
| `AGENTS.md` | [`AGENTS.original.md`](AGENTS.original.md) | Archived & rewritten | 3,170 | `e4391183c0f90ed6c68f9a9f59a7a58aff37b18ebab2851ff981d316d4b05080` | Renamed to `AGENTS.original.md` so tooling does not load it as nested agent instructions. |
| `README.md` | [`README.original.md`](README.original.md) | Archived & rewritten | 5,545 | `e53e64e04b663693d2b1b9d6c08b9ca7cceef2a14932ebfd74f41ea5ea530307` | Stored as `README.original.md` alongside this archive manifest (`README.md`); public onboarding rewritten with `npm ci`, current surfaces, and migration/font notes. |
| `PROJECT_DESCRIPTION.md` | [`PROJECT_DESCRIPTION.md`](PROJECT_DESCRIPTION.md) | Archived & rewritten | 152,320 | `7bfcf053bc5d637d7421236a48e5f43951894b9e0762a23e157f09923fe02846` | Rewritten as concise engineering reference; feature/UI details distributed to epic and shared docs. |
| `md/task.md` | [`md/task.md`](md/task.md) | Archived & replaced with inactive template | 24,134 | `4154d7ac24504b78f3788b355a205e968bd8bc0575aaebb3530401954566c523` | Assigned documentation-reconstruction brief preserved verbatim. |
| `md/agents/ui_ux.md` | [`md/agents/ui_ux.md`](md/agents/ui_ux.md) | Archived & retired | 66,521 | `301d2c222e5d679d2babfd5759f8b38a671ea95fe1b98d5d90f6cde6944b636a` | Split across [`md/agents/shared/uiux.md`](../../agents/shared/uiux.md), [`md/agents/homepage/readme.md`](../../agents/homepage/readme.md), and [`md/agents/tasks/readme.md`](../../agents/tasks/readme.md). |
| `md/agents/DESIGN_SPEC.md` | [`md/agents/DESIGN_SPEC.md`](md/agents/DESIGN_SPEC.md) | Archived & retired | 13,753 | `2e2bb79bbcb44366698107dc1593b138dc210bf7c4f8a668a962c68dabac2c40` | Consolidated into [`md/agents/tasks/readme.md`](../../agents/tasks/readme.md) with confirmed product decisions. |
| `md/agents/ASSET_GUIDE.md` | [`md/agents/ASSET_GUIDE.md`](md/agents/ASSET_GUIDE.md) | Archived & retired | 4,313 | `2a219ec6ca14532617e7bfdbedce276996b9a5fa4e1566a4f77a4fe0ee72fe56` | Consolidated into [`md/agents/tasks/readme.md`](../../agents/tasks/readme.md) and [`sources/img/daily-v2-reference/README.md`](../../../sources/img/daily-v2-reference/README.md). |
| `md/agents/context.md` | [`md/agents/context.md`](md/agents/context.md) | Archived & retired | 10,443 | `5a610bac0f5b3f8554a1cb6fbaea87719b4d97c0bc6d82aa441d033ca71ca81d` | Earlier conservative Daily redesign prompt based on `sources/img/img5.png`; superseded by Celestial V2 decisions. |
| `md/agents/agent_readme.md` | [`md/agents/agent_readme.md`](md/agents/agent_readme.md) | Archived & retired | 39,042 | `e0ae56a9f8cd64fd4ffaa34f973ecca7f191c6e598683fcc87b758d08c8a40b1` | Multi-phase autonomous mission prompt; durable requirements migrated to epic READMEs; autonomous execution sequence retired. |
| `md/read/conflicts.md` | [`md/read/conflicts.md`](md/read/conflicts.md) | Archived & retired | 22,314 | `2a44a2a67d95ee84ff66a5af6a8e992a9d7105fd20b7f8d774368275014b2025` | 6 November 2026 Markdown consistency audit; all items disposed in [`md/read/reconstruction.md`](../../read/reconstruction.md). |
| `sources/img/daily-v2-reference/README.md` | [`sources/img/daily-v2-reference/README.md`](sources/img/daily-v2-reference/README.md) | Archived & rewritten | 1,443 | `9f5858d0e55e7ea10814a372d741e83da60bae5bea385f0aa578ef54c6b3157e` | Rewritten as a concise asset index pointing to canonical Tasks documentation. |
| `sources/img/daily-v2-reference/DESIGN_SPEC.md` | [`sources/img/daily-v2-reference/DESIGN_SPEC.md`](sources/img/daily-v2-reference/DESIGN_SPEC.md) | Archived & retired | 13,753 | `2e2bb79bbcb44366698107dc1593b138dc210bf7c4f8a668a962c68dabac2c40` | Byte-for-byte duplicate of `md/agents/DESIGN_SPEC.md`. |
| `sources/img/daily-v2-reference/ASSET_GUIDE.md` | [`sources/img/daily-v2-reference/ASSET_GUIDE.md`](sources/img/daily-v2-reference/ASSET_GUIDE.md) | Archived & retired | 4,313 | `2a219ec6ca14532617e7bfdbedce276996b9a5fa4e1566a4f77a4fe0ee72fe56` | Byte-for-byte duplicate of `md/agents/ASSET_GUIDE.md`. |
| `sources/img/daily-v2-reference/AGENT_PROMPT.md` | [`sources/img/daily-v2-reference/AGENT_PROMPT.md`](sources/img/daily-v2-reference/AGENT_PROMPT.md) | Archived & retired | 9,640 | `d959447b386adcb79dc06b647456ba82eb8cf3769e27ef67b80e57680f23bdd8` | Standalone V2 visual prompt; durable visual rules consolidated into [`md/agents/tasks/readme.md`](../../agents/tasks/readme.md). |
