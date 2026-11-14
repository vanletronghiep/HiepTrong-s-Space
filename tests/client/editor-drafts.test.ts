// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearEditorDraft,
  isEditorDraftStale,
  listSavedEditDraftRecordIds,
  loadEditorDraft,
  makeEditorDraftKey,
  saveEditorDraft,
} from '@/client/editor-drafts';

interface SampleForm {
  title: string;
  count: number;
}

function isSampleForm(raw: unknown): raw is SampleForm {
  if (typeof raw !== 'object' || raw === null) return false;
  const candidate = raw as Record<string, unknown>;
  return typeof candidate.title === 'string' && typeof candidate.count === 'number';
}

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('editor-drafts persistence', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it('builds stable distinct create vs edit keys with safe URI encoding', () => {
    expect(makeEditorDraftKey('event', null)).toBe('hts.editorDraft.v1.event.new');
    expect(makeEditorDraftKey('event', 'evt/42?a=b')).toBe(
      'hts.editorDraft.v1.event.edit.evt%2F42%3Fa%3Db',
    );
  });

  it('saves, loads, and clears versioned drafts independently per form and record', () => {
    const savedNew = saveEditorDraft({
      formId: 'event',
      recordId: null,
      recordUpdatedAt: null,
      values: { title: 'Marine symposium', count: 1 },
      now: new Date('2026-11-13T07:00:00.000Z'),
    });
    expect(savedNew.ok).toBe(true);

    const savedEdit = saveEditorDraft({
      formId: 'event',
      recordId: 'evt-9',
      recordUpdatedAt: '2026-11-12T10:00:00.000Z',
      values: { title: 'Updated lecture', count: 2 },
      now: new Date('2026-11-13T08:00:00.000Z'),
    });
    expect(savedEdit.ok).toBe(true);

    const loadedNew = loadEditorDraft('event', null, isSampleForm);
    expect(loadedNew).toEqual({
      ok: true,
      draft: {
        version: 1,
        formId: 'event',
        recordId: null,
        savedAt: '2026-11-13T07:00:00.000Z',
        recordUpdatedAt: null,
        values: { title: 'Marine symposium', count: 1 },
      },
    });

    const loadedEdit = loadEditorDraft('event', 'evt-9', isSampleForm);
    expect(loadedEdit.ok).toBe(true);
    if (loadedEdit.ok && loadedEdit.draft) {
      expect(loadedEdit.draft.values.title).toBe('Updated lecture');
      expect(isEditorDraftStale(loadedEdit.draft, '2026-11-12T10:00:00.000Z')).toBe(false);
      expect(isEditorDraftStale(loadedEdit.draft, '2026-11-13T09:00:00.000Z')).toBe(true);
    }

    expect(listSavedEditDraftRecordIds('event')).toEqual(['evt-9']);

    clearEditorDraft('event', 'evt-9');
    expect(loadEditorDraft('event', 'evt-9', isSampleForm)).toEqual({ ok: true, draft: null });
    expect(loadEditorDraft('event', null, isSampleForm).ok).toBe(true);
  });

  it('rejects malformed or wrong-version drafts and cleans them up safely', () => {
    const key = makeEditorDraftKey('event', 'evt-bad');
    window.localStorage.setItem(key, JSON.stringify({ version: 99, formId: 'event' }));

    const result = loadEditorDraft('event', 'evt-bad', isSampleForm);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('corrupt');
    }
    expect(window.localStorage.getItem(key)).toBeNull();
  });

  it('surfaces explicit error on localStorage quota or write failure without throwing', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    const res = saveEditorDraft({
      formId: 'event',
      recordId: null,
      recordUpdatedAt: null,
      values: { title: 'Too large', count: 3 },
    });

    expect(res).toEqual({
      ok: false,
      error: 'Could not save draft locally because browser storage is full.',
    });
  });
});

