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

const initialBooks: BookItem[] = [
  {
    id: 'book-1',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    status: 'reading',
    progressPercentage: 65,
    rating: 5,
    genre: 'Systems Engineering',
    thoughts: 'Unmatched depth on distributed consensus, partition tolerance, and write-ahead logs.',
  },
  {
    id: 'book-2',
    title: 'Crafting Interpreters',
    author: 'Robert Nystrom',
    status: 'completed',
    progressPercentage: 100,
    rating: 5,
    genre: 'Compilers & Languages',
    thoughts: 'Superb pedagogical journey from AST tree-walking interpreter to a bytecode virtual machine.',
  },
  {
    id: 'book-3',
    title: 'Gödel, Escher, Bach: An Eternal Golden Braid',
    author: 'Douglas Hofstadter',
    status: 'reading',
    progressPercentage: 40,
    rating: 5,
    genre: 'Philosophy & Math',
    thoughts: 'Fascinating exploration of recursive self-reference, formal systems, and human consciousness.',
  },
  {
    id: 'book-4',
    title: 'Neuromancer',
    author: 'William Gibson',
    status: 'want_to_read',
    progressPercentage: 0,
    rating: 5,
    genre: 'Science Fiction',
    thoughts: 'Seminal cyberpunk classic exploring cyberspace and artificial intelligence.',
  },
];

const initialGames: GameItem[] = [
  {
    id: 'game-1',
    title: 'The Witcher 3: Wild Hunt',
    platform: 'PC',
    status: 'completed',
    hoursPlayed: 140,
    rating: 5,
  },
  {
    id: 'game-2',
    title: 'Elden Ring',
    platform: 'PC',
    status: 'playing',
    hoursPlayed: 85,
    rating: 5,
  },
  {
    id: 'game-3',
    title: 'Hollow Knight',
    platform: 'PC',
    status: 'completed',
    hoursPlayed: 55,
    rating: 5,
  },
  {
    id: 'game-4',
    title: 'Cyberpunk 2077',
    platform: 'PC',
    status: 'backlog',
    hoursPlayed: 15,
    rating: 4,
  },
];

const initialMusic: MusicTrack[] = [
  {
    id: 'music-1',
    title: 'Deep Focus Ambient Synthesizer',
    artist: 'Solar Fields & Carbon Based Lifeforms',
    mood: 'Deep focus',
    url: 'https://youtube.com',
    durationMinutes: 45,
  },
  {
    id: 'music-2',
    title: 'Goldberg Variations (Glenn Gould)',
    artist: 'J.S. Bach',
    mood: 'Contemplative study',
    url: 'https://youtube.com',
    durationMinutes: 52,
  },
  {
    id: 'music-3',
    title: 'Midnight Coding Lofi Flow',
    artist: 'Chillhop Music',
    mood: 'Relaxed night rhythm',
    url: 'https://youtube.com',
    durationMinutes: 60,
  },
];

const entertainmentStore = new JsonFileStore<StoredEntertainmentState>('entertainment-data.json', [
  {
    id: 'singleton-entertainment-state',
    books: initialBooks,
    games: initialGames,
    musicTracks: initialMusic,
  },
]);

export class EntertainmentService {
  private async getState(): Promise<StoredEntertainmentState> {
    const list = await entertainmentStore.getAll();
    if (list[0]) return list[0];
    const defaultState: StoredEntertainmentState = {
      id: 'singleton-entertainment-state',
      books: initialBooks,
      games: initialGames,
      musicTracks: initialMusic,
    };
    await entertainmentStore.save(defaultState);
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
    const state = await this.getState();
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
    await entertainmentStore.save(state);
    return newBook;
  }

  async updateBookProgress(bookId: string, progressPercentage: number, status?: BookItem['status']): Promise<BookItem | null> {
    const state = await this.getState();
    const book = state.books.find((b) => b.id === bookId);
    if (!book) return null;

    book.progressPercentage = Math.min(100, Math.max(0, progressPercentage));
    if (status) {
      book.status = status;
    } else if (book.progressPercentage === 100) {
      book.status = 'completed';
    }

    await entertainmentStore.save(state);
    return book;
  }

  async createGame(input: CreateGameInput): Promise<GameItem> {
    const state = await this.getState();
    const newGame: GameItem = {
      id: `game-${randomUUID().slice(0, 8)}`,
      title: input.title,
      platform: input.platform ?? 'PC',
      status: input.status ?? 'playing',
      hoursPlayed: input.hoursPlayed ?? 0,
      rating: input.rating ?? 5,
    };

    state.games.unshift(newGame);
    await entertainmentStore.save(state);
    return newGame;
  }
}

export const entertainmentService = new EntertainmentService();

