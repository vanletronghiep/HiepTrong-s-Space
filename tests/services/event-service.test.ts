import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildZonedInstant } from '@/domain/time';
import { ConflictError, ValidationError } from '@/services/errors';
import { EventService } from '@/services/event-service';

const dirs: string[] = [];
const NOW = new Date('2026-11-17T03:00:00.000Z');

async function setup(seed?: unknown[]) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'event-service-'));
  dirs.push(dir);
  if (seed)
    await fs.writeFile(path.join(dir, 'events.json'), JSON.stringify(seed, null, 2), 'utf8');
  return { dir, service: new EventService({ directory: dir, now: () => NOW }) };
}

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

const LEGACY = [
  {
    id: 'legacy-school',
    title: 'Old seminar',
    description: 'Separate description',
    category: 'school',
    startAt: '2026-11-18T07:30:00+07:00',
    endAt: null,
    locationType: 'in_person',
    location: 'Room 4',
    url: 'https://example.com/legacy',
    isExam: true,
    preparationTaskId: 'prep-1',
    recurrence: { frequency: 'weekly', daysOfWeek: [3] },
    notes: 'Legacy notes',
    unknownLegacyField: { keep: true },
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

function classInput(title: string, date: string, start = '07:30', end = '09:30', weekly = true) {
  return {
    kind: 'class' as const,
    title,
    startAt: buildZonedInstant(date, start),
    endAt: buildZonedInstant(date, end),
    classRepeat: { weekly, endDate: null },
  };
}

describe('EventService compatibility and migration', () => {
  it('normalises legacy records on read without writing, and preserves every field on a title-only edit', async () => {
    const { dir, service } = await setup(LEGACY);
    const before = await fs.readFile(path.join(dir, 'events.json'), 'utf8');
    const [record] = await service.listEvents();
    expect(record).toMatchObject({ kind: 'event', highlighted: false, revision: 0, isExam: true });
    expect(await fs.readFile(path.join(dir, 'events.json'), 'utf8')).toBe(before);

    const updated = await service.updateEvent('legacy-school', {
      title: 'Renamed',
      expectedRevision: 0,
    });
    expect(updated).toMatchObject({
      title: 'Renamed',
      category: 'school',
      isExam: true,
      location: 'Room 4',
      url: 'https://example.com/legacy',
      description: 'Separate description',
      notes: 'Legacy notes',
      preparationTaskId: 'prep-1',
      recurrence: { frequency: 'weekly', daysOfWeek: [3] },
      unknownLegacyField: { keep: true },
      revision: 1,
    });
  });

  it('takes one timestamped pre-v3.1 backup and a content-free summary before the first format-changing write', async () => {
    const { dir, service } = await setup(LEGACY);
    await service.updateEvent('legacy-school', { title: 'First write' });
    await service.updateEvent('legacy-school', { title: 'Second write' });
    const files = await fs.readdir(dir);
    const backups = files.filter(
      (name) => name.startsWith('events.json.pre-v3.1-') && name.endsWith('.bak'),
    );
    const summaries = files.filter((name) => name.endsWith('.summary.json'));
    expect(backups).toHaveLength(1);
    expect(JSON.parse(await fs.readFile(path.join(dir, backups[0]!), 'utf8'))).toEqual(LEGACY);
    const summary = JSON.parse(await fs.readFile(path.join(dir, summaries[0]!), 'utf8'));
    expect(summary).toMatchObject({ records: 1, recordsInOlderFormat: 1, label: 'pre-v3.1' });
    expect(JSON.stringify(summary)).not.toContain('Old seminar');
  });

  it('rejects stale revisions and keeps the original bytes when a write fails validation', async () => {
    const { dir, service } = await setup(LEGACY);
    await expect(
      service.updateEvent('legacy-school', { title: 'Stale', expectedRevision: 7 }),
    ).rejects.toBeInstanceOf(ConflictError);
    const before = await fs.readFile(path.join(dir, 'events.json'), 'utf8');
    await expect(
      service.updateEvent('legacy-school', { endAt: '2026-11-17T00:00:00+07:00' }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(await fs.readFile(path.join(dir, 'events.json'), 'utf8')).toBe(before);
  });

  it('blocks School for new ordinary events but allows legacy draft publication; categories derive exam meaning', async () => {
    const { service } = await setup([]);
    const base = { title: 'X', startAt: '2026-11-20T09:00:00+07:00' };
    await expect(service.createEvent({ ...base, category: 'school' })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(service.createEvent({ ...base })).rejects.toBeInstanceOf(ValidationError);
    const legacy = await service.createEvent({
      ...base,
      category: 'school',
      allowLegacyCategory: true,
    });
    expect(legacy.category).toBe('school');
    const contest = await service.createEvent({ ...base, category: 'contest', isExam: true });
    expect(contest.isExam).toBe(false);
    const exam = await service.createEvent({ ...base, category: 'exam' });
    expect(exam.isExam).toBe(true);
    const online = await service.createEvent({
      ...base,
      category: 'meeting',
      location: 'https://meet.example.com/x',
    });
    expect(online.locationType).toBe('online');
    expect(online.highlighted).toBe(false);
  });

  it('explicitly converts a legacy School event to a class, keeping its ID and original classification', async () => {
    const { service } = await setup(LEGACY);
    const converted = await service.updateEvent('legacy-school', {
      expectedRevision: 0,
      endAt: '2026-11-18T09:30:00+07:00',
      convertToClass: { weekly: false, endDate: null },
    });
    expect(converted).toMatchObject({
      id: 'legacy-school',
      kind: 'class',
      category: null,
      originalCategory: 'school',
      classSchedule: { repeating: false, startWeek: '2026-11-16' },
    });
    const occurrences = await service.listOccurrences('2026-11-16', '2026-12-31');
    expect(occurrences).toHaveLength(1);
    expect(occurrences[0]?.period).toBe(0);
  });
});

describe('EventService classes and scoped occurrences', () => {
  it('creates classes, blocks a conflicting class naming the class and week, and allows other slots', async () => {
    const { service } = await setup([]);
    await service.createEvent(classInput('Math', '2026-11-16'));
    await expect(service.createEvent(classInput('Chem', '2027-03-01'))).rejects.toThrow(
      /Math.*2027-03-01/,
    );
    await expect(
      service.createEvent(classInput('Bio', '2026-11-16', '09:30', '11:30')),
    ).resolves.toBeTruthy();
  });

  it('keeps a multi-period lesson as one occurrence and blocks overlaps and extensions over it', async () => {
    const { service } = await setup([]);
    const calculus = await service.createEvent(
      classInput('Calculus I', '2026-11-16', '13:30', '17:30'),
    );
    const [occurrence, ...rest] = await service.listOccurrences('2026-11-16', '2026-11-23');
    expect(rest).toHaveLength(0);
    expect(occurrence).toMatchObject({ period: 2, periodEnd: 3, title: 'Calculus I' });

    // Any overlap with the covered span is refused, with the clashing lesson named.
    await expect(
      service.createEvent(classInput('Physics', '2026-11-16', '15:30', '17:30')),
    ).rejects.toThrow(/Calculus I.*2026-11-16/);

    // A neighbouring period is free; extending the lesson over it is then refused.
    const bio = await service.createEvent(classInput('Bio', '2026-11-16', '09:30', '11:30'));
    await expect(
      service.mutateOccurrence(bio.id, {
        action: 'edit',
        originalWeek: '2026-11-16',
        scope: 'this-week',
        expectedRevision: bio.revision,
        fields: { endTime: '11:30', startTime: '07:30' },
      }),
    ).resolves.toBeTruthy();
    await expect(
      service.mutateOccurrence(calculus.id, {
        action: 'edit',
        originalWeek: '2026-11-16',
        scope: 'this-week-onward',
        expectedRevision: calculus.revision,
        fields: { startTime: '09:30' },
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('applies scoped edits through the occurrence command and rejects stale revisions', async () => {
    const { service } = await setup([]);
    const math = await service.createEvent(classInput('Math', '2026-11-16'));
    const result = await service.mutateOccurrence(math.id, {
      action: 'edit',
      originalWeek: '2026-11-23',
      scope: 'this-week',
      expectedRevision: 0,
      fields: { title: 'Math review', highlighted: true },
    });
    expect(result.occurrence).toMatchObject({ title: 'Math review', highlighted: true });
    await expect(
      service.mutateOccurrence(math.id, {
        action: 'cancel',
        originalWeek: '2026-11-30',
        scope: 'this-week',
        expectedRevision: 0,
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    const weeks = await service.listOccurrences('2026-11-16', '2026-12-07');
    expect(weeks.map((o) => o.title)).toEqual(['Math', 'Math review', 'Math']);
  });

  it('refuses unscoped deletion of a recurring class but deletes a single class', async () => {
    const { service } = await setup([]);
    const weekly = await service.createEvent(classInput('Weekly', '2026-11-16'));
    await expect(service.deleteEvent(weekly.id)).rejects.toBeInstanceOf(ValidationError);
    const single = await service.createEvent(
      classInput('Once', '2026-11-17', '07:30', '09:30', false),
    );
    await expect(service.deleteEvent(single.id)).resolves.toBe(true);
  });

  it('serialises simultaneous class creation so only one can take a cell', async () => {
    const { service } = await setup([]);
    const results = await Promise.allSettled([
      service.createEvent(classInput('A', '2026-11-18')),
      service.createEvent(classInput('B', '2026-11-18')),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
  });

  it('validates occurrence ranges and bounds them to 366 days', async () => {
    const { service } = await setup([]);
    await expect(service.listOccurrences('2026-01-01', '2027-01-03')).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(service.listOccurrences('2026-02-30', '2026-03-01')).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(service.listOccurrences('2026-03-02', '2026-03-01')).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(service.listOccurrences('2026-01-01', '2027-01-02')).resolves.toEqual([]);
  });

  it('keeps defaults, overrides, highlights, and cancellations across a restart', async () => {
    const { dir, service } = await setup([]);
    const math = await service.createEvent(classInput('Math', '2026-11-16'));
    await service.mutateOccurrence(math.id, {
      action: 'cancel',
      originalWeek: '2026-11-30',
      scope: 'this-week',
      expectedRevision: 0,
    });
    const reloaded = new EventService({ directory: dir, now: () => NOW });
    const occurrences = await reloaded.listOccurrences('2026-11-30', '2026-12-07');
    expect(occurrences[0]).toMatchObject({ title: 'Math', status: 'canceled' });
  });
});
