import type { CreateEventInput, EventItem } from '@/contracts/event';
import type { EventDraftEditorValues } from '@/contracts/event-draft';
import { isValidScheduledDate } from '@/contracts/task';
import { buildZonedInstant, DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';

const TIME_24H_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function isValidEventTimeHm(value: string): boolean {
  return TIME_24H_RE.test(value.trim());
}

export function isEventDraftPublishable(values: EventDraftEditorValues): boolean {
  const title = values.title.trim();
  return (
    title.length > 0 &&
    title.length <= 200 &&
    isValidScheduledDate(values.date.trim()) &&
    isValidEventTimeHm(values.time)
  );
}

export function formatZonedTime24(date: Date, timeZone: string = DEFAULT_APP_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).format(date);
}

export function eventEditorValues(event: EventItem): EventDraftEditorValues {
  return {
    title: event.title,
    category: event.category,
    date: formatScheduledDate(new Date(event.startAt), DEFAULT_APP_TIMEZONE),
    time: formatZonedTime24(new Date(event.startAt), DEFAULT_APP_TIMEZONE),
    location: event.location ?? '',
    isOnline: event.locationType === 'online',
    isExam: event.isExam,
    notes: event.notes ?? event.description ?? '',
  };
}

export function eventEditorPatch(
  event: EventItem,
  values: EventDraftEditorValues,
): Partial<CreateEventInput> {
  const previous = eventEditorValues(event);
  const patch: Partial<CreateEventInput> = {};
  if (values.title !== previous.title) patch.title = values.title.trim();
  if (values.category !== previous.category) patch.category = values.category;
  if (values.date !== previous.date || values.time !== previous.time)
    patch.startAt = buildZonedInstant(values.date, values.time);
  if (values.location !== previous.location) patch.location = values.location.trim() || null;
  if (values.isOnline !== previous.isOnline)
    patch.locationType = values.isOnline ? 'online' : 'in_person';
  if (values.isExam !== previous.isExam || values.category !== previous.category)
    patch.isExam = values.isExam || values.category === 'exam';
  if (values.notes !== previous.notes) patch.notes = values.notes.trim() || null;
  return patch;
}
