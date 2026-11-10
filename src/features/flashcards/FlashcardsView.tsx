'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import type { FlashcardDeck, FlashcardItem } from '@/contracts/flashcard';
import {
  useCreateCard,
  useCreateDeck,
  useFlashcardsData,
  useReviewCard,
} from '@/client/queries/flashcards';
import styles from './flashcards.module.css';

export function FlashcardsView() {
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [studyCardIndex, setStudyCardIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);

  // Modals state
  const [showAddCard, setShowAddCard] = useState<boolean>(false);
  const [showAddDeck, setShowAddDeck] = useState<boolean>(false);

  // Add Card inputs
  const [newPrompt, setNewPrompt] = useState<string>('');
  const [newAnswer, setNewAnswer] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');

  // Add Deck inputs
  const [newDeckName, setNewDeckName] = useState<string>('');
  const [newDeckTopic, setNewDeckTopic] = useState<string>('English lexicon');
  const [newDeckDesc, setNewDeckDesc] = useState<string>('');

  const deckSelectId = useId();
  const promptInputId = useId();
  const answerInputId = useId();
  const notesInputId = useId();
  const deckNameId = useId();
  const deckTopicId = useId();
  const deckDescId = useId();

  // Queries & Mutations
  const { data, isLoading } = useFlashcardsData();
  const createCard = useCreateCard();
  const createDeck = useCreateDeck();
  const reviewCard = useReviewCard();

  const decks = data?.decks ?? [];
  const cards = data?.cards ?? [];
  const stats = data?.stats;

  const activeDeckCards = activeDeck
    ? cards.filter((c) => c.deckId === activeDeck.id)
    : [];

  const currentStudyCard: FlashcardItem | undefined = activeDeckCards[studyCardIndex];

  const handleStartStudy = (deck: FlashcardDeck) => {
    setActiveDeck(deck);
    setStudyCardIndex(0);
    setIsAnswerRevealed(false);
  };

  const handleRateConfidence = async (confidence: number) => {
    if (!currentStudyCard) return;
    await reviewCard.mutateAsync({ cardId: currentStudyCard.id, confidence });
    setIsAnswerRevealed(false);
    if (studyCardIndex < activeDeckCards.length - 1) {
      setStudyCardIndex(studyCardIndex + 1);
    } else {
      setStudyCardIndex(0);
    }
  };

  const handleSaveCard = useCallback(async () => {
    if (!newPrompt.trim() || !newAnswer.trim()) return;
    const targetDeckId = selectedDeckId || activeDeck?.id || (data?.decks[0]?.id ?? '');
    if (!targetDeckId) return;

    await createCard.mutateAsync({
      deckId: targetDeckId,
      prompt: newPrompt.trim(),
      answer: newAnswer.trim(),
      notes: newNotes.trim(),
    });

    setNewPrompt('');
    setNewAnswer('');
    setNewNotes('');
    setShowAddCard(false);
  }, [newPrompt, newAnswer, newNotes, selectedDeckId, activeDeck, data?.decks, createCard]);

  // Ctrl+S / Cmd+S shortcut inside Card Creation Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (showAddCard) {
          e.preventDefault();
          handleSaveCard();
        }
      } else if (e.key === 'Escape') {
        setShowAddCard(false);
        setShowAddDeck(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddCard, handleSaveCard]);

  const handleSaveDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;

    await createDeck.mutateAsync({
      name: newDeckName.trim(),
      topic: newDeckTopic.trim(),
      description: newDeckDesc.trim(),
    });

    setNewDeckName('');
    setNewDeckDesc('');
    setShowAddDeck(false);
  };

  return (
    <div className={styles.container}>
      {/* Ancient History / Norse Atmosphere Header */}
      {!activeDeck && (
        <header className={styles.header}>
          <div className={styles.eyebrow}>
            <span>Runic memory & historical rhetoric</span>
          </div>

          <h1 className={styles.title}>Flashcards</h1>
          <p className={styles.description}>
            Deliberate spaced repetition for English vocabulary and classical discourse.
            Refine mastery with prompt-and-answer recall and active confidence rating.
          </p>

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
        </header>
      )}

      {/* Active Study Session Mode */}
      {activeDeck ? (
        <section aria-labelledby="study-heading" className={styles.studyContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => setActiveDeck(null)}
            >
              <span>← Back to decks</span>
            </button>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ws-text-muted)' }}>
              Card {studyCardIndex + 1} of {activeDeckCards.length}
            </span>
          </div>

          <h2 id="study-heading" style={{ fontSize: 'var(--text-lg)', margin: 0, color: 'var(--ws-text)' }}>
            {activeDeck.name}
          </h2>

          {activeDeckCards.length === 0 ? (
            <div style={{ padding: '32px', color: 'var(--ws-text-muted)', fontSize: 'var(--text-sm)' }}>
              This deck has no cards yet. Add your first card to begin.
            </div>
          ) : currentStudyCard ? (
            <>
              <div className={styles.flashcardFrame}>
                <h3 className={styles.cardPrompt}>{currentStudyCard.prompt}</h3>

                {!isAnswerRevealed ? (
                  <button
                    type="button"
                    className={styles.revealBtn}
                    onClick={() => setIsAnswerRevealed(true)}
                  >
                    <span>Reveal definition & answer</span>
                  </button>
                ) : (
                  <div className={styles.cardAnswerBox}>
                    <p className={styles.cardAnswer}>{currentStudyCard.answer}</p>
                    {currentStudyCard.notes && (
                      <p className={styles.cardNotes}>{currentStudyCard.notes}</p>
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
                        onClick={() => handleRateConfidence(lvl)}
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
        <section aria-labelledby="decks-heading">
          <div className={styles.sectionHeader}>
            <h2 id="decks-heading" className={styles.sectionTitle}>
              Vocabulary decks
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setShowAddCard(true)}
              >
                <span>+ Add card</span>
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setShowAddDeck(true)}
              >
                <span>+ New deck</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div style={{ color: 'var(--ws-text-muted)', fontSize: 'var(--text-xs)' }}>
              Loading flashcard decks...
            </div>
          ) : (
            <div className={styles.decksGrid}>
              {decks.map((deck) => (
                <div key={deck.id} className={styles.deckCard}>
                  <div>
                    <span className={styles.deckTopic}>{deck.topic}</span>
                    <h3 className={styles.deckName}>{deck.name}</h3>
                    <p className={styles.deckDesc}>{deck.description}</p>
                    <div className={styles.deckProgressTrack}>
                      <div
                        className={styles.deckProgressFill}
                        style={{ width: `${deck.masteryPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className={styles.deckFooter}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ws-text-muted)' }}>
                      {deck.cardCount} cards · {deck.masteryPercentage}% mastery
                    </span>
                    <button
                      type="button"
                      className={styles.studyBtn}
                      onClick={() => handleStartStudy(deck)}
                    >
                      Study deck
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Add Card Modal with Ctrl+S shortcut */}
      {showAddCard && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-card-modal-title"
          onClick={() => setShowAddCard(false)}
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 id="add-card-modal-title" className={styles.sectionTitle}>
                Add new flashcard
              </h2>
              <span className={styles.shortcutHint}>Press Ctrl+S to save</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label htmlFor={deckSelectId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Target deck
                </label>
                <select
                  id={deckSelectId}
                  className={styles.inputField}
                  value={selectedDeckId || decks[0]?.id || ''}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                >
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={promptInputId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Prompt / Word
                </label>
                <input
                  id={promptInputId}
                  type="text"
                  required
                  className={styles.inputField}
                  placeholder="e.g., Epistemic (adjective)"
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor={answerInputId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Answer / Definition
                </label>
                <textarea
                  id={answerInputId}
                  required
                  className={styles.textareaField}
                  placeholder="Precise definition or translation..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor={notesInputId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Context & example sentence
                </label>
                <input
                  id={notesInputId}
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g., Demonstrating epistemic humility in research."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowAddCard(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleSaveCard}
                disabled={createCard.isPending}
              >
                Save card (Ctrl+S)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Deck Modal */}
      {showAddDeck && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-deck-modal-title"
          onClick={() => setShowAddDeck(false)}
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 id="add-deck-modal-title" className={styles.sectionTitle}>
              Create vocabulary deck
            </h2>
            <form onSubmit={handleSaveDeck} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label htmlFor={deckNameId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Deck name
                </label>
                <input
                  id={deckNameId}
                  type="text"
                  required
                  className={styles.inputField}
                  placeholder="e.g., Old English & Viking Etymology"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor={deckTopicId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Topic
                </label>
                <input
                  id={deckTopicId}
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g., Etymology & History"
                  value={newDeckTopic}
                  onChange={(e) => setNewDeckTopic(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor={deckDescId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  id={deckDescId}
                  className={styles.textareaField}
                  placeholder="Purpose of this vocabulary set..."
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowAddDeck(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={createDeck.isPending}
                >
                  Create deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
