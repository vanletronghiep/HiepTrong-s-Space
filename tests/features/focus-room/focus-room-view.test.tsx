// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LearningSession } from '@/contracts/learning-room';
import {
  COMMITMENTS,
  leaveQuietMode,
  makeStats,
  memoryStorage,
  renderFocusRoom,
  startSession,
} from './harness';

const mocks = vi.hoisted(() => ({
  clear: vi.fn(),
  data: vi.fn(),
  save: vi.fn(),
  tasks: [] as { id: string; title: string; scheduledDate: string; deadlineAt: string }[],
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/focus-room',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/client/queries/tasks', () => ({
  useTasks: () => ({ data: mocks.tasks }),
  useCompleteTask: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@/client/queries/projects', () => ({ useProjects: () => ({ data: [] }) }));
vi.mock('@/client/queries/learning-room', () => ({
  useLearningRoomData: () => mocks.data(),
  useCreateLearningSession: () => ({
    mutateAsync: mocks.save,
    isPending: false,
    isError: false,
    reset: vi.fn(),
  }),
  useClearLearningRoom: () => ({ mutateAsync: mocks.clear, isPending: false }),
}));

Object.defineProperty(window, 'localStorage', { value: memoryStorage, configurable: true });

function loaded(stats = makeStats(), sessions: LearningSession[] = []) {
  mocks.data.mockReturnValue({
    data: { sessions, stats },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
}

beforeEach(() => {
  memoryStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-10T05:00:00Z'));
  mocks.save.mockReset().mockResolvedValue({ id: 'lr-new' });
  mocks.clear.mockReset().mockResolvedValue(3);
  mocks.tasks = [
    {
      id: 't1',
      title: 'Revise recursion notes',
      scheduledDate: '2026-11-10',
      deadlineAt: '2026-11-10T10:00:00.000Z',
    },
    {
      id: 't2',
      title: 'Flashcards unit 4',
      scheduledDate: '2026-11-10',
      deadlineAt: '2026-11-10T12:00:00.000Z',
    },
    {
      id: 't3',
      title: 'Planned for tomorrow',
      scheduledDate: '2026-11-11',
      deadlineAt: '2026-11-11T12:00:00.000Z',
    },
  ];
  loaded();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.documentElement.removeAttribute('data-hide-scrollbar');
});

describe('Focus Room setup', () => {
  it('puts a plain title outside the timer card and hides the scrollbars', () => {
    renderFocusRoom();
    const title = screen.getByRole('heading', { level: 1, name: 'Focus Room' });
    expect(title.closest('section')).toBeNull();
    expect(document.documentElement).toHaveAttribute('data-hide-scrollbar');
    expect(screen.queryByText('Plan a study session')).not.toBeInTheDocument();
  });

  it('asks for hours and minutes, one focus block box, and shows no helper text', () => {
    renderFocusRoom();
    expect(screen.getByLabelText('Hours')).toHaveValue('2');
    expect(screen.getByLabelText('Minutes')).toHaveValue('00');
    expect(screen.getByLabelText('Focus block minutes')).toHaveValue('25');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByText(/Break lengths and the number of blocks/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Select any block/)).not.toBeInTheDocument();
  });

  it('draws the plan as one line with focus, short and long break intervals', () => {
    renderFocusRoom();
    fireEvent.change(screen.getByLabelText('Hours'), { target: { value: '4' } });
    const line = screen.getByRole('list', { name: 'Session plan' });
    expect(within(line).getAllByRole('listitem', { name: 'Focus, 25 minutes' }).length).toBe(7);
    expect(within(line).getByRole('listitem', { name: 'Focus, 20 minutes' })).toBeTruthy();
    expect(within(line).getAllByRole('listitem', { name: 'Short break, 5 minutes' }).length).toBe(
      6,
    );
    expect(within(line).getByRole('listitem', { name: 'Long break, 15 minutes' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Focus, 25 minutes/ })).not.toBeInTheDocument();
  });

  it('keeps typed values inside the limits and remembers them', () => {
    renderFocusRoom();
    const focus = screen.getByLabelText('Focus block minutes');
    fireEvent.change(focus, { target: { value: '200' } });
    fireEvent.blur(focus);
    expect(focus).toHaveValue('90');
    fireEvent.change(focus, { target: { value: 'ab4' } });
    expect(focus).toHaveValue('4');
    fireEvent.blur(focus);
    expect(focus).toHaveValue('10');
    fireEvent.keyDown(focus, { key: 'ArrowUp' });
    expect(focus).toHaveValue('15');
    expect(JSON.parse(memoryStorage.getItem('hts.learning.planConfig') ?? '{}')).toMatchObject({
      focusMinutes: 10,
    });
  });

  it("lists only today's tasks and lets you start without one", () => {
    renderFocusRoom();
    expect(screen.getByRole('button', { name: 'Revise recursion notes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Flashcards unit 4' })).toBeInTheDocument();
    expect(screen.queryByText('Planned for tomorrow')).not.toBeInTheDocument();
    expect(screen.getByText('Free session')).toBeInTheDocument();

    const first = screen.getByRole('button', { name: 'Revise recursion notes' });
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText('Revise recursion notes').length).toBeGreaterThan(1);
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Free session')).toBeInTheDocument();
  });
});

describe('start ritual', () => {
  it('breathes for seven seconds, then needs all four commitments before starting', () => {
    renderFocusRoom();
    fireEvent.click(screen.getByRole('button', { name: 'Begin focus' }));
    expect(screen.getByRole('dialog', { name: 'Take a deep breath' })).toBeInTheDocument();
    expect(screen.getByText('Breathe in')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3600));
    expect(screen.getByText('Breathe out')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3500));

    expect(screen.getByRole('dialog', { name: 'Focus ritual' })).toBeInTheDocument();
    const start = screen.getByRole('button', { name: 'Start session' });
    expect(start).toBeDisabled();
    COMMITMENTS.slice(0, 3).forEach((title) =>
      fireEvent.click(screen.getByRole('button', { name: new RegExp(title) })),
    );
    expect(screen.getByText('3 of 4 confirmed')).toBeInTheDocument();
    expect(start).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(COMMITMENTS[3] ?? '') }));
    expect(start).toBeEnabled();
    fireEvent.click(start);
    expect(screen.getByRole('region', { name: 'Quiet focus view' })).toBeInTheDocument();
  });

  it('asks for the commitments once a day but breathes before every session', async () => {
    renderFocusRoom();
    startSession();
    expect(memoryStorage.getItem('hts.focus.ritualDay')).toBe('2026-11-10');
    leaveQuietMode();
    fireEvent.click(screen.getByRole('button', { name: 'Log & finish' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Skip notes' }));
    });

    // Second session the same day: the breath runs, then the session starts by itself.
    fireEvent.click(screen.getByRole('button', { name: 'Begin focus' }));
    expect(screen.getByRole('dialog', { name: 'Take a deep breath' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.queryByRole('dialog', { name: 'Focus ritual' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Quiet focus view' })).toBeInTheDocument();
  });

  it('asks for the commitments again the next day', () => {
    memoryStorage.setItem('hts.focus.ritualDay', '2026-11-09');
    renderFocusRoom();
    fireEvent.click(screen.getByRole('button', { name: 'Begin focus' }));
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByRole('dialog', { name: 'Focus ritual' })).toBeInTheDocument();
  });

  it('repeats the breath for every session and can be cancelled', () => {
    renderFocusRoom();
    fireEvent.click(screen.getByRole('button', { name: 'Begin focus' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Begin focus' }));
    expect(screen.getByRole('dialog', { name: 'Take a deep breath' })).toBeInTheDocument();
  });
});

describe('quiet mode', () => {
  it('starts on its own and shows the session name at the top left', () => {
    renderFocusRoom();
    fireEvent.click(screen.getByRole('button', { name: 'Revise recursion notes' }));
    startSession();
    const quiet = screen.getByRole('region', { name: 'Quiet focus view' });
    expect(within(quiet).getByRole('heading', { name: 'Revise recursion notes' })).toBeVisible();
    expect(within(quiet).getByText('Focus block 1 of 4')).toBeInTheDocument();
    expect(within(quiet).getByRole('list', { name: 'Session plan' })).toBeInTheDocument();
  });

  it('asks why before leaving, and Continue keeps you in quiet mode', () => {
    renderFocusRoom();
    startSession();
    fireEvent.click(screen.getByRole('button', { name: 'Exit quiet mode' }));
    const panel = screen.getByRole('dialog', { name: 'Leaving already?' });
    expect(panel).toBeInTheDocument();
    expect(panel.className).toContain('60vw');
    expect(within(panel).getByText("What's pulling you away?")).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole('radio', { name: 'Need a rest' }));
    expect(within(panel).getByRole('radio', { name: 'Need a rest' })).toBeChecked();
    fireEvent.change(within(panel).getByLabelText('Your reason, just for you'), {
      target: { value: 'My eyes are tired' },
    });
    fireEvent.click(within(panel).getByRole('button', { name: 'Continue' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Quiet focus view' })).toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('lets you leave with Exit while the timer keeps running', () => {
    renderFocusRoom();
    startSession();
    act(() => vi.advanceTimersByTime(5000));
    leaveQuietMode();
    expect(screen.queryByRole('region', { name: 'Quiet focus view' })).not.toBeInTheDocument();
    expect(screen.getByRole('timer').textContent).toBe('24:55');
    fireEvent.click(screen.getByRole('button', { name: 'Enter quiet mode' }));
    expect(screen.getByRole('region', { name: 'Quiet focus view' })).toBeInTheDocument();
  });

  it('parks a thought with the P key and lists it when the session ends', () => {
    renderFocusRoom();
    startSession();
    fireEvent.keyDown(window, { key: 'p' });
    const input = screen.getByLabelText('Park a thought');
    fireEvent.change(input, { target: { value: 'Ask about the lab deadline' } });
    fireEvent.click(screen.getByRole('button', { name: 'Park' }));
    leaveQuietMode();
    fireEvent.click(screen.getByRole('button', { name: 'Log & finish' }));
    expect(screen.getByText('Ask about the lab deadline')).toBeInTheDocument();
  });
});

describe('session complete', () => {
  it('shows a congratulations banner with focus time, blocks and streak', () => {
    renderFocusRoom();
    fireEvent.change(screen.getByLabelText('Hours'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '40' } });
    startSession();
    act(() => vi.advanceTimersByTime(40 * 60000));
    const dialog = screen.getByRole('dialog', { name: 'Session complete' });
    expect(within(dialog).getByText('35m')).toBeInTheDocument();
    expect(within(dialog).getByText('2/2')).toBeInTheDocument();
    expect(within(dialog).getByText('1 day')).toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: '4 stars' })).toBeInTheDocument();
  });

  it('uses a quieter banner when the session ends early', () => {
    renderFocusRoom();
    startSession();
    act(() => vi.advanceTimersByTime(60000));
    leaveQuietMode();
    fireEvent.click(screen.getByRole('button', { name: 'Log & finish' }));
    expect(screen.getByRole('dialog', { name: 'Ended early' })).toBeInTheDocument();
  });
});

describe('clear memory', () => {
  it('asks first, then clears the logbook and tells you', async () => {
    renderFocusRoom();
    fireEvent.click(screen.getByRole('button', { name: 'Clear memory' }));
    const dialog = screen.getByRole('dialog', { name: 'Clear memory?' });
    expect(mocks.clear).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Clear memory' }));
    });
    expect(mocks.clear).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Memory cleared/)).toBeInTheDocument();
  });

  it('deletes nothing when you cancel, and reports a failed clear', async () => {
    renderFocusRoom();
    fireEvent.click(screen.getByRole('button', { name: 'Clear memory' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mocks.clear).not.toHaveBeenCalled();

    mocks.clear.mockRejectedValueOnce(new Error('offline'));
    // The closing dialog may still be fading out, so take the page button, which comes first.
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear memory' })[0]!);
    const dialog = screen.getByRole('dialog', { name: 'Clear memory?' });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Clear memory' }));
    });
    expect(screen.getByText(/Could not clear memory/)).toBeInTheDocument();
  });
});

describe('statistics', () => {
  const stats = makeStats({
    todayFocusMinutes: 85,
    weekFocusMinutes: 425,
    averageSessionMinutes: 48,
    streakDays: 12,
    activity: [{ date: '2026-11-09', focusMinutes: 120 }],
    weekDays: makeStats().weekDays.map((day, index) => ({
      ...day,
      focusMinutes: [110, 135, 95, 85, 0, 0, 0][index] ?? 0,
    })),
    recentWeeks: [
      { weekStart: '2026-10-26', focusMinutes: 300 },
      { weekStart: '2026-11-02', focusMinutes: 600 },
      { weekStart: '2026-11-09', focusMinutes: 425 },
    ],
    months: [100, 200, 0, 0, 0, 0, 0, 0, 0, 300, 425, 0],
    timeline: makeStats().timeline.map((slots, month) =>
      month === 10 ? slots.map((_, slot) => (slot === 36 || slot === 37 ? 15 : 0)) : slots,
    ),
  });

  it('shows the four key numbers', () => {
    loaded(stats);
    renderFocusRoom();
    const metric = (label: string) => screen.getByText(label).nextElementSibling;
    expect(metric("Today's focus time")).toHaveTextContent('1h 25m');
    expect(metric("This week's focus time")).toHaveTextContent('7h 05m');
    expect(metric('Average session')).toHaveTextContent('48m');
    expect(metric('Focus streak')).toHaveTextContent('12 days');
  });

  it('draws a year-long activity heatmap with a cell for every day', () => {
    loaded(stats);
    renderFocusRoom();
    const map = screen.getByRole('img', { name: 'Focus activity in 2026' });
    expect(map.querySelector('[title="2026-11-09: 2h"]')).not.toBeNull();
    expect(map.querySelector('[title="2026-11-10: no focus"]')).not.toBeNull();
    expect(map.querySelectorAll('[title]')).toHaveLength(365);
  });

  it('compares focus time by day, week and month', () => {
    loaded(stats);
    renderFocusRoom();
    const day = screen.getByRole('list', { name: 'Focus time by day' });
    expect(within(day).getAllByRole('listitem')).toHaveLength(7);
    expect(within(day).getByText('1h 50m')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Week' }));
    const week = screen.getByRole('list', { name: 'Focus time by week' });
    expect(within(week).getAllByRole('listitem')).toHaveLength(3);
    expect(within(week).getByText('Oct 26')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Month' }));
    const month = screen.getByRole('list', { name: 'Focus time by month' });
    expect(within(month).getAllByRole('listitem')).toHaveLength(12);
    expect(within(month).getByText('Jan')).toBeInTheDocument();
    expect(within(month).getByText('Dec')).toBeInTheDocument();
  });

  it('shows this month as one continuous strip and opens the yearly overview', () => {
    loaded(stats);
    renderFocusRoom();
    expect(
      screen.getByRole('img', { name: 'November: busiest between 09:00 and 10:00' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Yearly overview' }));
    const dialog = screen.getByRole('dialog', { name: 'When you focus · 2026' });
    expect(within(dialog).getAllByRole('img')).toHaveLength(12);
    expect(
      within(dialog).getByRole('img', { name: 'January: no focus time yet' }),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows skeletons while loading', () => {
    mocks.data.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
    renderFocusRoom();
    expect(screen.getByLabelText('Loading focus statistics')).toBeInTheDocument();
  });

  it('keeps the timer usable offline with a retry banner', () => {
    const refetch = vi.fn();
    mocks.data.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    renderFocusRoom();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('The focus timer remains ready for offline study');
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Begin focus' })).toBeEnabled();
  });

  it('keeps the logbook of recent sessions with Asia/Saigon dates and star ratings', () => {
    loaded(stats, [
      {
        id: 'lr-1',
        title: 'Eigenvalue proofs',
        mode: 'deep_focus',
        targetSubject: 'Calculus I',
        relatedProjectId: null,
        relatedTaskId: null,
        startedAt: '2026-11-13T18:30:00.000Z',
        completedAt: '2026-11-13T19:20:00.000Z',
        durationMinutes: 50,
        focusMinutes: 50,
        breakMinutes: 0,
        pausedMinutes: 0,
        status: 'completed',
        reflectionNotes: 'Reviewed spectral theorem examples.',
        rating: 4,
        focusIntervals: [],
      },
    ]);
    renderFocusRoom();
    expect(screen.getByText('Eigenvalue proofs')).toBeInTheDocument();
    expect(screen.getByText('Nov 14')).toBeInTheDocument();
    expect(screen.getByLabelText('Rating: 4 out of 5 stars')).toHaveClass('text-text-due-soon');
  });
});
