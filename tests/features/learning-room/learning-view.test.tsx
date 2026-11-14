// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LearningRoomStats, LearningSession } from '@/contracts/learning-room';
import { LearningRoomView } from '@/features/learning-room/LearningRoomView';
import { FeatureThemeProvider } from '@/ui/FeatureTheme';

const mockUseLearningRoomData = vi.fn();
const mockMutateAsync = vi.fn();
const mockCreateState = {
  mutateAsync: mockMutateAsync,
  isPending: false,
  isError: false,
  reset: vi.fn(),
};

vi.mock('@/client/queries/learning-room', () => ({
  useLearningRoomData: () => mockUseLearningRoomData(),
  useCreateLearningSession: () => mockCreateState,
}));

function renderLearningView() {
  return render(
    <FeatureThemeProvider name="learning-room">
      <LearningRoomView />
    </FeatureThemeProvider>,
  );
}

const emptyStats: LearningRoomStats = {
  totalFocusMinutes: 0,
  totalStudyMinutes: 0,
  totalPausedMinutes: 0,
  totalSessions: 0,
  completedSessions: 0,
  streakDays: 0,
  subjectBreakdown: [],
  dailyHistory: [],
};

describe('LearningRoomView ("Bonsai Timer Sanctuary")', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset().mockResolvedValue({ id: 'lr-new' });
    mockCreateState.isPending = false;
    mockCreateState.isError = false;
    mockCreateState.reset.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders all 5 curated decorative SVGs, empty state meditation cushion, and labeled controls', () => {
    mockUseLearningRoomData.mockReturnValue({
      data: { sessions: [], stats: emptyStats },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const { container } = renderLearningView();

    expect(screen.getByRole('heading', { name: /Learning\s*Room/i })).toBeInTheDocument();
    expect(screen.getByText('Bonsai timer sanctuary · Deep work')).toBeInTheDocument();
    expect(screen.getByText('No recorded sessions yet.')).toBeInTheDocument();

    const imgs = Array.from(container.querySelectorAll('img'));
    const srcs = imgs.map((img) => img.getAttribute('src'));
    expect(srcs).toEqual(
      expect.arrayContaining([
        '/visuals/learning-room/bamboo-screen-edge.svg',
        '/visuals/learning-room/bonsai-on-a-stone.svg',
        '/visuals/learning-room/enso-and-pebble.svg',
        '/visuals/learning-room/bamboo-interval.svg',
        '/visuals/learning-room/meditation-cushion.svg',
      ]),
    );
    expect(new Set(srcs).size).toBe(5);
    for (const img of imgs) {
      expect(img).toHaveAttribute('alt', '');
      expect(img).toHaveAttribute('aria-hidden', 'true');
    }

    expect(screen.getByRole('group', { name: 'Study subject' })).toBeInTheDocument();
    expect(screen.getByLabelText('Session intention')).toBeInTheDocument();
  });

  it('renders Asia/Saigon bar chart dates, accessible minute readouts, and high-contrast star ratings', () => {
    const sessions: LearningSession[] = [
      {
        id: 'lr-1',
        title: 'Eigenvalue proofs',
        mode: 'deep_focus',
        targetSubject: 'Calculus I',
        relatedProjectId: null,
        relatedTaskId: null,
        startedAt: '2026-11-13T18:30:00.000Z', // 2026-11-14 01:30 in Asia/Saigon (+07:00)
        completedAt: '2026-11-13T19:20:00.000Z',
        durationMinutes: 50,
        focusMinutes: 50,
        breakMinutes: 0,
        pausedMinutes: 0,
        status: 'completed',
        reflectionNotes: 'Reviewed spectral theorem examples.',
        rating: 4,
      },
    ];
    const stats: LearningRoomStats = {
      totalFocusMinutes: 50,
      totalStudyMinutes: 50,
      totalPausedMinutes: 0,
      totalSessions: 1,
      completedSessions: 1,
      streakDays: 1,
      subjectBreakdown: [{ subject: 'Calculus I', minutes: 50, percentage: 100 }],
      dailyHistory: [
        { date: '2026-11-13', focusMinutes: 25, breakMinutes: 0, sessionCount: 1 },
        { date: '2026-11-14', focusMinutes: 50, breakMinutes: 0, sessionCount: 1 },
      ],
    };

    mockUseLearningRoomData.mockReturnValue({
      data: { sessions, stats },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderLearningView();

    // 2026-11-13 is Friday, 2026-11-14 is Saturday in Asia/Saigon
    const chartList = screen.getByRole('list', { name: '7-day study pattern' });
    expect(within(chartList).getByText('Fri')).toBeInTheDocument();
    expect(within(chartList).getByText('Sat')).toBeInTheDocument();
    expect(within(chartList).getByText('25m')).toBeInTheDocument();
    expect(within(chartList).getByText('50m')).toBeInTheDocument();

    // Session date formatted in Asia/Saigon (18:30Z -> Nov 14 in +07:00)
    expect(screen.getByText('Nov 14')).toBeInTheDocument();

    // Singular streak label & high-contrast star rating
    expect(screen.getByText('1 day')).toBeInTheDocument();
    const ratingEl = screen.getByLabelText('Rating: 4 out of 5 stars');
    expect(ratingEl).toHaveClass('text-text-due-soon');
  });

  it('keeps timer usable offline on load failure with non-blocking alert and Retry button', () => {
    const refetchSpy = vi.fn();
    mockUseLearningRoomData.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchSpy,
    });

    renderLearningView();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('The focus timer remains ready for offline study');
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(refetchSpy).toHaveBeenCalledTimes(1);

    // Timer remains interactive despite query failure
    fireEvent.click(screen.getByRole('button', { name: 'Begin focus' }));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('renders skeleton placeholders while loading', () => {
    mockUseLearningRoomData.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    renderLearningView();

    expect(screen.getByLabelText('Loading focus statistics')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading 7-day study pattern')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading subject distribution')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading recent study sessions')).toBeInTheDocument();
  });

  it('uses compact Session reflection Dialog, high-contrast star picker, and scopes save errors inside the dialog', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-13T08:00:00Z'));

    mockUseLearningRoomData.mockReturnValue({
      data: { sessions: [], stats: emptyStats },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockCreateState.isError = true;
    mockMutateAsync.mockRejectedValueOnce(new Error('Save failed'));

    renderLearningView();

    // No root-level mutation error before dialog opens
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Begin focus' }));
    act(() => vi.advanceTimersByTime(3000));
    fireEvent.click(screen.getByRole('button', { name: 'Log & finish' }));

    const dialog = screen.getByRole('dialog', { name: 'Session reflection' });
    expect(dialog).toHaveAttribute('data-feature-theme', 'learning-room');
    expect(dialog.className).toContain('max-w-[440px]');

    const starFour = within(dialog).getByRole('radio', { name: '4 stars' });
    fireEvent.click(starFour);
    expect(starFour).toHaveClass('text-text-due-soon');

    const notesInput = within(dialog).getByLabelText(/Key insights or notes/);
    fireEvent.change(notesInput, { target: { value: 'Retained insight' } });

    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save to logbook' }));
    });

    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      'Could not save this session. Your notes are retained; retry saving.',
    );
    expect(within(dialog).getByLabelText(/Key insights or notes/)).toHaveValue('Retained insight');
    // Still only 1 alert (scoped inside the dialog, no duplicate root alert)
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('toggles Quiet focus view and hides masthead and analytics while active', () => {
    mockUseLearningRoomData.mockReturnValue({
      data: { sessions: [], stats: emptyStats },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderLearningView();

    const toggle = screen.getByRole('button', { name: 'Quiet focus view' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle);

    const exitToggle = screen.getByRole('button', { name: 'Exit quiet view' });
    expect(exitToggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('heading', { name: /Learning\s*Room/i })).not.toBeInTheDocument();
    expect(screen.queryByText('7-day study pattern')).not.toBeInTheDocument();
  });
});
