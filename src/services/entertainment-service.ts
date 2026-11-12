import { randomUUID } from 'node:crypto';
import type {
  BookItem,
  CreateBookInput,
  CreateGameInput,
  EntertainmentData,
  GameItem,
  MusicTrack,
} from '@/contracts/entertainment';
import { JsonFileStore } from '@/services/storage/json-store';

interface StoredEntertainmentState {
  id: string;
  books: BookItem[];
  games: GameItem[];
  musicTracks: MusicTrack[];
}

const entertainmentStore = new JsonFileStore<StoredEntertainmentState>('entertainment-data.json');

export class EntertainmentService {
  private async getState(): Promise<StoredEntertainmentState> {
    const list = await entertainmentStore.getAll();
    if (list[0]) return list[0];
    const defaultState: StoredEntertainmentState = {
      id: 'singleton-entertainment-state',
      books: [],
      games: [],
      musicTracks: [],
    };
    return defaultState;
  }

  async getData(): Promise<EntertainmentData> {
    const state = await this.getState();
    const completedBooks = state.books.filter((b) => b.status === 'completed').length;
    const currentBook = state.books.find((b) => b.status === 'reading') ?? state.books[0] ?? null;
    const currentGame = state.games.find((g) => g.status === 'playing') ?? state.games[0] ?? null;

    return {
      books: state.books,
      games: state.games,
      musicTracks: state.musicTracks,
      stats: {
        booksReadThisYear: completedBooks,
        totalGamesPlayed: state.games.length,
        currentBook,
        currentGame,
      },
    };
  }

  async createBook(input: CreateBookInput): Promise<BookItem> {
    return entertainmentStore.update(await this.getState(), (state) => {
      const newBook: BookItem = {
        id: `book-${randomUUID().slice(0, 8)}`,
        title: input.title,
        author: input.author,
        status: input.status ?? 'reading',
        progressPercentage: input.progressPercentage ?? 0,
        rating: input.rating ?? 5,
        genre: input.genre ?? 'General',
        thoughts: input.thoughts ?? '',
      };

      state.books.unshift(newBook);
      return newBook;
    });
  }

  async updateBookProgress(bookId: string, progressPercentage: number, status?: BookItem['status']): Promise<BookItem | null> {
    return entertainmentStore.update(await this.getState(), (state) => {
      const book = state.books.find((b) => b.id === bookId);
      if (!book) return null;

      book.progressPercentage = Math.min(100, Math.max(0, progressPercentage));
      if (status) {
        book.status = status;
      } else if (book.progressPercentage === 100) {
        book.status = 'completed';
      }

      return book;
    });
  }

  async createGame(input: CreateGameInput): Promise<GameItem> {
    return entertainmentStore.update(await this.getState(), (state) => {
      const newGame: GameItem = {
        id: `game-${randomUUID().slice(0, 8)}`,
        title: input.title,
        platform: input.platform ?? 'PC',
        status: input.status ?? 'playing',
        hoursPlayed: input.hoursPlayed ?? 0,
        rating: input.rating ?? 5,
      };

      state.games.unshift(newGame);
      return newGame;
    });
  }
}

export const entertainmentService = new EntertainmentService();

