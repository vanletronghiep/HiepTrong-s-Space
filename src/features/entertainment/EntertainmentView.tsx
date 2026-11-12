'use client';

import { Dialog } from '@/ui/Dialog';

import React, { useRef, useState, useId } from 'react';
import type { BookStatus, GameStatus } from '@/contracts/entertainment';
import {
  useCreateBook,
  useCreateGame,
  useEntertainmentData,
  useUpdateBookProgress,
} from '@/client/queries/entertainment';
import styles from './entertainment.module.css';

export function EntertainmentView() {
  const writeLocks = useRef(new Set<string>());
  const [showAddBook, setShowAddBook] = useState<boolean>(false);
  const [showAddGame, setShowAddGame] = useState<boolean>(false);

  // Book Form
  const [bookTitle, setBookTitle] = useState<string>('');
  const [bookAuthor, setBookAuthor] = useState<string>('');
  const [bookGenre, setBookGenre] = useState<string>('Technology');
  const [bookStatus, setBookStatus] = useState<BookStatus>('reading');
  const [bookProgress, setBookProgress] = useState<number>(0);
  const [bookThoughts, setBookThoughts] = useState<string>('');

  // Game Form
  const [gameTitle, setGameTitle] = useState<string>('');
  const [gamePlatform, setGamePlatform] = useState<string>('PC');
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [gameHours, setGameHours] = useState<number>(0);

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
  const createBook = useCreateBook();
  const createGame = useCreateGame();
  const updateProgress = useUpdateBookProgress();

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim() || !bookAuthor.trim()) return;

    if (writeLocks.current.has('createBook')) return;
    writeLocks.current.add('createBook');
    try {
      await createBook.mutateAsync({
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        genre: bookGenre.trim(),
        status: bookStatus,
        progressPercentage: Number(bookProgress),
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
    setBookThoughts('');
    setBookProgress(0);
  };

  const handleGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameTitle.trim()) return;

    if (writeLocks.current.has('createGame')) return;
    writeLocks.current.add('createGame');
    try {
      await createGame.mutateAsync({
        title: gameTitle.trim(),
        platform: gamePlatform.trim(),
        status: gameStatus,
        hoursPlayed: Number(gameHours),
        rating: 5,
      });
    } catch {
      return;
    } finally {
      writeLocks.current.delete('createGame');
    }

    setShowAddGame(false);
    setGameTitle('');
    setGameHours(0);
  };

  const books = data?.books ?? [];
  const games = data?.games ?? [];
  const music = data?.musicTracks ?? [];
  const stats = data?.stats;



  if (loadFailed) return <div role="alert">Could not load this space. <button type="button" onClick={() => void refetch()}>Retry</button></div>;

  return (
    <div className={styles.container}>
      {[createBook, createGame, updateProgress].some(mutation => mutation.isError) && <p role="alert">The change could not be saved. Your input is retained; retry the action.</p>}
      {/* Relaxed Lounge Header */}
      <header className={styles.header}>
        <div className={styles.eyebrow}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span>Relaxed personal lounge</span>
        </div>

        <h1 className={styles.title}>Entertainment Hub</h1>
        <p className={styles.description}>
          A tranquil personal harbor for reading libraries, gaming adventures, and ambient soundtracks.
          Unwind and recharge cognitive energy.
        </p>
      </header>

      {/* "Continue Enjoying" Highlight Strip */}
      <section aria-labelledby="continue-heading" className={styles.continueStrip}>
        <div className={styles.continueHeader}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>Continue enjoying</span>
        </div>

        <div className={styles.continueGrid}>
          {stats?.currentBook && (
            <div className={styles.continueCard}>
              <div>
                <span className={styles.continueType}>Currently reading</span>
                <h3 className={styles.continueTitle}>{stats.currentBook.title}</h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ws-text-muted)' }}>
                  By {stats.currentBook.author} · {stats.currentBook.progressPercentage}% finished
                </span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${stats.currentBook.progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {stats?.currentGame && (
            <div className={styles.continueCard}>
              <div>
                <span className={styles.continueType}>Currently playing</span>
                <h3 className={styles.continueTitle}>{stats.currentGame.title}</h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ws-text-muted)' }}>
                  {stats.currentGame.platform} · {stats.currentGame.hoursPlayed} hours logged
                </span>
              </div>
              <div style={{ color: 'var(--status-due-soon)', fontSize: '11px' }}>
                {'★'.repeat(stats.currentGame.rating)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Books Reading Library */}
      <section aria-labelledby="books-heading">
        <div className={styles.sectionHeader}>
          <h2 id="books-heading" className={styles.sectionTitle}>
            Reading library
          </h2>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setShowAddBook(true)}
          >
            <span>+ Add book</span>
          </button>
        </div>

        {isLoading ? (
          <div style={{ color: 'var(--ws-text-muted)', fontSize: 'var(--text-xs)' }}>
            Loading library...
          </div>
        ) : (
          <div className={styles.booksGrid}>
            {books.map((book) => {
              const statusClass =
                book.status === 'reading'
                  ? styles.statusReading
                  : book.status === 'completed'
                    ? styles.statusCompleted
                    : styles.statusWant;

              return (
                <article key={book.id} className={styles.bookCard}>
                  <div>
                    <div className={styles.bookTop}>
                      <span className={styles.bookGenre}>{book.genre}</span>
                      <span className={`${styles.statusBadge} ${statusClass}`}>
                        {book.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h3 className={styles.bookTitle}>{book.title}</h3>
                    <p className={styles.bookAuthor}>By {book.author}</p>
                    {book.thoughts && <p className={styles.bookThoughts}>{book.thoughts}</p>}
                  </div>

                  <div>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${book.progressPercentage}%` }}
                      />
                    </div>

                    <div className={styles.progressControlRow}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        className={styles.progressRange}
                        value={book.progressPercentage}
                        onChange={(e) =>
                          updateProgress.mutate({
                            bookId: book.id,
                            progressPercentage: Number(e.target.value),
                          })
                        }
                        aria-label={`Reading progress for ${book.title}`}
                      />
                      <span style={{ fontSize: '11px', fontWeight: 600, minWidth: '32px' }}>
                        {book.progressPercentage}%
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Games Backlog */}
      <section aria-labelledby="games-heading">
        <div className={styles.sectionHeader}>
          <h2 id="games-heading" className={styles.sectionTitle}>
            Gaming adventures & backlog
          </h2>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setShowAddGame(true)}
          >
            <span>+ Add game</span>
          </button>
        </div>

        <div className={styles.gamesGrid}>
          {games.map((game) => (
            <div key={game.id} className={styles.gameCard}>
              <div>
                <span className={styles.gamePlatform}>{game.platform}</span>
                <h3 className={styles.gameTitle}>{game.title}</h3>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={styles.gameHours}>{game.hoursPlayed} hrs</span>
                <span style={{ fontSize: '11px', textTransform: 'capitalize', color: 'var(--ws-text-muted)' }}>
                  {game.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Music Soundtracks Strip */}
      <section aria-labelledby="music-heading" className={styles.musicSection}>
        <div className={styles.sectionHeader}>
          <h2 id="music-heading" className={styles.sectionTitle}>
            Ambient soundtracks & coding flow
          </h2>
        </div>

        <div className={styles.musicList}>
          {music.map((track) => (
            <div key={track.id} className={styles.musicItem}>
              <div>
                <span className={styles.musicTrackTitle}>{track.title}</span>
                <p className={styles.musicArtist}>
                  {track.artist} · {track.mood} ({track.durationMinutes} mins)
                </p>
              </div>

              <a
                href={track.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.listenBtn}
              >
                <span>Listen stream</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Add Book Modal */}
      {showAddBook && (
        <Dialog open portal title="Add book to library" className="max-w-2xl max-h-[90svh] overflow-y-auto" onClose={() => setShowAddBook(false)}>
{[createBook, createGame, updateProgress].some(mutation => mutation.isError) && <p role="alert">Could not save. Your input is retained; retry.</p>}
          <div className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>

            <form onSubmit={handleBookSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label htmlFor={bookTitleId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Title
                </label>
                <input
                  id={bookTitleId}
                  type="text"
                  required
                  className={styles.inputField}
                  placeholder="e.g., Gödel, Escher, Bach"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor={bookAuthorId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
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
                  <label htmlFor={bookGenreId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor={bookStatusId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select
                    id={bookStatusId}
                    className={styles.selectField}
                    value={bookStatus}
                    onChange={(e) => setBookStatus(e.target.value as BookStatus)}
                  >
                    <option value="reading">Currently reading</option>
                    <option value="completed">Completed</option>
                    <option value="want_to_read">Want to read</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={bookProgressId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    Progress percentage
                  </label>
                  <input
                    id={bookProgressId}
                    type="number"
                    min="0"
                    max="100"
                    className={styles.inputField}
                    value={bookProgress}
                    onChange={(e) => setBookProgress(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label htmlFor={bookThoughtsId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Takeaways & reflection
                </label>
                <textarea
                  id={bookThoughtsId}
                  className={styles.textareaField}
                  style={{ minHeight: '60px' }}
                  placeholder="Key concepts or memorable impressions..."
                  value={bookThoughts}
                  onChange={(e) => setBookThoughts(e.target.value)}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowAddBook(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={createBook.isPending}
                >
                  Add to library
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* Add Game Modal */}
      {showAddGame && (
        <Dialog open portal title="Add game" className="max-w-2xl max-h-[90svh] overflow-y-auto" onClose={() => setShowAddGame(false)}>
{[createBook, createGame, updateProgress].some(mutation => mutation.isError) && <p role="alert">Could not save. Your input is retained; retry.</p>}
          <div className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>

            <form onSubmit={handleGameSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label htmlFor={gameTitleId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Game title
                </label>
                <input
                  id={gameTitleId}
                  type="text"
                  required
                  className={styles.inputField}
                  placeholder="e.g., Baldur's Gate 3"
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor={gamePlatformId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
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
                  <label htmlFor={gameStatusId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select
                    id={gameStatusId}
                    className={styles.selectField}
                    value={gameStatus}
                    onChange={(e) => setGameStatus(e.target.value as GameStatus)}
                  >
                    <option value="playing">Currently playing</option>
                    <option value="completed">Completed</option>
                    <option value="backlog">In backlog</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor={gameHoursId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Hours played
                </label>
                <input
                  id={gameHoursId}
                  type="number"
                  min="0"
                  className={styles.inputField}
                  value={gameHours}
                  onChange={(e) => setGameHours(Number(e.target.value))}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowAddGame(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={createGame.isPending}
                >
                  Save game
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
}

