import {
  listDraftStorageKeys,
  readDraftStorageRaw,
  removeDraftStorageRaw,
  writeDraftStorageRaw,
} from './preferences';

export const EDITOR_DRAFT_VERSION = 1 as const;
const DRAFT_PREFIX = 'hts.editorDraft.v1.';

export interface EditorDraftPayload<TValues> {
  version: typeof EDITOR_DRAFT_VERSION;
  formId: string;
  recordId: string | null;
  savedAt: string;
  recordUpdatedAt: string | null;
  values: TValues;
}

export type SaveEditorDraftResult<TValues> =
  | { ok: true; draft: EditorDraftPayload<TValues> }
  | { ok: false; error: string };

export type LoadEditorDraftResult<TValues> =
  | { ok: true; draft: EditorDraftPayload<TValues> | null }
  | { ok: false; reason: 'corrupt' | 'storage_error'; error: string };

export type ClearEditorDraftResult = { ok: true } | { ok: false; error: string };

export function makeEditorDraftKey(formId: string, recordId: string | null): string {
  const safeForm = encodeURIComponent(formId);
  const safeRecord = recordId ? `edit.${encodeURIComponent(recordId)}` : 'new';
  return `${DRAFT_PREFIX}${safeForm}.${safeRecord}`;
}

export function saveEditorDraft<TValues>({
  formId,
  recordId,
  recordUpdatedAt,
  values,
  now = new Date(),
}: {
  formId: string;
  recordId: string | null;
  recordUpdatedAt: string | null;
  values: TValues;
  now?: Date;
}): SaveEditorDraftResult<TValues> {
  const draft: EditorDraftPayload<TValues> = {
    version: EDITOR_DRAFT_VERSION,
    formId,
    recordId,
    savedAt: now.toISOString(),
    recordUpdatedAt,
    values,
  };
  let serialized: string;
  try {
    serialized = JSON.stringify(draft);
  } catch {
    return { ok: false, error: 'Could not encode draft values.' };
  }
  const writeRes = writeDraftStorageRaw(makeEditorDraftKey(formId, recordId), serialized);
  if (!writeRes.ok) {
    return writeRes;
  }
  return { ok: true, draft };
}

export function loadEditorDraft<TValues>(
  formId: string,
  recordId: string | null,
  validateValues?: (raw: unknown) => raw is TValues,
): LoadEditorDraftResult<TValues> {
  const key = makeEditorDraftKey(formId, recordId);
  const readRes = readDraftStorageRaw(key);
  if (!readRes.ok) {
    return { ok: false, reason: 'storage_error', error: readRes.error };
  }
  if (readRes.raw === null) {
    return { ok: true, draft: null };
  }
  try {
    const parsed = JSON.parse(readRes.raw) as Partial<EditorDraftPayload<TValues>> | null;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.version !== EDITOR_DRAFT_VERSION ||
      parsed.formId !== formId ||
      parsed.recordId !== recordId ||
      typeof parsed.savedAt !== 'string' ||
      Number.isNaN(Date.parse(parsed.savedAt)) ||
      (parsed.recordUpdatedAt !== null && typeof parsed.recordUpdatedAt !== 'string') ||
      !('values' in parsed) ||
      (validateValues && !validateValues(parsed.values))
    ) {
      removeDraftStorageRaw(key);
      return {
        ok: false,
        reason: 'corrupt',
        error: 'Saved draft data was invalid and could not be restored.',
      };
    }
    return {
      ok: true,
      draft: parsed as EditorDraftPayload<TValues>,
    };
  } catch {
    removeDraftStorageRaw(key);
    return {
      ok: false,
      reason: 'corrupt',
      error: 'Saved draft data was unreadable and was cleared.',
    };
  }
}

export function clearEditorDraft(formId: string, recordId: string | null): ClearEditorDraftResult {
  return removeDraftStorageRaw(makeEditorDraftKey(formId, recordId));
}

export function isEditorDraftStale(
  draft: EditorDraftPayload<unknown> | null,
  currentRecordUpdatedAt: string | null,
): boolean {
  if (!draft || !draft.recordId || !currentRecordUpdatedAt || !draft.recordUpdatedAt) {
    return false;
  }
  return draft.recordUpdatedAt !== currentRecordUpdatedAt;
}

export function listSavedEditDraftRecordIds(formId: string): string[] {
  const prefix = `${DRAFT_PREFIX}${encodeURIComponent(formId)}.edit.`;
  const res = listDraftStorageKeys(prefix);
  if (!res.ok) return [];
  const ids: string[] = [];
  for (const key of res.keys) {
    const encoded = key.slice(prefix.length);
    if (!encoded) continue;
    try {
      ids.push(decodeURIComponent(encoded));
    } catch {
      // Ignore malformed key segments
    }
  }
  return ids;
}

