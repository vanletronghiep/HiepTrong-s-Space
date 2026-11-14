// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadEditorDraft, makeEditorDraftKey, saveEditorDraft } from '@/client/editor-drafts';
import { FlashcardsView } from '@/features/flashcards/FlashcardsView';
import { TransitionProvider } from '@/features/transitions/TransitionProvider';
import { ToastProvider } from '@/ui/Toast';

const mocks = vi.hoisted(() => ({
  review: vi.fn(),
  createCard: vi.fn(),
  createDeck: vi.fn(),
  refetch: vi.fn(),
  empty: false,
  isLoading: false,
  isError: false,
  decks: null as Array<{
    id: string;
    name: string;
    topic: string;
    description: string;
    cardCount: number;
    masteryPercentage?: number;
  }> | null,
  cards: null as Array<{
    id: string;
    deckId: string;
    prompt: string;
    answer: string;
    notes: string;
  }> | null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/flashcards',
}));

vi.mock('@/client/queries/flashcards', () => ({
  useFlashcardsData: () => ({
    isLoading: mocks.isLoading,
    isError: mocks.isError,
    refetch: mocks.refetch,
    data:
      mocks.isLoading || mocks.isError
        ? undefined
        : {
            decks: mocks.empty
              ? []
              : (mocks.decks ?? [
                  {
                    id: 'deck',
                    name: 'Vocabulary',
                    topic: 'English',
                    description: '',
                    cardCount: 1,
                  },
                ]),
            cards: mocks.empty
              ? []
              : (mocks.cards ?? [
                  {
                    id: 'card',
                    deckId: 'deck',
                    prompt: 'Tranquil',
                    answer: 'Calm and peaceful',
                    notes: 'Example: a tranquil reading room.',
                  },
                ]),
            stats: mocks.empty
              ? { totalDecks: 0, totalCards: 0, masteredCards: 0, needsPractice: 0 }
              : { totalDecks: 1, totalCards: 1, masteredCards: 0, needsPractice: 1 },
          },
  }),
  useCreateCard: () => ({ mutateAsync: mocks.createCard, isPending: false }),
  useCreateDeck: () => ({ mutateAsync: mocks.createDeck, isPending: false }),
  useReviewCard: () => ({ mutateAsync: mocks.review, isPending: false }),
}));

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function renderFlashcards() {
  return render(
    <ToastProvider>
      <TransitionProvider>
        <FlashcardsView />
      </TransitionProvider>
    </ToastProvider>,
  );
}

describe('FlashcardsView Vintage Reading Room', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    mocks.empty = false;
    mocks.isLoading = false;
    mocks.isError = false;
    mocks.decks = null;
    mocks.cards = null;
    mocks.review.mockReset();
    mocks.createCard.mockReset();
    mocks.createDeck.mockReset();
    mocks.refetch.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('guides an empty library to create a deck before adding cards and renders decorative empty-state art', () => {
    mocks.empty = true;
    const { container } = renderFlashcards();
    expect(screen.getByRole('button', { name: 'Add card' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'New deck' })).toBeEnabled();
    expect(
      screen.getByText('Create your first deck, then add cards to study.'),
    ).toBeInTheDocument();

    const emptyImg = container.querySelector('img[src="/visuals/flashcards/reading-corner.svg"]');
    expect(emptyImg).toBeInTheDocument();
    expect(emptyImg).toHaveAttribute('alt', '');
    expect(emptyImg).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders skeleton loading and non-blocking Retry on load error', () => {
    mocks.isLoading = true;
    const { unmount } = renderFlashcards();
    expect(screen.getByLabelText('Loading flashcard decks')).toHaveAttribute('aria-busy', 'true');
    unmount();

    mocks.isLoading = false;
    mocks.isError = true;
    renderFlashcards();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not load your flashcards reading room right now.');
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it('defaults masteryPercentage to 0, disables Study deck on 0-card decks, and renders overview decorative SVGs', () => {
    mocks.decks = [
      { id: 'deck', name: 'Vocabulary', topic: 'English', description: '', cardCount: 1 },
      {
        id: 'empty-deck',
        name: 'Empty Set',
        topic: 'Notes',
        description: '',
        cardCount: 0,
        masteryPercentage: 0,
      },
    ];
    const { container } = renderFlashcards();

    expect(screen.getByText('1 card · 0% mastery')).toBeInTheDocument();
    const studyButtons = screen.getAllByRole('button', { name: 'Study deck' });
    expect(studyButtons[0]).toBeEnabled();
    expect(studyButtons[1]).toBeDisabled();

    for (const src of [
      '/visuals/flashcards/library-arched-window.svg',
      '/visuals/flashcards/shelf-of-stories.svg',
      '/visuals/flashcards/bookmark-ribbon-edge.svg',
    ]) {
      const img = container.querySelector(`img[src="${src}"]`);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('alt', '');
      expect(img).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('reveals an answer before grading, shows study corner ornament, and submits one review while pending', async () => {
    let resolve!: () => void;
    mocks.review.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const { container } = renderFlashcards();
    fireEvent.click(screen.getByRole('button', { name: /Study deck/ }));

    const quillImg = container.querySelector(
      'img[src="/visuals/flashcards/quill-and-bookmark.svg"]',
    );
    expect(quillImg).toBeInTheDocument();
    expect(quillImg).toHaveAttribute('alt', '');
    expect(quillImg).toHaveAttribute('aria-hidden', 'true');

    expect(screen.queryByRole('button', { name: 'Confidence level 5' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Reveal definition & answer' }));
    expect(screen.getByText('Calm and peaceful')).toBeInTheDocument();
    const grade = screen.getByRole('button', { name: 'Confidence level 5' });
    fireEvent.click(grade);
    fireEvent.click(grade);
    expect(mocks.review).toHaveBeenCalledExactlyOnceWith({ cardId: 'card', confidence: 5 });
    resolve();
    await waitFor(() => expect(screen.getByText('Review complete.')).toBeInTheDocument());
  });

  it('opens Add card in LargeEditorDialog with dirty-close 3-choice prompt, local draft recovery, validation retention, Ctrl+S, and double-submit guard', async () => {
    const firstRender = renderFlashcards();

    // Untouched editor closes immediately
    fireEvent.click(screen.getByRole('button', { name: 'Add card' }));
    const editor = screen.getByRole('dialog', { name: 'Add new flashcard' });
    expect(within(editor).getByLabelText('Target deck')).toHaveValue('deck');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Add new flashcard' })).toBeNull(),
    );
    expect(screen.queryByRole('dialog', { name: 'Save changes before closing?' })).toBeNull();

    // Dirty editor prompts 3 choices on Escape and supports Save draft and close
    fireEvent.click(screen.getByRole('button', { name: 'Add card' }));
    const dialog = screen.getByRole('dialog', { name: 'Add new flashcard' });
    fireEvent.change(within(dialog).getByLabelText('Prompt / Word'), {
      target: { value: 'Epistemic' },
    });
    fireEvent.change(within(dialog).getByLabelText('Answer / Definition'), {
      target: { value: 'Relating to knowledge or its validation' },
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      screen.getByRole('dialog', { name: 'Save changes before closing?' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save draft and close' }));
    expect(window.localStorage.getItem(makeEditorDraftKey('flashcard', null))).not.toBeNull();

    // Remount offers Resume draft and restores input
    firstRender.unmount();
    renderFlashcards();
    fireEvent.click(screen.getByRole('button', { name: 'Add card' }));
    expect(screen.getByText(/Local draft saved/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume draft' }));
    expect(screen.getByLabelText('Prompt / Word')).toHaveValue('Epistemic');

    // Validation retains input when answer is cleared
    fireEvent.change(screen.getByLabelText('Answer / Definition'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save card' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a definition or answer before saving.',
    );
    expect(screen.getByLabelText('Prompt / Word')).toHaveValue('Epistemic');
    expect(mocks.createCard).not.toHaveBeenCalled();

    // Restore answer, test Ctrl+S double-submit guard and draft clearance on success
    fireEvent.change(screen.getByLabelText('Answer / Definition'), {
      target: { value: 'Relating to knowledge' },
    });
    let resolveCard!: () => void;
    mocks.createCard.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          resolveCard = done;
        }),
    );
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    fireEvent.click(screen.getByRole('button', { name: /Saving|Save card/ }));
    expect(mocks.createCard).toHaveBeenCalledTimes(1);
    expect(mocks.createCard).toHaveBeenCalledWith({
      deckId: 'deck',
      prompt: 'Epistemic',
      answer: 'Relating to knowledge',
      notes: '',
    });

    resolveCard();
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Add new flashcard' })).toBeNull(),
    );
    expect(loadEditorDraft('flashcard', null)).toEqual({ ok: true, draft: null });
  });

  it('keeps New deck in a compact Dialog with scoped validation and double-submit guard', async () => {
    saveEditorDraft({
      formId: 'flashcard',
      recordId: null,
      recordUpdatedAt: null,
      values: { deckId: 'deck', prompt: 'Unrelated', answer: 'Draft', notes: '' },
    });

    renderFlashcards();
    fireEvent.click(screen.getByRole('button', { name: 'New deck' }));
    const deckDialog = screen.getByRole('dialog', { name: 'Create vocabulary deck' });
    expect(deckDialog.className).toContain('max-w-[440px]');

    // Empty submit shows scoped alert inside compact dialog
    fireEvent.click(within(deckDialog).getByRole('button', { name: 'Create deck' }));
    expect(within(deckDialog).getByRole('alert')).toHaveTextContent(
      'Enter a deck name before creating.',
    );

    let resolveDeck!: () => void;
    mocks.createDeck.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          resolveDeck = done;
        }),
    );
    fireEvent.change(within(deckDialog).getByLabelText('Deck name'), {
      target: { value: 'Classical Rhetoric' },
    });
    fireEvent.click(within(deckDialog).getByRole('button', { name: 'Create deck' }));
    fireEvent.click(within(deckDialog).getByRole('button', { name: /Creating|Create deck/ }));
    expect(mocks.createDeck).toHaveBeenCalledTimes(1);
    expect(mocks.createDeck).toHaveBeenCalledWith({
      name: 'Classical Rhetoric',
      topic: 'English lexicon',
      description: '',
    });

    resolveDeck();
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Create vocabulary deck' })).toBeNull(),
    );
  });
});
