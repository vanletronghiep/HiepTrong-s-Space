import { describe, expect, it } from 'vitest';
import { eventItemSchema } from '@/contracts/event';
import {
  formatMonthTitle,
  getAgendaEventsForState,
  getMonthGridDays,
  getWeekDaysForAnchor,
  shiftMonthKey,
} from '@/domain/event-calendar';
import { computeEventStats, eventsForWeekday, getEventWeekDates } from '@/domain/event-domain';

const event = (
  id: string,
  startAt: string,
  category: 'exam' | 'school' | 'meeting' | 'deadline' = 'school',
  isExam = false,
) =>
  eventItemSchema.parse({
    id,
    title: id,
    category,
    isExam,
    startAt,
    createdAt: startAt,
    updatedAt: startAt,
  });

describe('event calendar boundaries & horizon agenda selection', () => {
  it('assigns each event to exactly one local day and excludes the next week', () => {
    const now = new Date('2026-11-09T18:00:00Z');
    const events = [
      event('tuesday', '2026-11-09T18:00:00Z'),
      event('next-week', '2026-11-15T17:00:00Z'),
    ];
    expect(getEventWeekDates(now)[0]).toBe('2026-11-09');
    expect(eventsForWeekday(events, 1, now).map((item) => item.id)).toEqual(['tuesday']);
    expect(
      Array.from({ length: 7 }, (_, index) => eventsForWeekday(events, index, now)).flat(),
    ).toHaveLength(1);
    expect(computeEventStats(events, now).thisWeekCount).toBe(1);
  });

  it('shifts months across year boundaries and builds 42-day Monday-first leap grids', () => {
    expect(shiftMonthKey('2026-12', 1)).toBe('2027-01');
    expect(shiftMonthKey('2026-01', -1)).toBe('2025-12');
    expect(formatMonthTitle('2026-11')).toBe('November 2026');

    const leapFeb = getMonthGridDays('2024-02');
    expect(leapFeb).toHaveLength(42);
    expect(leapFeb.some((d) => d.dateStr === '2024-02-29' && d.inMonth)).toBe(true);

    const commonFeb = getMonthGridDays('2026-02');
    expect(commonFeb).toHaveLength(42);
    expect(commonFeb.some((d) => d.dateStr === '2026-02-29')).toBe(false);
  });

  it('computes coordinated Monday-Sunday weeks across year boundaries', () => {
    const week = getWeekDaysForAnchor('2026-12-31');
    expect(week).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
  });

  it('sorts Upcoming ascending, Past descending, respects Asia/Saigon date filters & exam tags', () => {
    const now = new Date('2026-11-13T05:00:00.000Z'); // 12:00 Saigon Nov 13
    const items = [
      event('past-older', '2026-11-01T08:00:00+07:00', 'meeting'),
      event('past-recent', '2026-11-12T17:30:00Z', 'school'), // 00:30 Nov 13 Saigon -> past relative to 12:00 Nov 13!
      event('upcoming-school-exam', '2026-11-14T09:00:00+07:00', 'school', true),
      event('upcoming-deadline', '2026-11-20T18:00:00+07:00', 'deadline'),
    ];

    expect(
      getAgendaEventsForState({
        events: items,
        horizon: 'upcoming',
        categoryFilter: 'all',
        selectedDate: null,
        now,
      }).map((i) => i.id),
    ).toEqual(['upcoming-school-exam', 'upcoming-deadline']);

    expect(
      getAgendaEventsForState({
        events: items,
        horizon: 'past',
        categoryFilter: 'all',
        selectedDate: null,
        now,
      }).map((i) => i.id),
    ).toEqual(['past-recent', 'past-older']);

    expect(
      getAgendaEventsForState({
        events: items,
        horizon: 'upcoming',
        categoryFilter: 'exam',
        selectedDate: null,
        now,
      }).map((i) => i.id),
    ).toEqual(['upcoming-school-exam']);

    expect(
      getAgendaEventsForState({
        events: items,
        horizon: 'upcoming',
        categoryFilter: 'all',
        selectedDate: '2026-11-13',
        now,
      }).map((i) => i.id),
    ).toEqual(['past-recent']);
  });
});
