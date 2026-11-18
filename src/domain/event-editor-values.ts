/**
 * Pure mapping between stored events/occurrences and Events editor values (v3.1 §6.2).
 * Shared by the editor UI and server-side draft publication so both apply identical
 * preservation rules: a title-only edit never erases location, link, exam meaning, notes,
 * preparation links, or recurrence metadata.
 */
import type {
  EventItem,
  EventOccurrence,
  OccurrenceEditFields,
  OccurrenceScope,
  PatchEventInput,
} from '@/contracts/event';
import type { EventDraftEditorValues } from '@/contracts/event-draft';
import { isValidScheduledDate } from '@/contracts/task';
import { localDateOf, localTimeOf } from './event-occurrence';
import { buildZonedInstant, DEFAULT_APP_TIMEZONE } from './time';

const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimeHm(value: string): boolean {
  return TIME_RE.test(value.trim());
}

export function blankEditorValues(
  date: string,
  overrides: Partial<EventDraftEditorValues> = {},
): EventDraftEditorValues {
  return {
    kind: 'event',
    title: '',
    category: null,
    date,
    time: '09:00',
    endDate: '',
    endTime: '',
    location: '',
    highlighted: false,
    notes: '',
    classWeekly: true,
    classEndDate: '',
    isOnline: false,
    isExam: false,
    ...overrides,
  };
}

export function editorValuesFromEvent(
  event: EventItem,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): EventDraftEditorValues {
  return {
    kind: event.kind,
    title: event.title,
    category: event.category,
    date: localDateOf(event.startAt, timeZone),
    time: localTimeOf(event.startAt, timeZone),
    endDate: event.endAt ? localDateOf(event.endAt, timeZone) : '',
    endTime: event.endAt ? localTimeOf(event.endAt, timeZone) : '',
    // One field: a venue, or a legacy standalone link when no venue was stored.
    location: event.location ?? event.url ?? '',
    highlighted: event.highlighted,
    notes: event.notes ?? event.description ?? '',
    classWeekly: event.classSchedule?.repeating ?? true,
    classEndDate: event.classSchedule?.endDate ?? '',
    isOnline: event.locationType === 'online',
    isExam: event.isExam,
  };
}

/** Editor values for one resolved class occurrence. */
export function editorValuesFromOccurrence(
  occurrence: EventOccurrence,
  event: EventItem,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): EventDraftEditorValues {
  return {
    ...editorValuesFromEvent(event, timeZone),
    kind: 'class',
    category: null,
    title: occurrence.title,
    date: localDateOf(occurrence.startAt, timeZone),
    time: localTimeOf(occurrence.startAt, timeZone),
    endDate: occurrence.endAt ? localDateOf(occurrence.endAt, timeZone) : '',
    endTime: occurrence.endAt ? localTimeOf(occurrence.endAt, timeZone) : '',
    location: occurrence.location ?? occurrence.url ?? '',
    highlighted: occurrence.highlighted,
    notes: occurrence.notes ?? '',
  };
}

export interface EditorTimes {
  startAt: string;
  endAt: string | null;
}

/** Field-level validation shared by editor submit and draft publication. */
export function validateEditorValues(
  values: EventDraftEditorValues,
  options: { requireCategory?: boolean } = {},
): Record<string, string> {
  const errors: Record<string, string> = {};
  const title = values.title.trim();
  if (!title) errors.title = 'Enter a title';
  else if (title.length > 200) errors.title = 'Title must be 200 characters or fewer';
  if (!isValidScheduledDate(values.date.trim())) errors.date = 'Choose a valid date (YYYY-MM-DD)';
  if (!isValidTimeHm(values.time)) errors.time = 'Choose a valid 24-hour start time (HH:mm)';
  if (values.kind === 'event' && options.requireCategory !== false && !values.category) {
    errors.category = 'Choose a category';
  }
  const hasEnd = values.endTime.trim() !== '' || values.endDate.trim() !== '';
  if (values.kind === 'class' && !values.endTime.trim()) {
    errors.endTime = 'Choose when the class ends';
  }
  if (hasEnd) {
    const endDate = values.endDate.trim() || values.date.trim();
    if (!isValidScheduledDate(endDate)) errors.endDate = 'Choose a valid end date';
    if (!isValidTimeHm(values.endTime)) errors.endTime = 'Choose a valid 24-hour end time (HH:mm)';
    if (!errors.date && !errors.time && !errors.endDate && !errors.endTime) {
      const start = Date.parse(buildZonedInstant(values.date.trim(), values.time.trim()));
      const end = Date.parse(buildZonedInstant(endDate, values.endTime.trim()));
      if (end <= start) errors.endTime = 'End must be after the start';
      if (values.kind === 'class' && endDate !== values.date.trim()) {
        errors.endDate = 'A class starts and ends on the same day';
      }
    }
  }
  if (values.kind === 'class' && values.classWeekly && values.classEndDate.trim()) {
    if (!isValidScheduledDate(values.classEndDate.trim())) {
      errors.classEndDate = 'Choose a valid end date';
    } else if (values.classEndDate.trim() < values.date.trim()) {
      errors.classEndDate = 'Repeat end must be on or after the first class';
    }
  }
  return errors;
}

export function editorTimes(
  values: EventDraftEditorValues,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): EditorTimes {
  const startAt = buildZonedInstant(values.date.trim(), values.time.trim(), timeZone);
  const endTime = values.endTime.trim();
  if (!endTime) return { startAt, endAt: null };
  const endDate = values.endDate.trim() || values.date.trim();
  return { startAt, endAt: buildZonedInstant(endDate, endTime, timeZone) };
}

/**
 * Minimal patch for an ordinary event: only fields the user changed. Legacy venue + link
 * pairs stay intact; a link-only legacy record keeps editing its link.
 */
export function eventEditorPatch(
  event: EventItem,
  values: EventDraftEditorValues,
  timeZone: string = DEFAULT_APP_TIMEZONE,
): PatchEventInput {
  const previous = editorValuesFromEvent(event, timeZone);
  const patch: PatchEventInput = {};
  if (values.title !== previous.title && values.title.trim() !== previous.title.trim()) {
    patch.title = values.title.trim();
  }
  if (values.category !== previous.category && values.category) patch.category = values.category;
  if (values.date !== previous.date || values.time !== previous.time) {
    patch.startAt = buildZonedInstant(values.date.trim(), values.time.trim(), timeZone);
  }
  if (values.endDate !== previous.endDate || values.endTime !== previous.endTime) {
    patch.endAt = editorTimes(values, timeZone).endAt;
  }
  if (values.location.trim() !== previous.location.trim()) {
    const next = values.location.trim() || null;
    if (event.location === null && event.url !== null) patch.url = next;
    else patch.location = next;
  }
  if (values.highlighted !== previous.highlighted) patch.highlighted = values.highlighted;
  if (values.notes !== previous.notes) patch.notes = values.notes.trim() || null;
  return patch;
}

/**
 * Fields for a scoped class occurrence edit. With `previous`, only changed fields are sent,
 * so a legacy standalone link is never copied into the venue field.
 */
export function occurrenceEditFields(
  values: EventDraftEditorValues,
  scope: OccurrenceScope,
  previous?: EventDraftEditorValues,
): OccurrenceEditFields {
  const changed = <K extends keyof EventDraftEditorValues>(key: K) =>
    !previous || values[key] !== previous[key];
  const fields: OccurrenceEditFields = {};
  if (changed('title')) fields.title = values.title.trim();
  if (changed('date')) fields.date = values.date.trim();
  if (changed('time')) fields.startTime = values.time.trim();
  if (changed('endTime')) fields.endTime = values.endTime.trim();
  if (changed('location')) fields.location = values.location.trim() || null;
  if (changed('notes')) fields.notes = values.notes.trim() || null;
  if (changed('highlighted')) fields.highlighted = values.highlighted;
  if (scope === 'this-week-onward' && changed('classEndDate')) {
    fields.endDate = values.classEndDate.trim() || null;
  }
  return fields;
}

export function sameEditorValues(a: EventDraftEditorValues, b: EventDraftEditorValues): boolean {
  return (Object.keys(a) as Array<keyof EventDraftEditorValues>).every((key) => a[key] === b[key]);
}
