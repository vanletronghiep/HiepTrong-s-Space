import { describe, expect, it } from 'vitest';
import { consecutiveDays } from '@/domain/activity-days';
import { formatScheduledDate } from '@/domain/time';
describe('activity days', () => {
  it('uses local day before 07:00', () =>
    expect(formatScheduledDate('2026-11-09T18:00:00Z')).toBe('2026-11-10'));
  it('deduplicates days, preserves yesterday and breaks on a gap', () => {
    expect(
      consecutiveDays(['2026-11-09', '2026-11-09', '2026-11-08', '2026-11-06'], '2026-11-10'),
    ).toBe(2);
    expect(consecutiveDays([], '2026-11-10')).toBe(0);
    expect(consecutiveDays(['2026-11-11'], '2026-11-10')).toBe(0);
  });
});
