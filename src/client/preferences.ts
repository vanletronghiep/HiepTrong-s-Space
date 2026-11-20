export type DailyViewMode = 'day' | 'week' | 'month';
export type FeatureCollectionLayout = 'horizontal' | 'vertical';

const STORAGE_KEYS = {
  dailyView: 'hts.daily.view',
  featureCollectionLayout: 'hts.featureCollection.layout',
  loadHistory: 'hts.routeLoadHistory',
  activeStudySession: 'hts.learning.activeSession',
  studyPlanConfig: 'hts.learning.planConfig',
  focusSoundMuted: 'hts.focus.soundMuted',
  focusRitualDay: 'hts.focus.ritualDay',
  activeTask: 'hts.daily.activeTask',
} as const;

function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota or private-mode failures
  }
}

export function getDailyViewPreference(): DailyViewMode {
  const raw = safeGetItem(STORAGE_KEYS.dailyView);
  if (raw === 'day' || raw === 'week' || raw === 'month') {
    return raw;
  }
  return 'day';
}

export function setDailyViewPreference(mode: DailyViewMode): void {
  safeSetItem(STORAGE_KEYS.dailyView, mode);
}

export function getFeatureCollectionLayoutPreference(): FeatureCollectionLayout {
  const raw = safeGetItem(STORAGE_KEYS.featureCollectionLayout);
  if (raw === 'horizontal' || raw === 'vertical') {
    return raw;
  }
  return 'horizontal';
}

export function setFeatureCollectionLayoutPreference(layout: FeatureCollectionLayout): void {
  safeSetItem(STORAGE_KEYS.featureCollectionLayout, layout);
}

/** Raw JSON of measured route load durations used by the route loader's estimate (v3.2). */
export function getRouteLoadHistoryRaw(): string | null {
  return safeGetItem(STORAGE_KEYS.loadHistory);
}

export function setRouteLoadHistoryRaw(value: string): void {
  safeSetItem(STORAGE_KEYS.loadHistory, value);
}

/** Raw JSON of the running Focus Room session, so a refresh resumes it (v4.0). */
export function getActiveStudySessionRaw(): string | null {
  return safeGetItem(STORAGE_KEYS.activeStudySession);
}

export function setActiveStudySessionRaw(value: string | null): void {
  if (value === null) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(STORAGE_KEYS.activeStudySession);
    } catch {
      // Ignore storage failures.
    }
    return;
  }
  safeSetItem(STORAGE_KEYS.activeStudySession, value);
}

export function getStudyPlanConfigRaw(): string | null {
  return safeGetItem(STORAGE_KEYS.studyPlanConfig);
}

export function setStudyPlanConfigRaw(value: string): void {
  safeSetItem(STORAGE_KEYS.studyPlanConfig, value);
}

/** The day ('YYYY-MM-DD') the four focus commitments were last confirmed. */
export function getFocusRitualDay(): string | null {
  return safeGetItem(STORAGE_KEYS.focusRitualDay);
}

export function setFocusRitualDay(day: string): void {
  safeSetItem(STORAGE_KEYS.focusRitualDay, day);
}

/** Whether the Focus Room phase chimes are muted. */
export function getFocusSoundMuted(): boolean {
  return safeGetItem(STORAGE_KEYS.focusSoundMuted) === '1';
}

export function setFocusSoundMuted(muted: boolean): void {
  safeSetItem(STORAGE_KEYS.focusSoundMuted, muted ? '1' : '0');
}

export type DraftStorageReadResult =
  { ok: true; raw: string | null } | { ok: false; error: string };

export type DraftStorageWriteResult = { ok: true } | { ok: false; error: string };

function formatStorageError(error: unknown, fallback: string): string {
  if (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  ) {
    return 'Could not save draft locally because browser storage is full.';
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readDraftStorageRaw(key: string): DraftStorageReadResult {
  if (!hasLocalStorage()) {
    return { ok: false, error: 'Browser storage is unavailable outside a client session.' };
  }
  try {
    return { ok: true, raw: window.localStorage.getItem(key) };
  } catch (error) {
    return {
      ok: false,
      error: formatStorageError(error, 'Could not read saved draft from local storage.'),
    };
  }
}

export function writeDraftStorageRaw(key: string, value: string): DraftStorageWriteResult {
  if (!hasLocalStorage()) {
    return { ok: false, error: 'Browser storage is unavailable outside a client session.' };
  }
  try {
    window.localStorage.setItem(key, value);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: formatStorageError(error, 'Could not save draft to local storage.'),
    };
  }
}

export function removeDraftStorageRaw(key: string): DraftStorageWriteResult {
  if (!hasLocalStorage()) {
    return { ok: false, error: 'Browser storage is unavailable outside a client session.' };
  }
  try {
    window.localStorage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: formatStorageError(error, 'Could not remove saved draft from local storage.'),
    };
  }
}

export function listDraftStorageKeys(
  prefix: string,
): { ok: true; keys: string[] } | { ok: false; error: string } {
  if (!hasLocalStorage()) {
    return { ok: false, error: 'Browser storage is unavailable outside a client session.' };
  }
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    return { ok: true, keys };
  } catch (error) {
    return {
      ok: false,
      error: formatStorageError(error, 'Could not inspect saved drafts in local storage.'),
    };
  }
}

/** Raw JSON of the Daily "Active task" focus state (v3.4). */
export function getActiveTaskRaw(): string | null {
  return safeGetItem(STORAGE_KEYS.activeTask);
}

export function setActiveTaskRaw(value: string | null): void {
  if (value === null) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(STORAGE_KEYS.activeTask);
    } catch {
      // Ignore storage failures.
    }
    return;
  }
  safeSetItem(STORAGE_KEYS.activeTask, value);
}
