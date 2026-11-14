// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrackingData } from '@/contracts/tracking';
import { formatScheduledDate } from '@/domain/time';
import { TrackingView } from '@/features/tracking/TrackingView';
import { FeatureThemeProvider } from '@/ui/FeatureTheme';

const mockUseTrackingData = vi.fn();
const mockToggleMutate = vi.fn();
const mockCreateMutateAsync = vi.fn();
const mockLogSleepMutateAsync = vi.fn();
const mockLogScreenTimeMutateAsync = vi.fn();

const mockToggleState = {
  mutate: mockToggleMutate,
  isPending: false,
  isError: false,
  reset: vi.fn(),
};

const mockCreateState = {
  mutateAsync: mockCreateMutateAsync,
  isPending: false,
  isError: false,
  reset: vi.fn(),
};

const mockSleepState = {
  mutateAsync: mockLogSleepMutateAsync,
  isPending: false,
  isError: false,
  reset: vi.fn(),
};

const mockScreenTimeState = {
  mutateAsync: mockLogScreenTimeMutateAsync,
  isPending: false,
  isError: false,
  reset: vi.fn(),
};

vi.mock('@/client/queries/tracking', () => ({
  useTrackingData: () => mockUseTrackingData(),
  useToggleHabit: () => mockToggleState,
  useCreateHabit: () => mockCreateState,
  useLogSleep: () => mockSleepState,
  useLogScreenTime: () => mockScreenTimeState,
}));

function renderTrackingView() {
  return render(
    <FeatureThemeProvider name="tracking">
      <TrackingView />
    </FeatureThemeProvider>,
  );
}

describe('TrackingView ("Herbal Tea Sanctuary")', () => {
  const todayStr = formatScheduledDate(new Date());

  beforeEach(() => {
    mockToggleMutate.mockReset();
    mockCreateMutateAsync.mockReset().mockResolvedValue({});
    mockLogSleepMutateAsync.mockReset().mockResolvedValue({});
    mockLogScreenTimeMutateAsync.mockReset().mockResolvedValue({});

    mockToggleState.isPending = false;
    mockToggleState.isError = false;
    mockCreateState.isPending = false;
    mockCreateState.isError = false;
    mockSleepState.isPending = false;
    mockSleepState.isError = false;
    mockScreenTimeState.isPending = false;
    mockScreenTimeState.isError = false;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders empty state with garden-watering-can spot and curated non-interactive botanical SVGs', () => {
    const emptyData: TrackingData = {
      habits: [],
      sleepLogs: [],
      screenTimeLogs: [],
      stats: {
        overallHabitCompletionRate: 0,
        averageSleepHours: 0,
        averageProductiveRatio: 0,
        activeStreakDays: 0,
      },
    };
    mockUseTrackingData.mockReturnValue({
      data: emptyData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const { container } = renderTrackingView();

    expect(screen.getByRole('heading', { name: /Tracking\s*sanctuary/i })).toBeInTheDocument();
    expect(screen.getByText('Mindful daily rhythm · Kaizen')).toBeInTheDocument();
    expect(screen.getByText('Begin a daily ritual.')).toBeInTheDocument();

    const imgs = Array.from(container.querySelectorAll('img'));
    const srcs = imgs.map((img) => img.getAttribute('src'));
    expect(srcs).toEqual(
      expect.arrayContaining([
        '/visuals/tracking/climbing-thyme-edge.svg',
        '/visuals/tracking/herbal-tea-ritual.svg',
        '/visuals/tracking/garden-watering-can.svg',
        '/visuals/tracking/tea-steam-rule.svg',
        '/visuals/tracking/mint-herbarium.svg',
      ]),
    );
    for (const img of imgs) {
      expect(img).toHaveAttribute('alt', '');
      expect(img).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('toggles populated habit checkbox and formats singular/plural streaks cleanly', () => {
    const populatedData: TrackingData = {
      habits: [
        {
          id: 'h-1',
          title: 'Morning green tea & stillness',
          category: 'mindfulness',
          targetFrequency: 'daily',
          streakDays: 1,
          completedDates: [],
          active: true,
        },
        {
          id: 'h-2',
          title: 'Evening reading',
          category: 'learning',
          targetFrequency: 'daily',
          streakDays: 4,
          completedDates: [todayStr],
          active: true,
        },
      ],
      sleepLogs: [],
      screenTimeLogs: [],
      stats: {
        overallHabitCompletionRate: 50,
        averageSleepHours: 0,
        averageProductiveRatio: 0,
        activeStreakDays: 4,
      },
    };

    mockUseTrackingData.mockReturnValue({
      data: populatedData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderTrackingView();

    const habitsRegion = screen.getByRole('region', { name: 'Daily habits checklist' });
    expect(within(habitsRegion).getByText('1 / 2 today')).toBeInTheDocument();
    expect(within(habitsRegion).getByText('1 day')).toBeInTheDocument();
    expect(within(habitsRegion).getByText('4 days')).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', {
      name: 'Toggle habit Morning green tea & stillness',
    });
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(checkbox);
    expect(mockToggleMutate).toHaveBeenCalledWith({ habitId: 'h-1', date: todayStr });
  });

  it('renders sleep logs with high-contrast star class, timezone-safe dates, and submits sleep log', async () => {
    const sleepData: TrackingData = {
      habits: [],
      sleepLogs: [
        {
          id: 's-1',
          date: '2026-11-13',
          bedTime: '23:00',
          wakeTime: '06:30',
          durationHours: 7.5,
          qualityRating: 4,
          sleepDebtMinutes: 30,
          notes: 'Deep rest',
        },
      ],
      screenTimeLogs: [],
      stats: {
        overallHabitCompletionRate: 0,
        averageSleepHours: 7.5,
        averageProductiveRatio: 0,
        activeStreakDays: 0,
      },
    };
    mockUseTrackingData.mockReturnValue({
      data: sleepData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderTrackingView();

    expect(screen.getByText('Nov 13')).toBeInTheDocument();
    const ratingEl = screen.getByLabelText('4 out of 5 stars');
    expect(ratingEl).toHaveClass('text-text-due-soon');
    expect(ratingEl.textContent).toBe('★★★★');

    fireEvent.click(screen.getByRole('button', { name: 'Log sleep' }));
    const dialog = screen.getByRole('dialog', { name: "Log night's sleep" });
    expect(dialog).toHaveAttribute('data-feature-theme', 'tracking');

    fireEvent.change(within(dialog).getByLabelText('Restfulness notes'), {
      target: { value: 'Woke calm' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Log sleep' }));

    await waitFor(() =>
      expect(mockLogSleepMutateAsync).toHaveBeenCalledWith({
        date: todayStr,
        bedTime: '23:00',
        wakeTime: '06:30',
        durationHours: 7.5,
        qualityRating: 5,
        notes: 'Woke calm',
      }),
    );
  });

  it('guards totalMinutes === 0 screen time against NaN% and submits new balance log', async () => {
    const zeroScreenData: TrackingData = {
      habits: [],
      sleepLogs: [],
      screenTimeLogs: [
        {
          id: 'scr-zero',
          date: '2026-11-13',
          totalMinutes: 0,
          productiveMinutes: 0,
          leisureMinutes: 0,
          notes: 'Offline sabbatical',
        },
      ],
      stats: {
        overallHabitCompletionRate: 0,
        averageSleepHours: 0,
        averageProductiveRatio: 0,
        activeStreakDays: 0,
      },
    };

    mockUseTrackingData.mockReturnValue({
      data: zeroScreenData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const { container } = renderTrackingView();

    expect(container.textContent).not.toContain('NaN');
    expect(screen.getByText('0% deep work')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Log hours' }));
    const dialog = screen.getByRole('dialog', { name: 'Log screen time hours' });
    fireEvent.change(within(dialog).getByLabelText('Productive (minutes)'), {
      target: { value: '180' },
    });
    fireEvent.change(within(dialog).getByLabelText('Leisure (minutes)'), {
      target: { value: '30' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Log balance' }));

    await waitFor(() =>
      expect(mockLogScreenTimeMutateAsync).toHaveBeenCalledWith({
        date: todayStr,
        totalMinutes: 210,
        productiveMinutes: 180,
        leisureMinutes: 30,
        notes: '',
      }),
    );
  });

  it('scopes mutation errors to the failing dialog and retains user inputs on error', async () => {
    mockUseTrackingData.mockReturnValue({
      data: {
        habits: [],
        sleepLogs: [],
        screenTimeLogs: [],
        stats: {
          overallHabitCompletionRate: 0,
          averageSleepHours: 0,
          averageProductiveRatio: 0,
          activeStreakDays: 0,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockCreateState.isError = true;
    mockCreateMutateAsync.mockRejectedValueOnce(new Error('Network error'));

    renderTrackingView();

    // Unrelated sleep dialog must NOT show createHabit's error
    fireEvent.click(screen.getByRole('button', { name: 'Log sleep' }));
    const sleepDialog = screen.getByRole('dialog', { name: "Log night's sleep" });
    expect(within(sleepDialog).queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(within(sleepDialog).getByRole('button', { name: 'Cancel' }));

    // Add habit dialog shows only its own error and retains user input on rejected submit
    fireEvent.click(screen.getByRole('button', { name: 'Add new habit' }));
    const habitDialog = screen.getByRole('dialog', { name: 'Add daily habit' });
    const titleInput = within(habitDialog).getByLabelText('Habit title');
    fireEvent.change(titleInput, { target: { value: 'Herbal tea pause' } });
    fireEvent.click(within(habitDialog).getByRole('button', { name: 'Save habit' }));

    await waitFor(() => expect(mockCreateMutateAsync).toHaveBeenCalled());
    expect(within(habitDialog).getByRole('alert')).toHaveTextContent(
      'Could not save this habit. Your input is retained; retry.',
    );
    expect(within(habitDialog).getByLabelText('Habit title')).toHaveValue('Herbal tea pause');
  });

  it('renders alert banner with retry button on query fetch error', () => {
    const refetchSpy = vi.fn();
    mockUseTrackingData.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchSpy,
    });

    renderTrackingView();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not load your tracking rhythm right now.');
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(refetchSpy).toHaveBeenCalledTimes(1);
  });
});
