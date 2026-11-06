import { describe, expect, it } from 'vitest';
import { buildZonedInstant, DEFAULT_APP_TIMEZONE } from '@/domain/time';
import { getDailyClock } from '@/features/tasks/daily-dashboard-time';

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: DEFAULT_APP_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function clock(day: string, time: string, seconds = 0) {
  const instant = Date.parse(buildZonedInstant(day, time, DEFAULT_APP_TIMEZONE));
  return getDailyClock(new Date(instant + seconds * 1000), formatter);
}

describe('Daily dashboard clock', () => {
  it('keeps the time label on the minute while the arc moves every second', () => {
    const before = clock('2026-11-04', '23:58', 58);
    const after = clock('2026-11-04', '23:58', 59);
    expect(before.time).toBe('23:58');
    expect(after.time).toBe(before.time);
    expect(after.progress - before.progress).toBeCloseTo(1 / 86_400);
    expect(clock('2026-11-04', '23:59').time).toBe('23:59');
  });

  it('resets the day arc at local midnight', () => {
    expect(clock('2026-11-05', '00:00')).toEqual({
      time: '00:00',
      progress: 0,
    });
  });
});
