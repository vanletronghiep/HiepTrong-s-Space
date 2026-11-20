import {
  createEventInputSchema,
  eventItemSchema,
  occurrenceMutationSchema,
  ordinaryEventCategorySchema,
  patchEventInputSchema,
  type CreateEventInput,
  type EventItem,
  type EventOccurrence,
  type OccurrenceMutation,
  type PatchEventInput,
} from '@/contracts/event';
import { isWebUrl } from '@/domain/event-domain';
import {
  applyClassMutation,
  buildClassSchedule,
  classBaseFields,
  daysBetween,
  findClassConflict,
  listOccurrencesInRange,
  OccurrenceMutationError,
  resolveClassOccurrence,
  type ClassConflict,
} from '@/domain/event-occurrence';
import { isValidScheduledDate } from '@/contracts/task';
import { ConflictError, NotFoundError, ValidationError } from './errors';
import { JsonFileStore, type FormatBackupPolicy } from './storage/json-store';

/** Occurrence reads are bounded so clients request adjacent windows explicitly. */
export const MAX_OCCURRENCE_RANGE_DAYS = 366;

const V31_FIELDS = ['kind', 'highlighted', 'status', 'revision'] as const;

/** Records written before v3.1 lack the new discriminator fields. */
export const EVENTS_FORMAT_BACKUP: FormatBackupPolicy<EventItem> = {
  label: 'pre-v3.1',
  needsBackup: (items) =>
    items.some((item) => V31_FIELDS.some((field) => !Object.hasOwn(item, field))),
};

export interface EventServiceOptions {
  directory?: string;
  now?: () => Date;
}

export interface OccurrenceMutationResult {
  item: EventItem | null;
  occurrence: EventOccurrence | null;
  removed: boolean;
}

function normalize(raw: EventItem): EventItem {
  return eventItemSchema.parse(raw);
}

function conflictMessage(conflict: ClassConflict): string {
  return `“${conflict.title}” already occupies that timetable slot on ${conflict.date} (${conflict.startTime}–${conflict.endTime}). Choose another time, or cancel or delete that class first.`;
}

function toDomainError(error: unknown): never {
  if (error instanceof OccurrenceMutationError) {
    if (error.code === 'NOT_FOUND') throw new NotFoundError(error.message);
    if (error.code === 'CONFLICT') throw new ConflictError(error.message);
    throw new ValidationError(error.message, error.fieldErrors);
  }
  throw error;
}

export class EventService {
  private readonly store: JsonFileStore<EventItem>;
  private readonly now: () => Date;

  constructor(options: EventServiceOptions = {}) {
    this.store = new JsonFileStore<EventItem>('events.json', undefined, options.directory);
    this.now = options.now ?? (() => new Date());
  }

  /** Parsed, normalised records (no write side effects). */
  async listEvents(): Promise<EventItem[]> {
    const items = (await this.store.getAll()).map(normalize);
    return items.sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  }

  async getEvent(id: string): Promise<EventItem | null> {
    const item = await this.store.getById(id);
    return item ? normalize(item) : null;
  }

  async listOccurrences(from: string, to: string): Promise<EventOccurrence[]> {
    const fieldErrors: Record<string, string> = {};
    if (!isValidScheduledDate(from)) fieldErrors.from = 'Use a valid YYYY-MM-DD date';
    if (!isValidScheduledDate(to)) fieldErrors.to = 'Use a valid YYYY-MM-DD date';
    if (Object.keys(fieldErrors).length > 0) {
      throw new ValidationError('Occurrence range needs valid from and to dates', fieldErrors);
    }
    const span = daysBetween(from, to);
    if (span <= 0)
      throw new ValidationError('The range end must be after its start', {
        to: 'Choose a later end',
      });
    if (span > MAX_OCCURRENCE_RANGE_DAYS) {
      throw new ValidationError(`Request at most ${MAX_OCCURRENCE_RANGE_DAYS} days at a time`, {
        to: 'Shorten the range',
      });
    }
    return listOccurrencesInRange(await this.listEvents(), from, to);
  }

  /**
   * Runs a validated mutation under the events-file lock. All records are normalised on
   * write; the first format-changing write takes a timestamped pre-v3.1 backup plus a
   * count-only migration summary (storage layer).
   */
  private async mutate<R>(change: (items: EventItem[]) => { items: EventItem[]; result: R }) {
    return this.store.transaction((rawItems) => change(rawItems.map(normalize)), {
      formatBackup: EVENTS_FORMAT_BACKUP,
    });
  }

  async createEvent(input: CreateEventInput): Promise<EventItem> {
    const validated = createEventInputSchema.parse(input);
    if (validated.endAt && Date.parse(validated.endAt) < Date.parse(validated.startAt)) {
      throw new ValidationError('End must not precede start', {
        endAt: 'Choose an end after start',
      });
    }
    const nowIso = this.now().toISOString();
    const location = validated.location?.trim() || null;
    const base = {
      id: crypto.randomUUID(),
      title: validated.title.trim(),
      description: validated.description ?? null,
      originalCategory: null,
      startAt: validated.startAt,
      endAt: validated.endAt ?? null,
      locationType: validated.locationType ?? (isWebUrl(location) ? 'online' : 'in_person'),
      location,
      url: validated.url?.trim() || null,
      highlighted: validated.highlighted ?? false,
      status: 'active' as const,
      preparationTaskId: validated.preparationTaskId ?? null,
      recurrence: validated.recurrence ?? null,
      notes: validated.notes ?? null,
      revision: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (validated.kind === 'class') {
      if (!validated.endAt) {
        throw new ValidationError('A class needs an end time', { endAt: 'Choose an end time' });
      }
      let item: EventItem;
      try {
        const schedule = buildClassSchedule(
          {
            title: base.title,
            startAt: validated.startAt,
            endAt: validated.endAt,
            location,
            url: base.url,
            notes: base.notes,
            highlighted: base.highlighted,
          },
          validated.classRepeat ?? { weekly: true, endDate: null },
        );
        item = normalize({
          ...base,
          kind: 'class',
          category: null,
          isExam: false,
          classSchedule: schedule,
          ...classBaseFields(schedule),
        } as EventItem);
      } catch (error) {
        toDomainError(error);
      }
      return this.mutate((items) => {
        const conflict = findClassConflict(item, items);
        if (conflict) throw new ConflictError(conflictMessage(conflict));
        return { items: [item, ...items], result: item };
      });
    }

    const category = validated.category;
    if (!category) {
      throw new ValidationError('Choose a category', { category: 'Choose a category' });
    }
    const legacyAllowed = category === 'school' && validated.allowLegacyCategory === true;
    if (!legacyAllowed && !ordinaryEventCategorySchema.safeParse(category).success) {
      throw new ValidationError('School is no longer an event category; add a class instead', {
        category: 'Choose Exam, Meeting, Deadline, or Contest',
      });
    }
    // New events derive exam meaning from category; a legacy draft keeps its own flag.
    const isExam = category === 'exam' || (legacyAllowed && validated.isExam === true);
    const item = normalize({
      ...base,
      kind: 'event',
      category,
      isExam,
      classSchedule: null,
    } as EventItem);
    return this.mutate((items) => ({ items: [item, ...items], result: item }));
  }

  async updateEvent(id: string, rawPatch: PatchEventInput): Promise<EventItem | null> {
    const patch = patchEventInputSchema.parse(rawPatch);
    return this.mutate((items) => {
      const index = items.findIndex((item) => item.id === id);
      const existing = items[index];
      if (!existing) return { items, result: null };
      if (patch.expectedRevision !== undefined && patch.expectedRevision !== existing.revision) {
        throw new ConflictError(
          'This event changed since you opened it. Review the latest version before saving.',
        );
      }

      if (patch.convertToClass) {
        const converted = this.convertToClass(existing, patch, items);
        const next = [...items];
        next[index] = converted;
        return { items: next, result: converted };
      }

      if (existing.kind === 'class') {
        throw new ValidationError(
          'Edit classes through their occurrence scope (this week or onward)',
        );
      }

      const fields: Partial<PatchEventInput> = { ...patch };
      delete fields.expectedRevision;
      delete fields.convertToClass;
      const updated: EventItem = { ...existing, ...stripUndefined(fields) };
      if (patch.category !== undefined && patch.category !== existing.category) {
        if (!patch.category || !ordinaryEventCategorySchema.safeParse(patch.category).success) {
          throw new ValidationError('Choose Exam, Meeting, Deadline, or Contest', {
            category: 'Choose Exam, Meeting, Deadline, or Contest',
          });
        }
        // Explicit re-categorisation replaces any legacy exam flag with the category meaning.
        updated.isExam = patch.isExam ?? patch.category === 'exam';
      }
      if (patch.location !== undefined && patch.locationType === undefined) {
        updated.location = patch.location?.trim() || null;
        updated.locationType = isWebUrl(updated.location) ? 'online' : 'in_person';
      }
      if (updated.endAt && Date.parse(updated.endAt) < Date.parse(updated.startAt)) {
        throw new ValidationError('End must not precede start', {
          endAt: 'Choose an end after start',
        });
      }
      updated.revision = existing.revision + 1;
      updated.updatedAt = this.now().toISOString();
      const next = [...items];
      next[index] = normalize(updated);
      return { items: next, result: next[index] ?? null };
    });
  }

  private convertToClass(
    existing: EventItem,
    patch: PatchEventInput,
    items: EventItem[],
  ): EventItem {
    if (existing.kind === 'class') throw new ValidationError('This event is already a class');
    const repeat = patch.convertToClass!;
    const startAt = patch.startAt ?? existing.startAt;
    const endAt = patch.endAt ?? existing.endAt;
    if (!endAt) {
      throw new ValidationError('Choose the class end time before converting', {
        endAt: 'Choose an end time',
      });
    }
    try {
      const schedule = buildClassSchedule(
        {
          title: (patch.title ?? existing.title).trim(),
          startAt,
          endAt,
          location: patch.location !== undefined ? patch.location : existing.location,
          url: patch.url !== undefined ? patch.url : existing.url,
          notes: patch.notes !== undefined ? patch.notes : (existing.notes ?? null),
          highlighted: patch.highlighted ?? existing.highlighted,
        },
        repeat,
      );
      const converted = normalize({
        ...existing,
        kind: 'class',
        category: null,
        // Keeps the original ID and classification metadata (v3.1 §6.1, §8.3).
        originalCategory: existing.originalCategory ?? existing.category,
        classSchedule: schedule,
        ...classBaseFields(schedule),
        revision: existing.revision + 1,
        updatedAt: this.now().toISOString(),
      });
      const conflict = findClassConflict(converted, items);
      if (conflict) throw new ConflictError(conflictMessage(conflict));
      return converted;
    } catch (error) {
      toDomainError(error);
    }
  }

  /** Scoped class command: edit/cancel/delete for this week or this week onward. */
  async mutateOccurrence(
    id: string,
    rawMutation: OccurrenceMutation,
  ): Promise<OccurrenceMutationResult> {
    const mutation = occurrenceMutationSchema.parse(rawMutation);
    return this.mutate<OccurrenceMutationResult>((items) => {
      const index = items.findIndex((item) => item.id === id);
      const existing = items[index];
      if (!existing) throw new NotFoundError('Event not found');
      if (existing.kind !== 'class' || !existing.classSchedule) {
        throw new ValidationError('Only classes have scoped occurrences');
      }
      if (mutation.expectedRevision !== existing.revision) {
        throw new ConflictError(
          'This class changed since you opened it. Review the latest version before saving.',
        );
      }
      let outcome;
      try {
        outcome = applyClassMutation(existing.classSchedule, mutation);
      } catch (error) {
        toDomainError(error);
      }
      if (outcome.type === 'remove-record') {
        return {
          items: items.filter((item) => item.id !== id),
          result: { item: null, occurrence: null, removed: true },
        };
      }
      const updated = normalize({
        ...existing,
        classSchedule: outcome.schedule,
        ...classBaseFields(outcome.schedule),
        revision: existing.revision + 1,
        updatedAt: this.now().toISOString(),
      });
      if (mutation.action === 'edit') {
        const conflict = findClassConflict(updated, items);
        if (conflict) throw new ConflictError(conflictMessage(conflict));
      }
      const next = [...items];
      next[index] = updated;
      return {
        items: next,
        result: {
          item: updated,
          occurrence: resolveClassOccurrence(updated, mutation.originalWeek),
          removed: false,
        },
      };
    });
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.mutate((items) => {
      const existing = items.find((item) => item.id === id);
      if (!existing) return { items, result: false };
      if (existing.kind === 'class' && existing.classSchedule?.repeating) {
        throw new ValidationError(
          'Recurring classes keep their history; delete this week only or this week onward instead',
        );
      }
      return { items: items.filter((item) => item.id !== id), result: true };
    });
  }
}

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export const eventService = new EventService();
