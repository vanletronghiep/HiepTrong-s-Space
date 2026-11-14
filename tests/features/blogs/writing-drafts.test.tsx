// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { BlogArticle } from '@/contracts/blog';
import { WritingRoomView } from '@/features/blogs/WritingRoomView';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  articles: [] as BlogArticle[],
}));

vi.mock('@/client/queries/blogs', () => ({
  useBlogArticles: () => ({
    data: mocks.articles,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCreateBlogArticle: () => ({ mutateAsync: mocks.create, isPending: false, isError: false }),
  useUpdateBlogArticle: () => ({ mutateAsync: mocks.update, isPending: false, isError: false }),
}));

beforeEach(() => {
  mocks.articles = [];
  mocks.create.mockReset().mockResolvedValue({ id: 'saved' });
  mocks.update.mockReset().mockImplementation(async ({ id, patch }) => ({
    ...mocks.articles.find((article) => article.id === id),
    ...patch,
    id,
  }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('saves a draft explicitly and resumes it through the existing update API', async () => {
  const view = render(<WritingRoomView />);
  fireEvent.click(screen.getByRole('button', { name: 'Write new piece' }));
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Retain my writing' } });
  fireEvent.change(screen.getByLabelText(/Prose essay/), { target: { value: 'Original prose' } });
  fireEvent.change(screen.getByLabelText(/Original source URL/), {
    target: { value: 'https://example.org/article' },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  });
  expect(mocks.create).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 'draft',
      content: 'Original prose',
      originalSourceUrl: 'https://example.org/article',
    }),
  );
  mocks.articles = [
    {
      ...mocks.create.mock.calls[0]?.[0],
      id: 'saved',
      slug: 'saved',
      publishedAt: '2026-11-10T00:00:00Z',
      readingTimeMinutes: 1,
      sources: [],
    },
  ];
  view.unmount();
  render(<WritingRoomView />);
  fireEvent.click(screen.getByRole('button', { name: /Retain my writing/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit piece' }));
  expect((screen.getByLabelText(/Prose essay/) as HTMLTextAreaElement).value).toBe(
    'Original prose',
  );
  fireEvent.change(screen.getByLabelText(/Prose essay/), { target: { value: 'Revised prose' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  });
  expect(mocks.update).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'saved',
      patch: expect.objectContaining({ content: 'Revised prose', status: 'draft' }),
    }),
  );
  expect(mocks.create).toHaveBeenCalledTimes(1);
});

it('retains unsaved prose after failed writes and lets the writer cancel closing', async () => {
  mocks.create.mockRejectedValue(new Error('Offline'));
  render(<WritingRoomView />);
  fireEvent.click(screen.getByRole('button', { name: 'Write new piece' }));
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Keep me' } });
  fireEvent.change(screen.getByLabelText(/Prose essay/), { target: { value: 'Unsaved prose' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  });
  expect(screen.getByRole('alert')).toHaveTextContent('Offline');
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.getByRole('dialog', { name: 'Save changes before closing?' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Continue editing' }));
  expect((screen.getByLabelText(/Prose essay/) as HTMLTextAreaElement).value).toBe('Unsaved prose');
});

it('starts a blank new piece after closing an existing article edit without overwriting it', async () => {
  mocks.articles = [
    {
      id: 'original',
      slug: 'original',
      title: 'Original article',
      subtitle: 'Original subtitle',
      category: 'personal_stories',
      authorship: 'saved_from_others',
      authorName: 'Original author',
      originalSourceUrl: 'https://example.org/original',
      commentary: 'Original commentary',
      readingTimeMinutes: 1,
      publishedAt: '2026-11-10T00:00:00Z',
      shortVersion: 'Original summary',
      content: 'Original prose',
      tags: ['Original'],
      sources: [],
      status: 'published',
    },
  ];
  render(<WritingRoomView />);
  fireEvent.click(screen.getByRole('button', { name: /Original article/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit piece' }));
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Canceled edit' } });
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.getByRole('dialog', { name: 'Save changes before closing?' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
  fireEvent.click(screen.getByRole('button', { name: 'Back to all articles' }));
  fireEvent.click(screen.getByRole('button', { name: 'Write new piece' }));

  expect(screen.getByRole('dialog', { name: 'Draft a new piece' })).toBeTruthy();
  for (const label of [
    'Title',
    'Subtitle',
    /The short version/,
    /Prose essay/,
    /Tags/,
    /Original source URL/,
  ]) {
    expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe('');
  }
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Separate article' } });
  fireEvent.change(screen.getByLabelText(/Prose essay/), { target: { value: 'Separate prose' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  });

  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.create).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      title: 'Separate article',
      content: 'Separate prose',
      category: 'ideas_and_perspectives',
      authorship: 'by_hiep',
      authorName: 'Hiep Trong',
      commentary: null,
      originalSourceUrl: null,
      tags: [],
      status: 'draft',
    }),
  );
  expect(mocks.articles[0]?.title).toBe('Original article');
});
