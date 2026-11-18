# Agent workflow experience guide

Optimize successful completion per unit of time and tokens while preserving correctness.

Basis: [Agent A's Task Execution Retrospective & Handoff Report](https://chatgpt.com/library?file_id=libfile_6381b63af458819185b95d99c611f72c&account_id=personal), covering `desc.md`, adjacent GoGame debugging, and memory export.
**[E]** = grounded in the retrospective's reported actions or measurements; **[S]** = suggested improvement, not an observed failure. Original transcripts were not independently verified. Priority reflects expected impact, not measured savings.

## P1 — Control context and output scope

- **[S]** Outline required topics and their authoritative sources before reading; stop discovery when each topic has sufficient evidence.
- **[E]** Search headings and read relevant ranges in large inventories; the unbounded `report.md` read returned 800 lines with little unique value (§3, #2).
- **[E]** Check candidate paths in one scoped inventory and remember missing files; stale links caused four failed reads across sessions (§3, #1).
- **[S]** Reuse unchanged instructions and previously extracted facts; reread only missing, changed, or ambiguous sections.
- **[E]** Preserve requested depth: the owner explicitly requested a comprehensive `desc.md`; large generation alone does not establish waste (§1.1).
- **[S]** Within comprehensive handoffs, write each rule once and link supporting detail; shorten repeated explanations rather than omit required coverage.
- **[E]** Treat task plans as intent, not implementation proof; reading `md/task.md` cannot alone establish that all 20 decisions shipped (§2.1, steps 42–43).

## P1 — Preserve verification and truthful completion

- **[E]** Reproduce the exact failing build before changing code; this exposed concrete UI/API mismatches in GoGame (§2.2, steps 0–4).
- **[E]** Map actual interfaces before editing consumers; the documented inspection was followed by a clean first rebuild (§2.2, steps 5–69).
- **[E]** Report build success separately from test success: GoGame compiled, but only 25/30 scenarios passed; full correctness remained unresolved (§1.2).
- **[S]** Capture failing test names and causes; establish a baseline or compare an untouched revision before calling failures pre-existing.
- **[S]** After changing modal confirmation/close flags, test exactly-once action handling, cancellation, and reopening; compilation cannot verify these behaviors.
- **[E]** Keep documentation checks appropriate: skipping application builds/tests for `desc.md` respected the assignment's rules (§1.1).
- **[S]** Verify document links, anchors, coverage, final change scope, and protected-file hashes; a pre-edit clean-tree check cannot prove post-edit preservation.

## P2 — Reduce tool round trips safely

- **[E]** Extract a dependency list from compiler diagnostics, then batch relevant small headers; fragmented inspection required repeated planner turns (§3, #5).
- **[E]** Retain parallel independent reads, which worked in the primary session; limit each batch to files that answer current questions (§2.1).
- **[E]** Group independent read-only Git queries in one turn; separate status/log turns added avoidable orchestration (§3, #3).
- **[E]** Remember environment capabilities after failure: `rg` was unavailable repeatedly; use `Select-String` or `git grep` here (§3, #4).
- **[E]** Target the relevant directory instead of recursive app-state enumeration; broad discovery produced truncated output and permission errors (§3, #6).
- **[E]** Use `git log --follow` for one path only; omit it for multiple paths or query rename history separately (§3, #6).
- **[S]** Consolidate related edits to one file into a coherent patch; parallelize only independent operations, not potentially conflicting mutations.
- **[S]** Prefer focused edits when feasible; justify a full-file rewrite by the required changes rather than treating it as automatically faster or wrong.

## P2 — Manage waits, continuity, and interruptions

- **[E]** Treat a short async yield as normal: `ctest` finished after 35.39 seconds despite yielding at 10 seconds (§2.2, steps 69–75).
- **[S]** Resume the existing process handle and avoid repeated planner-only checks; choose waits from observed runtime while preserving useful progress updates.
- **[S]** Move unrelated tasks to a fresh session at a safe boundary with a compact handoff of scope, files, verified results, and unresolved failures.
- **[E]** Account for cache behavior when changing models: the reported switch coincided with zero cached input, but continuity may still justify switching (§4.2).
- **[S]** Record a small checkpoint when redirected so unfinished work can resume without rediscovery; distinguish interruption from execution failure.
- **[E]** Separate active execution from user gaps and follow-up requests; the adjacent session contained several tasks across a longer elapsed interval (§2.2).

## P2 — Interpret token and time evidence correctly

- **[E]** Report uncached input, cached input, and output separately; neither cached-token volume nor cache percentage alone measures successful efficiency (§4).
- **[E]** Label cumulative prompt processing separately from maximum per-turn context: the primary table totals 1,241,495 input/cache tokens, with a listed peak of 187,939 (§4.1).
- **[E]** Keep combined output/thinking totals intact unless separate counters exist; byte-based reasoning/content splits are estimates (§5.2).
- **[E]** Treat proposed savings as counterfactual estimates; the retrospective did not rerun equivalent tasks with the suggested workflow (§4.4).
- **[E]** Do not sum overlapping savings or assume every later turn retains identical cache behavior; context reduction changes subsequent accounting (§§3–4).
- **[E]** Do not infer a server restart from zero cached tokens alone, or convert token counts into money without provider accounting evidence (§4.2).
- **[E]** Do not call the reported 81.8% starting-prompt difference a whole-task saving; the two sessions had different tasks and histories (§4.4).
- **[E]** Distinguish command runtime from planner/tool latency; the reported Git-turn duration does not establish that Git itself was slow (§3, #3).

## P3 — Make reviews and handoffs reusable

- **[S]** Extract transcript events and usage totals in one structured pass; print only relevant records instead of repeatedly loading the same ranges.
- **[E]** Keep session and step references for findings; the retrospective's chronology makes failed commands, corrections, and outcomes traceable (§2).
- **[E]** Preserve explicit evidence limits; the retrospective correctly separates combined output totals from estimated subdivisions (§5.2).
- **[S]** Distinguish available-log coverage from complete project history; recent commit summaries cannot establish every past mistake or implementation detail.
- **[E]** Validate path format before delivery; the retrospective claims relative-path compliance while repeatedly using absolute `file:///` links (§1 and links throughout).
- **[S]** Link the deliverable with a brief outcome and remaining limitations; avoid reproducing its contents in the final response.
