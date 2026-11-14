import type { EventItem, CreateEventInput } from '@/contracts/event';
import { buildZonedInstant, DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';

export function eventEditorValues(event: EventItem) {
  return {
    title: event.title,
    category: event.category,
    date: formatScheduledDate(new Date(event.startAt), DEFAULT_APP_TIMEZONE),
    time: new Intl.DateTimeFormat('en-GB', {
      timeZone: DEFAULT_APP_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(event.startAt)),
    location: event.location ?? '',
    isOnline: event.locationType === 'online',
    isExam: event.isExam,
    notes: event.notes ?? event.description ?? '',
  };
}

export function eventEditorPatch(event: EventItem, values: ReturnType<typeof eventEditorValues>) {
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
