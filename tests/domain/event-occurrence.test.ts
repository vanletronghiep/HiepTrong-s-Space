import { describe, expect, it } from 'vitest';
import {
  eventItemSchema,
  type ClassSchedule,
  type EventItem,
  type OccurrenceMutation,
} from '@/contracts/event';
import {
  addDays,
  applyClassMutation,
  buildClassSchedule,
  computeOccurrenceStats,
  findClassConflict,
  isOccurrenceExpired,
  isOccurrenceOngoing,
  isoWeekday,
  listOccurrencesInRange,
  matchTimetableSpan,
  occurrenceDateSpan,
  resolveClassOccurrence,
  selectHighlights,
  weekStartOf,
} from '@/domain/event-occurrence';
import { buildZonedInstant } from '@/domain/time';

const NOW_ISO = '2026-11-17T03:00:00.000Z';

function classEvent(schedule: ClassSchedule, id = 'series-a', title = 'A'): EventItem {
  return eventItemSchema.parse({
    id,
    kind: 'class',
    title,
    category: null,
    startAt: buildZonedInstant(schedule.startWeek, '07:30'),
    endAt: buildZonedInstant(schedule.startWeek, '09:30'),
    classSchedule: schedule,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  });
}

function mondayClass(
  title: string,
  startDate: string,
  period: [string, string] = ['07:30', '09:30'],
) {
  return buildClassSchedule(
    {
      title,
      startAt: buildZonedInstant(startDate, period[0]),
      endAt: buildZonedInstant(startDate, period[1]),
      location: null,
      url: null,
      notes: null,
      highlighted: false,
    },
    { weekly: true, endDate: null },
  );
}

function mutate(
  schedule: ClassSchedule,
  mutation: Omit<OccurrenceMutation, 'expectedRevision'>,
): ClassSchedule {
  const outcome = applyClassMutation(schedule, mutation);
  if (outcome.type !== 'updated') throw new Error('expected updated schedule');
  return outcome.schedule;
}

function titleIn(event: EventItem, week: string): string | null {
  return resolveClassOccurrence(event, week)?.title ?? null;
}

describe('calendar-date helpers (Asia/Saigon Monday–Sunday)', () => {
  it('computes ISO weekdays, Monday week starts, and year boundaries', () => {
    expect(isoWeekday('2026-11-16')).toBe(1);
    expect(isoWeekday('2026-11-22')).toBe(7);
    expect(weekStartOf('2026-11-22')).toBe('2026-11-16');
    expect(weekStartOf('2027-01-01')).toBe('2026-12-28');
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
    expect(weekStartOf('2028-02-29')).toBe('2028-02-28');
  });

  it('keeps Saigon midnight on the right local day regardless of host timezone', () => {
    const late = { startAt: '2026-11-16T16:30:00.000Z', endAt: '2026-11-16T17:00:00.000Z' };
    // 23:30–00:00 Saigon on 16 Nov; ends exactly at midnight so it does not touch 17 Nov.
    expect(occurrenceDateSpan(late)).toEqual({ first: '2026-11-16', last: '2026-11-16' });
  });
});

describe('recurrence precedence — dated acceptance example (v3.1 §7.3)', () => {
  // Monday 07:30 class A from 16 Nov; week of 30 Nov customised to B; default C from 14 Dec;
  // then default D set in the week of 23 Nov.
  let schedule = mondayClass('A', '2026-11-16');
  schedule = mutate(schedule, {
    action: 'edit',
    originalWeek: '2026-11-30',
    scope: 'this-week',
    fields: { title: 'B' },
  });
  schedule = mutate(schedule, {
    action: 'edit',
    originalWeek: '2026-12-14',
    scope: 'this-week-onward',
    fields: { title: 'C' },
  });
  schedule = mutate(schedule, {
    action: 'edit',
    originalWeek: '2026-11-23',
    scope: 'this-week-onward',
    fields: { title: 'D' },
  });
  const series = classEvent(schedule);

  it('resolves A, D, B, D, C, C across the weeks', () => {
    expect(titleIn(series, '2026-11-16')).toBe('A');
    expect(titleIn(series, '2026-11-23')).toBe('D');
    expect(titleIn(series, '2026-11-30')).toBe('B');
    expect(titleIn(series, '2026-12-07')).toBe('D');
    expect(titleIn(series, '2026-12-14')).toBe('C');
    expect(titleIn(series, '2027-03-01')).toBe('C');
  });

  it('promotes the 30 Nov override to the default until 14 Dec and drops the redundant override', () => {
    const promoted = mutate(schedule, {
      action: 'edit',
      originalWeek: '2026-11-30',
      scope: 'this-week-onward',
    });
    expect(promoted.overrides['2026-11-30']).toBeUndefined();
    const event = classEvent(promoted);
    expect(titleIn(event, '2026-11-23')).toBe('D');
    expect(titleIn(event, '2026-11-30')).toBe('B');
    expect(titleIn(event, '2026-12-07')).toBe('B');
    expect(titleIn(event, '2026-12-14')).toBe('C');
  });

  it('cancels only 7 Dec, keeps it visible, and lets an independent replacement occupy its cell', () => {
    const canceled = mutate(schedule, {
      action: 'cancel',
      originalWeek: '2026-12-07',
      scope: 'this-week',
    });
    const event = classEvent(canceled);
    const occurrence = resolveClassOccurrence(event, '2026-12-07');
    expect(occurrence?.status).toBe('canceled');
    expect(occurrence?.title).toBe('D');
    expect(resolveClassOccurrence(event, '2026-11-30')?.status).toBe('active');
    expect(resolveClassOccurrence(event, '2026-12-14')?.status).toBe('active');

    const replacement = classEvent(
      buildClassSchedule(
        {
          title: 'Replacement',
          startAt: buildZonedInstant('2026-12-07', '07:30'),
          endAt: buildZonedInstant('2026-12-07', '09:30'),
          location: null,
          url: null,
          notes: null,
          highlighted: false,
        },
        { weekly: false, endDate: null },
      ),
      'replacement',
      'Replacement',
    );
    expect(findClassConflict(replacement, [event])).toBeNull();
    expect(findClassConflict(replacement, [classEvent(schedule)])).toMatchObject({
      eventId: 'series-a',
      week: '2026-12-07',
    });
  });

  it('deletes the series from 14 Dec without touching the replacement or earlier history', () => {
    const deleted = mutate(schedule, {
      action: 'delete',
      originalWeek: '2026-12-14',
      scope: 'this-week-onward',
    });
    const event = classEvent(deleted);
    expect(titleIn(event, '2026-12-07')).toBe('D');
    expect(titleIn(event, '2026-11-30')).toBe('B');
    expect(titleIn(event, '2026-12-14')).toBeNull();
    expect(titleIn(event, '2027-01-04')).toBeNull();
    expect(deleted.defaults.map((revision) => revision.title)).toEqual(['A', 'D']);
  });
});

describe('scoped class edits, cancellation, and deletion', () => {
  const base = mondayClass('Physics', '2026-11-16');

  it('edits only the selected week when Set Default is unchecked', () => {
    const edited = classEvent(
      mutate(base, {
        action: 'edit',
        originalWeek: '2026-11-23',
        scope: 'this-week',
        fields: { title: 'Lab' },
      }),
    );
    expect(titleIn(edited, '2026-11-16')).toBe('Physics');
    expect(titleIn(edited, '2026-11-23')).toBe('Lab');
    expect(titleIn(edited, '2026-11-30')).toBe('Physics');
  });

  it('keeps an occurrence’s original-week identity when its date moves into another week', () => {
    const moved = classEvent(
      mutate(base, {
        action: 'edit',
        originalWeek: '2026-11-23',
        scope: 'this-week',
        fields: { date: '2026-12-02' },
      }),
    );
    const occurrence = resolveClassOccurrence(moved, '2026-11-23');
    expect(occurrence?.key).toBe('series-a@2026-11-23');
    const inDestination = listOccurrencesInRange([moved], '2026-11-30', '2026-12-07');
    expect(inDestination.map((o) => o.key).sort()).toEqual([
      'series-a@2026-11-23',
      'series-a@2026-11-30',
    ]);
    expect(listOccurrencesInRange([moved], '2026-11-23', '2026-11-30')).toHaveLength(0);
  });

  it('cancel this week onward cancels already-customised future weeks and a later default cannot undo it', () => {
    let schedule = mutate(base, {
      action: 'edit',
      originalWeek: '2026-12-14',
      scope: 'this-week',
      fields: { title: 'Custom' },
    });
    schedule = mutate(schedule, {
      action: 'edit',
      originalWeek: '2027-01-04',
      scope: 'this-week-onward',
      fields: { title: 'Later default' },
    });
    schedule = mutate(schedule, {
      action: 'cancel',
      originalWeek: '2026-11-30',
      scope: 'this-week-onward',
    });
    const event = classEvent(schedule);
    expect(resolveClassOccurrence(event, '2026-11-23')?.status).toBe('active');
    expect(resolveClassOccurrence(event, '2026-12-14')).toMatchObject({
      title: 'Custom',
      status: 'canceled',
    });
    expect(resolveClassOccurrence(event, '2027-01-11')).toMatchObject({
      title: 'Later default',
      status: 'canceled',
    });
  });

  it('delete this week only suppresses the week and the default never revives it', () => {
    let schedule = mutate(base, {
      action: 'delete',
      originalWeek: '2026-11-30',
      scope: 'this-week',
    });
    schedule = mutate(schedule, {
      action: 'edit',
      originalWeek: '2026-11-23',
      scope: 'this-week-onward',
      fields: { title: 'Renamed' },
    });
    const event = classEvent(schedule);
    expect(titleIn(event, '2026-11-30')).toBeNull();
    expect(titleIn(event, '2026-12-07')).toBe('Renamed');
  });

  it('allows explicit past-week correction while later defaults never rewrite prior weeks', () => {
    let schedule = mutate(base, {
      action: 'edit',
      originalWeek: '2026-11-16',
      scope: 'this-week',
      fields: { title: 'Corrected' },
    });
    schedule = mutate(schedule, {
      action: 'edit',
      originalWeek: '2026-11-30',
      scope: 'this-week-onward',
      fields: { title: 'New default' },
    });
    const event = classEvent(schedule);
    expect(titleIn(event, '2026-11-16')).toBe('Corrected');
    expect(titleIn(event, '2026-11-23')).toBe('Physics');
    expect(titleIn(event, '2026-11-30')).toBe('New default');
  });

  it('treats the optional end date as inclusive and creates single-week classes without future occurrences', () => {
    const finite = buildClassSchedule(
      {
        title: 'Seminar',
        startAt: buildZonedInstant('2026-11-18', '13:30'),
        endAt: buildZonedInstant('2026-11-18', '15:30'),
        location: null,
        url: null,
        notes: null,
        highlighted: false,
      },
      { weekly: true, endDate: '2026-12-02' },
    );
    const event = classEvent(finite);
    expect(listOccurrencesInRange([event], '2026-11-16', '2027-01-01')).toHaveLength(3);

    const single = classEvent(
      buildClassSchedule(
        {
          title: 'One-off',
          startAt: buildZonedInstant('2026-11-18', '13:30'),
          endAt: buildZonedInstant('2026-11-18', '15:30'),
          location: null,
          url: null,
          notes: null,
          highlighted: false,
        },
        { weekly: false, endDate: null },
      ),
    );
    expect(listOccurrencesInRange([single], '2026-11-01', '2027-06-01')).toHaveLength(1);
  });

  it('removes a single class record when its only occurrence is deleted', () => {
    const single = buildClassSchedule(
      {
        title: 'One-off',
        startAt: buildZonedInstant('2026-11-18', '13:30'),
        endAt: buildZonedInstant('2026-11-18', '15:30'),
        location: null,
        url: null,
        notes: null,
        highlighted: false,
      },
      { weekly: false, endDate: null },
    );
    expect(
      applyClassMutation(single, {
        action: 'delete',
        originalWeek: '2026-11-16',
        scope: 'this-week',
      }),
    ).toEqual({ type: 'remove-record' });
  });
});

describe('timetable conflicts over the full future', () => {
  const monday = mondayClass('Math', '2026-11-16');

  it('detects same-cell, future-only, and beyond-12-week overlaps of unbounded schedules', () => {
    const math = classEvent(monday, 'math', 'Math');
    const lateStart = classEvent(mondayClass('Chem', '2027-09-06'), 'chem', 'Chem');
    expect(findClassConflict(lateStart, [math])).toMatchObject({
      eventId: 'math',
      date: '2027-09-06',
    });
  });

  it('does not conflict across a finite end boundary or with canceled slots or other periods', () => {
    const finite = buildClassSchedule(
      {
        title: 'Old',
        startAt: buildZonedInstant('2026-11-16', '07:30'),
        endAt: buildZonedInstant('2026-11-16', '09:30'),
        location: null,
        url: null,
        notes: null,
        highlighted: false,
      },
      { weekly: true, endDate: '2026-12-06' },
    );
    const later = classEvent(mondayClass('New', '2026-12-07'), 'new', 'New');
    expect(findClassConflict(later, [classEvent(finite, 'old', 'Old')])).toBeNull();

    const canceledFrom = classEvent(
      mutate(monday, { action: 'cancel', originalWeek: '2026-12-07', scope: 'this-week-onward' }),
      'math',
      'Math',
    );
    expect(findClassConflict(later, [canceledFrom])).toBeNull();

    const afternoon = classEvent(mondayClass('Bio', '2026-11-16', ['13:30', '15:30']), 'bio');
    expect(findClassConflict(afternoon, [classEvent(monday, 'math')])).toBeNull();
  });

  it('blocks moving an occurrence into an occupied cell and names the class and week', () => {
    const math = classEvent(monday, 'math', 'Math');
    const tuesday = buildClassSchedule(
      {
        title: 'Lit',
        startAt: buildZonedInstant('2026-11-17', '07:30'),
        endAt: buildZonedInstant('2026-11-17', '09:30'),
        location: null,
        url: null,
        notes: null,
        highlighted: false,
      },
      { weekly: true, endDate: null },
    );
    const moved = mutate(tuesday, {
      action: 'edit',
      originalWeek: '2026-12-14',
      scope: 'this-week',
      fields: { date: '2026-12-14' },
    });
    expect(findClassConflict(classEvent(moved, 'lit', 'Lit'), [math])).toEqual({
      eventId: 'math',
      title: 'Math',
      week: '2026-12-14',
      date: '2026-12-14',
      startTime: '07:30',
      endTime: '09:30',
    });
  });

  it('ignores ordinary events for occupancy', () => {
    const ordinary = eventItemSchema.parse({
      id: 'meeting',
      title: 'Meeting',
      category: 'meeting',
      startAt: buildZonedInstant('2026-11-23', '07:30'),
      endAt: buildZonedInstant('2026-11-23', '09:30'),
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    });
    expect(findClassConflict(classEvent(monday), [ordinary])).toBeNull();
  });

  it('blocks any time overlap, including custom-time lessons, but not touching ranges', () => {
    const outOfSlot = classEvent(mondayClass('Club', '2026-11-16', ['07:45', '09:00']), 'club');
    expect(resolveClassOccurrence(outOfSlot, '2026-11-16')?.period).toBeNull();
    // 07:45–09:00 overlaps the 07:30–09:30 period on every Monday.
    expect(findClassConflict(classEvent(monday), [outOfSlot])).toMatchObject({
      eventId: 'club',
      date: '2026-11-16',
    });
    // 09:30–11:30 starts exactly when 07:30–09:30 ends, so the two only touch.
    const touching = classEvent(mondayClass('Bio', '2026-11-16', ['09:30', '11:30']), 'bio');
    expect(findClassConflict(touching, [classEvent(monday, 'math')])).toBeNull();
  });

  it('blocks a multi-period lesson that overlaps another lesson on any covered period', () => {
    const physics = classEvent(
      mondayClass('Physics', '2026-11-16', ['15:30', '17:30']),
      'physics',
      'Physics',
    );
    const calculus = classEvent(
      mondayClass('Calculus I', '2026-11-16', ['13:30', '17:30']),
      'calculus',
      'Calculus I',
    );
    expect(findClassConflict(calculus, [physics])).toMatchObject({
      eventId: 'physics',
      date: '2026-11-16',
    });
    // Shrinking Calculus to the first afternoon period clears the conflict.
    const shorter = classEvent(
      mondayClass('Calculus I', '2026-11-16', ['13:30', '15:30']),
      'calculus',
      'Calculus I',
    );
    expect(findClassConflict(shorter, [physics])).toBeNull();
  });

  it('blocks extending an existing lesson over another lesson when edited for this week onward', () => {
    const math = classEvent(monday, 'math', 'Math');
    const history = classEvent(
      mondayClass('History', '2026-11-16', ['09:30', '11:30']),
      'history',
      'History',
    );
    const extended = mutate(history.classSchedule!, {
      action: 'edit',
      originalWeek: '2026-11-23',
      scope: 'this-week-onward',
      fields: { startTime: '07:30' },
    });
    expect(findClassConflict(classEvent(extended, 'history', 'History'), [math])).toMatchObject({
      eventId: 'math',
      date: '2026-11-23',
    });
  });
});

describe('timetable spans', () => {
  it('matches one period or consecutive periods inside the morning or afternoon', () => {
    expect(matchTimetableSpan('07:30', '09:30')).toEqual({ start: 0, end: 0 });
    expect(matchTimetableSpan('07:30', '11:30')).toEqual({ start: 0, end: 1 });
    expect(matchTimetableSpan('13:30', '17:30')).toEqual({ start: 2, end: 3 });
    expect(matchTimetableSpan('15:30', '17:30')).toEqual({ start: 3, end: 3 });
  });

  it('rejects spans across lunch, backwards spans, and custom times', () => {
    expect(matchTimetableSpan('09:30', '15:30')).toBeNull();
    expect(matchTimetableSpan('15:30', '13:30')).toBeNull();
    expect(matchTimetableSpan('07:45', '09:30')).toBeNull();
    expect(matchTimetableSpan('07:30', '10:00')).toBeNull();
  });

  it('reports the first and last period on a class occurrence', () => {
    const calculus = classEvent(
      mondayClass('Calculus I', '2026-11-16', ['13:30', '17:30']),
      'calculus',
      'Calculus I',
    );
    const occurrence = resolveClassOccurrence(calculus, '2026-11-16')!;
    expect(occurrence.period).toBe(2);
    expect(occurrence.periodEnd).toBe(3);
  });
});

describe('expiry, highlights, and counts', () => {
  const now = new Date(NOW_ISO); // 17 Nov 2026 10:00 Saigon (Tuesday)
  const make = (id: string, fields: Partial<EventItem>) =>
    eventItemSchema.parse({
      id,
      title: id,
      category: 'meeting',
      startAt: NOW_ISO,
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
      ...fields,
    });

  it('expires exactly at endAt, or at startAt without an end, and marks ongoing events', () => {
    const ending = listOccurrencesInRange(
      [make('ending', { startAt: '2026-11-17T02:00:00.000Z', endAt: NOW_ISO })],
      '2026-11-16',
      '2026-11-23',
    )[0]!;
    expect(isOccurrenceExpired(ending, now)).toBe(true);
    const ongoing = listOccurrencesInRange(
      [make('ongoing', { startAt: '2026-11-17T02:00:00.000Z', endAt: '2026-11-17T04:00:00.000Z' })],
      '2026-11-16',
      '2026-11-23',
    )[0]!;
    expect(isOccurrenceExpired(ongoing, now)).toBe(false);
    expect(isOccurrenceOngoing(ongoing, now)).toBe(true);
    const noEnd = listOccurrencesInRange([make('instant', {})], '2026-11-16', '2026-11-23')[0]!;
    expect(isOccurrenceExpired(noEnd, now)).toBe(true);
  });

  it('selects opted-in, non-canceled, unexpired occurrences in start order with stable ties', () => {
    const start = '2026-11-20T02:00:00.000Z';
    const occurrences = listOccurrencesInRange(
      [
        make('b', { startAt: start, highlighted: true }),
        make('a', { startAt: start, highlighted: true }),
        make('later', { startAt: '2026-11-25T02:00:00.000Z', highlighted: true }),
        make('plain', { startAt: '2026-11-19T02:00:00.000Z' }),
        make('canceled', {
          startAt: '2026-11-19T02:00:00.000Z',
          highlighted: true,
          status: 'canceled',
        }),
        make('old', { startAt: '2026-11-10T02:00:00.000Z', highlighted: true }),
      ],
      '2026-11-01',
      '2027-01-01',
    );
    expect(selectHighlights(occurrences, now).map((o) => o.key)).toEqual(['a', 'b', 'later']);
  });

  it('keeps highlights within 14 days of now and never includes classes', () => {
    const lesson = classEvent(
      buildClassSchedule(
        {
          title: 'Math',
          startAt: buildZonedInstant('2026-11-17', '13:30'),
          endAt: buildZonedInstant('2026-11-17', '15:30'),
          location: null,
          url: null,
          notes: null,
          highlighted: true,
        },
        { weekly: true, endDate: null },
      ),
      'math',
      'Math',
    );
    const occurrences = listOccurrencesInRange(
      [
        make('day-13', { startAt: '2026-11-30T02:00:00.000Z', highlighted: true }),
        // Exactly 14 days after now (03:00Z on the 17th) is the last instant that still counts.
        make('day-14', { startAt: '2026-12-01T03:00:00.000Z', highlighted: true }),
        make('day-15', { startAt: '2026-12-01T03:00:01.000Z', highlighted: true }),
        make('ongoing', {
          startAt: '2026-11-17T02:00:00.000Z',
          endAt: '2026-11-17T04:00:00.000Z',
          highlighted: true,
        }),
        lesson,
      ],
      '2026-11-01',
      '2027-01-01',
    );
    expect(selectHighlights(occurrences, now).map((o) => o.key)).toEqual([
      'ongoing',
      'day-13',
      'day-14',
    ]);
  });

  it('counts this week, upcoming, and upcoming exams including preserved legacy flags', () => {
    const occurrences = listOccurrencesInRange(
      [
        make('exam', { category: 'exam', startAt: '2026-11-20T02:00:00.000Z' }),
        make('legacy', { category: 'school', isExam: true, startAt: '2026-11-22T02:00:00.000Z' }),
        make('far-exam', { category: 'exam', startAt: '2026-12-20T02:00:00.000Z' }),
        make('canceled-exam', {
          category: 'exam',
          status: 'canceled',
          startAt: '2026-11-19T02:00:00.000Z',
        }),
      ],
      '2026-11-17',
      '2027-02-09',
    );
    expect(computeOccurrenceStats(occurrences, now)).toEqual({
      upcomingCount: 3,
      thisWeekCount: 2,
      upcomingExamsCount: 2,
    });
  });
});

describe('legacy normalisation', () => {
  it('normalises absent v3.1 fields without dropping unknown legacy keys', () => {
    const parsed = eventItemSchema.parse({
      id: 'legacy',
      title: 'Old class',
      category: 'school',
      startAt: NOW_ISO,
      isExam: true,
      legacyExtra: { keep: true },
      createdAt: NOW_ISO,
      updatedAt: NOW_ISO,
    });
    expect(parsed).toMatchObject({
      kind: 'event',
      highlighted: false,
      status: 'active',
      revision: 0,
      classSchedule: null,
      isExam: true,
      legacyExtra: { keep: true },
    });
    expect(eventItemSchema.parse(parsed)).toEqual(parsed);
  });
});
