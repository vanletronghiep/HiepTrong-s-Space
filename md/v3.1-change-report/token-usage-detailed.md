# v3.1 work: token usage by part and phase (detailed)

**Everything here is an estimate, not a measurement.** I can read only session totals, not usage per step. Measured at the time of this file: 774,939 tokens in the context window, of which 718,076 are conversation messages (tool output, file contents, my writing). I split those 718,076 tokens across 38 small phases using the method below.

## Method

1. **Reading:** for files I read, tokens = characters / 4 (using the size of the version I actually read).
2. **Writing:** for files I wrote, tokens = characters / 4 of the final file. This undercounts files I rewrote several times and counts the EventsView rewrite twice (one write was rejected, but it still sits in the conversation).
3. **Other:** an allowance for tool results (test runs, diffs, command output), edits, screenshots and my reasoning in that phase. This column is my judgment and is the least reliable.
4. The three columns add to a raw total of 638,321. I scaled every phase by 1.125 so the total matches the measured 718,076.

## Summary by part

| Part | Tokens | Share |
|---|---|---|
| Part A: baseline review | ~164,373 | 22.9% |
| Part B: Phase 1, focus styling and Task card rules | ~37,696 | 5.2% |
| Part C: Phase 2, loader and homepage | ~62,523 | 8.7% |
| Part D: Phases 4 and 5, Events backend | ~113,222 | 15.8% |
| Part E: Phases 4 and 5, Events interface | ~105,336 | 14.7% |
| Part F: formatting mistake and cleanup | ~42,748 | 6.0% |
| Part G: Task mockups | ~45,335 | 6.3% |
| Part H: verification and performance | ~73,587 | 10.2% |
| Part I: documentation | ~24,201 | 3.4% |
| Part J: Phase 6 card change | ~9,000 | 1.3% |
| Part K: report and token files | ~40,053 | 5.6% |
| **Total** | **~718,074** | 100% |

## Detail by phase

### Part A: baseline review

| Phase | Reading | Writing | Other | Scaled estimate |
|---|---:|---:|---:|---:|
| A1 Baseline: read plan, task list, protected-file hashes | 12,083 | 0 | 4,000 | **~18,092** |
| A2 Baseline: file inventory, transition and zodiac code | 18,014 | 0 | 9,000 | **~30,389** |
| A3 Baseline: homepage collection and gallery code | 17,109 | 0 | 4,000 | **~23,746** |
| A4 Baseline: focus CSS, shared controls, Task card and tokens | 25,392 | 0 | 6,000 | **~35,314** |
| A5 Baseline: Events code, services, storage, client, API | 30,520 | 0 | 6,000 | **~41,083** |
| A6 Baseline: data shape inspection, reference images, first full check | 0 | 0 | 14,000 | **~15,749** |

### Part B: Phase 1, focus styling and Task card rules

| Phase | Reading | Writing | Other | Scaled estimate |
|---|---:|---:|---:|---:|
| B1 Phase 1: focus tokens and global focus rules | 0 | 0 | 9,000 | **~10,125** |
| B2 Phase 1: shared controls and feature CSS cleanup | 0 | 1,027 | 9,000 | **~11,280** |
| B3 Phase 1: Task brief-card module and TaskCard restructure | 0 | 482 | 14,000 | **~16,291** |

### Part C: Phase 2, loader and homepage

| Phase | Reading | Writing | Other | Scaled estimate |
|---|---:|---:|---:|---:|
| C1 Phase 2: route-zodiac, loader overlay and styles | 0 | 1,841 | 6,000 | **~8,821** |
| C2 Phase 2: TransitionProvider rewrite and rule rename | 1,995 | 3,307 | 8,000 | **~14,964** |
| C3 Phase 2: readiness wiring across 11 views | 0 | 0 | 9,000 | **~10,125** |
| C4 Phase 2: homepage selection, gallery gutter, static zodiac cards | 0 | 0 | 14,000 | **~15,749** |
| C5 Phase 2: loader tests and test fixes | 0 | 2,435 | 9,000 | **~12,864** |

### Part D: Phases 4 and 5, Events backend

| Phase | Reading | Writing | Other | Scaled estimate |
|---|---:|---:|---:|---:|
| D1 Events backend: contracts | 0 | 4,121 | 5,000 | **~10,261** |
| D2 Events backend: occurrence domain | 0 | 8,862 | 7,000 | **~17,844** |
| D3 Events backend: domain tests | 0 | 4,449 | 3,000 | **~8,380** |
| D4 Events backend: storage transaction and backup | 0 | 1,764 | 6,000 | **~8,734** |
| D5 Events backend: EventService and draft service | 0 | 7,059 | 14,000 | **~23,690** |
| D6 Events backend: API routes and client queries | 0 | 1,912 | 9,000 | **~12,275** |
| D7 Events backend: type fallout, pilot fixtures, test adaptation | 0 | 2,480 | 26,000 | **~32,038** |

### Part E: Phases 4 and 5, Events interface

| Phase | Reading | Writing | Other | Scaled estimate |
|---|---:|---:|---:|---:|
| E1 Events UI: format helpers, badges, modal surface and CSS | 0 | 4,215 | 4,000 | **~9,241** |
| E2 Events UI: reader, detail pane, highlights | 0 | 4,200 | 4,000 | **~9,225** |
| E3 Events UI: Week Calendar and School timetable | 0 | 5,588 | 4,000 | **~10,786** |
| E4 Events UI: editor dialog | 0 | 7,346 | 9,000 | **~18,388** |
| E5 Events UI: EventsView rewrite (two attempts, one rejected) | 0 | 26,660 | 6,000 | **~36,741** |
| E6 Events UI: dashboard tests and failure fixes | 0 | 4,628 | 14,000 | **~20,955** |

### Part F: formatting mistake and cleanup

| Phase | Reading | Writing | Other | Scaled estimate |
|---|---:|---:|---:|---:|
| F1 Prettier mistake: stop, revert 91 files, inspect diffs, re-apply | 0 | 0 | 38,000 | **~42,748** |

### Part G: Task mockups

| Phase | Reading | Writing | Other | Scaled estimate |
|---|---:|---:|---:|---:|
| G1 Mockups: design-type instructions, canvas index | 0 | 529 | 17,000 | **~19,719** |
| G2 Mockups: seven artboards | 0 | 15,771 | 7,000 | **~25,616** |

### Part H: verification and performance

| Phase | Reading | Writing | Other | Scaled estimate |
|---|---:|---:|---:|---:|
| H1 Verification: builds, servers, baseline copy and its drive error | 0 | 0 | 18,000 | **~20,249** |
| H2 Verification: browser checks, screenshots, bug hunting | 0 | 0 | 36,000 | **~40,498** |
| H3 Verification: headless timing script and runs | 0 | 1,414 | 10,000 | **~12,840** |

### Part I: documentation

| Phase | Reading | Writing | Other | Scaled estimate |
|---|---:|---:|---:|---:|
| I1 Docs: three canonical specs and archive copies | 2,489 | 0 | 16,000 | **~20,799** |
| I2 Docs: suggestions file | 0 | 2,024 | 1,000 | **~3,402** |

### Part J: Phase 6 card change

| Phase | Reading | Writing | Other | Scaled estimate |
|---|---:|---:|---:|---:|
| J1 Phase 6: Hub card change, test update, check, build | 0 | 0 | 8,000 | **~9,000** |

### Part K: report and token files

| Phase | Reading | Writing | Other | Scaled estimate |
|---|---:|---:|---:|---:|
| K1 LaTeX report: install, compile errors, report text | 0 | 4,079 | 26,000 | **~33,837** |
| K2 Token files | 0 | 526 | 5,000 | **~6,216** |

## What cost the most

1. F1 Prettier mistake: stop, revert 91 files, inspect diffs, re-apply: ~42,748
2. A5 Baseline: Events code, services, storage, client, API: ~41,083
3. H2 Verification: browser checks, screenshots, bug hunting: ~40,498
4. E5 Events UI: EventsView rewrite (two attempts, one rejected): ~36,741
5. A4 Baseline: focus CSS, shared controls, Task card and tokens: ~35,314
6. K1 LaTeX report: install, compile errors, report text: ~33,837

## Notes on specific phases

- **A (baseline)** is large because I read most of the Events, transition and Task code before changing anything. This was needed to avoid guessing.
- **E5 (EventsView)** is the single largest write: a 1,900-line component written twice because the first write was rejected after the file changed on disk.
- **F1 (formatting mistake)** is pure waste: I ran Prettier over the whole repository, then spent tokens inspecting diffs and reverting 91 unrelated files.
- **D7 (type fallout)** covers the many small edits, type errors and test repairs after the contracts changed. It is mostly the "Other" column, so its number is the least precise.
- **G (mockups)** includes the design tool's long instruction text, which I received once and which sits in the conversation.
- **H2 (browser checks)** includes screenshots. I do not know the exact token cost of an image, so I treated each as a few thousand tokens.

## What these numbers do not include

- Tokens billed. Every turn re-reads the earlier conversation, so total billed input is far larger than 718k, and I cannot see that total.
- Anything compacted or dropped from the window before this reading.
- Output the app produced outside the conversation (for example, build logs I only read the last lines of cost only those lines).
