import type {
  CreateEventInput,
  EventItem,
  OccurrenceMutation,
  PatchEventInput,
} from '@/contracts/event';
import {
  eventDraftRecordSchema,
  eventDraftSourceKey,
  patchEventDraftInputSchema,
  publishEventDraftInputSchema,
  saveEventDraftInputSchema,
  type EventDraftPublicationReceipt,
  type EventDraftRecord,
  type PatchEventDraftInput,
  type PublishEventDraftInput,
  type PublishEventDraftResult,
  type SaveEventDraftInput,
} from '@/contracts/event-draft';
import {
  editorTimes,
  editorValuesFromEvent,
  editorValuesFromOccurrence,
  eventEditorPatch,
  occurrenceEditFields,
  validateEditorValues,
} from '@/domain/event-editor-values';
import { resolveClassOccurrence } from '@/domain/event-occurrence';
import { ConflictError, NotFoundError, ValidationError } from './errors';
import { eventService, type OccurrenceMutationResult } from './event-service';
import { JsonFileStore, type FormatBackupPolicy } from './storage/json-store';

export interface EventStorePort {
  getEvent(id: string): Promise<EventItem | null>;
  createEvent(input: CreateEventInput): Promise<EventItem>;
  updateEvent(id: string, patch: PatchEventInput): Promise<EventItem | null>;
  mutateOccurrence(id: string, mutation: OccurrenceMutation): Promise<OccurrenceMutationResult>;
}

export interface EventDraftServiceOptions {
  directory?: string;
  events?: EventStorePort;
}

export interface SaveEventDraftResult {
  item: EventDraftRecord;
  created: boolean;
}

/** Drafts saved before v3.1 lack the kind/end/highlight/occurrence fields. */
const DRAFTS_FORMAT_BACKUP: FormatBackupPolicy<EventDraftRecord> = {
  label: 'pre-v3.1',
  needsBackup: (items) =>
    items.some(
      (item) =>
        !Object.hasOwn(item, 'occurrence') ||
        !Object.hasOwn(item.values ?? {}, 'kind') ||
        !Object.hasOwn(item.values ?? {}, 'highlighted'),
    ),
};

export class EventDraftService {
  private readonly draftsStore: JsonFileStore<EventDraftRecord>;
  private readonly receiptsStore: JsonFileStore<EventDraftPublicationReceipt>;
  private readonly events: EventStorePort;
  private mutex: Promise<void> = Promise.resolve();

  constructor(options: EventDraftServiceOptions = {}) {
    this.draftsStore = new JsonFileStore<EventDraftRecord>(
      'event-drafts.json',
      undefined,
      options.directory,
    );
    this.receiptsStore = new JsonFileStore<EventDraftPublicationReceipt>(
      'event-draft-receipts.json',
      undefined,
      options.directory,
    );
    this.events = options.events ?? eventService;
  }

  private async withLock<R>(fn: () => Promise<R>): Promise<R> {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previous = this.mutex;
    this.mutex = previous.then(
      () => gate,
      () => gate,
    );
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  /** Replaces one draft under the file lock; the first v3.1 write keeps a dated backup. */
  private async putDraft(draft: EventDraftRecord): Promise<void> {
    await this.draftsStore.transaction(
      (items) => ({
        items: [
          draft,
          ...items
            .filter((existing) => existing.id !== draft.id)
            .map((existing) => eventDraftRecordSchema.parse(existing)),
        ],
        result: undefined,
      }),
      { formatBackup: DRAFTS_FORMAT_BACKUP },
    );
  }

  async listDrafts(): Promise<EventDraftRecord[]> {
    const items = (await this.draftsStore.getAll()).map((item) =>
      eventDraftRecordSchema.parse(item),
    );
    return items.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }

  async getDraft(id: string): Promise<EventDraftRecord | null> {
    const item = await this.draftsStore.getById(id);
    return item ? eventDraftRecordSchema.parse(item) : null;
  }

  async saveDraft(input: SaveEventDraftInput): Promise<SaveEventDraftResult> {
    const parsed = saveEventDraftInputSchema.parse(input);
    // Older clients and imported browser drafts omit v3.1 fields; for edit drafts, take those
    // from the source instead of defaulting them, so an end time or highlight is never cleared.
    const rawValues = (input.values ?? {}) as Record<string, unknown>;
    const missing = (['endDate', 'endTime', 'highlighted'] as const).filter(
      (field) => !Object.hasOwn(rawValues, field),
    );
    if (missing.length > 0 && parsed.sourceEventId) {
      const source = await this.events.getEvent(parsed.sourceEventId);
      if (source) {
        const stored = editorValuesFromEvent(source);
        for (const field of missing) Object.assign(parsed.values, { [field]: stored[field] });
      }
    }
    return this.withLock(async () => {
      const drafts = (await this.draftsStore.getAll()).map((draft) =>
        eventDraftRecordSchema.parse(draft),
      );
      const nowIso = new Date().toISOString();
      const sourceKey = eventDraftSourceKey(parsed);

      const existingByImport = parsed.importKey
        ? drafts.find((draft) => draft.importKey === parsed.importKey)
        : undefined;
      // Class occurrence drafts are keyed by series + original week + scope, so two weeks of
      // one series never overwrite each other.
      const existingBySource =
        !existingByImport && sourceKey
          ? drafts.find((draft) => eventDraftSourceKey(draft) === sourceKey)
          : undefined;
      const existingById =
        !existingByImport && !existingBySource && parsed.id
          ? drafts.find((draft) => draft.id === parsed.id)
          : undefined;

      const existing = existingByImport ?? existingBySource ?? existingById;

      if (existing) {
        const updated: EventDraftRecord = eventDraftRecordSchema.parse({
          ...existing,
          sourceUpdatedAt:
            parsed.sourceUpdatedAt !== undefined
              ? parsed.sourceUpdatedAt
              : existing.sourceUpdatedAt,
          sourceRevision:
            parsed.sourceRevision !== undefined ? parsed.sourceRevision : existing.sourceRevision,
          values: parsed.values,
          importKey: existing.importKey ?? parsed.importKey ?? null,
          updatedAt: nowIso,
        });
        await this.putDraft(updated);
        return { item: updated, created: false };
      }

      const created: EventDraftRecord = eventDraftRecordSchema.parse({
        id: parsed.id ?? crypto.randomUUID(),
        sourceEventId: parsed.sourceEventId ?? null,
        sourceUpdatedAt: parsed.sourceUpdatedAt ?? null,
        sourceRevision: parsed.sourceRevision ?? null,
        occurrence: parsed.occurrence ?? null,
        values: parsed.values,
        importKey: parsed.importKey ?? null,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      await this.putDraft(created);
      return { item: created, created: true };
    });
  }

  async updateDraft(id: string, input: PatchEventDraftInput): Promise<EventDraftRecord | null> {
    const parsed = patchEventDraftInputSchema.parse(input);
    return this.withLock(async () => {
      const existing = await this.getDraft(id);
      if (!existing) return null;
      const updated = eventDraftRecordSchema.parse({
        ...existing,
        sourceUpdatedAt:
          parsed.sourceUpdatedAt !== undefined ? parsed.sourceUpdatedAt : existing.sourceUpdatedAt,
        sourceRevision:
          parsed.sourceRevision !== undefined ? parsed.sourceRevision : existing.sourceRevision,
        values: parsed.values ? { ...existing.values, ...parsed.values } : existing.values,
        updatedAt: new Date().toISOString(),
      });
      await this.putDraft(updated);
      return updated;
    });
  }

  async deleteDraft(id: string): Promise<boolean> {
    return this.withLock(async () => this.draftsStore.delete(id));
  }

  private assertFresh(draft: EventDraftRecord, current: EventItem, force: boolean): void {
    if (force) return;
    const revisionChanged =
      draft.sourceRevision !== null && draft.sourceRevision !== current.revision;
    const timestampChanged =
      draft.sourceRevision === null &&
      draft.sourceUpdatedAt !== null &&
      current.updatedAt !== draft.sourceUpdatedAt;
    if (revisionChanged || timestampChanged) {
      throw new ConflictError(
        'This event was updated after your draft was saved. Review changes before overwriting.',
      );
    }
  }

  private async recordPublication(
    draft: EventDraftRecord,
    eventId: string,
    mode: 'create' | 'update',
  ): Promise<void> {
    await this.receiptsStore.save({
      id: draft.id,
      draftId: draft.id,
      eventId,
      publishedAt: new Date().toISOString(),
      mode,
    });
    await this.draftsStore.delete(draft.id);
  }

  async publishDraft(
    id: string,
    options: PublishEventDraftInput = {},
  ): Promise<PublishEventDraftResult> {
    const parsedOptions = publishEventDraftInputSchema.parse(options);
    const force = parsedOptions.forceOverwrite === true;
    return this.withLock(async () => {
      // Idempotency: a draft that already published returns its event, never a second copy.
      const existingReceipt = await this.receiptsStore.getById(id);
      if (existingReceipt) {
        const publishedEvent = await this.events.getEvent(existingReceipt.eventId);
        if (publishedEvent) {
          await this.draftsStore.delete(id);
          return {
            event: publishedEvent,
            alreadyPublished: true,
            mode: existingReceipt.mode,
          };
        }
      }

      const rawDraft = await this.draftsStore.getById(id);
      const draft = rawDraft ? eventDraftRecordSchema.parse(rawDraft) : null;
      if (!draft) {
        throw new NotFoundError('Event draft not found');
      }
      // Drafts saved before v3.1 never carried end/highlight fields; they must not clear them.
      const rawValues = (rawDraft?.values ?? {}) as Record<string, unknown>;
      const legacyFields = (['endDate', 'endTime', 'highlighted'] as const).filter(
        (field) => !Object.hasOwn(rawValues, field),
      );
      let values = draft.values;
      // Legacy drafts (no source) may still publish their School category without conversion.
      const fieldErrors = validateEditorValues(values, {
        requireCategory: !draft.sourceEventId,
      });
      if (Object.keys(fieldErrors).length > 0) {
        throw new ValidationError(
          'Complete the required event fields before adding to schedule',
          fieldErrors,
        );
      }
      const title = values.title.trim();
      const { startAt, endAt } = editorTimes(values);

      if (draft.sourceEventId) {
        const currentEvent = await this.events.getEvent(draft.sourceEventId);
        if (!currentEvent) {
          throw new NotFoundError('Original event no longer exists');
        }
        this.assertFresh(draft, currentEvent, force);
        if (legacyFields.length > 0) {
          const stored = editorValuesFromEvent(currentEvent);
          values = { ...values };
          for (const field of legacyFields) Object.assign(values, { [field]: stored[field] });
        }

        if (draft.occurrence) {
          const occurrence = resolveClassOccurrence(currentEvent, draft.occurrence.originalWeek);
          if (!occurrence) throw new NotFoundError('This class occurrence no longer exists');
          const result = await this.events.mutateOccurrence(currentEvent.id, {
            action: 'edit',
            originalWeek: draft.occurrence.originalWeek,
            scope: draft.occurrence.scope,
            expectedRevision: currentEvent.revision,
            fields: occurrenceEditFields(
              values,
              draft.occurrence.scope,
              editorValuesFromOccurrence(occurrence, currentEvent),
            ),
          });
          if (!result.item) throw new NotFoundError('Original event no longer exists');
          await this.recordPublication(draft, result.item.id, 'update');
          return { event: result.item, alreadyPublished: false, mode: 'update' };
        }

        // Only changed fields are applied, so unrelated stored data is preserved.
        const patch = eventEditorPatch(currentEvent, values);
        if (!patch.title && title !== currentEvent.title) patch.title = title;
        const updatedEvent = await this.events.updateEvent(draft.sourceEventId, {
          ...patch,
          ...(force ? {} : { expectedRevision: currentEvent.revision }),
        });
        if (!updatedEvent) {
          throw new NotFoundError('Original event no longer exists');
        }
        await this.recordPublication(draft, updatedEvent.id, 'update');
        return { event: updatedEvent, alreadyPublished: false, mode: 'update' };
      }

      const location = values.location.trim() || null;
      const createdEvent =
        values.kind === 'class'
          ? await this.events.createEvent({
              kind: 'class',
              title,
              startAt,
              endAt,
              location,
              highlighted: values.highlighted,
              notes: values.notes.trim() || null,
              classRepeat: {
                weekly: values.classWeekly,
                endDate: values.classWeekly ? values.classEndDate.trim() || null : null,
              },
            })
          : await this.events.createEvent({
              kind: 'event',
              title,
              description: null,
              category: values.category,
              startAt,
              endAt,
              location,
              ...(values.isOnline ? { locationType: 'online' as const } : {}),
              highlighted: values.highlighted,
              isExam: values.isExam,
              notes: values.notes.trim() || null,
              allowLegacyCategory: values.category === 'school',
            });

      await this.recordPublication(draft, createdEvent.id, 'create');
      return { event: createdEvent, alreadyPublished: false, mode: 'create' };
    });
  }
}

export const eventDraftService = new EventDraftService();
