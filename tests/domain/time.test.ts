import { describe, expect, it } from 'vitest';
import {
  createTaskInputSchema,
  isoInstantSchema,
  scheduledDateSchema,
  taskQuerySchema,
} from '@/contracts';
import type { Clock } from '@/domain/clock';
import {
  buildZonedInstant,
  formatDisplayDate,
  formatDisplayDateTime,
  formatHubDeadline,
  formatInspectorDeadline,
  formatScheduledDate,
  formatScheduledDateWithYear,
  shiftScheduledDate,
} from '@/domain/time';

function createFakeClock(isoInstant: string): Clock {
  return {
    now: () => new Date(isoInstant),
  };
}

describe('domain/time', () => {
  it('formats scheduled date in Asia/Saigon across UTC midnight boundary', () => {
    // 2026-10-29T18:30:00Z is 2026-10-30 01:30:00 in Asia/Saigon (UTC+7)
    expect(formatScheduledDate('2026-10-29T18:30:00.000Z', 'Asia/Saigon')).toBe('2026-10-30');
    // 2026-10-29T16:59:59Z is 2026-10-29 23:59:59 in Asia/Saigon
    expect(formatScheduledDate('2026-10-29T16:59:59.000Z', 'Asia/Saigon')).toBe('2026-10-29');
  });

  it('omits year in display format when within current year and includes year otherwise', () => {
    const clock = createFakeClock('2026-10-30T03:00:00.000Z'); // 2026-10-30 10:00 ICT
    const sameYearInstant = '2026-12-31T16:59:00.000Z'; // 2026-12-31 23:59 ICT
    const nextYearInstant = '2026-12-31T17:00:00.000Z'; // 2027-01-01 00:00 ICT

    expect(formatDisplayDate(sameYearInstant, clock.now(), 'Asia/Saigon')).toBe('31/12');
    expect(formatDisplayDateTime(sameYearInstant, clock.now(), 'Asia/Saigon')).toBe('31/12 23:59');

    expect(formatDisplayDate(nextYearInstant, clock.now(), 'Asia/Saigon')).toBe('01/01/2027');
    expect(formatDisplayDateTime(nextYearInstant, clock.now(), 'Asia/Saigon')).toBe(
      '01/01/2027 00:00',
    );
  });

  it('builds UTC instant from YYYY-MM-DD and HH:mm in Asia/Saigon', () => {
    // 2026-10-30 23:59 Asia/Saigon -> 2026-10-30T16:59:00.000Z
    expect(buildZonedInstant('2026-10-30', '23:59', 'Asia/Saigon')).toBe(
      '2026-10-30T16:59:00.000Z',
    );
  });

  it('handles leap day and rejects non-existent calendar dates', () => {
    expect(buildZonedInstant('2028-02-29', '09:00', 'Asia/Saigon')).toBe(
      '2028-02-29T02:00:00.000Z',
    );
    expect(() => buildZonedInstant('2026-02-29', '09:00', 'Asia/Saigon')).toThrow(RangeError);
    expect(() => buildZonedInstant('2026-10-30', '24:00', 'Asia/Saigon')).toThrow(RangeError);
  });

  it('shifts scheduled dates across month, leap-year, and year boundaries', () => {
    expect(shiftScheduledDate('2026-12-31', 1, 'Asia/Saigon')).toBe('2027-01-01');
    expect(shiftScheduledDate('2027-01-01', -1, 'Asia/Saigon')).toBe('2026-12-31');
    expect(shiftScheduledDate('2028-02-28', 1, 'Asia/Saigon')).toBe('2028-02-29');
    expect(shiftScheduledDate('2026-02-28', 1, 'Asia/Saigon')).toBe('2026-03-01');
    expect(() => shiftScheduledDate('2026-02-30', 1, 'Asia/Saigon')).toThrow(RangeError);
  });

  it('rejects impossible YYYY-MM-DD calendar dates in scheduledDateSchema and taskQuerySchema (C06)', () => {
    expect(scheduledDateSchema.safeParse('2026-10-30').success).toBe(true);
    expect(scheduledDateSchema.safeParse('2028-02-29').success).toBe(true);
    expect(scheduledDateSchema.safeParse('2026-02-29').success).toBe(false);
    expect(scheduledDateSchema.safeParse('2026-02-30').success).toBe(false);
    expect(scheduledDateSchema.safeParse('2026-13-01').success).toBe(false);
    expect(scheduledDateSchema.safeParse('2026-00-10').success).toBe(false);

    expect(
      createTaskInputSchema.safeParse({
        title: 'Bad scheduled date',
        deadlineAt: '2026-10-30T16:59:00.000Z',
        scheduledDate: '2026-02-30',
      }).success,
    ).toBe(false);

    expect(
      taskQuerySchema.safeParse({
        scheduledFrom: '2026-02-30',
      }).success,
    ).toBe(false);
  });

  it('normalizes offset ISO instants to canonical UTC .toISOString() in isoInstantSchema (C05)', () => {
    expect(isoInstantSchema.parse('2026-10-30T23:59:00+07:00')).toBe('2026-10-30T16:59:00.000Z');
    expect(isoInstantSchema.parse('2026-10-30T16:59:00Z')).toBe('2026-10-30T16:59:00.000Z');
  });

  it('formats Hub deadlines as HH:mm · ddd · d MMM without year in timezone', () => {
    // 2026-11-15T12:00:00Z = 19:00 on Sun 15 Nov 2026 in Asia/Saigon (+07:00)
    expect(formatHubDeadline('2026-11-15T12:00:00.000Z', 'Asia/Saigon')).toBe('19:00 · Sun · 15 Nov');
    // 2026-11-04T18:05:00Z = 01:05 on Thu 5 Nov 2026 in Asia/Saigon (+07:00)
    expect(formatHubDeadline('2026-11-04T18:05:00.000Z', 'Asia/Saigon')).toBe('01:05 · Thu · 5 Nov');
  });

  it('formats Inspector deadlines and scheduled dates with full year', () => {
    expect(formatInspectorDeadline('2026-11-15T12:00:00.000Z', 'Asia/Saigon')).toBe(
      '19:00 · Sun · 15 Nov 2026',
    );
    expect(formatInspectorDeadline('2027-01-01T01:30:00.000Z', 'Asia/Saigon')).toBe(
      '08:30 · Fri · 1 Jan 2027',
    );
    expect(formatScheduledDateWithYear('2026-11-15', 'Asia/Saigon')).toBe('Sun · 15 Nov 2026');
    expect(formatScheduledDateWithYear('2026-11-05', 'Asia/Saigon')).toBe('Thu · 5 Nov 2026');
    expect(() => formatScheduledDateWithYear('2026-02-29', 'Asia/Saigon')).toThrow(RangeError);
  });
});
