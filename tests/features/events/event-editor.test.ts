import { describe, expect, it } from 'vitest';
import { eventItemSchema, type EventItem } from '@/contracts/event';
import {
  eventEditorPatch,
  eventEditorValues,
  formatZonedTime24,
  isEventDraftPublishable,
  isValidEventTimeHm,
} from '@/features/events/event-editor';
import { blankEditorValues } from '@/domain/event-editor-values';

export const event: EventItem = eventItemSchema.parse({
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
});

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
      isEventDraftPublishable(
        blankEditorValues('2026-11-25', {
          title: 'Lab checkoff',
          category: 'school',
          time: '00:15',
        }),
      ),
    ).toBe(true);
    expect(
      isEventDraftPublishable(
        blankEditorValues('2026-11-25', { title: '   ', category: 'school', time: '00:15' }),
      ),
    ).toBe(false);
    expect(
      isEventDraftPublishable(
        blankEditorValues('2026-02-30', {
          title: 'Incomplete date',
          category: 'school',
          time: '19:00',
        }),
      ),
    ).toBe(false);
  });
});

describe('v3.1 editor preservation rules', () => {
  it('keeps a legacy venue + link pair intact on a title-only edit', () => {
    const values = eventEditorValues(event);
    expect(values.location).toBe('Room 4');
    expect(eventEditorPatch(event, { ...values, title: 'Renamed' })).toEqual({ title: 'Renamed' });
  });

  it('edits the stored link when a legacy record has only a URL', () => {
    const linkOnly = eventItemSchema.parse({ ...event, location: null });
    const values = eventEditorValues(linkOnly);
    expect(values.location).toBe('https://example.com/meeting');
    expect(eventEditorPatch(linkOnly, { ...values, location: 'https://example.com/new' })).toEqual({
      url: 'https://example.com/new',
    });
  });

  it('never sends category or exam changes when only other fields change, preserving legacy exam flags', () => {
    const legacy = eventItemSchema.parse({ ...event, category: 'school', isExam: true });
    const patch = eventEditorPatch(legacy, { ...eventEditorValues(legacy), notes: 'More' });
    expect(patch).toEqual({ notes: 'More' });
    expect(patch).not.toHaveProperty('isExam');
    expect(patch).not.toHaveProperty('category');
  });

  it('requires a category for new ordinary events and an end time for classes', () => {
    expect(isEventDraftPublishable(blankEditorValues('2026-11-25', { title: 'Untyped' }))).toBe(
      false,
    );
    expect(
      isEventDraftPublishable(
        blankEditorValues('2026-11-25', { title: 'Class', kind: 'class', time: '07:30' }),
      ),
    ).toBe(false);
    expect(
      isEventDraftPublishable(
        blankEditorValues('2026-11-25', {
          title: 'Class',
          kind: 'class',
          time: '07:30',
          endTime: '09:30',
        }),
      ),
    ).toBe(true);
  });

  it('rejects an end before its start', () => {
    expect(
      isEventDraftPublishable(
        blankEditorValues('2026-11-25', {
          title: 'Backwards',
          category: 'meeting',
          time: '10:00',
          endTime: '09:00',
        }),
      ),
    ).toBe(false);
  });
});
