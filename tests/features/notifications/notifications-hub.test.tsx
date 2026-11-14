// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotificationDto, NotificationListResponse } from '@/contracts';
import { buildZonedInstant, formatScheduledDate, shiftScheduledDate } from '@/domain/time';
import { BellButton } from '@/features/notifications/BellButton';
import { NotificationsHubView } from '@/features/notifications/NotificationsHubView';
import { FeatureThemeProvider } from '@/ui/FeatureTheme';
import { ToastProvider } from '@/ui/Toast';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
  }),
  usePathname: () => '/notifications',
}));

vi.mock('@/features/transitions/TransitionProvider', () => ({
  useTransitionRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    isTransitioning: false,
  }),
}));

function renderHub(withBell = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <FeatureThemeProvider name="notification">
          <div data-theme="workspace" data-feature-theme="notification">
            {withBell ? <BellButton tone="workspace" /> : null}
            <NotificationsHubView />
          </div>
        </FeatureThemeProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

function createSampleNotifications(): [NotificationDto, NotificationDto, NotificationDto] {
  const todayKey = formatScheduledDate(new Date());
  const yesterdayKey = shiftScheduledDate(todayKey, -1);

  return [
    {
      id: crypto.randomUUID(),
      kind: 'due_soon',
      tagLabel: 'Due soon',
      title: 'Due soon',
      message: '"Review algorithms" is due today.',
      isRead: false,
      createdAt: buildZonedInstant(todayKey, '00:02'),
      timeLeftMs: 5400_000,
      taskId: null,
      targetUrl: '/events?item=alg',
    },
    {
      id: crypto.randomUUID(),
      kind: 'overdue',
      tagLabel: 'Overdue',
      title: 'Overdue',
      message: '"Submit lab draft" was due yesterday.',
      isRead: false,
      createdAt: buildZonedInstant(todayKey, '00:01'),
      timeLeftMs: -3600_000,
      taskId: null,
      targetUrl: '/projects?item=lab',
    },
    {
      id: crypto.randomUUID(),
      kind: 'completed',
      tagLabel: 'Completed',
      title: 'Nicely done',
      message: '"Finish kanji flashcards" is complete.',
      isRead: true,
      createdAt: buildZonedInstant(yesterdayKey, '12:00'),
      timeLeftMs: null,
      taskId: null,
      targetUrl: null,
    },
  ];
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('NotificationsHubView (Epic 04 Sakura Inbox)', () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('groups by date without auto-marking read, syncs BellButton across toggles, supports filters & full-inbox mark-read', async () => {
    let currentItems: NotificationDto[] = createSampleNotifications();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url === '/api/notifications' && (!init?.method || init.method === 'GET')) {
        const body: NotificationListResponse = {
          items: currentItems,
          unreadCount: currentItems.filter((i) => !i.isRead).length,
        };
        return new Response(JSON.stringify(body), { status: 200 });
      }
      const readMatch = url.match(/^\/api\/notifications\/([^/]+)\/(read|unread)$/);
      if (readMatch && init?.method === 'POST') {
        const [, targetId, action] = readMatch;
        const nextRead = action === 'read';
        currentItems = currentItems.map((i) =>
          i.id === targetId ? { ...i, isRead: nextRead } : i,
        );
        return new Response(JSON.stringify({ item: currentItems.find((i) => i.id === targetId) }), {
          status: 200,
        });
      }
      if (url === '/api/notifications/read-all' && init?.method === 'POST') {
        const updatedCount = currentItems.filter((i) => !i.isRead).length;
        currentItems = currentItems.map((i) => ({ ...i, isRead: true }));
        return new Response(JSON.stringify({ ok: true, updatedCount }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: { message: 'Not found' } }), { status: 404 });
    });

    vi.stubGlobal('fetch', fetchMock);

    renderHub(true);

    expect(await screen.findByText('"Review algorithms" is due today.')).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Notifications (2 unread)' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('bell-unread-indicator')).toHaveTextContent('2');

    // Opening /notifications must NOT auto-mark notifications as read
    const postCallsOnOpen = fetchMock.mock.calls.filter(([input, init]) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = (init?.method ?? 'GET').toUpperCase();
      return method === 'POST' && (url.includes('/read-all') || url.endsWith('/read'));
    });
    expect(postCallsOnOpen).toEqual([]);

    // Date-grouped sections (Today, Yesterday) replace read/unread split headings
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Yesterday' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Today',
      'Yesterday',
    ]);
    expect(screen.queryByRole('heading', { name: /Unread dispatches/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Read earlier/i })).not.toBeInTheDocument();

    // Explicit full-inbox mark-all-read button and scope clarification
    const markAllButton = screen.getByRole('button', { name: 'Mark full inbox read' });
    expect(markAllButton).toBeEnabled();
    expect(markAllButton).toHaveAccessibleDescription(
      'Affects full inbox, not only filtered results.',
    );
    expect(screen.getByText('Affects full inbox, not only filtered results.')).toBeInTheDocument();

    // Toggling read checkbox syncs BellButton unread count without navigating
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mark "Due soon" notification as read' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Notifications (1 unread)' })).toBeInTheDocument();
    });
    expect(
      screen.getByRole('checkbox', { name: 'Mark "Due soon" notification as unread' }),
    ).toBeChecked();
    expect(pushMock).not.toHaveBeenCalled();

    // Toggling back to unread restores BellButton count to 2
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Mark "Due soon" notification as unread' }),
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Notifications (2 unread)' })).toBeInTheDocument();
    });
    expect(screen.getByTestId('bell-unread-indicator')).toHaveTextContent('2');
    expect(
      screen.getByRole('checkbox', { name: 'Mark "Due soon" notification as read' }),
    ).not.toBeChecked();
    expect(pushMock).not.toHaveBeenCalled();

    // Search filters across message content and clears back to all notifications
    const searchInput = screen.getByLabelText('Search notifications');
    fireEvent.change(searchInput, { target: { value: 'kanji' } });
    await waitFor(() => {
      expect(screen.queryByText('"Review algorithms" is due today.')).not.toBeInTheDocument();
    });
    expect(screen.getByText('"Finish kanji flashcards" is complete.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(await screen.findByText('"Review algorithms" is due today.')).toBeInTheDocument();

    // Filter by Read status
    fireEvent.click(screen.getByRole('button', { name: /Read\s+1/i }));
    await waitFor(() => {
      expect(screen.queryByText('"Review algorithms" is due today.')).not.toBeInTheDocument();
    });
    expect(screen.getByText('"Finish kanji flashcards" is complete.')).toBeInTheDocument();

    // Filter back to All and filter by Overdue type
    fireEvent.click(screen.getByRole('button', { name: /All\s+3/i }));
    fireEvent.click(screen.getByRole('button', { name: /Overdue\s+1/i }));
    await waitFor(() => {
      expect(screen.queryByText('"Review algorithms" is due today.')).not.toBeInTheDocument();
      expect(screen.getByText('"Submit lab draft" was due yesterday.')).toBeInTheDocument();
    });

    // Search with no matches displays filtered empty state + Reset filters
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(
      await screen.findByRole('heading', { name: 'No matching notifications' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(await screen.findByText('"Review algorithms" is due today.')).toBeInTheDocument();
    expect(screen.getByText('"Submit lab draft" was due yesterday.')).toBeInTheDocument();
    expect(screen.getByText('"Finish kanji flashcards" is complete.')).toBeInTheDocument();

    // Mark full inbox read syncs BellButton to 0 unread while keeping date sections
    fireEvent.click(markAllButton);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
      expect(screen.queryByTestId('bell-unread-indicator')).not.toBeInTheDocument();
    });
    expect(markAllButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /Unread\s+0/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Yesterday' })).toBeInTheDocument();
  });

  it('rolls back optimistic read state and shows error toasts when POST /read or POST /read-all returns HTTP 500', async () => {
    const sampleItems = createSampleNotifications();
    const postReadDeferred = createDeferred<Response>();
    const postReadAllDeferred = createDeferred<Response>();
    let heldGet: ReturnType<typeof createDeferred<void>> | null = null;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url === '/api/notifications' && (!init?.method || init.method === 'GET')) {
          if (heldGet) {
            await heldGet.promise;
          }
          const body: NotificationListResponse = {
            items: sampleItems,
            unreadCount: sampleItems.filter((i) => !i.isRead).length,
          };
          return new Response(JSON.stringify(body), { status: 200 });
        }
        if (/^\/api\/notifications\/[^/]+\/read$/.test(url) && init?.method === 'POST') {
          return postReadDeferred.promise;
        }
        if (url === '/api/notifications/read-all' && init?.method === 'POST') {
          return postReadAllDeferred.promise;
        }
        return new Response(JSON.stringify({ error: { message: 'Not found' } }), { status: 404 });
      }),
    );

    renderHub(true);

    expect(await screen.findByText('"Review algorithms" is due today.')).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Notifications (2 unread)' }),
    ).toBeInTheDocument();

    // 1) Optimistic toggle on single notification followed by HTTP 500 rollback + toast
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mark "Due soon" notification as read' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Notifications (1 unread)' })).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'Mark "Due soon" notification as unread' }),
      ).toBeChecked();
    });

    heldGet = createDeferred<void>();
    postReadDeferred.resolve(
      new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Failed' } }), {
        status: 500,
      }),
    );

    expect(await screen.findByText('Could not update notification status.')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Notifications (2 unread)' })).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'Mark "Due soon" notification as read' }),
      ).not.toBeChecked();
    });
    expect(screen.getByTestId('bell-unread-indicator')).toHaveTextContent('2');

    const releaseFirstGet = heldGet;
    heldGet = null;
    releaseFirstGet.resolve();

    // 2) Optimistic "Mark full inbox read" followed by HTTP 500 rollback + toast
    const markAllButton = screen.getByRole('button', { name: 'Mark full inbox read' });
    fireEvent.click(markAllButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
      expect(screen.queryByTestId('bell-unread-indicator')).not.toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'Mark "Due soon" notification as unread' }),
      ).toBeChecked();
    });

    heldGet = createDeferred<void>();
    postReadAllDeferred.resolve(
      new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Failed' } }), {
        status: 500,
      }),
    );

    expect(await screen.findByText('Could not mark notifications as read.')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Notifications (2 unread)' })).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: 'Mark "Due soon" notification as read' }),
      ).not.toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'Mark "Overdue" notification as read' }),
      ).not.toBeChecked();
    });
    expect(screen.getByTestId('bell-unread-indicator')).toHaveTextContent('2');
    expect(markAllButton).toBeEnabled();

    const releaseSecondGet = heldGet;
    heldGet = null;
    releaseSecondGet.resolve();
  });

  it('renders error retry and global empty states cleanly', async () => {
    let fail = true;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        if (fail) {
          return new Response(JSON.stringify({ error: { message: 'Boom' } }), { status: 500 });
        }
        return new Response(JSON.stringify({ items: [], unreadCount: 0 }), { status: 200 });
      }),
    );

    renderHub();

    expect(await screen.findByText('Could not load notifications.')).toBeInTheDocument();
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'All caught up.' })).toBeInTheDocument();
  });
});
