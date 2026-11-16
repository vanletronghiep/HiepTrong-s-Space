import { describe, expect, it } from 'vitest';
import type { EventItem } from '@/contracts/event';
import {
  eventEditorPatch,
  eventEditorValues,
  formatZonedTime24,
  isEventDraftPublishable,
  isValidEventTimeHm,
} from '@/features/events/event-editor';

export const event: EventItem = {
  id: 'meeting',
  title: 'Project review',
  category: 'meeting',
  startAt: '2026-11-20T16:45:37.000Z',
  endAt: '2026-11-20T17:45:37.000Z',
  description: 'Original description',
  notes: null,
  location: 'Room 4',
  locationType: 'in_person',
  url: 'https://example.com/meeting',
  isExam: false,
  preparationTaskId: 'prep-task',
  recurrence: { frequency: 'weekly', daysOfWeek: [5] },
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

describe('event editing preserves fields outside the editor', () => {
  it('does not rewrite an untouched title while another field is edited', () => {
    const original = { ...event, title: '  Project review  ' };
    expect(
      eventEditorPatch(original, { ...eventEditorValues(original), notes: 'New notes' }),
    ).toEqual({ notes: 'New notes' });
  });
  it('uses the existing timezone and leaves unchanged timestamps, seconds and hidden fields alone', () => {
    const values = eventEditorValues(event);
    expect(values.date).toBe('2026-11-20');
    expect(values.time).toBe('23:45');
    expect(values.notes).toBe('Original description');
    expect(eventEditorPatch(event, values)).toEqual({});
    expect(eventEditorPatch(event, { ...values, title: '  Updated review  ' })).toEqual({
      title: 'Updated review',
    });
  });

  it('patches changed supported fields without clearing description, URL, recurrence or end time', () => {
    const patch = eventEditorPatch(event, {
      ...eventEditorValues(event),
      date: '2026-11-21',
      time: '00:30',
      notes: 'New notes',
    });
    expect(patch).toEqual({ startAt: '2026-11-20T17:30:00.000Z', notes: 'New notes' });
    const result = { ...event, ...patch };
    for (const field of [
      'description',
      'endAt',
      'url',
      'recurrence',
      'preparationTaskId',
    ] as const) {
      expect(result[field]).toEqual(event[field]);
    }
  });

  it('formats midnight in 24-hour 00:mm format and validates publishable drafts cleanly', () => {
    const midnightEvent: EventItem = {
      ...event,
      startAt: '2026-11-20T17:15:00.000Z', // 00:15+07:00
    };
    expect(formatZonedTime24(new Date(midnightEvent.startAt))).toBe('00:15');
    expect(eventEditorValues(midnightEvent).time).toBe('00:15');

    expect(isValidEventTimeHm('00:00')).toBe(true);
    expect(isValidEventTimeHm('23:59')).toBe(true);
    expect(isValidEventTimeHm('24:00')).toBe(false);
    expect(isValidEventTimeHm('9:00')).toBe(false);

    expect(
      isEventDraftPublishable({
        title: 'Lab checkoff',
        category: 'school',
        date: '2026-11-25',
        time: '00:15',
        location: '',
        isOnline: false,
        isExam: false,
        notes: '',
      }),
    ).toBe(true);
    expect(
      isEventDraftPublishable({
        title: '   ',
        category: 'school',
        date: '2026-11-25',
        time: '00:15',
        location: '',
        isOnline: false,
        isExam: false,
        notes: '',
      }),
    ).toBe(false);
    expect(
      isEventDraftPublishable({
        title: 'Incomplete date',
        category: 'school',
        date: '2026-02-30',
        time: '19:00',
        location: '',
        isOnline: false,
        isExam: false,
        notes: '',
      }),
    ).toBe(false);
  });
});
