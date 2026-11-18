// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { createElement } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildZonedInstant, DEFAULT_APP_TIMEZONE } from '@/domain/time';
import { DailyDashboard } from '@/features/tasks/daily/DailyDashboard';
import { getDailyClock } from '@/features/tasks/daily/daily-dashboard-time';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

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
      timeSeconds: '00:00:00',
      countdown: '-24:00:00 until 00:00',
      progress: 0,
    });
  });

  it('updates DayArc on minute boundaries using compositor transform instead of 1Hz layout loops', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-04T16:58:58.000Z')); // 23:58:58 Asia/Ho_Chi_Minh

    render(createElement(DailyDashboard, { done: 1, total: 3, timeZone: DEFAULT_APP_TIMEZONE }));

    const arc = screen.getByRole('region', { name: 'Day arc' });
    const moon = arc.querySelector('[class*="moon"]') as HTMLElement;
    const track = moon.parentElement as HTMLElement;
    const elapsed = arc.querySelector('[class*="arcElapsed"]') as SVGPathElement;

    expect(screen.getByText('23:58')).toBeInTheDocument();
    expect(moon.style.left).toBe('');
    expect(moon.style.top).toBe('');
    expect(track.style.transform).toContain('translate3d(');

    const initialTransform = track.style.transform;
    const initialClipPath = elapsed.style.clipPath;

    // 1s later within the same minute -> no DOM/style churn
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('23:58')).toBeInTheDocument();
    expect(track.style.transform).toBe(initialTransform);
    expect(elapsed.style.clipPath).toBe(initialClipPath);

    // Cross minute boundary (23:58:59 -> 23:59:00.100) -> discrete step
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(screen.getByText('23:59')).toBeInTheDocument();
    expect(track.style.transform).not.toBe(initialTransform);
    expect(elapsed.style.clipPath).not.toBe(initialClipPath);

    // 2500ms idle within 23:59 -> zero idle updates
    const settledTransform = track.style.transform;
    const settledClipPath = elapsed.style.clipPath;
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(track.style.transform).toBe(settledTransform);
    expect(elapsed.style.clipPath).toBe(settledClipPath);
  });
});
