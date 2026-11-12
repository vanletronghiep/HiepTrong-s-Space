import { NotFoundError } from './errors';
import { randomUUID } from 'node:crypto';
import type {
  CreateCardInput,
  CreateDeckInput,
  FlashcardDeck,
  FlashcardItem,
  FlashcardsData,
  ReviewCardInput,
} from '@/contracts/flashcard';
import { JsonFileStore } from '@/services/storage/json-store';

interface StoredFlashcardState {
  id: string;
  decks: FlashcardDeck[];
  cards: FlashcardItem[];
}

const flashcardStore = new JsonFileStore<StoredFlashcardState>('flashcards-data.json');

export class FlashcardService {
  private async getState(): Promise<StoredFlashcardState> {
    const list = await flashcardStore.getAll();
    if (list[0]) return list[0];
    const defaultState: StoredFlashcardState = {
      id: 'singleton-flashcards-state',
      decks: [],
      cards: [],
    };
    return defaultState;
  }

  async getData(): Promise<FlashcardsData> {
    const state = await this.getState();
    const totalCards = state.cards.length;
    const masteredCards = state.cards.filter((c) => c.confidence >= 4).length;
    const needsPractice = state.cards.filter((c) => c.confidence <= 2).length;

    // Recalculate deck counts & mastery
    for (const deck of state.decks) {
      const deckCards = state.cards.filter((c) => c.deckId === deck.id);
      deck.cardCount = deckCards.length;
      const deckMastered = deckCards.filter((c) => c.confidence >= 4).length;
      deck.masteryPercentage = deckCards.length > 0 ? Math.round((deckMastered / deckCards.length) * 100) : 0;
    }

    return {
      decks: state.decks,
      cards: state.cards,
      stats: {
        totalDecks: state.decks.length,
        totalCards,
        masteredCards,
        needsPractice,
      },
    };
  }

  async createDeck(input: CreateDeckInput): Promise<FlashcardDeck> {
    return flashcardStore.update(await this.getState(), (state) => {
      const newDeck: FlashcardDeck = {
        id: `deck-${randomUUID().slice(0, 8)}`,
        name: input.name,
        topic: input.topic ?? 'General vocabulary',
        description: input.description ?? '',
        cardCount: 0,
        masteryPercentage: 0,
      };

      state.decks.push(newDeck);
      return newDeck;
    });
  }

  async createCard(input: CreateCardInput): Promise<FlashcardItem> {
    return flashcardStore.update(await this.getState(), (state) => {
      if (!state.decks.some(deck => deck.id === input.deckId)) throw new NotFoundError('Deck not found');
      const newCard: FlashcardItem = {
        id: `card-${randomUUID().slice(0, 8)}`,
        deckId: input.deckId,
        prompt: input.prompt,
        answer: input.answer,
        notes: input.notes ?? '',
        confidence: 1,
        reviewCount: 0,
        lastReviewedAt: null,
      };

      state.cards.push(newCard);
      return newCard;
    });
  }

  async reviewCard(input: ReviewCardInput): Promise<FlashcardItem | null> {
    return flashcardStore.update(await this.getState(), (state) => {
      const card = state.cards.find((c) => c.id === input.cardId);
      if (!card) return null;

      card.confidence = input.confidence;
      card.reviewCount += 1;
      card.lastReviewedAt = new Date().toISOString();

      return card;
    });
  }
}

export const flashcardService = new FlashcardService();

