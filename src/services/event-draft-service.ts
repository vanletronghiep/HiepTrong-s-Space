import { isValidScheduledDate } from '@/contracts/task';
import type { CreateEventInput, EventItem } from '@/contracts/event';
import {
  eventDraftRecordSchema,
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
import { buildZonedInstant } from '@/domain/time';
import { ConflictError, NotFoundError, ValidationError } from './errors';
import { eventService } from './event-service';
import { JsonFileStore } from './storage/json-store';

const TIME_24H_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export interface EventStorePort {
  getEvent(id: string): Promise<EventItem | null>;
  createEvent(input: CreateEventInput): Promise<EventItem>;
  updateEvent(id: string, patch: Partial<CreateEventInput>): Promise<EventItem | null>;
}

export interface EventDraftServiceOptions {
  directory?: string;
  events?: EventStorePort;
}

export interface SaveEventDraftResult {
  item: EventDraftRecord;
  created: boolean;
}

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

  async listDrafts(): Promise<EventDraftRecord[]> {
    const items = await this.draftsStore.getAll();
    for (const item of items) {
      eventDraftRecordSchema.parse(item);
    }
    return [...items].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }

  async getDraft(id: string): Promise<EventDraftRecord | null> {
    const item = await this.draftsStore.getById(id);
    return item ? eventDraftRecordSchema.parse(item) : null;
  }

  async saveDraft(input: SaveEventDraftInput): Promise<SaveEventDraftResult> {
    const parsed = saveEventDraftInputSchema.parse(input);
    return this.withLock(async () => {
      const drafts = await this.draftsStore.getAll();
      const nowIso = new Date().toISOString();

      const existingByImport = parsed.importKey
        ? drafts.find((draft) => draft.importKey === parsed.importKey)
        : undefined;
      const existingBySource =
        !existingByImport && parsed.sourceEventId
          ? drafts.find((draft) => draft.sourceEventId === parsed.sourceEventId)
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
          values: parsed.values,
          importKey: existing.importKey ?? parsed.importKey ?? null,
          updatedAt: nowIso,
        });
        await this.draftsStore.save(updated);
        return { item: updated, created: false };
      }

      const created: EventDraftRecord = eventDraftRecordSchema.parse({
        id: parsed.id ?? crypto.randomUUID(),
        sourceEventId: parsed.sourceEventId ?? null,
        sourceUpdatedAt: parsed.sourceUpdatedAt ?? null,
        values: parsed.values,
        importKey: parsed.importKey ?? null,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      await this.draftsStore.save(created);
      return { item: created, created: true };
    });
  }

  async updateDraft(id: string, input: PatchEventDraftInput): Promise<EventDraftRecord | null> {
    const parsed = patchEventDraftInputSchema.parse(input);
    return this.withLock(async () => {
      return this.draftsStore.modify(id, (existing) =>
        eventDraftRecordSchema.parse({
          ...existing,
          sourceUpdatedAt:
            parsed.sourceUpdatedAt !== undefined
              ? parsed.sourceUpdatedAt
              : existing.sourceUpdatedAt,
          values: parsed.values ? { ...existing.values, ...parsed.values } : existing.values,
          updatedAt: new Date().toISOString(),
        }),
      );
    });
  }

  async deleteDraft(id: string): Promise<boolean> {
    return this.withLock(async () => this.draftsStore.delete(id));
  }

  async publishDraft(
    id: string,
    options: PublishEventDraftInput = {},
  ): Promise<PublishEventDraftResult> {
    const parsedOptions = publishEventDraftInputSchema.parse(options);
    return this.withLock(async () => {
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

      const draft = await this.draftsStore.getById(id);
      if (!draft) {
        throw new NotFoundError('Event draft not found');
      }

      const fieldErrors: Record<string, string> = {};
      const title = draft.values.title.trim();
      if (!title) {
        fieldErrors.title = 'Title is required';
      } else if (title.length > 200) {
        fieldErrors.title = 'Title must be 200 characters or fewer';
      }

      const date = draft.values.date.trim();
      if (!isValidScheduledDate(date)) {
        fieldErrors.date = 'Choose a valid date in YYYY-MM-DD format';
      }

      const time = draft.values.time.trim();
      if (!TIME_24H_RE.test(time)) {
        fieldErrors.time = 'Choose a valid 24-hour time in HH:mm format';
      }

      if (Object.keys(fieldErrors).length > 0) {
        throw new ValidationError(
          'Complete the required event fields before adding to schedule',
          fieldErrors,
        );
      }

      const startAt = buildZonedInstant(date, time);
      const location = draft.values.location.trim() || null;
      const locationType = draft.values.isOnline ? 'online' : 'in_person';
      const isExam = draft.values.isExam || draft.values.category === 'exam';
      const notes = draft.values.notes.trim() || null;

      if (draft.sourceEventId) {
        const currentEvent = await this.events.getEvent(draft.sourceEventId);
        if (!currentEvent) {
          throw new NotFoundError('Original event no longer exists');
        }
        if (
          draft.sourceUpdatedAt &&
          currentEvent.updatedAt !== draft.sourceUpdatedAt &&
          !parsedOptions.forceOverwrite
        ) {
          throw new ConflictError(
            'This event was updated after your draft was saved. Review changes before overwriting.',
          );
        }

        const updatedEvent = await this.events.updateEvent(draft.sourceEventId, {
          title,
          category: draft.values.category,
          startAt,
          location,
          locationType,
          isExam,
          notes,
        });
        if (!updatedEvent) {
          throw new NotFoundError('Original event no longer exists');
        }

        await this.receiptsStore.save({
          id: draft.id,
          draftId: draft.id,
          eventId: updatedEvent.id,
          publishedAt: new Date().toISOString(),
          mode: 'update',
        });
        await this.draftsStore.delete(draft.id);

        return {
          event: updatedEvent,
          alreadyPublished: false,
          mode: 'update',
        };
      }

      const createdEvent = await this.events.createEvent({
        title,
        description: null,
        category: draft.values.category,
        startAt,
        location,
        locationType,
        isExam,
        notes,
      });

      await this.receiptsStore.save({
        id: draft.id,
        draftId: draft.id,
        eventId: createdEvent.id,
        publishedAt: new Date().toISOString(),
        mode: 'create',
      });
      await this.draftsStore.delete(draft.id);

      return {
        event: createdEvent,
        alreadyPublished: false,
        mode: 'create',
      };
    });
  }
}

export const eventDraftService = new EventDraftService();
