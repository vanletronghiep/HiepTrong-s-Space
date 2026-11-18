'use client';

import { usePageReady } from '@/features/transitions/TransitionProvider';
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, BookOpen, Plus, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import {
  clearEditorDraft,
  loadEditorDraft,
  saveEditorDraft,
  type EditorDraftPayload,
} from '@/client/editor-drafts';
import {
  useCreateCard,
  useCreateDeck,
  useFlashcardsData,
  useReviewCard,
} from '@/client/queries/flashcards';
import type { FlashcardDeck, FlashcardItem } from '@/contracts/flashcard';
import { DEFAULT_APP_TIMEZONE } from '@/domain/time';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { FormattedNoteContent } from '@/ui/FormattedNoteContent';
import {
  LargeEditorDialog,
  LargeEditorTwoColumn,
  type DraftSaveOutcome,
} from '@/ui/LargeEditorDialog';
import { RichNoteEditor } from '@/ui/RichNoteEditor';
import { SelectField } from '@/ui/SelectField';
import { Skeleton } from '@/ui/Skeleton';
import styles from './flashcards.module.css';

interface FlashcardEditorValues {
  deckId: string;
  prompt: string;
  answer: string;
  notes: string;
}

const EMPTY_CARD_VALUES: FlashcardEditorValues = {
  deckId: '',
  prompt: '',
  answer: '',
  notes: '',
};

function isFlashcardDraftValues(raw: unknown): raw is FlashcardEditorValues {
  if (typeof raw !== 'object' || raw === null) {
    return false;
  }
  const value = raw as Record<string, unknown>;
  return (
    typeof value.deckId === 'string' &&
    typeof value.prompt === 'string' &&
    typeof value.answer === 'string' &&
    typeof value.notes === 'string'
  );
}

function sameCardValues(a: FlashcardEditorValues, b: FlashcardEditorValues): boolean {
  return (
    a.deckId === b.deckId && a.prompt === b.prompt && a.answer === b.answer && a.notes === b.notes
  );
}

function formatDraftTimestamp(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    return 'recently';
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: DEFAULT_APP_TIMEZONE,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ms));
}

export function FlashcardsView() {
  const writeLocks = useRef(new Set<string>());
  const promptInputRef = useRef<HTMLInputElement>(null);
  const answerInputRef = useRef<HTMLTextAreaElement>(null);
  const deckNameInputRef = useRef<HTMLInputElement>(null);

  const [reviewComplete, setReviewComplete] = useState(false);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [studyCardIndex, setStudyCardIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string>('');

  // Add Card LargeEditorDialog state
  const [showAddCard, setShowAddCard] = useState<boolean>(false);
  const [initialCardValues, setInitialCardValues] =
    useState<FlashcardEditorValues>(EMPTY_CARD_VALUES);
  const [cardFormValues, setCardFormValues] = useState<FlashcardEditorValues>(EMPTY_CARD_VALUES);
  const [loadedCardDraft, setLoadedCardDraft] =
    useState<EditorDraftPayload<FlashcardEditorValues> | null>(null);
  const [cardEditorError, setCardEditorError] = useState<string>('');
  const [isSubmittingCard, setIsSubmittingCard] = useState<boolean>(false);

  // Compact New Deck Dialog state
  const [showAddDeck, setShowAddDeck] = useState<boolean>(false);
  const [newDeckName, setNewDeckName] = useState<string>('');
  const [newDeckTopic, setNewDeckTopic] = useState<string>('English lexicon');
  const [newDeckDesc, setNewDeckDesc] = useState<string>('');
  const [deckEditorError, setDeckEditorError] = useState<string>('');
  const [isSubmittingDeck, setIsSubmittingDeck] = useState<boolean>(false);

  const cardFormId = useId();
  const deckFormId = useId();
  const deckSelectId = useId();
  const promptInputId = useId();
  const answerInputId = useId();
  const notesInputId = useId();
  const deckNameId = useId();
  const deckTopicId = useId();
  const deckDescId = useId();

  // Queries & Mutations
  const { data, isLoading, isError: loadFailed, refetch } = useFlashcardsData();
  usePageReady(!isLoading);
  const createCard = useCreateCard();
  const createDeck = useCreateDeck();
  const reviewCard = useReviewCard();

  const decks = useMemo(() => data?.decks ?? [], [data?.decks]);
  const cards = useMemo(() => data?.cards ?? [], [data?.cards]);
  const stats = data?.stats;

  const activeDeckCards = activeDeck ? cards.filter((c) => c.deckId === activeDeck.id) : [];

  const currentStudyCard: FlashcardItem | undefined = activeDeckCards[studyCardIndex];
  const isCardDirty = showAddCard && !sameCardValues(cardFormValues, initialCardValues);

  const resolveDefaultDeckId = useCallback(() => {
    if (activeDeck && decks.some((d) => d.id === activeDeck.id)) {
      return activeDeck.id;
    }
    return decks[0]?.id ?? '';
  }, [activeDeck, decks]);

  const handleOpenAddCard = () => {
    const defaultDeckId = resolveDefaultDeckId();
    const base: FlashcardEditorValues = {
      deckId: defaultDeckId,
      prompt: '',
      answer: '',
      notes: '',
    };
    const existing = loadEditorDraft<FlashcardEditorValues>(
      'flashcard',
      null,
      isFlashcardDraftValues,
    );
    setInitialCardValues(base);
    setCardFormValues(base);
    setCardEditorError('');
    setLoadedCardDraft(existing.ok ? existing.draft : null);
    setShowAddCard(true);
  };

  const handleSaveCardDraft = useCallback((): DraftSaveOutcome => {
    const result = saveEditorDraft({
      formId: 'flashcard',
      recordId: null,
      recordUpdatedAt: null,
      values: cardFormValues,
    });
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    setLoadedCardDraft(null);
    setInitialCardValues(cardFormValues);
    return {
      ok: true,
      message: `Draft saved locally (${formatDraftTimestamp(result.draft.savedAt)}).`,
    };
  }, [cardFormValues]);

  const handleStartStudy = (deck: FlashcardDeck) => {
    if (!cards.some((card) => card.deckId === deck.id)) return;
    setReviewComplete(false);
    setReviewError('');
    setActiveDeck(deck);
    setStudyCardIndex(0);
    setIsAnswerRevealed(false);
  };

  const handleRateConfidence = async (confidence: number) => {
    if (!currentStudyCard) return;
    if (writeLocks.current.has('reviewCard')) return;
    writeLocks.current.add('reviewCard');
    setReviewError('');
    try {
      await reviewCard.mutateAsync({ cardId: currentStudyCard.id, confidence });
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : 'Could not save your rating. Please try again.',
      );
      return;
    } finally {
      writeLocks.current.delete('reviewCard');
    }
    setIsAnswerRevealed(false);
    if (studyCardIndex < activeDeckCards.length - 1) {
      setStudyCardIndex(studyCardIndex + 1);
    } else {
      setActiveDeck(null);
      setReviewComplete(true);
    }
  };

  const submitCard = useCallback(async () => {
    if (writeLocks.current.has('createCard')) return;
    const targetDeckId =
      (cardFormValues.deckId && decks.some((d) => d.id === cardFormValues.deckId)
        ? cardFormValues.deckId
        : '') ||
      decks[0]?.id ||
      '';

    if (!targetDeckId) {
      setCardEditorError('Select a target deck before saving.');
      return;
    }
    if (!cardFormValues.prompt.trim()) {
      setCardEditorError('Enter a prompt or word before saving.');
      promptInputRef.current?.focus();
      return;
    }
    if (!cardFormValues.answer.trim()) {
      setCardEditorError('Enter a definition or answer before saving.');
      answerInputRef.current?.focus();
      return;
    }

    writeLocks.current.add('createCard');
    setIsSubmittingCard(true);
    setCardEditorError('');
    try {
      await createCard.mutateAsync({
        deckId: targetDeckId,
        prompt: cardFormValues.prompt.trim(),
        answer: cardFormValues.answer.trim(),
        notes: cardFormValues.notes.trim(),
      });
      clearEditorDraft('flashcard', null);
      setLoadedCardDraft(null);
      setInitialCardValues(EMPTY_CARD_VALUES);
      setCardFormValues(EMPTY_CARD_VALUES);
      setShowAddCard(false);
    } catch (error) {
      setCardEditorError(
        error instanceof Error
          ? error.message
          : 'Could not save this flashcard. Your input is retained.',
      );
    } finally {
      writeLocks.current.delete('createCard');
      setIsSubmittingCard(false);
    }
  }, [cardFormValues, createCard, decks]);

  const handleCardFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitCard();
  };

  // Ctrl+S / Cmd+S shortcut scoped strictly to the open Add Card editor.
  // Escape is delegated to LargeEditorDialog / Dialog focus traps for dirty-close handling.
  useEffect(() => {
    if (!showAddCard) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void submitCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddCard, submitCard]);

  const handleOpenAddDeck = () => {
    setDeckEditorError('');
    setShowAddDeck(true);
  };

  const handleSaveDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (writeLocks.current.has('createDeck')) return;
    if (!newDeckName.trim()) {
      setDeckEditorError('Enter a deck name before creating.');
      deckNameInputRef.current?.focus();
      return;
    }

    writeLocks.current.add('createDeck');
    setIsSubmittingDeck(true);
    setDeckEditorError('');
    try {
      await createDeck.mutateAsync({
        name: newDeckName.trim(),
        topic: newDeckTopic.trim() || 'English lexicon',
        description: newDeckDesc.trim(),
      });
      setNewDeckName('');
      setNewDeckDesc('');
      setShowAddDeck(false);
    } catch (error) {
      setDeckEditorError(
        error instanceof Error
          ? error.message
          : 'Could not create this deck. Your input is retained.',
      );
    } finally {
      writeLocks.current.delete('createDeck');
      setIsSubmittingDeck(false);
    }
  };

  if (loadFailed) {
    return (
      <div className={styles.pageStack}>
        <div role="alert" className={styles.errorCard}>
          <p className={styles.errorMessage}>
            <AlertTriangle size={18} strokeWidth={1.7} aria-hidden="true" />
            <span>Could not load your flashcards reading room right now.</span>
          </p>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} aria-hidden="true" />}
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageStack}>
      {!activeDeck && (
        <Image
          src="/visuals/flashcards/bookmark-ribbon-edge.svg"
          alt=""
          aria-hidden="true"
          width={200}
          height={480}
          unoptimized
          className={styles.bookmarkEdgeDecor}
        />
      )}

      {reviewComplete && (
        <p role="status" className={styles.statusBanner}>
          Review complete.
        </p>
      )}

      {/* Vintage Reading Room Open Masthead (hidden during active study for focus) */}
      {!activeDeck && (
        <>
          <header data-feature-heading className={styles.masthead}>
            <div className={styles.mastheadCopy}>
              <div className={styles.eyebrow}>
                <BookOpen size={14} strokeWidth={1.7} aria-hidden="true" />
                <span>Your personal study library</span>
              </div>

              <h1 className={styles.title}>Flashcards</h1>
              <p className={styles.description}>
                Review English vocabulary and classical discourse at your own pace. Refine mastery
                with prompt-and-answer recall and active confidence rating.
              </p>
            </div>

            <Image
              src="/visuals/flashcards/library-arched-window.svg"
              alt=""
              aria-hidden="true"
              width={480}
              height={300}
              unoptimized
              className={styles.archedWindowArt}
            />
          </header>

          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats?.totalDecks ?? 0}</div>
              <div className={styles.statLabel}>Active decks</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats?.totalCards ?? 0}</div>
              <div className={styles.statLabel}>Total cards</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats?.masteredCards ?? 0}</div>
              <div className={styles.statLabel}>Mastered cards</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats?.needsPractice ?? 0}</div>
              <div className={styles.statLabel}>Needs practice</div>
            </div>
          </div>

          <div className={styles.shelfDivider} aria-hidden="true">
            <Image
              src="/visuals/flashcards/shelf-of-stories.svg"
              alt=""
              aria-hidden="true"
              width={720}
              height={100}
              unoptimized
              className={styles.shelfDividerArt}
            />
          </div>
        </>
      )}

      {/* Active Study Session Mode */}
      {activeDeck ? (
        <section aria-labelledby="study-heading" className={styles.studyContainer}>
          <div className={styles.studyTopBar}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft size={14} aria-hidden="true" />}
              className={styles.mobileTouchBtn}
              onClick={() => {
                setActiveDeck(null);
                setReviewError('');
              }}
            >
              Back to decks
            </Button>
            <span className={styles.studyProgress}>
              Card {studyCardIndex + 1} of {activeDeckCards.length}
            </span>
          </div>

          <h2 id="study-heading" className={styles.studyHeading}>
            {activeDeck.name}
          </h2>

          {reviewError ? (
            <p role="alert" className={styles.inlineAlert}>
              {reviewError}
            </p>
          ) : null}

          {activeDeckCards.length === 0 ? (
            <div className={styles.emptyLibrary} role="status">
              <Image
                src="/visuals/flashcards/reading-corner.svg"
                alt=""
                aria-hidden="true"
                width={320}
                height={280}
                unoptimized
                className={styles.emptyIllustration}
              />
              <h3 className={styles.emptyTitle}>This deck has no cards yet.</h3>
            </div>
          ) : currentStudyCard ? (
            <>
              <div className={styles.flashcardFrame}>
                <Image
                  src="/visuals/flashcards/quill-and-bookmark.svg"
                  alt=""
                  aria-hidden="true"
                  width={240}
                  height={240}
                  unoptimized
                  className={styles.quillCornerArt}
                />
                <h3 className={styles.cardPrompt}>{currentStudyCard.prompt}</h3>

                {!isAnswerRevealed ? (
                  <Button
                    variant="secondary"
                    size="md"
                    pill
                    className={styles.mobileTouchBtn}
                    onClick={() => setIsAnswerRevealed(true)}
                  >
                    Reveal definition & answer
                  </Button>
                ) : (
                  <div className={styles.cardAnswerBox} role="status">
                    <p className={styles.cardAnswer}>{currentStudyCard.answer}</p>
                    {currentStudyCard.notes && (
                      <FormattedNoteContent
                        value={currentStudyCard.notes}
                        className={styles.cardNotes}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Confidence Rating (1 to 5) */}
              {isAnswerRevealed && (
                <div className={styles.confidenceRow}>
                  <span className={styles.confidenceLabel}>
                    Rate recall confidence (1 = unfamiliar, 5 = mastered):
                  </span>
                  <div className={styles.ratingGroup}>
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        className={styles.rateBtn}
                        disabled={reviewCard.isPending}
                        onClick={() => void handleRateConfidence(lvl)}
                        aria-label={`Confidence level ${lvl}`}
                      >
                        <span>{lvl}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </section>
      ) : (
        /* Decks Overview */
        <section aria-labelledby="decks-heading" className={styles.decksSection}>
          <div className={styles.sectionHeader}>
            <h2 id="decks-heading" className={styles.sectionTitle}>
              Vocabulary decks
            </h2>
            <div className={styles.sectionActions}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus size={14} aria-hidden="true" />}
                className={styles.mobileTouchBtn}
                disabled={decks.length === 0}
                title={decks.length === 0 ? 'Create a deck before adding cards.' : undefined}
                onClick={handleOpenAddCard}
              >
                Add card
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={14} aria-hidden="true" />}
                className={styles.mobileTouchBtn}
                onClick={handleOpenAddDeck}
              >
                New deck
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className={styles.decksGrid} aria-busy="true" aria-label="Loading flashcard decks">
              {[0, 1].map((idx) => (
                <div key={idx} className={styles.skeletonCard}>
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full rounded-pill" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-9 w-24 rounded-pill" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.decksGrid}>
              {decks.length === 0 && (
                <div className={styles.emptyLibrary} role="status">
                  <Image
                    src="/visuals/flashcards/reading-corner.svg"
                    alt=""
                    aria-hidden="true"
                    width={320}
                    height={280}
                    unoptimized
                    className={styles.emptyIllustration}
                  />
                  <h3 className={styles.emptyTitle}>Your study library is ready.</h3>
                  <p className={styles.emptyDescription}>
                    Create your first deck, then add cards to study.
                  </p>
                </div>
              )}
              {decks.map((deck) => {
                const mastery = Math.max(0, Math.min(100, deck.masteryPercentage ?? 0));
                const cardCount = deck.cardCount ?? 0;
                const hasCards = cards.some((card) => card.deckId === deck.id);
                return (
                  <article key={deck.id} className={styles.deckCard}>
                    <div>
                      <span className={styles.deckTopic}>{deck.topic}</span>
                      <h3 className={styles.deckName}>{deck.name}</h3>
                      {deck.description ? (
                        <FormattedNoteContent
                          value={deck.description}
                          className={styles.deckDesc}
                        />
                      ) : null}
                      <div className={styles.deckProgressTrack} aria-hidden="true">
                        <div className={styles.deckProgressFill} style={{ width: `${mastery}%` }} />
                      </div>
                    </div>

                    <div className={styles.deckFooter}>
                      <span className={styles.deckMeta}>
                        {cardCount} {cardCount === 1 ? 'card' : 'cards'} · {mastery}% mastery
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        pill
                        className={styles.mobileTouchBtn}
                        disabled={!hasCards}
                        title={!hasCards ? 'Add a card to study this deck.' : undefined}
                        onClick={() => handleStartStudy(deck)}
                      >
                        Study deck
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Add Card Large Two-Column Editor + Local Drafts */}
      <LargeEditorDialog
        open={showAddCard}
        onClose={() => {
          setShowAddCard(false);
          setCardEditorError('');
          setLoadedCardDraft(null);
        }}
        title="Add new flashcard"
        eyebrow="Vocabulary index"
        description="Compose a prompt, definition, and context note for active recall. Press Ctrl+S to save."
        formId={cardFormId}
        isDirty={isCardDirty}
        isSubmitting={createCard.isPending || isSubmittingCard}
        submitLabel="Save card"
        submittingLabel="Saving…"
        closeAriaLabel="Close card editor"
        initialFocusRef={promptInputRef}
        errorMessage={cardEditorError || null}
        draftRecovery={
          loadedCardDraft
            ? {
                savedAtLabel: formatDraftTimestamp(loadedCardDraft.savedAt),
                onResume: () => {
                  const restoredDeckId = decks.some((d) => d.id === loadedCardDraft.values.deckId)
                    ? loadedCardDraft.values.deckId
                    : resolveDefaultDeckId();
                  setCardFormValues({
                    ...loadedCardDraft.values,
                    deckId: restoredDeckId,
                  });
                  setLoadedCardDraft(null);
                  setCardEditorError('');
                },
                onDiscard: () => {
                  clearEditorDraft('flashcard', null);
                  setLoadedCardDraft(null);
                },
              }
            : null
        }
        onSaveDraft={handleSaveCardDraft}
        onDiscardChanges={() => {
          setCardFormValues(initialCardValues);
          setCardEditorError('');
        }}
      >
        <form id={cardFormId} onSubmit={handleCardFormSubmit} noValidate>
          <LargeEditorTwoColumn
            primary={
              <>
                <div className={styles.fieldGroup}>
                  <label htmlFor={promptInputId} className={styles.fieldLabel}>
                    Prompt / Word
                  </label>
                  <input
                    ref={promptInputRef}
                    id={promptInputId}
                    type="text"
                    required
                    className={styles.inputField}
                    placeholder="e.g., Epistemic (adjective)"
                    value={cardFormValues.prompt}
                    onChange={(e) => {
                      setCardFormValues((prev) => ({ ...prev, prompt: e.target.value }));
                      if (cardEditorError) setCardEditorError('');
                    }}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor={answerInputId} className={styles.fieldLabel}>
                    Answer / Definition
                  </label>
                  <textarea
                    ref={answerInputRef}
                    id={answerInputId}
                    rows={6}
                    required
                    className={styles.textareaField}
                    placeholder="Precise definition, explanation, or translation..."
                    value={cardFormValues.answer}
                    onChange={(e) => {
                      setCardFormValues((prev) => ({ ...prev, answer: e.target.value }));
                      if (cardEditorError) setCardEditorError('');
                    }}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor={notesInputId} className={styles.fieldLabel}>
                    Context &amp; example sentence
                  </label>
                  <RichNoteEditor
                    id={notesInputId}
                    ariaLabel="Context & example sentence"
                    placeholder="e.g., Demonstrating epistemic humility in research."
                    value={cardFormValues.notes}
                    onChange={(nextValue) =>
                      setCardFormValues((prev) => ({ ...prev, notes: nextValue }))
                    }
                    minHeightClassName="min-h-[84px]"
                  />
                </div>
              </>
            }
            metadata={
              <>
                <div className={styles.fieldGroup}>
                  <label htmlFor={deckSelectId} className={styles.fieldLabel}>
                    Target deck
                  </label>
                  <SelectField
                    id={deckSelectId}
                    ariaLabel="Target deck"
                    value={cardFormValues.deckId}
                    onChange={(nextDeckId) =>
                      setCardFormValues((prev) => ({ ...prev, deckId: nextDeckId }))
                    }
                    options={decks.map((d) => ({ value: d.id, label: d.name }))}
                  />
                </div>

                <p className={styles.metaHintCard}>
                  Cards begin at confidence level 1 and reach mastery at level 4 or 5 during study
                  sessions.
                </p>
              </>
            }
          />
        </form>
      </LargeEditorDialog>

      {/* Compact New Deck Dialog */}
      <Dialog
        open={showAddDeck}
        portal
        title="Create vocabulary deck"
        description="Group related terms into a focused reading-room deck."
        initialFocusRef={deckNameInputRef}
        className="max-w-[440px] max-h-[90svh] overflow-y-auto"
        onClose={() => {
          setShowAddDeck(false);
          setDeckEditorError('');
        }}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowAddDeck(false);
                setDeckEditorError('');
              }}
              disabled={createDeck.isPending || isSubmittingDeck}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form={deckFormId}
              variant="primary"
              size="sm"
              disabled={createDeck.isPending || isSubmittingDeck}
            >
              {createDeck.isPending || isSubmittingDeck ? 'Creating…' : 'Create deck'}
            </Button>
          </>
        }
      >
        <form id={deckFormId} onSubmit={handleSaveDeck} className="flex flex-col gap-3" noValidate>
          {deckEditorError ? (
            <p role="alert" className={styles.inlineAlert}>
              {deckEditorError}
            </p>
          ) : null}

          <div className={styles.fieldGroup}>
            <label htmlFor={deckNameId} className={styles.fieldLabel}>
              Deck name
            </label>
            <input
              ref={deckNameInputRef}
              id={deckNameId}
              type="text"
              required
              className={styles.inputField}
              placeholder="e.g., Literary Rhetoric & Classical Terms"
              value={newDeckName}
              onChange={(e) => {
                setNewDeckName(e.target.value);
                if (deckEditorError) setDeckEditorError('');
              }}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor={deckTopicId} className={styles.fieldLabel}>
              Topic
            </label>
            <input
              id={deckTopicId}
              type="text"
              className={styles.inputField}
              placeholder="e.g., Etymology & Rhetoric"
              value={newDeckTopic}
              onChange={(e) => setNewDeckTopic(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor={deckDescId} className={styles.fieldLabel}>
              Description
            </label>
            <RichNoteEditor
              id={deckDescId}
              ariaLabel="Description"
              placeholder="Purpose of this vocabulary set..."
              value={newDeckDesc}
              onChange={setNewDeckDesc}
              minHeightClassName="min-h-[84px]"
            />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
