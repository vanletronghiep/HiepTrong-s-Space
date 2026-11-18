'use client';

import { usePageReady } from '@/features/transitions/TransitionProvider';
import React, { useId, useRef, useState } from 'react';
import { AlertTriangle, Headphones, Play, Plus, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import {
  useCreateBook,
  useCreateGame,
  useEntertainmentData,
  useUpdateBookProgress,
} from '@/client/queries/entertainment';
import type { BookStatus, GameStatus } from '@/contracts/entertainment';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { Dialog } from '@/ui/Dialog';
import { EmptyState } from '@/ui/EmptyState';
import { FeatureThemeProvider, useFeatureTheme } from '@/ui/FeatureTheme';
import { FormattedNoteContent } from '@/ui/FormattedNoteContent';
import { RichNoteEditor } from '@/ui/RichNoteEditor';
import { SelectField } from '@/ui/SelectField';
import { Skeleton } from '@/ui/Skeleton';
import styles from './entertainment.module.css';

type MediaTab = 'books' | 'games' | 'music';

const MEDIA_TABS: readonly { id: MediaTab; label: string }[] = [
  { id: 'books', label: 'Books' },
  { id: 'games', label: 'Games' },
  { id: 'music', label: 'Music' },
];

const GAME_STATUS_LABEL: Record<GameStatus, string> = {
  playing: 'Playing',
  completed: 'Completed',
  backlog: 'Backlog',
};

function clampBookProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function clampGameHours(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 10) / 10);
}

function isSafeExternalUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function EntertainmentView() {
  const existingTheme = useFeatureTheme();
  const [activeMedia, setActiveMedia] = useState<MediaTab>('books');
  const writeLocks = useRef(new Set<string>());
  const [showAddBook, setShowAddBook] = useState<boolean>(false);
  const [showAddGame, setShowAddGame] = useState<boolean>(false);

  // Book draft form state (retained across Cancel/Esc/backdrop/error)
  const [bookTitle, setBookTitle] = useState<string>('');
  const [bookAuthor, setBookAuthor] = useState<string>('');
  const [bookGenre, setBookGenre] = useState<string>('Technology');
  const [bookStatus, setBookStatus] = useState<BookStatus>('reading');
  const [bookProgress, setBookProgress] = useState<number>(0);
  const [bookThoughts, setBookThoughts] = useState<string>('');

  // Game draft form state (retained across Cancel/Esc/backdrop/error)
  const [gameTitle, setGameTitle] = useState<string>('');
  const [gamePlatform, setGamePlatform] = useState<string>('PC');
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [gameHours, setGameHours] = useState<number>(0);

  const bookTitleRef = useRef<HTMLInputElement>(null);
  const gameTitleRef = useRef<HTMLInputElement>(null);

  const bookTitleId = useId();
  const bookAuthorId = useId();
  const bookGenreId = useId();
  const bookStatusId = useId();
  const bookProgressId = useId();
  const bookThoughtsId = useId();
  const gameTitleId = useId();
  const gamePlatformId = useId();
  const gameStatusId = useId();
  const gameHoursId = useId();

  // Queries & Mutations
  const { data, isLoading, isError: loadFailed, refetch } = useEntertainmentData();
  usePageReady(!isLoading);
  const createBook = useCreateBook();
  const createGame = useCreateGame();
  const updateProgress = useUpdateBookProgress();

  const openAddBookDialog = () => {
    createBook.reset?.();
    setShowAddBook(true);
  };

  const openAddGameDialog = () => {
    createGame.reset?.();
    setShowAddGame(true);
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim() || !bookAuthor.trim()) return;

    if (writeLocks.current.has('createBook')) return;
    writeLocks.current.add('createBook');
    try {
      await createBook.mutateAsync({
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        genre: bookGenre.trim() || 'Technology',
        status: bookStatus,
        progressPercentage: clampBookProgress(bookProgress),
        thoughts: bookThoughts.trim(),
        rating: 5,
      });
    } catch {
      return;
    } finally {
      writeLocks.current.delete('createBook');
    }

    setShowAddBook(false);
    setBookTitle('');
    setBookAuthor('');
    setBookGenre('Technology');
    setBookStatus('reading');
    setBookProgress(0);
    setBookThoughts('');
  };

  const handleGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameTitle.trim()) return;

    if (writeLocks.current.has('createGame')) return;
    writeLocks.current.add('createGame');
    try {
      await createGame.mutateAsync({
        title: gameTitle.trim(),
        platform: gamePlatform.trim() || 'PC',
        status: gameStatus,
        hoursPlayed: clampGameHours(gameHours),
        rating: 5,
      });
    } catch {
      return;
    } finally {
      writeLocks.current.delete('createGame');
    }

    setShowAddGame(false);
    setGameTitle('');
    setGamePlatform('PC');
    setGameStatus('playing');
    setGameHours(0);
  };

  const books = data?.books ?? [];
  const games = data?.games ?? [];
  const music = data?.musicTracks ?? [];
  const stats = data?.stats;
  const booksCompletedCount =
    stats?.booksReadThisYear ?? books.filter((b) => b.status === 'completed').length;
  const gamesLoggedCount = stats?.totalGamesPlayed ?? games.length;

  const content = (
    <div className={styles.pageStack}>
      <Image
        src="/visuals/entertainment-hub/pixel-waterfall-edge.svg"
        alt=""
        aria-hidden="true"
        width={200}
        height={480}
        loading="eager"
        unoptimized
        className={styles.waterfallEdgeDecor}
      />

      {/* Editorial Lounge Masthead */}
      <header className={styles.masthead} aria-labelledby="entertainment-page-heading">
        <Image
          src="/visuals/entertainment-hub/dream-city-horizon.svg"
          alt=""
          aria-hidden="true"
          width={640}
          height={240}
          loading="eager"
          unoptimized
          className={styles.mastheadArt}
        />

        <div className={styles.mastheadText}>
          <div className={styles.eyebrow}>
            <Headphones size={14} strokeWidth={1.6} aria-hidden="true" />
            <span>Relaxed personal lounge</span>
          </div>

          <h1 id="entertainment-page-heading" className={styles.displayTitle}>
            Entertainment <span className={styles.displayTitleEmphasis}>lounge</span>
          </h1>
          <p className={styles.mastheadSubtitle}>
            A tranquil personal harbor for reading libraries, gaming adventures, and ambient
            soundtracks. Unwind and recharge cognitive energy.
          </p>
        </div>
      </header>

      {/* Non-blocking load failure banner */}
      {loadFailed ? (
        <div role="alert" className={styles.alertBanner}>
          <span className={styles.alertMessageGroup}>
            <AlertTriangle size={16} strokeWidth={1.6} aria-hidden="true" />
            <span>Could not load your entertainment shelves. Please retry.</span>
          </span>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} strokeWidth={1.6} aria-hidden="true" />}
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {/* Stationary 4-Card Summary Strip */}
      {isLoading ? (
        <div className={styles.summaryGrid} aria-label="Loading library overview">
          <Skeleton className="h-[88px] w-full rounded-card" />
          <Skeleton className="h-[88px] w-full rounded-card" />
          <Skeleton className="h-[88px] w-full rounded-card" />
          <Skeleton className="h-[88px] w-full rounded-card" />
        </div>
      ) : (
        <section aria-label="Library overview" className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Books on shelf</p>
            <p className={cn(styles.summaryValue, 'tabular-nums')}>{books.length}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Books completed</p>
            <p className={cn(styles.summaryValue, 'tabular-nums')}>{booksCompletedCount}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Games logged</p>
            <p className={cn(styles.summaryValue, 'tabular-nums')}>{gamesLoggedCount}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Soundtracks</p>
            <p className={cn(styles.summaryValue, 'tabular-nums')}>{music.length}</p>
          </div>
        </section>
      )}

      {/* Continue Enjoying Highlight Strip */}
      <section aria-labelledby="continue-heading" className={styles.continueStrip}>
        <div className={styles.continueHeader}>
          <Play size={16} strokeWidth={2} aria-hidden="true" />
          <h2 id="continue-heading" className={styles.continueHeading}>
            Continue enjoying
          </h2>
        </div>

        {isLoading ? (
          <div className={styles.continueGrid} aria-label="Loading active media">
            <Skeleton className="h-[118px] w-full rounded-item" />
            <Skeleton className="h-[118px] w-full rounded-item" />
          </div>
        ) : (
          <div className={styles.continueGrid}>
            {!stats?.currentBook && !stats?.currentGame ? (
              <p className={styles.continueEmpty}>
                Nothing in progress yet. Choose a book or game from your shelves below.
              </p>
            ) : null}

            {stats?.currentBook ? (
              <div className={styles.continueCard}>
                <div className={styles.continueCardTop}>
                  <div>
                    <span className={styles.continueType}>Currently reading</span>
                    <h3 className={styles.continueTitle}>{stats.currentBook.title}</h3>
                    <p className={styles.continueMeta}>
                      By {stats.currentBook.author} ·{' '}
                      <span className="tabular-nums">{stats.currentBook.progressPercentage}%</span>{' '}
                      finished
                    </p>
                  </div>
                  {activeMedia !== 'books' ? (
                    <Button variant="ghost" size="sm" onClick={() => setActiveMedia('books')}>
                      View shelf
                    </Button>
                  ) : null}
                </div>
                <progress
                  className={styles.progressBar}
                  value={clampBookProgress(stats.currentBook.progressPercentage)}
                  max={100}
                  aria-hidden="true"
                />
              </div>
            ) : null}

            {stats?.currentGame ? (
              <div className={styles.continueCard}>
                <div className={styles.continueCardTop}>
                  <div>
                    <span className={styles.continueType}>Currently playing</span>
                    <h3 className={styles.continueTitle}>{stats.currentGame.title}</h3>
                    <p className={styles.continueMeta}>
                      {stats.currentGame.platform} ·{' '}
                      <span className="tabular-nums">{stats.currentGame.hoursPlayed}</span> hours
                      logged
                    </p>
                  </div>
                  {activeMedia !== 'games' ? (
                    <Button variant="ghost" size="sm" onClick={() => setActiveMedia('games')}>
                      View shelf
                    </Button>
                  ) : null}
                </div>
                <div
                  className={cn(styles.starRating, 'text-text-due-soon')}
                  aria-label={`Rating: ${stats.currentGame.rating} out of 5 stars`}
                >
                  {'★'.repeat(stats.currentGame.rating)}
                  {'☆'.repeat(5 - stats.currentGame.rating)}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <div className={styles.dividerWrap} aria-hidden="true">
        <Image
          src="/visuals/entertainment-hub/ribbon-signal.svg"
          alt=""
          aria-hidden="true"
          width={720}
          height={100}
          unoptimized
          className={styles.ribbonDividerArt}
        />
      </div>

      {/* Media Shelves Roving Tablist */}
      <div className={styles.mediaTabs} role="tablist" aria-label="Entertainment library">
        {MEDIA_TABS.map(({ id, label }, index, all) => (
          <button
            key={id}
            id={`media-tab-${id}`}
            role="tab"
            type="button"
            className={styles.mediaTab}
            aria-selected={activeMedia === id}
            aria-controls={`media-panel-${id}`}
            tabIndex={activeMedia === id ? 0 : -1}
            onClick={() => setActiveMedia(id)}
            onKeyDown={(event) => {
              const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
              const target =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? all.length - 1
                    : step
                      ? (index + step + all.length) % all.length
                      : -1;
              if (target < 0) return;
              event.preventDefault();
              setActiveMedia(all[target]!.id);
              event.currentTarget.parentElement
                ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                [target]?.focus();
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Books Reading Library */}
      <section
        role="tabpanel"
        id="media-panel-books"
        aria-labelledby="media-tab-books"
        hidden={activeMedia !== 'books'}
        className={styles.mediaPanel}
      >
        <div className={styles.sectionHeader}>
          <h2 id="books-heading" className={styles.sectionTitle}>
            Reading library
          </h2>
          <Button
            variant="secondary"
            size="sm"
            pill
            leftIcon={<Plus size={14} strokeWidth={2} aria-hidden="true" />}
            onClick={openAddBookDialog}
          >
            Add book
          </Button>
        </div>

        {updateProgress.isError ? (
          <p role="alert" className={styles.inlineAlert}>
            Could not update reading progress. Please adjust the slider to retry.
          </p>
        ) : null}

        {isLoading ? (
          <div className={styles.booksGrid} aria-label="Loading reading library">
            <Skeleton className="h-[180px] w-full rounded-card" />
            <Skeleton className="h-[180px] w-full rounded-card" />
          </div>
        ) : (
          <div className={styles.booksGrid}>
            {books.length === 0 ? (
              <div className={styles.emptyStateWrap} role="status">
                <EmptyState
                  compact
                  title="No books in your library yet."
                  description="Add a book to track chapters, reflections, and reading progress."
                />
              </div>
            ) : null}

            {books.map((book) => {
              const statusClass =
                book.status === 'reading'
                  ? styles.statusReading
                  : book.status === 'completed'
                    ? styles.statusCompleted
                    : styles.statusWant;
              const pct = clampBookProgress(book.progressPercentage);

              return (
                <article key={book.id} className={styles.bookCard}>
                  <div>
                    <div className={styles.bookTop}>
                      <span className={styles.bookGenre}>{book.genre}</span>
                      <span className={cn(styles.statusBadge, statusClass)}>
                        {book.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h3 className={styles.bookTitle}>{book.title}</h3>
                    <p className={styles.bookAuthor}>By {book.author}</p>
                    {book.thoughts ? (
                      <FormattedNoteContent value={book.thoughts} className={styles.bookThoughts} />
                    ) : null}
                  </div>

                  <div>
                    <progress
                      className={styles.progressBar}
                      value={pct}
                      max={100}
                      aria-hidden="true"
                    />

                    <div className={styles.progressControlRow}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        className={styles.progressRange}
                        value={pct}
                        onChange={(e) =>
                          updateProgress.mutate({
                            bookId: book.id,
                            progressPercentage: clampBookProgress(Number(e.target.value)),
                          })
                        }
                        aria-label={`Reading progress for ${book.title}`}
                      />
                      <span className={cn(styles.progressValue, 'tabular-nums')}>{pct}%</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Games Backlog */}
      <section
        role="tabpanel"
        id="media-panel-games"
        aria-labelledby="media-tab-games"
        hidden={activeMedia !== 'games'}
        className={styles.mediaPanel}
      >
        <div className={styles.sectionHeader}>
          <h2 id="games-heading" className={styles.sectionTitle}>
            Gaming adventures & backlog
          </h2>
          <Button
            variant="secondary"
            size="sm"
            pill
            leftIcon={<Plus size={14} strokeWidth={2} aria-hidden="true" />}
            onClick={openAddGameDialog}
          >
            Add game
          </Button>
        </div>

        {isLoading ? (
          <div className={styles.gamesGrid} aria-label="Loading gaming shelf">
            <Skeleton className="h-[116px] w-full rounded-item" />
            <Skeleton className="h-[116px] w-full rounded-item" />
            <Skeleton className="h-[116px] w-full rounded-item" />
          </div>
        ) : (
          <div className={styles.gamesGrid}>
            {games.length === 0 ? (
              <div className={styles.emptyStateWrap} role="status">
                <EmptyState
                  compact
                  title="Your gaming shelf is clear."
                  description="Log a title you are playing or add one to your backlog."
                />
              </div>
            ) : null}

            {games.map((game) => (
              <article key={game.id} className={styles.gameCard}>
                <div>
                  <span className={styles.gamePlatform}>{game.platform}</span>
                  <h3 className={styles.gameTitle}>{game.title}</h3>
                </div>
                <div className={styles.gameFooter}>
                  <span className={cn(styles.gameHours, 'tabular-nums')}>
                    {game.hoursPlayed} hrs
                  </span>
                  <span className={styles.gameStatus}>{GAME_STATUS_LABEL[game.status]}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Music Soundtracks Strip */}
      <section
        role="tabpanel"
        id="media-panel-music"
        aria-labelledby="media-tab-music"
        hidden={activeMedia !== 'music'}
        className={styles.mediaPanel}
      >
        <div className={styles.sectionHeader}>
          <h2 id="music-heading" className={styles.sectionTitle}>
            Ambient soundtracks & coding flow
          </h2>
        </div>

        {isLoading ? (
          <div className={styles.musicList} aria-label="Loading soundtracks">
            <Skeleton className="h-[76px] w-full rounded-item" />
            <Skeleton className="h-[76px] w-full rounded-item" />
          </div>
        ) : (
          <div className={styles.musicList}>
            {music.length === 0 ? (
              <div className={styles.emptyStateWrap} role="status">
                <Image
                  src="/visuals/entertainment-hub/floating-headphones.svg"
                  alt=""
                  aria-hidden="true"
                  width={240}
                  height={240}
                  unoptimized
                  className={styles.musicEmptyArt}
                />
                <p className={styles.emptyTitle}>No saved soundtracks yet.</p>
                <p className={styles.emptyDescription}>
                  Ambient playlists and focus mixes will appear here when added.
                </p>
              </div>
            ) : null}

            {music.map((track) => (
              <div key={track.id} className={styles.musicItem}>
                <div>
                  <span className={styles.musicTrackTitle}>{track.title}</span>
                  <p className={styles.musicArtist}>
                    {track.artist} · {track.mood} (
                    <span className="tabular-nums">{track.durationMinutes}</span> mins)
                  </p>
                </div>

                {isSafeExternalUrl(track.url) ? (
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.listenBtn}
                  >
                    <span>Listen stream</span>
                    <Play size={12} strokeWidth={2} aria-hidden="true" />
                  </a>
                ) : (
                  <span className={styles.listenUnavailable}>Stream link unavailable</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Compact Add Book Dialog (NEVER LargeEditorDialog) */}
      {showAddBook ? (
        <Dialog
          open
          portal
          initialFocusRef={bookTitleRef}
          title="Add book to library"
          className="max-w-[440px] max-h-[90svh] overflow-y-auto"
          onClose={() => setShowAddBook(false)}
        >
          <form onSubmit={handleBookSubmit} className={styles.modalForm}>
            {createBook.isError ? (
              <p role="alert" className={styles.inlineAlert}>
                Could not add this book. Your draft is retained; please retry.
              </p>
            ) : null}

            <div>
              <label htmlFor={bookTitleId} className={styles.fieldLabel}>
                Title
              </label>
              <input
                ref={bookTitleRef}
                id={bookTitleId}
                type="text"
                required
                className={styles.inputField}
                placeholder="e.g., Gödel, Escher, Bach"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
              />
            </div>

            <div className={styles.fieldRow}>
              <div>
                <label htmlFor={bookAuthorId} className={styles.fieldLabel}>
                  Author
                </label>
                <input
                  id={bookAuthorId}
                  type="text"
                  required
                  className={styles.inputField}
                  placeholder="e.g., Douglas Hofstadter"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor={bookGenreId} className={styles.fieldLabel}>
                  Genre
                </label>
                <input
                  id={bookGenreId}
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g., Philosophy & Math"
                  value={bookGenre}
                  onChange={(e) => setBookGenre(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div>
                <label htmlFor={bookStatusId} className={styles.fieldLabel}>
                  Status
                </label>
                <SelectField<BookStatus>
                  id={bookStatusId}
                  ariaLabel="Status"
                  value={bookStatus}
                  onChange={setBookStatus}
                  options={[
                    { value: 'reading', label: 'Currently reading' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'want_to_read', label: 'Want to read' },
                  ]}
                />
              </div>

              <div>
                <label htmlFor={bookProgressId} className={styles.fieldLabel}>
                  Progress percentage
                </label>
                <input
                  id={bookProgressId}
                  type="number"
                  min="0"
                  max="100"
                  className={styles.inputField}
                  value={bookProgress}
                  onChange={(e) => setBookProgress(clampBookProgress(Number(e.target.value)))}
                />
              </div>
            </div>

            <div>
              <label htmlFor={bookThoughtsId} className={styles.fieldLabel}>
                Takeaways &amp; reflection
              </label>
              <RichNoteEditor
                id={bookThoughtsId}
                ariaLabel="Takeaways & reflection"
                placeholder="Key concepts or memorable impressions..."
                value={bookThoughts}
                onChange={setBookThoughts}
                minHeightClassName="min-h-[84px]"
              />
            </div>

            <div className={styles.modalFooter}>
              <Button variant="secondary" onClick={() => setShowAddBook(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={createBook.isPending}>
                {createBook.isPending ? 'Saving...' : 'Add to library'}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}

      {/* Compact Add Game Dialog (NEVER LargeEditorDialog) */}
      {showAddGame ? (
        <Dialog
          open
          portal
          initialFocusRef={gameTitleRef}
          title="Add game"
          className="max-w-[440px] max-h-[90svh] overflow-y-auto"
          onClose={() => setShowAddGame(false)}
        >
          <form onSubmit={handleGameSubmit} className={styles.modalForm}>
            {createGame.isError ? (
              <p role="alert" className={styles.inlineAlert}>
                Could not save this game. Your draft is retained; please retry.
              </p>
            ) : null}

            <div>
              <label htmlFor={gameTitleId} className={styles.fieldLabel}>
                Game title
              </label>
              <input
                ref={gameTitleRef}
                id={gameTitleId}
                type="text"
                required
                className={styles.inputField}
                placeholder="e.g., Baldur's Gate 3"
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
              />
            </div>

            <div className={styles.fieldRow}>
              <div>
                <label htmlFor={gamePlatformId} className={styles.fieldLabel}>
                  Platform
                </label>
                <input
                  id={gamePlatformId}
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g., PC, Switch"
                  value={gamePlatform}
                  onChange={(e) => setGamePlatform(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor={gameStatusId} className={styles.fieldLabel}>
                  Status
                </label>
                <SelectField<GameStatus>
                  id={gameStatusId}
                  ariaLabel="Status"
                  value={gameStatus}
                  onChange={setGameStatus}
                  options={[
                    { value: 'playing', label: 'Currently playing' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'backlog', label: 'In backlog' },
                  ]}
                />
              </div>
            </div>

            <div>
              <label htmlFor={gameHoursId} className={styles.fieldLabel}>
                Hours played
              </label>
              <input
                id={gameHoursId}
                type="number"
                min="0"
                step="0.5"
                className={styles.inputField}
                value={gameHours}
                onChange={(e) => setGameHours(clampGameHours(Number(e.target.value)))}
              />
            </div>

            <div className={styles.modalFooter}>
              <Button variant="secondary" onClick={() => setShowAddGame(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={createGame.isPending}>
                {createGame.isPending ? 'Saving...' : 'Save game'}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </div>
  );

  return existingTheme ? (
    content
  ) : (
    <FeatureThemeProvider name="entertainment-hub">{content}</FeatureThemeProvider>
  );
}
