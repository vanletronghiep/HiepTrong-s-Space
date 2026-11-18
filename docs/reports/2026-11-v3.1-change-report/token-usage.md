# v3.1 work: token usage by part

**These per-part numbers are my estimates, not measurements.** The tool I have reports only session totals. I split the message tokens by how much reading, writing and tool output each part involved, so treat each row as roughly right to within several percentage points.

## What was measured (read at 2026-11-17T14:16Z)

| Item | Tokens | Share of window |
|---|---|---|
| Context window used now | 774,939 | 77% of 1,000,000 |
| Messages (conversation, tool output, file contents) | 718,076 | 72% |
| System tools | 22,413 | 2% |
| MCP tools | 13,755 | 1% |
| System prompt | 10,549 | 1% |
| Skills | 6,970 | 1% |
| Memory files | 3,176 | 0% |

Plan usage at the same moment: 18% of the 5-hour limit and 16% of the weekly limit (Pro plan).

## Estimated split of the message tokens

| Part | Share | Tokens |
|---|---|---|
| Baseline: reading plan, code, data, reference images, first check | ~14% | ~100,531 |
| Phase 1: focus styling and shared Task card rules | ~5% | ~35,904 |
| Phase 2: zodiac loader, readiness wiring, homepage, tests | ~9% | ~64,627 |
| Events backend: contracts, occurrence domain, storage, services, API, tests | ~22% | ~157,977 |
| Events interface: components, EventsView rewrite, editor, tests | ~20% | ~143,615 |
| Prettier mistake and cleanup of unrelated files | ~3% | ~21,542 |
| Task mockups (7 design boards) | ~9% | ~64,627 |
| Browser verification and performance measurements | ~9% | ~64,627 |
| Documentation and suggestions file | ~3% | ~21,542 |
| LaTeX change report | ~4% | ~28,723 |
| Phase 6 card change and final checks | ~2% | ~14,362 |
| **Total** | 100% | **~718,077** |

## Limits of these numbers

- They describe what is held in the context window now, not what was billed. Each turn re-reads the earlier conversation, so total billed input is much larger than 775k, and I cannot see that figure.
- Earlier turns that the app compacted or dropped are not counted in the window.
- The two background build and test runs and the headless browser runs cost almost no tokens, since only their summary lines came back.
