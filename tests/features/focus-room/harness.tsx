import { act, fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import type { LearningRoomStats } from '@/contracts/learning-room';
import { FocusRoomView } from '@/features/focus-room/FocusRoomView';
import { FocusSessionProvider } from '@/features/focus-room/FocusSessionProvider';
import { FeatureThemeProvider } from '@/ui/FeatureTheme';
import { ToastProvider } from '@/ui/Toast';

export const memoryStorage = (() => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, String(value)),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
  };
})();

export function renderFocusRoom() {
  return render(
    <ToastProvider>
      <FeatureThemeProvider name="learning-room">
        <FocusSessionProvider>
          <FocusRoomView />
        </FocusSessionProvider>
      </FeatureThemeProvider>
    </ToastProvider>,
  );
}

export const COMMITMENTS = [
  'No phone allowed',
  'Silence notifications',
  'No unnecessary tabs',
  'Respect your time',
];

/**
 * Click Begin focus, wait out the breath, and confirm all four commitments when they are asked
 * for (once a day), then start.
 */
export function startSession() {
  fireEvent.click(screen.getByRole('button', { name: 'Begin focus' }));
  act(() => {
    vi.advanceTimersByTime(7000);
  });
  if (!screen.queryByRole('dialog', { name: 'Focus ritual' })) return;
  for (const title of COMMITMENTS) {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(title) }));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Start session' }));
}

/** Leave quiet mode through the confirmation panel so the full timer card shows. */
export function leaveQuietMode() {
  fireEvent.click(screen.getByRole('button', { name: 'Exit quiet mode' }));
  fireEvent.click(screen.getByRole('button', { name: 'Exit' }));
}

export function makeStats(overrides: Partial<LearningRoomStats> = {}): LearningRoomStats {
  return {
    year: 2026,
    todayFocusMinutes: 0,
    weekFocusMinutes: 0,
    averageSessionMinutes: 0,
    streakDays: 0,
    activity: [],
    weekDays: [
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ].map((date) => ({ date, focusMinutes: 0 })),
    recentWeeks: [{ weekStart: '2026-11-09', focusMinutes: 0 }],
    months: Array.from({ length: 12 }, () => 0),
    timeline: Array.from({ length: 12 }, () => Array.from({ length: 96 }, () => 0)),
    ...overrides,
  };
}
