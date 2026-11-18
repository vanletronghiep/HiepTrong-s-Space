/**
 * Pure event-occurrence domain (v3.1 §7–8). Resolves stored events and weekly class series
 * into dated occurrences, applies scoped class mutations, and detects timetable conflicts.
 * Framework-free: no filesystem, UI, or environment access. Calendar dates are Asia/Saigon
 * 'YYYY-MM-DD' strings unless a timezone is supplied.
 */
import {
  TIMETABLE_PERIODS,
  type ClassDefaultRevision,
  type ClassFields,
  type ClassOverride,
  type ClassRepeatInput,
  type ClassSchedule,
  type EventItem,
  type EventOccurrence,
  type OccurrenceMutation,
} from '@/contracts/event';
import { buildZonedInstant, DEFAULT_APP_TIMEZONE, formatScheduledDate } from './time';

const DAY_MS = 86_400_000;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export class OccurrenceMutationError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'VALIDATION' | 'CONFLICT' = 'VALIDATION',
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'OccurrenceMutationError';
  }
}

/* ─── Calendar-date arithmetic (timezone-independent 'YYYY-MM-DD') ─── */

function toDayNumber(date: string): number {
  const match = DATE_RE.exec(date);
  if (!match) throw new RangeError(`Invalid date "${date}"`);
  return Math.round(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS);
}

function fromDayNumber(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return fromDayNumber(toDayNumber(date) + days);
}

export function addWeeks(date: string, weeks: number): string {
  return addDays(date, weeks * 7);
}

/** ISO weekday: Monday = 1 … Sunday = 7. */
export function isoWeekday(date: string): number {
  const dow = new Date(toDayNumber(date) * DAY_MS).getUTCDay();
  return dow === 0 ? 7 : dow;
}

/** Monday of the Monday–Sunday week containing `date`. */
export function weekStartOf(date: string): string {
  return addDays(date, 1 - isoWeekday(date));
}

export function daysBetween(from: string, to: string): number {
  return toDayNumber(to) - toDayNumber(from);
}

function minDate(a: string | null, b: string): string {
  return a !== null && a < b ? a : b;
}

/* ─── Zoned instants ─── */

export function localDateOf(iso: string, timeZone: string = DEFAULT_APP_TIMEZONE): string {
  return formatScheduledDate(iso, timeZone);
}

export function localTimeOf(iso: string, timeZone: string = DEFAULT_APP_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).format(new Date(iso));
}

/** Timetable period index for an exact full-period match, otherwise null. */
export function matchTimetablePeriod(startTime: string, endTime: string): number | null {
  const period = TIMETABLE_PERIODS.find((p) => p.start === startTime && p.end === endTime);
  return period ? period.index : null;
}

/* ─── Normalisation ─── */

/** Exam meaning: Exam category, or a preserved legacy flag on any other record. */
export function hasExamMeaning(event: Pick<EventItem, 'category' | 'isExam'>): boolean {
  return event.category === 'exam' || event.isExam;
}

/* ─── Class resolution ─── */

/** Latest default revision effective at or before `week` (defaults ascend by week). */
export function latestDefaultAt(
  schedule: ClassSchedule,
  week: string,
): ClassDefaultRevision | null {
  let found: ClassDefaultRevision | null = null;
  for (const revision of schedule.defaults) {
    if (revision.effectiveWeek <= week) found = revision;
  }
  return found ?? schedule.defaults[0] ?? null;
}

/** Step 1: does the series exist for this original week? */
export function seriesExistsInWeek(schedule: ClassSchedule, week: string): boolean {
  if (week < schedule.startWeek) return false;
  if (!schedule.repeating && week !== schedule.startWeek) return false;
  if (schedule.deletedFromWeek !== null && week >= schedule.deletedFromWeek) return false;
  if (schedule.endDate !== null && week > schedule.endDate) return false;
  return true;
}

interface ResolvedClassFields {
  date: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string | null;
  url: string | null;
  notes: string | null;
  highlighted: boolean;
  status: 'active' | 'canceled';
  isOverride: boolean;
}

/**
 * Resolution order (v3.1 §7.2): series existence → latest default → weekly override
 * (including cancel/delete) → series-wide cancellation cutoff → derived fields.
 * Returns null for absent or deleted occurrences.
 */
export function resolveClassFields(
  schedule: ClassSchedule,
  week: string,
): ResolvedClassFields | null {
  if (!seriesExistsInWeek(schedule, week)) return null;
  const revision = latestDefaultAt(schedule, week);
  if (!revision) return null;
  const defaultDate = addDays(week, revision.weekday - 1);
  if (schedule.endDate !== null && defaultDate > schedule.endDate) return null;

  const override = schedule.overrides[week];
  if (override?.type === 'deleted') return null;

  const fields: ResolvedClassFields =
    override?.type === 'occurrence'
      ? {
          date: override.date,
          title: override.title,
          startTime: override.startTime,
          endTime: override.endTime,
          location: override.location,
          url: override.url,
          notes: override.notes,
          highlighted: override.highlighted,
          status: override.status,
          isOverride: true,
        }
      : {
          date: defaultDate,
          title: revision.title,
          startTime: revision.startTime,
          endTime: revision.endTime,
          location: revision.location,
          url: revision.url,
          notes: revision.notes,
          highlighted: revision.highlighted,
          status: 'active',
          isOverride: false,
        };

  if (schedule.canceledFromWeek !== null && week >= schedule.canceledFromWeek) {
    fields.status = 'canceled';
  }
  return fields;
}

function classOccurrence(
  event: EventItem,
  week: string,
  fields: ResolvedClassFields,
  timeZone: string,
): EventOccurrence {
  return {
    key: `${event.id}@${week}`,
    eventId: event.id,
    kind: 'class',
    originalWeek: week,
    title: fields.title,
    category: null,
    originalCategory: event.originalCategory ?? null,
    isExam: event.isExam,
    highlighted: fields.highlighted,
    status: fields.status,
    startAt: buildZonedInstant(fields.date, fields.startTime, timeZone),
    endAt: buildZonedInstant(fields.date, fields.endTime, timeZone),
    location: fields.location,
    url: fields.url,
    locationType: event.locationType,
    notes: fields.notes,
    description: event.description,
    preparationTaskId: event.preparationTaskId ?? null,
    recurrence: event.recurrence ?? null,
    period: matchTimetablePeriod(fields.startTime, fields.endTime),
    isOverride: fields.isOverride,
    isRepeating: event.classSchedule?.repeating ?? false,
    revision: event.revision,
  };
}

export function resolveClassOccurrence(
  event: EventItem,
  week: string,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): EventOccurrence | null {
  const schedule = event.classSchedule;
  if (!schedule) return null;
  const fields = resolveClassFields(schedule, week);
  return fields ? classOccurrence(event, week, fields, timeZone) : null;
}

export function ordinaryOccurrence(event: EventItem): EventOccurrence {
  return {
    key: event.id,
    eventId: event.id,
    kind: event.kind,
    originalWeek: null,
    title: event.title,
    category: event.category,
    originalCategory: event.originalCategory ?? null,
    isExam: hasExamMeaning(event),
    highlighted: event.highlighted,
    status: event.status,
    startAt: event.startAt,
    endAt: event.endAt,
    location: event.location,
    url: event.url,
    locationType: event.locationType,
    notes: event.notes ?? null,
    description: event.description,
    preparationTaskId: event.preparationTaskId ?? null,
    recurrence: event.recurrence ?? null,
    period: null,
    isOverride: false,
    isRepeating: false,
    revision: event.revision,
  };
}

/** Local dates an occurrence covers; an end exactly at midnight does not touch the next day. */
export function occurrenceDateSpan(
  occurrence: Pick<EventOccurrence, 'startAt' | 'endAt'>,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): { first: string; last: string } {
  const first = localDateOf(occurrence.startAt, timeZone);
  if (!occurrence.endAt || Date.parse(occurrence.endAt) <= Date.parse(occurrence.startAt)) {
    return { first, last: first };
  }
  let last = localDateOf(occurrence.endAt, timeZone);
  if (localTimeOf(occurrence.endAt, timeZone) === '00:00' && last > first) {
    last = addDays(last, -1);
  }
  return { first, last };
}

/** Candidate original weeks whose class occurrence may land inside [from, to). */
function classCandidateWeeks(schedule: ClassSchedule, from: string, to: string): string[] {
  const weeks = new Set<string>();
  const lastWeek = weekStartOf(addDays(to, -1));
  let week = weekStartOf(from);
  if (week < schedule.startWeek) week = schedule.startWeek;
  for (; week <= lastWeek; week = addWeeks(week, 1)) {
    if (!seriesExistsInWeek(schedule, week)) {
      if (!schedule.repeating || (schedule.endDate !== null && week > schedule.endDate)) break;
      if (schedule.deletedFromWeek !== null && week >= schedule.deletedFromWeek) break;
      continue;
    }
    weeks.add(week);
  }
  // Moved occurrences are found by their actual date, whatever their original week.
  for (const [originalWeek, override] of Object.entries(schedule.overrides)) {
    if (override.type === 'occurrence' && override.date >= from && override.date < to) {
      weeks.add(originalWeek);
    }
  }
  return [...weeks];
}

/**
 * Resolved occurrences intersecting the half-open local-date interval [from, to),
 * including canceled entries, ordered by start then key.
 */
export function listOccurrencesInRange(
  events: readonly EventItem[],
  from: string,
  to: string,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): EventOccurrence[] {
  const result: EventOccurrence[] = [];
  for (const event of events) {
    if (event.kind === 'class' && event.classSchedule) {
      for (const week of classCandidateWeeks(event.classSchedule, from, to)) {
        const occurrence = resolveClassOccurrence(event, week, timeZone);
        if (!occurrence) continue;
        const date = localDateOf(occurrence.startAt, timeZone);
        if (date >= from && date < to) result.push(occurrence);
      }
      continue;
    }
    const occurrence = ordinaryOccurrence(event);
    const span = occurrenceDateSpan(occurrence, timeZone);
    if (span.first < to && span.last >= from) result.push(occurrence);
  }
  return sortOccurrences(result);
}

export function sortOccurrences(occurrences: EventOccurrence[]): EventOccurrence[] {
  return occurrences.sort(
    (a, b) => Date.parse(a.startAt) - Date.parse(b.startAt) || (a.key < b.key ? -1 : 1),
  );
}

/* ─── Horizons, expiry, highlights, counts ─── */

/** An occurrence expires at its end, or at its start when it has no end. */
export function occurrenceExpiryMs(occurrence: Pick<EventOccurrence, 'startAt' | 'endAt'>): number {
  return Date.parse(occurrence.endAt ?? occurrence.startAt);
}

export function isOccurrenceExpired(
  occurrence: Pick<EventOccurrence, 'startAt' | 'endAt'>,
  now: Date,
): boolean {
  return now.getTime() >= occurrenceExpiryMs(occurrence);
}

export function isOccurrenceOngoing(
  occurrence: Pick<EventOccurrence, 'startAt' | 'endAt'>,
  now: Date,
): boolean {
  if (!occurrence.endAt) return false;
  const nowMs = now.getTime();
  return Date.parse(occurrence.startAt) <= nowMs && nowMs < Date.parse(occurrence.endAt);
}

/** Highlights: opted-in, non-canceled, unexpired occurrences, nearest first, stable by key. */
export function selectHighlights(
  occurrences: readonly EventOccurrence[],
  now: Date,
): EventOccurrence[] {
  return sortOccurrences(
    occurrences.filter(
      (o) => o.highlighted && o.status === 'active' && !isOccurrenceExpired(o, now),
    ),
  );
}

export function upcomingOccurrences(
  occurrences: readonly EventOccurrence[],
  now: Date,
): EventOccurrence[] {
  return sortOccurrences(occurrences.filter((o) => !isOccurrenceExpired(o, now)));
}

export function pastOccurrences(
  occurrences: readonly EventOccurrence[],
  now: Date,
): EventOccurrence[] {
  return occurrences
    .filter((o) => isOccurrenceExpired(o, now))
    .sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt) || (a.key < b.key ? 1 : -1));
}

export const UPCOMING_EXAM_HORIZON_DAYS = 7;

export interface OccurrenceStats {
  /** Non-canceled, unexpired occurrences inside the displayed horizon. */
  upcomingCount: number;
  /** Distinct non-canceled occurrences intersecting the current Monday–Sunday week. */
  thisWeekCount: number;
  /** Non-canceled exams that are ongoing or start within seven days. */
  upcomingExamsCount: number;
}

export function computeOccurrenceStats(
  horizonOccurrences: readonly EventOccurrence[],
  now: Date,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): OccurrenceStats {
  const today = localDateOf(now.toISOString(), timeZone);
  const weekStart = weekStartOf(today);
  const weekEnd = addDays(weekStart, 7);
  const examLimit = now.getTime() + UPCOMING_EXAM_HORIZON_DAYS * DAY_MS;
  const thisWeek = new Set<string>();
  let upcomingCount = 0;
  let upcomingExamsCount = 0;

  for (const occurrence of horizonOccurrences) {
    if (occurrence.status === 'canceled') continue;
    const span = occurrenceDateSpan(occurrence, timeZone);
    if (span.first < weekEnd && span.last >= weekStart) thisWeek.add(occurrence.key);
    if (isOccurrenceExpired(occurrence, now)) continue;
    upcomingCount += 1;
    if (occurrence.isExam && Date.parse(occurrence.startAt) <= examLimit) upcomingExamsCount += 1;
  }
  return { upcomingCount, thisWeekCount: thisWeek.size, upcomingExamsCount };
}

/* ─── Class schedule construction and scoped mutations ─── */

export interface ClassFirstOccurrence {
  title: string;
  startAt: string;
  endAt: string;
  location: string | null;
  url: string | null;
  notes: string | null;
  highlighted: boolean;
}

export function buildClassSchedule(
  first: ClassFirstOccurrence,
  repeat: ClassRepeatInput,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): ClassSchedule {
  const date = localDateOf(first.startAt, timeZone);
  const startTime = localTimeOf(first.startAt, timeZone);
  const endTime = localTimeOf(first.endAt, timeZone);
  if (localDateOf(first.endAt, timeZone) !== date || endTime <= startTime) {
    throw new OccurrenceMutationError(
      'A class must end after it starts on the same day',
      'VALIDATION',
      {
        endAt: 'Choose an end later the same day',
      },
    );
  }
  const endDate = repeat.weekly ? (repeat.endDate ?? null) : null;
  if (endDate !== null && endDate < date) {
    throw new OccurrenceMutationError(
      'The repeat end date is before the first class',
      'VALIDATION',
      {
        endDate: 'Choose an end date on or after the first class',
      },
    );
  }
  const startWeek = weekStartOf(date);
  return {
    startWeek,
    repeating: repeat.weekly,
    endDate,
    defaults: [
      {
        effectiveWeek: startWeek,
        title: first.title,
        weekday: isoWeekday(date),
        startTime,
        endTime,
        location: first.location,
        url: first.url,
        notes: first.notes,
        highlighted: first.highlighted,
      },
    ],
    overrides: {},
    canceledFromWeek: null,
    deletedFromWeek: null,
  };
}

function cloneSchedule(schedule: ClassSchedule): ClassSchedule {
  return {
    ...schedule,
    defaults: schedule.defaults.map((revision) => ({ ...revision })),
    overrides: Object.fromEntries(
      Object.entries(schedule.overrides).map(([week, override]) => [week, { ...override }]),
    ),
  };
}

function assertTimes(startTime: string, endTime: string): void {
  if (endTime <= startTime) {
    throw new OccurrenceMutationError('A class must end after it starts', 'VALIDATION', {
      endTime: 'Choose an end time after the start time',
    });
  }
}

export type ClassMutationOutcome =
  | { type: 'updated'; schedule: ClassSchedule }
  /** The whole record should be removed (single class, or delete onward from its first week). */
  | { type: 'remove-record' };

/**
 * Applies one scoped class command (v3.1 §7.2 table). Earlier weeks are never rewritten by a
 * default change; explicit overrides and later defaults are preserved unless an explicit
 * cancel/delete-onward command overrides them.
 */
export function applyClassMutation(
  schedule: ClassSchedule,
  mutation: Omit<OccurrenceMutation, 'expectedRevision'>,
): ClassMutationOutcome {
  const week = mutation.originalWeek;
  if (weekStartOf(week) !== week) {
    throw new OccurrenceMutationError('Original week must be a Monday');
  }
  const current = resolveClassFields(schedule, week);
  if (!current) {
    throw new OccurrenceMutationError('This class occurrence no longer exists', 'NOT_FOUND');
  }
  const next = cloneSchedule(schedule);
  const fields = mutation.fields ?? {};

  if (mutation.action === 'edit') {
    const merged = {
      date: fields.date ?? current.date,
      title: (fields.title ?? current.title).trim(),
      startTime: fields.startTime ?? current.startTime,
      endTime: fields.endTime ?? current.endTime,
      location: fields.location !== undefined ? fields.location : current.location,
      url: fields.url !== undefined ? fields.url : current.url,
      notes: fields.notes !== undefined ? fields.notes : current.notes,
      highlighted: fields.highlighted ?? current.highlighted,
    };
    if (!merged.title) {
      throw new OccurrenceMutationError('Title is required', 'VALIDATION', {
        title: 'Enter a class title',
      });
    }
    assertTimes(merged.startTime, merged.endTime);

    if (mutation.scope === 'this-week') {
      const existing = schedule.overrides[week];
      next.overrides[week] = {
        type: 'occurrence',
        ...merged,
        status: existing?.type === 'occurrence' ? existing.status : 'active',
      };
      return { type: 'updated', schedule: next };
    }

    // Set Default from week A: add/replace the revision effective in A, drop A's redundant
    // override, keep earlier weeks, later defaults, and every other weekly override.
    const revision: ClassDefaultRevision = {
      effectiveWeek: week,
      title: merged.title,
      weekday: isoWeekday(merged.date),
      startTime: merged.startTime,
      endTime: merged.endTime,
      location: merged.location,
      url: merged.url,
      notes: merged.notes,
      highlighted: merged.highlighted,
    };
    next.defaults = [
      ...next.defaults.filter((existing) => existing.effectiveWeek !== week),
      revision,
    ].sort((a, b) => (a.effectiveWeek < b.effectiveWeek ? -1 : 1));
    delete next.overrides[week];
    if (fields.endDate !== undefined) {
      if (fields.endDate !== null && fields.endDate < schedule.startWeek) {
        throw new OccurrenceMutationError(
          'The repeat end date is before the series starts',
          'VALIDATION',
          {
            endDate: 'Choose a later end date',
          },
        );
      }
      next.endDate = fields.endDate;
    }
    return { type: 'updated', schedule: next };
  }

  if (mutation.action === 'cancel') {
    if (mutation.scope === 'this-week') {
      next.overrides[week] = { type: 'occurrence', ...stripStatus(current), status: 'canceled' };
    } else {
      next.canceledFromWeek = minDate(schedule.canceledFromWeek, week);
    }
    return { type: 'updated', schedule: next };
  }

  // delete
  if (mutation.scope === 'this-week') {
    if (!schedule.repeating) return { type: 'remove-record' };
    next.overrides[week] = { type: 'deleted' };
    return { type: 'updated', schedule: next };
  }
  if (week <= schedule.startWeek) return { type: 'remove-record' };
  next.deletedFromWeek = minDate(schedule.deletedFromWeek, week);
  for (const key of Object.keys(next.overrides)) {
    if (key >= week) delete next.overrides[key];
  }
  next.defaults = next.defaults.filter((revision) => revision.effectiveWeek < week);
  if (next.defaults.length === 0) return { type: 'remove-record' };
  return { type: 'updated', schedule: next };
}

type OccurrenceOverride = Extract<ClassOverride, { type: 'occurrence' }>;

function stripStatus(fields: ResolvedClassFields): Omit<OccurrenceOverride, 'type' | 'status'> {
  return {
    date: fields.date,
    title: fields.title,
    startTime: fields.startTime,
    endTime: fields.endTime,
    location: fields.location,
    url: fields.url,
    notes: fields.notes,
    highlighted: fields.highlighted,
  };
}

/** Mirrors a class's first resolvable occurrence onto legacy base fields for old clients. */
export function classBaseFields(
  schedule: ClassSchedule,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): Pick<EventItem, 'title' | 'startAt' | 'endAt' | 'location' | 'url' | 'notes' | 'highlighted'> {
  const revision = schedule.defaults[0] as ClassFields & { effectiveWeek: string };
  const date = addDays(schedule.startWeek, revision.weekday - 1);
  return {
    title: revision.title,
    startAt: buildZonedInstant(date, revision.startTime, timeZone),
    endAt: buildZonedInstant(date, revision.endTime, timeZone),
    location: revision.location,
    url: revision.url,
    notes: revision.notes,
    highlighted: revision.highlighted,
  };
}

/* ─── Timetable conflicts ─── */

export interface ClassConflict {
  eventId: string;
  title: string;
  /** Monday of the conflicting week. */
  week: string;
  date: string;
  period: number;
}

/** Original week whose active occurrence occupies (date, period), or null. */
export function occupyingWeek(
  event: EventItem,
  date: string,
  period: number,
  excludeWeek: string | null = null,
): string | null {
  const schedule = event.kind === 'class' ? event.classSchedule : null;
  if (!schedule) return null;
  const check = (week: string): boolean => {
    if (week === excludeWeek) return false;
    const fields = resolveClassFields(schedule, week);
    return (
      fields !== null &&
      fields.status === 'active' &&
      fields.date === date &&
      matchTimetablePeriod(fields.startTime, fields.endTime) === period
    );
  };
  const home = weekStartOf(date);
  if (check(home)) return home;
  for (const [week, override] of Object.entries(schedule.overrides)) {
    if (week !== home && override.type === 'occurrence' && override.date === date && check(week)) {
      return week;
    }
  }
  return null;
}

interface Segment {
  weekday: number;
  period: number;
  from: string;
  /** Exclusive Monday, or null for an unbounded weekly schedule. */
  to: string | null;
}

function activeSegments(schedule: ClassSchedule): Segment[] {
  let limit: string | null = schedule.repeating ? null : addWeeks(schedule.startWeek, 1);
  const cut = (candidate: string | null) => {
    if (candidate !== null && (limit === null || candidate < limit)) limit = candidate;
  };
  cut(schedule.deletedFromWeek);
  cut(schedule.canceledFromWeek);
  if (schedule.endDate !== null) cut(addWeeks(weekStartOf(schedule.endDate), 1));

  const segments: Segment[] = [];
  schedule.defaults.forEach((revision, index) => {
    const period = matchTimetablePeriod(revision.startTime, revision.endTime);
    if (period === null) return;
    const from =
      revision.effectiveWeek < schedule.startWeek ? schedule.startWeek : revision.effectiveWeek;
    let to: string | null = schedule.defaults[index + 1]?.effectiveWeek ?? null;
    if (limit !== null && (to === null || limit < to)) to = limit;
    if (to !== null && to <= from) return;
    segments.push({ weekday: revision.weekday, period, from, to });
  });
  return segments;
}

function overridePoints(event: EventItem): Array<{ week: string; date: string; period: number }> {
  const schedule = event.classSchedule;
  if (!schedule) return [];
  const points: Array<{ week: string; date: string; period: number }> = [];
  for (const week of Object.keys(schedule.overrides)) {
    const fields = resolveClassFields(schedule, week);
    if (!fields || fields.status !== 'active') continue;
    const period = matchTimetablePeriod(fields.startTime, fields.endTime);
    if (period !== null) points.push({ week, date: fields.date, period });
  }
  return points;
}

/**
 * Earliest timetable conflict between `candidate` and every other active class, over the
 * full future (not just the rendered horizon). Unbounded weekly schedules are compared as
 * slot intervals; only finitely many weeks can differ from the defaults, so each overlap
 * needs at most (overrides + 3) probes.
 */
export function findClassConflict(
  candidate: EventItem,
  others: readonly EventItem[],
): ClassConflict | null {
  const schedule = candidate.kind === 'class' ? candidate.classSchedule : null;
  if (!schedule) return null;
  let best: ClassConflict | null = null;
  const consider = (other: EventItem, date: string, period: number) => {
    if (best === null || date < best.date) {
      best = { eventId: other.id, title: other.title, week: weekStartOf(date), date, period };
    }
  };

  const candidatePoints = overridePoints(candidate);
  const candidateSegments = activeSegments(schedule);

  // A moved occurrence must not land on another week's occurrence of the same series.
  for (const point of candidatePoints) {
    const week = occupyingWeek(candidate, point.date, point.period, point.week);
    if (week !== null) consider(candidate, point.date, point.period);
  }

  for (const other of others) {
    if (other.id === candidate.id || other.kind !== 'class' || !other.classSchedule) continue;
    const otherSchedule = other.classSchedule;

    for (const point of candidatePoints) {
      if (occupyingWeek(other, point.date, point.period) !== null) {
        consider(other, point.date, point.period);
      }
    }
    for (const point of overridePoints(other)) {
      if (occupyingWeek(candidate, point.date, point.period) !== null) {
        consider(other, point.date, point.period);
      }
    }

    const probeBudget =
      Object.keys(schedule.overrides).length + Object.keys(otherSchedule.overrides).length + 3;
    for (const a of candidateSegments) {
      for (const b of activeSegments(otherSchedule)) {
        if (a.weekday !== b.weekday || a.period !== b.period) continue;
        const from = a.from > b.from ? a.from : b.from;
        const to = a.to === null ? b.to : b.to === null ? a.to : a.to < b.to ? a.to : b.to;
        if (to !== null && to <= from) continue;
        let week = from;
        for (let probe = 0; probe < probeBudget && (to === null || week < to); probe += 1) {
          const date = addDays(week, a.weekday - 1);
          if (
            occupyingWeek(candidate, date, a.period) !== null &&
            occupyingWeek(other, date, a.period) !== null
          ) {
            consider(other, date, a.period);
            break;
          }
          week = addWeeks(week, 1);
        }
      }
    }
  }
  return best;
}
