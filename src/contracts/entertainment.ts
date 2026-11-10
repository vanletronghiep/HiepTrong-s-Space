import { z } from 'zod';

export type BookStatus = 'reading' | 'completed' | 'want_to_read';
export type GameStatus = 'playing' | 'completed' | 'backlog';

export const bookItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  status: z.enum(['reading', 'completed', 'want_to_read']),
  progressPercentage: z.number().min(0).max(100).default(0),
  rating: z.number().min(1).max(5).default(5),
  genre: z.string().default('Computer Science'),
  thoughts: z.string().default(''),
});

export type BookItem = z.infer<typeof bookItemSchema>;

export const gameItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  platform: z.string().default('PC'),
  status: z.enum(['playing', 'completed', 'backlog']),
  hoursPlayed: z.number().default(0),
  rating: z.number().min(1).max(5).default(5),
});

export type GameItem = z.infer<typeof gameItemSchema>;

export const musicTrackSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  mood: z.string(),
  url: z.string(),
  durationMinutes: z.number(),
});

export type MusicTrack = z.infer<typeof musicTrackSchema>;

export const entertainmentDataSchema = z.object({
  books: z.array(bookItemSchema),
  games: z.array(gameItemSchema),
  musicTracks: z.array(musicTrackSchema),
  stats: z.object({
    booksReadThisYear: z.number(),
    totalGamesPlayed: z.number(),
    currentBook: bookItemSchema.nullable(),
    currentGame: gameItemSchema.nullable(),
  }),
});

export type EntertainmentData = z.infer<typeof entertainmentDataSchema>;

export const createBookInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  status: z.enum(['reading', 'completed', 'want_to_read']).default('reading'),
  progressPercentage: z.number().min(0).max(100).default(0),
  rating: z.number().min(1).max(5).default(5),
  genre: z.string().default('Technology'),
  thoughts: z.string().default(''),
});

export type CreateBookInput = z.infer<typeof createBookInputSchema>;

export const createGameInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  platform: z.string().default('PC'),
  status: z.enum(['playing', 'completed', 'backlog']).default('playing'),
  hoursPlayed: z.number().default(0),
  rating: z.number().min(1).max(5).default(5),
});

export type CreateGameInput = z.infer<typeof createGameInputSchema>;

