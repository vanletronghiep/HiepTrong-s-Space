# Codebase Detox & Optimization Report: Hiep Trong Space

**Role:** Principal Software Engineer  
**Date:** March 2026 (System execution context: November 2026)  
**Status:** Complete  
**Repository:** `Hiep Trong's Space` (Local-first Next.js 15, React 19, TypeScript, TanStack Query, Drizzle ORM, SQLite)

---

## 1. Executive Summary

A comprehensive architectural audit, code detox, and reliability overhaul was executed across the entire repository. The system is a personal operating system built with local-first principles. Prior to this optimization, the codebase suffered from:
1. **Critical Client Serialization Defect:** Double-serialization in `apiRequest` and query modules causing JSON string wrappers (`"\"{\\\"title\\\":...}\""`) that triggered HTTP 400 Bad Request validation failures across 10 workspace features.
2. **Inconsistent API Error Envelope:** Split behavior between standard contracts (`ApiErrorResponse` `{ error: { code, message, fields } }`) and informal error shapes (`{ success: false, error: '...' }`), which stripped descriptive error messages on the client and hid validation details.
3. **Dead Mock Fixtures Bloat:** Hundreds of lines of static seed data and mock structures across multiple services (`ai-engineering`, `entertainment`, `flashcards`, `tracking`, `blogs`, `learning-room`, `projects`, `milestones`, `events`, `achievements`) that were entirely ignored by `JsonFileStore` (due to clean-profile empty store requirements) yet inflated memory footprints and maintenance overhead.
4. **Duplicate Window Listeners & Accessibility Gaps:** Redundant manual `keydown` listeners on `window` in feature views attempting to handle Escape keys, which collided with and duplicated accessible `Dialog` modal focus-trap and escape management.
5. **Fabricated Fallback Metrics & Date Parser Inconsistencies:** Hardcoded non-zero streaks and counts in fallback states that masked uninitialized data, alongside hardcoded timezone strings (`+07:00`) rather than canonical domain-driven timezone handling (`buildZonedInstant`).

### Summary of Outcomes:
- **Codebase Reduction:** Removed ~1,000+ lines of dead fixtures, redundant listeners, and duplicate wrappers.
- **Client Layer Standardization:** 100% of network calls now route through `apiRequest` in `api-client.ts`, with typed deserialization, automated header injection, and consistent `ApiError` propagation.
- **API Error Contract Uniformity:** All API endpoints standardized with `handleApiError`, `NotFoundError`, and `ValidationError`.
- **Verification Integrity:** All 34 test files (136 tests) pass cleanly in Vitest; ESLint reports 0 errors and 0 warnings; TypeScript compiler (`tsc --noEmit`) passes cleanly; production bundle (`next build`) builds all 35 routes without errors.

---

## 2. Findings

| ID | Category | Severity | Confidence | Impact | Finding Description | Disposition |
|---|---|---|---|---|---|---|
| **F-01** | Bugs & Reliability | **Critical** | Confirmed | Correctness | **Double JSON Stringification in `apiRequest`:** Calling `JSON.stringify` on pre-stringified bodies sent double-escaped strings to server routes, causing Zod schemas to fail. | **FIXED** |
| **F-02** | Architecture & Contracts | **High** | Confirmed | Maintainability / Reliability | **Non-standard API Error Envelopes:** Routes returned `{ success: false, error: '...' }` instead of the canonical `{ error: { code, message, fields } }`, degrading client error display. | **FIXED** |
| **F-03** | Code Detox | **High** | Confirmed | Maintainability | **Dead Seed Fixtures:** Large static seed arrays in 10 services were passed to `JsonFileStore` constructor but never read because clean profile initialization returns empty stores. | **FIXED** |
| **F-04** | Architecture | **Medium** | Confirmed | Maintainability | **Raw `fetch` in Client Queries:** Workspace feature query files directly used `window.fetch` with inconsistent error unpacking instead of `apiRequest`. | **FIXED** |
| **F-05** | Bugs & Reliability | **Medium** | Confirmed | Correctness | **Fabricated UI Fallbacks:** Views displayed fake non-zero streak days (e.g. `streakDays ?? 5` or `6`) rather than truthful zero counts for unpopulated profiles. | **FIXED** |
| **F-06** | UI/UX & Reliability | **Medium** | Confirmed | Accessibility / Reliability | **Redundant Escape Listeners:** Modals registered `window.addEventListener('keydown', ...)` duplicating the built-in accessible trap in `@/ui/Dialog`. | **FIXED** |
| **F-07** | Bugs & Reliability | **Low** | Confirmed | Correctness | **Non-canonical Date Construction:** Hardcoded string concatenation with `+07:00` in `EventsView` instead of domain utility `buildZonedInstant`. | **FIXED** |
| **F-08** | Architecture | **Medium** | Confirmed | Performance / Maintainability | **Overriding CSS in Views:** Direct CSS utility classes such as `text-white` applied over tokenized button variants in `ProjectsView`. | **FIXED** |

---

## 3. Changes Made

### A. Client Request Infrastructure (`src/client/`)
1. **`src/client/api-client.ts`**:
   - Implemented conditional body stringification: `typeof init.body === 'string' ? init.body : JSON.stringify(init.body)`.
   - Added robust error message extraction supporting both `ApiErrorResponse` (`{ error: { message, code, fields } }`) and legacy string formats (`{ error: '...' }`).
   - Standardized error instance creation as `ApiError`.
2. **Standardized Query Modules (`src/client/queries/`)**:
   - Migrated all query and mutation hooks across `achievements.ts`, `ai-engineering.ts`, `apcs.ts`, `blogs.ts`, `entertainment.ts`, `events.ts`, `flashcards.ts`, `learning-room.ts`, `milestones.ts`, `projects.ts`, `tracking.ts` to use `apiRequest`.
   - Removed manual `headers: { 'Content-Type': 'application/json' }` and `JSON.stringify(...)` boilerplate from every mutation call.
   - Standardized query key factories (`achievementKeys`, `blogKeys`, `entertainmentKeys`, `flashcardKeys`, `learningRoomKeys`, `trackingKeys`, `apcsKeys`).

### B. Server API Routes (`src/app/api/`)
1. **Error Handling & Validation**:
   - Replaced ad-hoc manual validation returns (`NextResponse.json({ error: ... }, { status: 400 })`) with `schema.parse(body)` and unified `handleApiError(err)`.
   - Replaced manual 404 returns with `throw new NotFoundError('...')`.
   - Applied across 16 API endpoints:
     - `src/app/api/events/[id]/route.ts`
     - `src/app/api/milestones/[id]/route.ts`
     - `src/app/api/milestones/[id]/toggle-landmark/route.ts`
     - `src/app/api/projects/[id]/route.ts`
     - `src/app/api/blogs/[id]/route.ts`
     - `src/app/api/blogs/route.ts`
     - `src/app/api/achievements/[id]/route.ts`
     - `src/app/api/achievements/route.ts`
     - `src/app/api/learning-room/route.ts`
     - `src/app/api/entertainment/route.ts`
     - `src/app/api/flashcards/route.ts`
     - `src/app/api/tracking/route.ts`
     - `src/app/api/ai-engineering/route.ts`
     - `src/app/api/apcs/file/route.ts`
     - `src/app/api/apcs/route.ts`
     - `src/app/api/apcs/search/route.ts`

### C. Service Storage Layer (`src/services/`)
1. **`src/services/storage/json-store.ts`**:
   - Made `_defaultSeed?: T[]` optional in `JsonFileStore` constructor.
2. **Services Detox**:
   - Removed static initial mock arrays and streamlined store initialization to `new JsonFileStore<T>('filename.json')` in:
     - `ai-engineering-service.ts` (-159 lines)
     - `entertainment-service.ts` (-113 lines)
     - `flashcard-service.ts` (-99 lines)
     - `tracking-service.ts` (-120 lines)
     - `blog-service.ts` (-187 lines)
     - `learning-room-service.ts` (-92 lines)
     - `project-service.ts` (-57 lines)
     - `milestone-service.ts` (-65 lines)
     - `event-service.ts` (-71 lines)
     - `achievement-service.ts` (-84 lines)

### D. UI/UX Views (`src/features/`)
1. **Removed Redundant Window Listeners**:
   - Removed duplicate `useEffect` registering `window.addEventListener('keydown', ...)` for Escape in `EventsView`, `AchievementsView`, `AiEngineeringView`, `ApcsView`, `EntertainmentView`, `MilestonesView`, `ProjectsView`, `TrackingView`.
2. **Truthful Empty/Zero Metrics**:
   - Changed fallback streaks in `LearningRoomView`, `TrackingView`, `ApcsView`, and `AiEngineeringView` to default to `0` or explicit empty state copy rather than fabricated non-zero numbers.
3. **Domain Date Construction**:
   - Updated `EventsView` to use `buildZonedInstant(newDate, normalizedTime)`.

---

## 4. Removed Code

| Target File | Removed Code | Justification & Evidence |
|---|---|---|
| `src/services/ai-engineering-service.ts` | `initialRoadmap`, `initialNotes` (~150 LOC) | Dead code. `JsonFileStore.load()` returns `[]` on missing files for user privacy and clean profiles. |
| `src/services/entertainment-service.ts` | `initialBooks`, `initialGames`, `initialMusic` (~110 LOC) | Dead code. Static seed ignored at runtime. |
| `src/services/flashcard-service.ts` | `initialDecks`, `initialCards` (~95 LOC) | Dead code. Static seed ignored at runtime. |
| `src/services/tracking-service.ts` | `initialHabits`, `initialSleepLogs`, `initialScreenTimeLogs` (~120 LOC) | Dead code. Static seed ignored at runtime. |
| `src/services/blog-service.ts` | `initialArticles` (~185 LOC) | Dead code. Static seed ignored at runtime. |
| `src/services/learning-room-service.ts` | `initialSessions` (~85 LOC) | Dead code. Static seed ignored at runtime. |
| `src/services/project-service.ts` | `initialProjects` (~57 LOC) | Dead code. Static seed ignored at runtime. |
| `src/services/milestone-service.ts` | `initialMilestones` (~65 LOC) | Dead code. Static seed ignored at runtime. |
| `src/services/event-service.ts` | `initialEvents` (~71 LOC) | Dead code. Static seed ignored at runtime. |
| `src/services/achievement-service.ts` | `initialAchievements` (~84 LOC) | Dead code. Static seed ignored at runtime. |
| 8 feature view files | Window `keydown` Escape listeners | Redundant and colliding with `@/ui/Dialog`'s focus trap and escape handler. |
| Query modules | Manual `fetch` and `.json().catch()` blocks | Replaced with unified `apiRequest`. |

---

## 5. Bug Fixes

### 1. Client Double-Serialization Defect
- **Root Cause:** `apiRequest` in `src/client/api-client.ts` unconditionally executed `init.body = JSON.stringify(init.body)`. Any query hook that passed `JSON.stringify(payload)` produced a JSON string literal instead of a JSON object payload.
- **Correction:** Checked `typeof init.body === 'string' ? init.body : JSON.stringify(init.body)` in `api-client.ts`. Also migrated callers to pass objects directly.
- **Regression Protection:** Added unit test suite `tests/client/api-client.test.ts` testing both raw objects and pre-serialized JSON strings.

### 2. Masked API Errors
- **Root Cause:** API routes returned custom shapes like `{ success: false, error: 'Not found' }`. Because `api-client.ts` only parsed `{ error: { message } }`, the client threw generic fallback errors ("Request failed with status 404") masking the actual message.
- **Correction:** All API endpoints standardized with `handleApiError`, returning canonical `{ error: { code, message, fields } }`. `api-client.ts` also gained fallback extraction for any lingering legacy string errors.
- **Regression Protection:** Unit tests in `tests/client/api-client.test.ts` and route tests in `tests/server/engineering-routes.test.ts`.

### 3. Date Timezone Shift in Events
- **Root Cause:** Direct string concatenation with `+07:00` in UI layer bypassed domain timezone rules and could create invalid ISO timestamps.
- **Correction:** Replaced with `buildZonedInstant(newDate, normalizedTime)`.
- **Regression Protection:** Covered by existing `tests/domain/event-calendar.test.ts` and `tests/domain/time.test.ts`.

---

## 6. Performance & Resource Efficiency

1. **Bundle Size & Memory Footprint:**
   - Eliminating ~1,000 lines of dead static data arrays reduces the server and client bundle weights and prevents unnecessary in-memory object allocation on module evaluation.
2. **Network Protocol Efficiency:**
   - By eliminating raw fetch calls with duplicate manual headers, and standardizing on single-roundtrip `apiRequest`, client request serialization is clean and deterministic.
3. **Event Listener Optimization:**
   - Removing 8 uncoordinated `window.addEventListener('keydown')` listeners reduces unnecessary global event dispatching across modal lifecycles.
4. **Cache Invalidation Precision:**
   - Replaced scattered string query keys with structured key factories (`taskKeys`, `projectKeys`, `achievementKeys`, etc.), enabling targeted query cache invalidations without over-fetching unrelated queries.

---

## 7. Verification Results

| Verification Activity | Tool / Suite | Command | Result | Status |
|---|---|---|---|---|
| **Static Linting** | ESLint 9 | `npm run lint` | 0 errors, 0 warnings | **VERIFIED** |
| **Type Checking** | TypeScript 5.8 | `npm run typecheck` | 0 errors (`tsc --noEmit` clean) | **VERIFIED** |
| **Unit & Integration Tests** | Vitest 3.2.7 | `npm test` | **34 passed (34), 136 passed (136)** | **VERIFIED** |
| **Production Build** | Next.js 15.5.28 | `npm run build` | **All 35 static/dynamic routes compiled successfully** | **VERIFIED** |
| **Double-Serialization Unit Tests** | Vitest | `tests/client/api-client.test.ts` | 4/4 passing | **VERIFIED** |
| **Structured Route Error Tests** | Vitest | `tests/server/engineering-routes.test.ts` | 5/5 passing | **VERIFIED** |
| **Event Calendar Timezone Tests** | Vitest | `tests/domain/event-calendar.test.ts` | 1/1 passing | **VERIFIED** |
| **Protected File Integrity** | Git | `git status` | Untracked protected files untouched | **VERIFIED** |
| **Interactive UX in Live Browser** | Headless / Manual | — | Headless CLI environment; automated tests simulate DOM/events | **NOT VERIFIED** (In browser) |

---

## 8. Remaining Risks & Deferred Items

1. **User Drafts in Workspace Views (DEFERRED):**
   - In-progress local state in views like `DailySky` and `HomeJourney` was preserved as uncommitted user work per instructions. These uncommitted changes remain untouched in the working tree.
2. **Live Browser Visual Testing (DEFERRED):**
   - While DOM component tests (`@testing-library/react`) pass for draft sessions, month views, dialogs, and popovers, real browser visual regression testing was deferred as no browser harness is available in the non-interactive CLI environment.

---

## 9. Further Recommendations

1. **Continuous Route Testing:** Expand `tests/server/engineering-routes.test.ts` to cover every workspace POST/PATCH route with explicit Zod edge-case payloads.
2. **Shared Mutation Hook Pattern:** Further abstract TanStack Query mutations into a typed domain hook helper to eliminate repetitive `invalidateQueries` calls.
3. **Database Migration Sync:** Keep `drizzle.config.ts` and runtime `.env` `DATA_DIR` synchronized before running CLI schema migrations, as noted in repository guidelines.

