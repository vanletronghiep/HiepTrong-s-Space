// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { EntertainmentView } from '@/features/entertainment/EntertainmentView';

vi.mock('@/client/queries/entertainment', () => ({
  useEntertainmentData: () => ({
    data: { books: [], games: [], musicTracks: [] },
    isLoading: false,
  }),
  useCreateBook: () => ({ mutateAsync: vi.fn() }),
  useCreateGame: () => ({ mutateAsync: vi.fn() }),
  useUpdateBookProgress: () => ({ mutate: vi.fn() }),
}));
afterEach(cleanup);

it('supports roving keyboard tabs, hides other panels, and retains unfinished form input', async () => {
  render(<EntertainmentView />);
  const books = screen.getByRole('tab', { name: 'Books' });
  const games = screen.getByRole('tab', { name: 'Games' });
  expect(books).toHaveAttribute('aria-selected', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Add book' }));
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Keep my draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  fireEvent.keyDown(books, { key: 'ArrowRight' });
  expect(games).toHaveFocus();
  expect(games).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', games.id);
  fireEvent.keyDown(games, { key: 'Home' });
  expect(books).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Add book' }));
  expect(screen.getByLabelText('Title')).toHaveValue('Keep my draft');
});
