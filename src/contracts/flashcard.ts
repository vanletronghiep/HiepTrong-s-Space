import { z } from 'zod';

export const flashcardItemSchema = z.object({
  id: z.string(),
  deckId: z.string(),
  prompt: z.string().min(1, 'Prompt is required'),
  answer: z.string().min(1, 'Answer is required'),
  notes: z.string().default(''),
  confidence: z.number().min(1).max(5).default(1),
  reviewCount: z.number().default(0),
  lastReviewedAt: z.string().nullable().default(null),
});

export type FlashcardItem = z.infer<typeof flashcardItemSchema>;

export const flashcardDeckSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Deck name is required'),
  topic: z.string(),
  description: z.string(),
  cardCount: z.number().default(0),
  masteryPercentage: z.number().default(0),
});

export type FlashcardDeck = z.infer<typeof flashcardDeckSchema>;

export const flashcardsDataSchema = z.object({
  decks: z.array(flashcardDeckSchema),
  cards: z.array(flashcardItemSchema),
  stats: z.object({
    totalDecks: z.number(),
    totalCards: z.number(),
    masteredCards: z.number(),
    needsPractice: z.number(),
  }),
});

export type FlashcardsData = z.infer<typeof flashcardsDataSchema>;

export const createDeckInputSchema = z.object({
  name: z.string().min(1, 'Deck name is required'),
  topic: z.string().default('English vocabulary'),
  description: z.string().default(''),
});

export type CreateDeckInput = z.infer<typeof createDeckInputSchema>;

export const createCardInputSchema = z.object({
  deckId: z.string(),
  prompt: z.string().min(1, 'Prompt is required'),
  answer: z.string().min(1, 'Answer is required'),
  notes: z.string().optional().default(''),
});

export type CreateCardInput = z.infer<typeof createCardInputSchema>;

export const reviewCardInputSchema = z.object({
  cardId: z.string(),
  confidence: z.number().min(1).max(5),
});

export type ReviewCardInput = z.infer<typeof reviewCardInputSchema>;

