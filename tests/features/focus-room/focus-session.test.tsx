// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import type { HTMLAttributes, ReactNode } from 'react';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { leaveQuietMode, memoryStorage, renderFocusRoom, startSession } from './harness';

const mocks = vi.hoisted(() => ({ save: vi.fn() }));

// Keep presentation animations out of the timer and notification assertions.
vi.mock('motion/react', async () => {
  const { createElement, forwardRef } = await import('react');
  return {
    useReducedMotion: () => true,
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    motion: {
      div: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
        ({ children, ...props }, ref) => {
          const domProps = { ...props } as Record<string, unknown>;
          for (const key of ['initial', 'animate', 'exit', 'transition']) delete domProps[key];
          return createElement('div', { ...domProps, ref }, children);
        },
      ),
    },
  };
});

vi.mock('next/navigation', () => ({
  usePathname: () => '/focus-room',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/client/queries/tasks', () => ({
  useTasks: () => ({ data: [] }),
  useCompleteTask: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@/client/queries/projects', () => ({ useProjects: () => ({ data: [] }) }));
vi.mock('@/client/queries/learning-room', () => ({
  useLearningRoomData: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCreateLearningSession: () => ({ mutateAsync: mocks.save, isPending: false, isError: false }),
  useClearLearningRoom: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

Object.defineProperty(window, 'localStorage', { value: memoryStorage, configurable: true });

beforeEach(() => {
  memoryStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-10T05:00:00Z'));
  mocks.save.mockReset().mockResolvedValue({ id: 'session' });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('focus session accounting', () => {
  it('records real focus and pause durations and persists when notes are skipped', async () => {
    renderFocusRoom();
    startSession();
    act(() => vi.advanceTimersByTime(65000));
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    act(() => vi.advanceTimersByTime(30000));
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    act(() => vi.advanceTimersByTime(5000));
    leaveQuietMode();
    fireEvent.click(screen.getByRole('button', { name: 'Log & finish' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Skip notes' }));
    });
    const input = mocks.save.mock.calls[0]?.[0];
    expect(input.focusMinutes).toBeCloseTo(70 / 60);
    expect(input.pausedMinutes).toBe(0.5);
    expect(input.breakMinutes).toBe(0);
    expect(input.durationMinutes).toBeCloseTo(100 / 60);
    expect(Date.parse(input.completedAt) - Date.parse(input.startedAt)).toBe(100000);
    expect(input.focusIntervals).toHaveLength(1);
    expect(
      Date.parse(input.focusIntervals[0].end) - Date.parse(input.focusIntervals[0].start),
    ).toBe(100000);
  });

  it('keeps reflection input on failure and prevents duplicate in-flight saves', async () => {
    let rejectSave!: (reason: Error) => void;
    mocks.save.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectSave = reject;
        }),
    );
    renderFocusRoom();
    startSession();
    act(() => vi.advanceTimersByTime(2000));
    leaveQuietMode();
    fireEvent.click(screen.getByRole('button', { name: 'Log & finish' }));
    fireEvent.change(screen.getByLabelText(/Key insights or notes/), {
      target: { value: 'Keep this reflection' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Skip notes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip notes' }));
    expect(mocks.save).toHaveBeenCalledTimes(1);
    await act(async () => {
      rejectSave(new Error('Offline'));
    });
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect((screen.getByLabelText(/Key insights or notes/) as HTMLTextAreaElement).value).toBe(
      'Keep this reflection',
    );
  });

  it('splits the total time into focus blocks and breaks, then records every phase', async () => {
    renderFocusRoom();
    fireEvent.change(screen.getByLabelText('Hours'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '40' } });
    expect(screen.getAllByRole('listitem', { name: 'Focus, 25 minutes' })).toHaveLength(1);
    expect(screen.getByRole('listitem', { name: 'Short break, 5 minutes' })).toBeTruthy();
    expect(screen.getByRole('listitem', { name: 'Focus, 10 minutes' })).toBeTruthy();
    startSession();
    act(() => vi.advanceTimersByTime(25 * 60000));
    // A break starts: quiet mode ends so you can move around the app.
    expect(screen.getByText('Rest & recharge')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Quiet focus view' })).toBeNull();
    act(() => vi.advanceTimersByTime(15 * 60000));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Skip notes' }));
    });
    expect(mocks.save.mock.calls[0]?.[0]).toMatchObject({
      focusMinutes: 35,
      breakMinutes: 5,
      pausedMinutes: 0,
      durationMinutes: 40,
      relatedTaskId: null,
    });
    expect(mocks.save.mock.calls[0]?.[0].focusIntervals).toHaveLength(2);
  });

  it('resumes a running session in quiet mode after a refresh', () => {
    const first = renderFocusRoom();
    startSession();
    act(() => vi.advanceTimersByTime(60000));
    first.unmount();
    renderFocusRoom();
    expect(screen.getByRole('region', { name: 'Quiet focus view' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
    expect(screen.getByRole('timer').textContent).toBe('24:00');
  });
});

describe('phase notifications', () => {
  it('flashes the tab title twice, shows a dismissible toast, then restores the title', () => {
    renderFocusRoom();
    fireEvent.change(screen.getByLabelText('Hours'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '40' } });
    startSession();
    act(() => vi.advanceTimersByTime(25 * 60000));

    const alert = '(1) Time for a break · 5 min';
    expect(document.title).toBe(alert);
    act(() => vi.advanceTimersByTime(1200));
    expect(document.title).not.toBe(alert);
    act(() => vi.advanceTimersByTime(1200));
    expect(document.title).toBe(alert);
    act(() => vi.advanceTimersByTime(1200));
    expect(document.title).not.toBe(alert);
    act(() => vi.advanceTimersByTime(3600));
    expect(document.title).not.toBe(alert);
    expect(document.title).toMatch(/^☕ /);

    const toast = screen.getByText('Time for a break').closest('[role="status"]') as HTMLElement;
    expect(toast).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByText('Time for a break')).not.toBeInTheDocument();
  });

  it('dismisses the toast on its own after a few seconds', () => {
    renderFocusRoom();
    fireEvent.change(screen.getByLabelText('Hours'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '40' } });
    startSession();
    act(() => vi.advanceTimersByTime(25 * 60000));
    expect(screen.getByText('Time for a break')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(9000));
    expect(screen.queryByText('Time for a break')).not.toBeInTheDocument();
  });

  it('stays silent while the leave panel is open', () => {
    renderFocusRoom();
    fireEvent.change(screen.getByLabelText('Hours'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '40' } });
    startSession();
    act(() => vi.advanceTimersByTime(24 * 60000));
    fireEvent.click(screen.getByRole('button', { name: 'Exit quiet mode' }));
    act(() => vi.advanceTimersByTime(90000));
    expect(screen.queryByText('Time for a break')).not.toBeInTheDocument();
    expect(document.title).not.toMatch(/^\(1\)/);
  });
});

describe('sound preference', () => {
  it('remembers the mute switch', () => {
    renderFocusRoom();
    fireEvent.click(screen.getByRole('button', { name: 'Mute sounds' }));
    expect(memoryStorage.getItem('hts.focus.soundMuted')).toBe('1');
    expect(screen.getByRole('button', { name: 'Turn sounds on' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
