// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntertainmentData } from '@/contracts/entertainment';
import { EntertainmentView } from '@/features/entertainment/EntertainmentView';
import { FeatureThemeProvider } from '@/ui/FeatureTheme';

const mockUseEntertainmentData = vi.fn();
const mockCreateBookAsync = vi.fn();
const mockCreateGameAsync = vi.fn();
const mockUpdateProgressMutate = vi.fn();

const mockCreateBookState = {
  mutateAsync: mockCreateBookAsync,
  isPending: false,
  isError: false,
  reset: vi.fn(),
};

const mockCreateGameState = {
  mutateAsync: mockCreateGameAsync,
  isPending: false,
  isError: false,
  reset: vi.fn(),
};

const mockUpdateProgressState = {
  mutate: mockUpdateProgressMutate,
  isPending: false,
  isError: false,
  reset: vi.fn(),
};

vi.mock('@/client/queries/entertainment', () => ({
  useEntertainmentData: () => mockUseEntertainmentData(),
  useCreateBook: () => mockCreateBookState,
  useCreateGame: () => mockCreateGameState,
  useUpdateBookProgress: () => mockUpdateProgressState,
}));

function renderEntertainmentView() {
  return render(
    <FeatureThemeProvider name="entertainment-hub">
      <EntertainmentView />
    </FeatureThemeProvider>,
  );
}

const emptyData: EntertainmentData = {
  books: [],
  games: [],
  musicTracks: [],
  stats: {
    booksReadThisYear: 0,
    totalGamesPlayed: 0,
    currentBook: null,
    currentGame: null,
  },
};

const populatedData: EntertainmentData = {
  books: [
    {
      id: 'book-1',
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      status: 'reading',
      progressPercentage: 45,
      rating: 5,
      genre: 'Systems',
      thoughts: 'Clear breakdown of replication models.',
    },
    {
      id: 'book-2',
      title: 'The Art of Doing Science and Engineering',
      author: 'Richard Hamming',
      status: 'completed',
      progressPercentage: 100,
      rating: 5,
      genre: 'Philosophy',
      thoughts: '',
    },
  ],
  games: [
    {
      id: 'game-1',
      title: 'Hollow Knight',
      platform: 'PC',
      status: 'playing',
      hoursPlayed: 24,
      rating: 4,
    },
  ],
  musicTracks: [
    {
      id: 'track-1',
      title: 'Rain over Kyoto',
      artist: 'Ambient Ensemble',
      mood: 'Calm focus',
      url: 'https://example.com/kyoto-rain',
      durationMinutes: 42,
    },
    {
      id: 'track-2',
      title: 'Unsafe Stream',
      artist: 'Invalid Source',
      mood: 'Blocked',
      url: 'javascript:alert(1)',
      durationMinutes: 10,
    },
  ],
  stats: {
    booksReadThisYear: 1,
    totalGamesPlayed: 1,
    currentBook: {
      id: 'book-1',
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      status: 'reading',
      progressPercentage: 45,
      rating: 5,
      genre: 'Systems',
      thoughts: 'Clear breakdown of replication models.',
    },
    currentGame: {
      id: 'game-1',
      title: 'Hollow Knight',
      platform: 'PC',
      status: 'playing',
      hoursPlayed: 24,
      rating: 4,
    },
  },
};

describe('EntertainmentView ("Continue Strip & Shelves")', () => {
  beforeEach(() => {
    mockCreateBookAsync.mockReset().mockResolvedValue({ id: 'book-new' });
    mockCreateGameAsync.mockReset().mockResolvedValue({ id: 'game-new' });
    mockUpdateProgressMutate.mockReset();

    mockCreateBookState.isPending = false;
    mockCreateBookState.isError = false;
    mockCreateBookState.reset.mockReset();

    mockCreateGameState.isPending = false;
    mockCreateGameState.isError = false;
    mockCreateGameState.reset.mockReset();

    mockUpdateProgressState.isPending = false;
    mockUpdateProgressState.isError = false;
    mockUpdateProgressState.reset.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders all 5 curated decorative SVGs and empty states with dream-console and floating-headphones', () => {
    mockUseEntertainmentData.mockReturnValue({
      data: emptyData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const { container } = renderEntertainmentView();

    expect(screen.getByRole('heading', { name: /Entertainment\s*lounge/i })).toBeInTheDocument();
    expect(screen.getByText('Relaxed personal lounge')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Continue enjoying' })).toBeInTheDocument();
    expect(screen.getByText('No books in your library yet.')).toBeInTheDocument();
    expect(screen.getByText('Your gaming shelf is clear.')).toBeInTheDocument();
    expect(screen.getByText('No saved soundtracks yet.')).toBeInTheDocument();

    const imgs = Array.from(container.querySelectorAll('img'));
    const srcs = imgs.map((img) => img.getAttribute('src'));
    expect(srcs).toEqual(
      expect.arrayContaining([
        '/visuals/entertainment-hub/pixel-waterfall-edge.svg',
        '/visuals/entertainment-hub/dream-city-horizon.svg',
        '/visuals/entertainment-hub/ribbon-signal.svg',
        '/visuals/entertainment-hub/dream-console.svg',
        '/visuals/entertainment-hub/floating-headphones.svg',
      ]),
    );
    expect(new Set(srcs).size).toBe(5);
    for (const img of imgs) {
      expect(img).toHaveAttribute('alt', '');
      expect(img).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('renders populated Continue enjoying strip, high-contrast star ratings, reading slider, and safe music links', () => {
    mockUseEntertainmentData.mockReturnValue({
      data: populatedData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderEntertainmentView();

    const continueSection = screen.getByRole('region', { name: 'Continue enjoying' });
    expect(
      within(continueSection).getByRole('heading', { name: 'Continue enjoying' }),
    ).toHaveAttribute('id', 'continue-heading');
    expect(
      within(continueSection).getByText('Designing Data-Intensive Applications'),
    ).toBeInTheDocument();
    expect(within(continueSection).getByText('Hollow Knight')).toBeInTheDocument();

    const starRating = within(continueSection).getByLabelText('Rating: 4 out of 5 stars');
    expect(starRating).toHaveClass('text-text-due-soon');

    const overview = screen.getByRole('region', { name: 'Library overview' });
    const booksMetric = within(overview).getByText('Books on shelf').closest('div')!;
    expect(within(booksMetric).getByText('2')).toBeInTheDocument();
    const completedMetric = within(overview).getByText('Books completed').closest('div')!;
    expect(within(completedMetric).getByText('1')).toBeInTheDocument();

    const readingBadge = screen.getByText('reading');
    const completedBadge = screen.getByText('completed');
    expect(readingBadge.className).toContain('statusReading');
    expect(completedBadge.className).toContain('statusCompleted');

    const slider = screen.getByRole('slider', {
      name: 'Reading progress for Designing Data-Intensive Applications',
    });
    fireEvent.change(slider, { target: { value: '72' } });
    expect(mockUpdateProgressMutate).toHaveBeenCalledWith({
      bookId: 'book-1',
      progressPercentage: 72,
    });

    // Switch to Music tab and verify safe external URL handling
    fireEvent.click(screen.getByRole('tab', { name: 'Music' }));
    const listenLink = screen.getByRole('link', { name: /Listen stream/i });
    expect(listenLink).toHaveAttribute('href', 'https://example.com/kyoto-rain');
    expect(screen.getByText('Stream link unavailable')).toBeInTheDocument();
  });

  it('shows Skeleton placeholders while loading and a non-blocking Retry banner on load error', () => {
    mockUseEntertainmentData.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    const { unmount } = renderEntertainmentView();
    expect(screen.getByLabelText('Loading library overview')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading active media')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading reading library')).toBeInTheDocument();
    unmount();

    const refetchSpy = vi.fn();
    mockUseEntertainmentData.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchSpy,
    });

    renderEntertainmentView();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not load your entertainment shelves');
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(refetchSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: /Entertainment\s*lounge/i })).toBeInTheDocument();
  });

  it('uses compact Dialogs with scoped alerts, clamped numeric inputs, and draft retention on error', async () => {
    mockUseEntertainmentData.mockReturnValue({
      data: emptyData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockCreateBookState.isError = true;
    mockCreateBookAsync.mockRejectedValueOnce(new Error('Book save failed'));

    renderEntertainmentView();

    // createBook error must not leak to root or into Add game dialog
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add book' }));
    const bookDialog = screen.getByRole('dialog', { name: 'Add book to library' });
    expect(bookDialog).toHaveAttribute('data-feature-theme', 'entertainment-hub');
    expect(bookDialog.className).toContain('max-w-[440px]');

    const titleInput = within(bookDialog).getByLabelText('Title');
    await waitFor(() => expect(titleInput).toHaveFocus());
    fireEvent.change(titleInput, { target: { value: 'Dune' } });
    fireEvent.change(within(bookDialog).getByLabelText('Author'), {
      target: { value: 'Frank Herbert' },
    });
    fireEvent.change(within(bookDialog).getByLabelText('Progress percentage'), {
      target: { value: '150' },
    });
    expect(within(bookDialog).getByLabelText('Progress percentage')).toHaveValue(100);

    await act(async () => {
      fireEvent.click(within(bookDialog).getByRole('button', { name: 'Add to library' }));
    });

    expect(mockCreateBookAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Dune',
        author: 'Frank Herbert',
        progressPercentage: 100,
      }),
    );
    expect(within(bookDialog).getByRole('alert')).toHaveTextContent(
      'Could not add this book. Your draft is retained; please retry.',
    );
    expect(within(bookDialog).getByLabelText('Title')).toHaveValue('Dune');

    fireEvent.click(within(bookDialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Open Add game dialog: createBook error must not leak here
    fireEvent.click(screen.getByRole('tab', { name: 'Games' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add game' }));
    const gameDialog = screen.getByRole('dialog', { name: 'Add game' });
    expect(gameDialog.className).toContain('max-w-[440px]');
    expect(within(gameDialog).queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.change(within(gameDialog).getByLabelText('Game title'), {
      target: { value: 'Celeste' },
    });
    fireEvent.change(within(gameDialog).getByLabelText('Hours played'), {
      target: { value: '-5' },
    });
    expect(within(gameDialog).getByLabelText('Hours played')).toHaveValue(0);

    await act(async () => {
      fireEvent.click(within(gameDialog).getByRole('button', { name: 'Save game' }));
    });
    expect(mockCreateGameAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Celeste',
        hoursPlayed: 0,
      }),
    );
  });
});
