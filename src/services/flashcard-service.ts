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

const initialDecks: FlashcardDeck[] = [
  {
    id: 'deck-academic',
    name: 'Advanced Academic & Philosophical Lexicon',
    topic: 'Academic English',
    description: 'Precision vocabulary for graduate research papers, cognitive science, and epistemological discourse.',
    cardCount: 4,
    masteryPercentage: 75,
  },
  {
    id: 'deck-rhetoric',
    name: 'Rhetoric, Discourse & Norse Imagery',
    topic: 'Literary & Historical English',
    description: 'Expressive vocabulary inspired by classical rhetoric, dialectics, and ancient historical treatises.',
    cardCount: 3,
    masteryPercentage: 66,
  },
];

const initialCards: FlashcardItem[] = [
  {
    id: 'card-1',
    deckId: 'deck-academic',
    prompt: 'Epistemic (adjective)',
    answer: 'Relating to knowledge or to the degree of its validation and cognitive limits.',
    notes: 'Example: The epistemic humility required when assessing machine learning models.',
    confidence: 4,
    reviewCount: 3,
    lastReviewedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'card-2',
    deckId: 'deck-academic',
    prompt: 'Inchoate (adjective)',
    answer: 'Just begun and so not fully formed or developed; rudimentary.',
    notes: 'Example: An inchoate intuition that later solidified into an architectural law.',
    confidence: 3,
    reviewCount: 2,
    lastReviewedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'card-3',
    deckId: 'deck-academic',
    prompt: 'Teleological (adjective)',
    answer: 'Relating to the philosophical doctrine that design and purpose are inherent in natural phenomena.',
    notes: 'Contrast with mechanistic or purely random explanations.',
    confidence: 5,
    reviewCount: 4,
    lastReviewedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'card-4',
    deckId: 'deck-academic',
    prompt: 'Hegemony (noun)',
    answer: 'Leadership or predominant influence, especially by one nation or social collective over others.',
    notes: 'Often used in socioeconomic and geopolitical discourse.',
    confidence: 4,
    reviewCount: 2,
    lastReviewedAt: new Date().toISOString(),
  },
  {
    id: 'card-5',
    deckId: 'deck-rhetoric',
    prompt: 'Skaldic (adjective)',
    answer: 'Relating to ancient Scandinavian court bards who composed alliterative verse recounting sagas and heroic deeds.',
    notes: 'Etymology: Old Norse skáld (poet).',
    confidence: 4,
    reviewCount: 3,
    lastReviewedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'card-6',
    deckId: 'deck-rhetoric',
    prompt: 'Dialectic (noun)',
    answer: 'The discourse between two opposing perspectives seeking to establish truth through reasoned arguments.',
    notes: 'Hegelian dialectic: thesis, antithesis, synthesis.',
    confidence: 5,
    reviewCount: 5,
    lastReviewedAt: new Date().toISOString(),
  },
  {
    id: 'card-7',
    deckId: 'deck-rhetoric',
    prompt: 'Anachronism (noun)',
    answer: 'A thing belonging or appropriate to a historical period other than that in which it currently exists.',
    notes: 'Example: A smartphone depicted in a Viking shield hall painting.',
    confidence: 2,
    reviewCount: 1,
    lastReviewedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

const flashcardStore = new JsonFileStore<StoredFlashcardState>('flashcards-data.json', [
  {
    id: 'singleton-flashcards-state',
    decks: initialDecks,
    cards: initialCards,
  },
]);

export class FlashcardService {
  private async getState(): Promise<StoredFlashcardState> {
    const list = await flashcardStore.getAll();
    if (list[0]) return list[0];
    const defaultState: StoredFlashcardState = {
      id: 'singleton-flashcards-state',
      decks: initialDecks,
      cards: initialCards,
    };
    await flashcardStore.save(defaultState);
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
    const state = await this.getState();
    const newDeck: FlashcardDeck = {
      id: `deck-${randomUUID().slice(0, 8)}`,
      name: input.name,
      topic: input.topic ?? 'General vocabulary',
      description: input.description ?? '',
      cardCount: 0,
      masteryPercentage: 0,
    };

    state.decks.push(newDeck);
    await flashcardStore.save(state);
    return newDeck;
  }

  async createCard(input: CreateCardInput): Promise<FlashcardItem> {
    const state = await this.getState();
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
    await flashcardStore.save(state);
    return newCard;
  }

  async reviewCard(input: ReviewCardInput): Promise<FlashcardItem | null> {
    const state = await this.getState();
    const card = state.cards.find((c) => c.id === input.cardId);
    if (!card) return null;

    card.confidence = input.confidence;
    card.reviewCount += 1;
    card.lastReviewedAt = new Date().toISOString();

    await flashcardStore.save(state);
    return card;
  }
}

export const flashcardService = new FlashcardService();

