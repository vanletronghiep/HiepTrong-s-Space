import { describe, expect, it } from 'vitest';
import { computeEventStats, eventsForWeekday, getEventWeekDates } from '@/domain/event-domain';
import { eventItemSchema } from '@/contracts/event';
const event = (id: string, startAt: string) => eventItemSchema.parse({ id, title: id, category: 'school', startAt, createdAt: startAt, updatedAt: startAt });
describe('event calendar boundaries', () => {
  it('assigns each event to exactly one local day and excludes the next week', () => {
    const now = new Date('2026-11-09T18:00:00Z');
    const events = [event('tuesday', '2026-11-09T18:00:00Z'), event('next-week', '2026-11-15T17:00:00Z')];
    expect(getEventWeekDates(now)[0]).toBe('2026-11-09');
    expect(eventsForWeekday(events, 1, now).map(item => item.id)).toEqual(['tuesday']);
    expect(Array.from({ length: 7 }, (_, index) => eventsForWeekday(events, index, now)).flat()).toHaveLength(1);
    expect(computeEventStats(events, now).thisWeekCount).toBe(1);
  });
});
