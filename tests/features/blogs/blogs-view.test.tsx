// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadEditorDraft, makeEditorDraftKey } from '@/client/editor-drafts';
import type { BlogArticle } from '@/contracts/blog';
import { WritingRoomView } from '@/features/blogs/WritingRoomView';
import { TransitionProvider } from '@/features/transitions/TransitionProvider';
import { ToastProvider } from '@/ui/Toast';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  refetch: vi.fn(),
  isLoading: false,
  isError: false,
  articles: [] as BlogArticle[],
  lastQueryArgs: [] as Array<[string | undefined, string | undefined, string | undefined]>,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/blogs',
}));

vi.mock('@/client/queries/blogs', () => ({
  useBlogArticles: (category?: string, authorship?: string, tag?: string) => {
    mocks.lastQueryArgs.push([category, authorship, tag]);
    return {
      data: mocks.isLoading || mocks.isError ? [] : mocks.articles,
      isLoading: mocks.isLoading,
      isError: mocks.isError,
      refetch: mocks.refetch,
    };
  },
  useCreateBlogArticle: () => ({ mutateAsync: mocks.create, isPending: false, isError: false }),
  useUpdateBlogArticle: () => ({ mutateAsync: mocks.update, isPending: false, isError: false }),
}));

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

const SAMPLE_ARTICLE: BlogArticle = {
  id: 'article-1',
  slug: 'woodland-notes',
  title: 'Woodland Notes on Attention',
  subtitle: 'Why calm margins restore deep reading',
  category: 'ideas_and_perspectives',
  authorship: 'saved_from_others',
  authorName: 'Cal Newport',
  originalSourceUrl: 'https://example.org/attention',
  commentary: 'Essential guidance for deep study sessions.',
  readingTimeMinutes: 5,
  publishedAt: '2026-11-10T09:00:00.000Z',
  shortVersion: 'Quiet spaces make long-form synthesis possible.',
  content: [
    'Opening paragraph with **bold insight** and *gentle nuance* plus <script>alert(1)</script>.',
    '### Three Habits',
    '1. **First step:** Clear the desk.\n2. **Second step:** Protect *ninety* quiet minutes.',
    '- **Bullet item:** Keep paper nearby.',
    '> "Attention is the rarest resource."',
  ].join('\n\n'),
  tags: ['Focus', 'Learning'],
  sources: [
    {
      title: 'Deep Work',
      url: 'https://calnewport.com/deep-work/',
      note: 'Attention capital principles.',
    },
  ],
  status: 'published',
};

function renderWritingRoom() {
  return render(
    <ToastProvider>
      <TransitionProvider>
        <WritingRoomView />
      </TransitionProvider>
    </ToastProvider>,
  );
}

describe('WritingRoomView Editorial Woodland Reading Room', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    mocks.isLoading = false;
    mocks.isError = false;
    mocks.articles = [SAMPLE_ARTICLE];
    mocks.lastQueryArgs = [];
    mocks.create.mockReset();
    mocks.update.mockReset();
    mocks.refetch.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders open editorial masthead, decorative overview SVGs, and accessible card button without clickable article role', () => {
    const { container } = renderWritingRoom();

    expect(screen.getByRole('heading', { level: 1, name: 'The Writing Room' })).toBeInTheDocument();

    for (const src of [
      '/visuals/blogs-hub/woodland-cabin.svg',
      '/visuals/blogs-hub/timber-grain-rule.svg',
    ]) {
      const img = container.querySelector(`img[src="${src}"]`);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('alt', '');
      expect(img).toHaveAttribute('aria-hidden', 'true');
    }

    // Article elements must not carry role="button"
    expect(container.querySelector('article[role="button"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Woodland Notes on Attention' })).toBeInTheDocument();
  });

  it('renders skeleton loading, non-blocking Retry on load error, and cabin-lantern empty state', () => {
    mocks.isLoading = true;
    const { unmount } = renderWritingRoom();
    expect(screen.getByLabelText('Loading articles')).toHaveAttribute('aria-busy', 'true');
    unmount();

    mocks.isLoading = false;
    mocks.isError = true;
    renderWritingRoom();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not load the writing room right now.');
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
    cleanup();

    mocks.isError = false;
    mocks.articles = [];
    const { container } = renderWritingRoom();
    expect(screen.getByText('No articles match your current criteria.')).toBeInTheDocument();
    const lanternImg = container.querySelector('img[src="/visuals/blogs-hub/cabin-lantern.svg"]');
    expect(lanternImg).toBeInTheDocument();
    expect(lanternImg).toHaveAttribute('alt', '');
    expect(lanternImg).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports accessible Chip filters with aria-pressed for category, authorship, and topic tags', () => {
    renderWritingRoom();

    const personalChip = screen.getByRole('button', { name: 'Personal stories' });
    expect(personalChip).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(personalChip);
    expect(personalChip).toHaveAttribute('aria-pressed', 'true');

    const byHiepChip = screen.getByRole('button', { name: 'By Hiep' });
    fireEvent.click(byHiepChip);
    expect(byHiepChip).toHaveAttribute('aria-pressed', 'true');

    const focusChip = screen.getByRole('button', { name: 'Focus' });
    fireEvent.click(focusChip);
    expect(focusChip).toHaveAttribute('aria-pressed', 'true');

    expect(mocks.lastQueryArgs.at(-1)).toEqual(['personal_stories', 'by_hiep', 'Focus']);
  });

  it('renders Reader Mode with ordered lists, safe inline bold/italic markdown, escaped HTML, and decorative reader SVGs', () => {
    const { container } = renderWritingRoom();

    fireEvent.click(screen.getByRole('button', { name: 'Woodland Notes on Attention' }));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Woodland Notes on Attention' }),
    ).toBeInTheDocument();

    // Decorative Reader Mode SVGs
    for (const src of [
      '/visuals/blogs-hub/falling-maple-pair.svg',
      '/visuals/blogs-hub/timber-grain-rule.svg',
    ]) {
      const img = container.querySelector(`img[src="${src}"]`);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('alt', '');
      expect(img).toHaveAttribute('aria-hidden', 'true');
    }

    // Ordered list <ol> + inline <strong> / <em> + literal escaped script text (no XSS)
    const orderedList = container.querySelector('ol');
    expect(orderedList).toBeInTheDocument();
    expect(orderedList?.querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByText('bold insight').tagName).toBe('STRONG');
    expect(screen.getByText('gentle nuance').tagName).toBe('EM');
    expect(screen.getByText('First step:').tagName).toBe('STRONG');
    expect(screen.getByText('ninety').tagName).toBe('EM');
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText(/<script>alert\(1\)<\/script>/)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Original source' })).toHaveAttribute(
      'href',
      'https://example.org/attention',
    );
  });

  it('provides Writing Desk LargeEditorDialog with typewriter art, local crash-recovery draft, and double-submit guard', async () => {
    const firstRender = renderWritingRoom();
    fireEvent.click(screen.getByRole('button', { name: 'Write new piece' }));

    const dialog = screen.getByRole('dialog', { name: 'Draft a new piece' });
    const typewriterImg = dialog.querySelector(
      'img[src="/visuals/blogs-hub/woodland-typewriter.svg"]',
    );
    expect(typewriterImg).toBeInTheDocument();
    expect(typewriterImg).toHaveAttribute('alt', '');
    expect(typewriterImg).toHaveAttribute('aria-hidden', 'true');

    fireEvent.change(within(dialog).getByLabelText('Title'), {
      target: { value: 'Recovered Essay' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Prose essay/), {
      target: { value: 'Draft paragraph saved locally.' },
    });

    // Save local crash-recovery draft via close prompt
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      screen.getByRole('dialog', { name: 'Save changes before closing?' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save draft and close' }));
    expect(window.localStorage.getItem(makeEditorDraftKey('blog-article', null))).not.toBeNull();

    // Remount and resume local draft
    firstRender.unmount();
    renderWritingRoom();
    fireEvent.click(screen.getByRole('button', { name: 'Write new piece' }));
    expect(screen.getByText(/Local draft saved/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume draft' }));
    expect(screen.getByLabelText('Title')).toHaveValue('Recovered Essay');
    expect(screen.getByLabelText(/Prose essay/)).toHaveValue('Draft paragraph saved locally.');

    // Double-submit guard on Publish to Writing Room
    let resolvePublish!: (value: BlogArticle) => void;
    mocks.create.mockImplementationOnce(
      () =>
        new Promise<BlogArticle>((resolve) => {
          resolvePublish = resolve;
        }),
    );
    const publishBtn = screen.getByRole('button', { name: 'Publish to Writing Room' });
    fireEvent.click(publishBtn);
    fireEvent.click(screen.getByRole('button', { name: /Saving|Publish to Writing Room/ }));
    expect(mocks.create).toHaveBeenCalledTimes(1);

    resolvePublish({ ...SAMPLE_ARTICLE, id: 'published-1', title: 'Recovered Essay' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Draft a new piece' })).toBeNull(),
    );
    expect(loadEditorDraft('blog-article', null)).toEqual({ ok: true, draft: null });
  });

  it('uses WCAG AA contrast tokens and design-scale CSS classes without legacy modal styles', () => {
    const css = readFileSync('src/features/blogs/writing-room.module.css', 'utf8');
    expect(css).toContain('color: var(--ws-accent);');
    expect(css).toContain('color: var(--text-notif-completed);');
    expect(css).not.toContain('--text-xs');
    expect(css).not.toContain('--text-sm');
    expect(css).not.toContain('--text-2xl');
    expect(css).not.toContain('.modalOverlay');
    expect(css).not.toContain('.editorModal');
  });
});
