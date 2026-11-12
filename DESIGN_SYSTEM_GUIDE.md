# Hiep Trong Space — shared design guide

Status: remediation specification derived from the rendered Daily Task Management reference on 10 November 2026. It does not claim the current application conforms. Read with [the audit](WEBSITE_QUALITY_AUDIT.md) and [blueprint](blueprint.md). The current instruction makes Daily the primary reference; preserve its successful qualities while applying the requested scoped cleanup.

## 1. The reference and the principles to transfer

Reference evidence: [Daily desktop](review/quality-audit-2026-11-10/tasks-daily-1440.png), [populated desktop](review/quality-audit-2026-11-10/daily-populated.png), [phone](review/quality-audit-2026-11-10/tasks-daily-390.png). Sources: `DailySky.tsx`, `DailyDashboard.tsx`, `daily-foundation.module.css`, `daily-task-card.module.css`, `day-carousel.module.css`, `tokens.css` and `public/visuals/daily-v2/`.

The actual reference is **light**, not the midnight/gold treatment described in older docs. It combines a pale lavender sky, drifting atmospheric gradients, fine edge illustrations, restrained twinkling stars, softly lit rounded panels, serif headings and compact sans-serif controls. On desktop, a clear header precedes summary content, then a visibly dominant active task board. On phone, content stacks while the same curves, typography and controls remain recognizable.

Transfer these principles, not a list of copied colors:

1. One atmospheric scene behind a clear working surface. Depth comes from tonal layers and controlled illustration, not blur on every card.
2. One dominant activity per page. Statistics support the task; they do not automatically occupy the first three rows.
3. Editorial headings with precise, quiet interface typography. Titles, instructions and actions have visibly different importance.
4. Rounded geometry, fine borders, soft shadows, deliberate negative space. Dense content remains legible.
5. Illustration belongs to the space and stays outside primary reading/interaction zones. Each theme has the same hand and level of detail.
6. State changes remain understandable with animation disabled. Motion supports orientation and feedback.

Preserve Daily's custom scrollbar, celestial asset quality, day-board hierarchy, clock/countdown, shared task identity, and Tasks Hub's simpler planning layout. Do not copy its three-board carousel into unrelated features. Do not reintroduce the removed named eclipse/spiral/day-divider/zodiac-corner artwork just because an old spec mentions it.

## 2. Typography

| Role | Implementation reference / specification |
|---|---|
| Display | `--font-display`: existing Cormorant Garamond 500/600, Georgia fallback. Page titles and selected editorial headings. Keep homepage vector wordmark as artwork |
| Interface/body | `--font-ui`: existing Inter 400/500/600, system fallback. Body, actions, inputs, metadata, tabular numbers |
| Workspace title | `--fs-h1` or Daily's observed 29–45px clamp when composition calls for it; use one shared page-title convention across inner pages |
| Section heading | `--fs-h2` (20–24px), clear contrast and visible spacing before content |
| Body / long reading | `--fs-body` 16px, line-height 1.6–1.7. Reading measure roughly 60–72 characters, with comfortable paragraphs |
| Actions / compact UI | `--fs-ui` 14px; inputs 16px on touch layouts where possible |
| Secondary metadata | `--fs-small` 13px; `--fs-micro` 12px for genuinely secondary content. Never hide essential actions in 10px labels |

Use sentence case for interface copy and retain product names. Use tabular numerals for clocks, progress and dates. Avoid letter-spaced all-caps labels, monospace decoration, or a new font per feature. Exceptions need an explicit reason and comparison against the reference. Do not retain the newer pages' 24px bold sans-serif header simply because Tailwind supplies `--text-2xl`; it weakens the shared hierarchy.

## 3. Color architecture and feature palettes

Keep every static color definition in `src/design/tokens.css`; register utility-facing values in `globals.css` when needed. The current code actually defines these useful anchors:

| Existing token | Current value | Role |
|---|---|---|
| `--ws-bg` | `#f0eff8` | Neutral workspace canvas |
| `--ws-surface` | `#ffffff` | Clear content plane |
| `--ws-text` | `#29263b` | Primary ink |
| `--ws-text-muted` | `#777387` | Secondary text, subject to contrast check on actual background |
| `--daily-sky-start` / `--daily-sky-end` | `#f1ebfc` / `#f8f4ff` | Atmospheric range |
| `--daily-accent` / `--daily-heading-accent` | `#8065e9` / `#6249cc` | Decorative/interactive violet and deeper heading accent |
| `--daily-card` / `--daily-card-line` | `#fcfaff` / `#e1d7fa` | Soft panel and outline |
| `--daily-pill` / `--daily-planet` | `#e9e0fa` / `#d9cdf6` | Gentle selected surfaces and illustration fill |
| `--status-overdue`, `--status-due-soon`, `--status-completed` | existing coral, amber, lavender | Shared semantic status; use derived `--text-*` for readable status text |

These observed colors are reference inputs, not a claim that every pairing passes contrast. In particular, white text on the pale `--ws-accent` is not an acceptable default primary button.

For implementation, introduce only the semantic feature roles required by real use: canvas start/end, surface, border, decorative accent, interactive accent, text-on-accent, and primary/muted ink. Names such as `--feature-accent` may be scoped by a theme attribute; choose one consistent naming scheme during M01. Themes must not redefine warning/success meanings. A green page still uses distinct warning and overdue treatments.

| Space | Blueprint direction | Recommended translation of Daily's language |
|---|---|---|
| Home | Cosmos/Earth → soft nebula | Preserve dark opening, pale celestial type and Earth; muted lavender/blue cloud depth behind gallery |
| Daily / Tasks Hub / Notifications | Celestial workspace | Keep current lavender reference; Hub calmer and denser; notification chrome remains compatible with surrounding page |
| Events | Forest, soft green | Sage/mint atmosphere; fine tree/grass/leaf contours at edges; clear calendar paper and exam emphasis |
| Projects | Computing/internet/gaming | Muted periwinkle/blue; small circuit/map/controller-inspired line motifs; visible next step and blocker |
| Milestone | Proposed quiet horizon | Lavender dawn with restrained warm horizon; a path/landmarks composition, not another task dashboard |
| APCS Hub | Sea/sky/blue | Pale blue/turquoise depth, low wave contours and cloud shapes; library explorer remains crisp |
| Learning Room | Cozy focus | Warm cream/sand with muted green or mauve; quiet desk/window light; reduce decoration in active focus |
| Writing Room | Wood/trees/warmth | Warm ivory and muted walnut/sage, fine branch/grain motifs; generous editorial reading surface |
| Tracking | Restrained Japanese influence | Pale sage/stone/blush, sparse botanical/ink-like line work; calm observation, no performance guilt |
| AI Engineering | Proposed calm technical | Cool lavender/blue with fine network constellations; topic/next-step hierarchy |
| Flashcards | Ancient/Viking/European history | Pale parchment, muted bronze/slate; subtle knotwork/manuscript contours outside the card content |
| Achievements | Proposed personal gallery | Soft ivory/lavender with restrained brass framing; era-led story and reflection |
| Entertainment Hub | Proposed lounge | Dusty blue/lilac with warm cream, small book/music motifs; easy continuation and collection maintenance |

Palette proposals are implementation guidance under the authorized creative freedom, not new domain requirements. Forest animals, marine life, or historical ornaments are optional; add them only if the composition benefits. Do not substitute decorative emoji, saturated gradients, unrelated stock art, or excessive glassmorphism.

## 4. Background and illustration composition

Use a small layered composition: base canvas → one or two low-contrast atmospheric fields → edge/margin motifs → content surfaces → working controls/overlays. Keep decoration `aria-hidden` and `pointer-events: none`. Distinguish background depth from the card elevation hierarchy.

Match Daily's thin curved linework and soft fills. Reuse compatible runtime SVGs when thematically appropriate; create theme-native SVG variants with consistent stroke weight and shading when needed. Keep licensing/provenance for added assets. Prefer existing vector/code-native assets over generated raster assets for these motifs; no new asset pipeline is required.

No illustration behind dense body text, field labels, errors or calendar numbers. Limit decorative density on small screens; crop to margins rather than squeeze content. Large transparent panels need a predictable reading surface beneath them. Do not apply backdrop blur to every card. Fixed backgrounds must be checked while scrolling, not judged from full-page screenshots alone.

## 5. Layout and components

Use the existing 4px-based spacing steps: 4/8/12/16/24/32/48/64px. The current `--max-content` is 80rem; use it for shared shell alignment, with narrower purpose-specific content inside. Avoid stacking a shell gutter and a second oversized page padding that pushes all new headers down to 152px without purpose.

| Component | Shared specification |
|---|---|
| Header | Title and short useful context; primary action aligned to title area; responsive wrap. No mandatory giant tinted hero or stat strip |
| Panel/card | `--radius-card` 16px, task 14px or item 12px; subtle defined border and `--shadow-task`; 16–24px content padding depending density |
| Button | Existing `Button`; use `leftIcon`/`rightIcon`. Default primary uses readable ink/surface, theme variant only with verified contrast. Never white text on an undefined/pale fill |
| Filter / segmented mode | Existing `Chip`/`SegmentedControl` where behavior fits; selected state by shape/weight/mark as well as color; wrap or bounded accessible scrolling |
| Inputs | Persistent programmatic label, visible focus, error/help association, clear disabled/pending state; values do not vanish on failure |
| Dialog / drawer | Existing primitives and focus stack. Portal when needed; scrim and content above shell/cards; internal scrolling with visible close and reachable submit |
| List row | Clear title and metadata; the actionable region is keyboard reachable; preserve separate nested actions without conflicting click handlers |
| Statistics / charts | Show genuine data and its time window. No fabricated fallback numbers; empty state says no data. Include readable labels/table/text alternative |
| Empty/loading/error | Distinct states. Empty explains the first useful action; skeleton matches final geometry; error preserves content and offers retry |
| Notification | Preserve current type tag, read checkbox, relative age and time-left layout; use explicit source identity and reliable destination |

Prefer shared behavior with feature-specific composition. Do not create a monolithic configurable dashboard abstraction. Refactor only repeated code needed to fix these defects.

## 6. Motion

Use the **actual** motion system: `--dur-fast` 150ms, `--dur-base` 250ms, `--dur-slow` 400ms, `--ease` cubic-bezier(0.22, 0.61, 0.36, 1), and exports from `src/design/motion.ts`. Daily has an observed scoped 300ms carousel duration; preserve it unless a measured defect requires adjustment. The older 140/220/380ms documentation is not the current source of truth.

- Small hover/focus/press feedback: 100–150ms; popover/state switch roughly 170–280ms; larger drawer movement at most about 400ms.
- Use transform/opacity for spatial changes; avoid animating layout dimensions for decorative effects. No `transition: all` or springy productivity controls.
- Focus indication is immediate. Persistent animations pause when hidden and stop under reduced motion. Timers continue by wall-clock semantics even when rendering pauses.
- Cosmic Launch retains its current deliberate approximately 3-second sequence for now. Fix readiness on every route, then measure. Reduced motion uses the existing ≤300ms fade; Back/Forward bypasses the long sequence.
- Homepage scroll phases remain reversible; no sudden Earth size change at the Meet Hiep handoff. Required text must remain readable without a successful WebGL context or fancy gradient.
- Capture brief video or timestamped pose/transition evidence for motion. A static screenshot cannot establish smoothness, input latency, or background-tab behavior.

## 7. Responsive and accessible acceptance

Check **320, 390, 768, 1024 and 1440px**. Use a single working column where content requires it; two columns only when text/actions retain breathing room. Calendar cells may become a clear agenda on small screens if the same date/action model is preserved. Long titles, many tags, empty data, errors, and open dialogs are part of responsive design.

- No document-wide horizontal overflow; all horizontal scrollers have a discoverable interaction and can reveal focused controls. Global clipping is not proof of layout correctness.
- Touch actions target at least 44×44px; compact desktop controls may have smaller visuals with adequate hit area. Icon-only actions have meaningful accessible names.
- Normal text contrast ≥4.5:1, large text ≥3:1, meaningful control boundaries/focus/status graphics ≥3:1 against their actual adjacent background. Measure composed colors, not token names.
- Keyboard can reach, operate and leave every control; dialogs trap/restore focus; Escape closes only the top overlay. Add a visible-on-focus skip link and a valid main target.
- Status is conveyed by text and/or shape, not color alone. Loading/saving/errors use appropriate status announcements without ticking screen-reader output every second.
- Reading and editing work at 200% zoom; dialogs remain usable with the mobile keyboard. Avoid hidden offscreen actions and invalid tab semantics.
- Respect reduced motion and browser navigation. Preserve the existing tasks' scheduling/deadline distinction and data semantics while changing layout.

## 8. Visual review rubric

For each milestone, present Daily and the changed feature side by side at matching widths and representative data density. Score each dimension 0 = failing, 1 = needs correction, 2 = meets the guide: hierarchy, spacing/proportion, typography, palette/contrast, illustration consistency, control consistency, state clarity, narrow layout, and motion/orientation. Scores guide discussion; a functional/accessibility failure cannot be averaged away.

Acceptance requires no P0/P1 regression, all named objective criteria passing, and no “failing” visual dimension. Reviewer notes must identify actual screenshots and explain any remaining subjective difference. Prefer one carefully finished feature as the theme reference before applying its primitives to the rest.

Do not accept “UI improved,” generated mockups, screenshot-only static HTML, or a passing build as proof. Evidence must come from the implemented application with working data and controls.
