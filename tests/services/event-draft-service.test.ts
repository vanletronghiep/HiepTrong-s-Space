import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { eventItemSchema, type EventItem } from '@/contracts/event';
import type { EventDraftPublicationReceipt, EventDraftRecord } from '@/contracts/event-draft';
import { EventDraftService } from '@/services/event-draft-service';
import { JsonFileStore } from '@/services/storage/json-store';

const tempDirs: string[] = [];
const originalDataDir = process.env.DATA_DIR;

async function makeTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'event-draft-service-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  if (originalDataDir === undefined) {
    delete process.env.DATA_DIR;
  } else {
    process.env.DATA_DIR = originalDataDir;
  }
  vi.resetModules();
  vi.restoreAllMocks();
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

async function makeIsolatedModules() {
  const dir = await makeTempDir();
  await fs.writeFile(path.join(dir, 'events.json'), '[]', 'utf8');
  process.env.DATA_DIR = dir;
  vi.resetModules();
  const [
    { eventService },
    { EventDraftService: IsolatedEventDraftService },
    { listTimedSources },
    {
      ConflictError: IsolatedConflictError,
      NotFoundError: IsolatedNotFoundError,
      ValidationError: IsolatedValidationError,
    },
  ] = await Promise.all([
    import('@/services/event-service'),
    import('@/services/event-draft-service'),
    import('@/services/timed-sources'),
    import('@/services/errors'),
  ]);
  const draftService = new IsolatedEventDraftService({ directory: dir, events: eventService });
  return {
    dir,
    eventService,
    draftService,
    listTimedSources,
    ConflictError: IsolatedConflictError,
    NotFoundError: IsolatedNotFoundError,
    ValidationError: IsolatedValidationError,
  };
}

describe('EventDraftService', () => {
  it('supports multiple independent new-event drafts including incomplete fields without leaking into events or timed sources', async () => {
    const { dir, eventService, draftService, listTimedSources } = await makeIsolatedModules();

    const first = await draftService.saveDraft({
      values: {
        title: '',
        category: 'school',
        date: '',
        time: '',
        location: '',
        isOnline: false,
        isExam: false,
        notes: 'Early outline',
      },
    });
    const second = await draftService.saveDraft({
      values: {
        title: 'Midterm prep',
        category: 'exam',
        date: '2026-12-03',
        time: '00:15',
        location: 'Room 204',
        isOnline: false,
        isExam: true,
        notes: 'Bring **calculator**',
      },
    });

    expect(first.created).toBe(true);
    expect(second.created).toBe(true);
    expect(first.item.id).not.toBe(second.item.id);

    const reloadedService = new EventDraftService({ directory: dir, events: eventService });
    const drafts = await reloadedService.listDrafts();
    expect(drafts).toHaveLength(2);
    expect(drafts.map((d) => d.values.notes)).toContain('Early outline');

    expect(await eventService.listEvents()).toEqual([]);
    expect(await listTimedSources()).toEqual([]);
  });

  it('upserts one working edit draft per existing event and preserves untouched fields on PATCH', async () => {
    const { eventService, draftService } = await makeIsolatedModules();
    const existing = await eventService.createEvent({
      title: 'Original seminar',
      description: 'Legacy summary',
      category: 'meeting',
      startAt: '2026-11-22T09:00:00+07:00',
      endAt: '2026-11-22T11:00:00+07:00',
      locationType: 'in_person',
      location: 'Hall A',
      url: 'https://example.com/room',
      isExam: false,
      preparationTaskId: 'task-123',
      recurrence: { frequency: 'weekly', daysOfWeek: [0] },
      notes: 'Prepare slides',
    });

    const firstSave = await draftService.saveDraft({
      sourceEventId: existing.id,
      sourceUpdatedAt: existing.updatedAt,
      values: {
        title: 'Seminar draft v1',
        category: 'meeting',
        date: '2026-11-22',
        time: '09:00',
        location: 'Hall A',
        isOnline: false,
        isExam: false,
        notes: 'Prepare slides',
      },
    });
    expect(firstSave.created).toBe(true);

    const secondSave = await draftService.saveDraft({
      sourceEventId: existing.id,
      sourceUpdatedAt: existing.updatedAt,
      values: {
        title: 'Seminar draft v2',
        category: 'meeting',
        date: '2026-11-22',
        time: '14:30',
        location: 'Hall B',
        isOnline: false,
        isExam: false,
        notes: 'Updated notes',
      },
    });
    expect(secondSave.created).toBe(false);
    expect(secondSave.item.id).toBe(firstSave.item.id);
    expect(await draftService.listDrafts()).toHaveLength(1);

    const patched = await draftService.updateDraft(firstSave.item.id, {
      values: { title: 'Seminar draft v3' },
    });
    expect(patched?.values.title).toBe('Seminar draft v3');
    expect(patched?.values.time).toBe('14:30');
    expect(patched?.values.location).toBe('Hall B');
    expect(patched?.values.notes).toBe('Updated notes');
  });

  it('imports browser drafts idempotently by importKey even under concurrent requests', async () => {
    const { eventService, draftService } = await makeIsolatedModules();

    const results = await Promise.all([
      draftService.saveDraft({
        importKey: 'browser:event:new',
        values: {
          title: 'Imported workshop',
          category: 'school',
          date: '2026-12-01',
          time: '19:00',
          location: '',
          isOnline: true,
          isExam: false,
          notes: 'Zoom link pending',
        },
      }),
      draftService.saveDraft({
        importKey: 'browser:event:new',
        values: {
          title: 'Imported workshop',
          category: 'school',
          date: '2026-12-01',
          time: '19:00',
          location: '',
          isOnline: true,
          isExam: false,
          notes: 'Zoom link pending',
        },
      }),
    ]);

    expect(results.filter((r) => r.created)).toHaveLength(1);
    expect(results[0]!.item.id).toBe(results[1]!.item.id);
    expect(await draftService.listDrafts()).toHaveLength(1);
    expect(await eventService.listEvents()).toEqual([]);
  });

  it('rejects incomplete drafts on publishDraft while keeping the draft intact', async () => {
    const { eventService, draftService, ValidationError } = await makeIsolatedModules();

    const { item: badTitle } = await draftService.saveDraft({
      values: {
        title: '   ',
        category: 'school',
        date: '2026-11-25',
        time: '09:00',
        location: '',
        isOnline: false,
        isExam: false,
        notes: '',
      },
    });
    await expect(draftService.publishDraft(badTitle.id)).rejects.toBeInstanceOf(ValidationError);

    const { item: badDate } = await draftService.saveDraft({
      values: {
        title: 'Bad date',
        category: 'school',
        date: '2026-02-30',
        time: '09:00',
        location: '',
        isOnline: false,
        isExam: false,
        notes: '',
      },
    });
    await expect(draftService.publishDraft(badDate.id)).rejects.toBeInstanceOf(ValidationError);

    const { item: badTime } = await draftService.saveDraft({
      values: {
        title: 'Bad time',
        category: 'school',
        date: '2026-11-25',
        time: '24:00',
        location: '',
        isOnline: false,
        isExam: false,
        notes: '',
      },
    });
    await expect(draftService.publishDraft(badTime.id)).rejects.toBeInstanceOf(ValidationError);

    expect(await draftService.listDrafts()).toHaveLength(3);
    expect(await eventService.listEvents()).toEqual([]);
  });

  it('publishes new drafts cleanly with 24h midnight support and cleans up lingering drafts on retry via receipt', async () => {
    const { dir, eventService, draftService } = await makeIsolatedModules();

    const { item: draft } = await draftService.saveDraft({
      values: {
        title: '  Midnight deadline  ',
        category: 'deadline',
        date: '2026-11-21',
        time: '00:15',
        location: 'Online portal',
        isOnline: true,
        isExam: false,
        notes: 'Submit **PDF** report',
      },
    });

    const published = await draftService.publishDraft(draft.id);
    expect(published.alreadyPublished).toBe(false);
    expect(published.mode).toBe('create');
    expect(published.event.title).toBe('Midnight deadline');
    expect(published.event.startAt).toBe('2026-11-20T17:15:00.000Z');
    expect(published.event.description).toBeNull();
    expect(published.event.notes).toBe('Submit **PDF** report');
    expect(published.event.locationType).toBe('online');
    expect(await draftService.listDrafts()).toEqual([]);

    // Simulate a crash where receipt was recorded before the draft file deletion completed
    const draftsStore = new JsonFileStore<EventDraftRecord>('event-drafts.json', undefined, dir);
    await draftsStore.save(draft);

    const retried = await draftService.publishDraft(draft.id);
    expect(retried.alreadyPublished).toBe(true);
    expect(retried.mode).toBe('create');
    expect(retried.event.id).toBe(published.event.id);
    expect(await eventService.listEvents()).toHaveLength(1);
    expect(await draftService.listDrafts()).toEqual([]);

    const receiptsStore = new JsonFileStore<EventDraftPublicationReceipt>(
      'event-draft-receipts.json',
      undefined,
      dir,
    );
    expect(await receiptsStore.getById(draft.id)).not.toBeNull();
  });

  it('enforces NotFoundError on missing source events and ConflictError on stale edits unless forceOverwrite is true while preserving non-editor fields', async () => {
    const { eventService, draftService, ConflictError, NotFoundError } =
      await makeIsolatedModules();

    const original = await eventService.createEvent({
      title: 'Calculus Midterm',
      description: 'Legacy overview',
      category: 'exam',
      startAt: '2026-11-25T09:00:00+07:00',
      endAt: '2026-11-25T11:00:00.000Z',
      locationType: 'in_person',
      location: 'Auditorium 1',
      url: 'https://exam.example.com',
      isExam: true,
      preparationTaskId: 'prep-99',
      recurrence: { frequency: 'weekly', daysOfWeek: [3] },
      notes: 'Initial notes',
    });

    const { item: editDraft } = await draftService.saveDraft({
      sourceEventId: original.id,
      sourceUpdatedAt: original.updatedAt,
      values: {
        title: 'Calculus I Midterm (Revised)',
        category: 'exam',
        date: '2026-11-25',
        time: '13:30',
        location: 'Auditorium 2',
        isOnline: false,
        isExam: true,
        notes: 'Bring **2B pencil**',
      },
    });

    // External update invalidates sourceUpdatedAt
    await new Promise((resolve) => setTimeout(resolve, 10));
    const externallyUpdated = await eventService.updateEvent(original.id, {
      location: 'Auditorium 3',
    });
    expect(externallyUpdated?.updatedAt).not.toBe(original.updatedAt);

    await expect(draftService.publishDraft(editDraft.id)).rejects.toBeInstanceOf(ConflictError);
    expect(await draftService.getDraft(editDraft.id)).not.toBeNull();

    const forced = await draftService.publishDraft(editDraft.id, { forceOverwrite: true });
    expect(forced.alreadyPublished).toBe(false);
    expect(forced.mode).toBe('update');
    expect(forced.event.title).toBe('Calculus I Midterm (Revised)');
    expect(forced.event.location).toBe('Auditorium 2');
    expect(forced.event.endAt).toBe('2026-11-25T11:00:00.000Z');
    expect(forced.event.url).toBe('https://exam.example.com');
    expect(forced.event.preparationTaskId).toBe('prep-99');
    expect(forced.event.recurrence).toEqual({ frequency: 'weekly', daysOfWeek: [3] });
    expect(forced.event.description).toBe('Legacy overview');
    expect(await draftService.listDrafts()).toEqual([]);

    // Missing source event draft raises NotFoundError
    const { item: orphanDraft } = await draftService.saveDraft({
      sourceEventId: 'deleted-event-id',
      sourceUpdatedAt: null,
      values: {
        title: 'Orphaned update',
        category: 'school',
        date: '2026-11-29',
        time: '10:00',
        location: '',
        isOnline: false,
        isExam: false,
        notes: '',
      },
    });
    await expect(draftService.publishDraft(orphanDraft.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await draftService.getDraft(orphanDraft.id)).not.toBeNull();
  });

  it('recovers cleanly if receipt creation succeeds without throwing while mock delete fails or retries', async () => {
    const dir = await makeTempDir();
    const eventsStore = new JsonFileStore<EventItem>('events.json', undefined, dir);
    const seedEvent: EventItem = eventItemSchema.parse({
      id: 'evt-retry',
      title: 'Initial',
      description: null,
      category: 'school',
      startAt: '2026-12-05T10:00:00+07:00',
      endAt: null,
      locationType: 'in_person',
      location: null,
      url: null,
      isExam: false,
      preparationTaskId: null,
      recurrence: null,
      notes: null,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    });
    await eventsStore.save(seedEvent);

    const createEventSpy = vi.fn(async () => seedEvent);
    const updateEventSpy = vi.fn(async (_id: string, patch: Partial<EventItem>) => {
      const next = { ...seedEvent, ...patch, updatedAt: '2026-11-15T10:00:00.000Z' };
      await eventsStore.save(next);
      return next;
    });
    const service = new EventDraftService({
      directory: dir,
      events: {
        getEvent: (id) => eventsStore.getById(id),
        createEvent: createEventSpy,
        updateEvent: updateEventSpy,
        mutateOccurrence: vi.fn(),
      },
    });

    const { item: draft } = await service.saveDraft({
      sourceEventId: seedEvent.id,
      sourceUpdatedAt: seedEvent.updatedAt,
      values: {
        title: 'Updated once',
        category: 'school',
        date: '2026-12-05',
        time: '15:00',
        location: '',
        isOnline: false,
        isExam: false,
        notes: '',
      },
    });

    const first = await service.publishDraft(draft.id);
    expect(first.mode).toBe('update');
    expect(updateEventSpy).toHaveBeenCalledTimes(1);

    // Put draft back to mimic interrupted cleanup after receipt write, then retry
    await new JsonFileStore<EventDraftRecord>('event-drafts.json', undefined, dir).save(draft);
    const second = await service.publishDraft(draft.id);
    expect(second.alreadyPublished).toBe(true);
    expect(second.event.title).toBe('Updated once');
    expect(updateEventSpy).toHaveBeenCalledTimes(1);
    expect(await service.listDrafts()).toEqual([]);
  });
});
