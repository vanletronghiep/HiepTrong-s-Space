// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadEditorDraft, makeEditorDraftKey, saveEditorDraft } from '@/client/editor-drafts';
import type { EventItem } from '@/contracts/event';
import { EventsView } from '@/features/events/EventsView';
import { TransitionProvider } from '@/features/transitions/TransitionProvider';
import { ToastProvider } from '@/ui/Toast';

const state = vi.hoisted(() => ({
  update: vi.fn(),
  create: vi.fn(),
  del: vi.fn(),
  events: [] as EventItem[],
}));

vi.mock('@/ui/use-item-anchor', () => ({ useItemAnchor: vi.fn() }));
vi.mock('@/client/queries/events', () => ({
  useEvents: () => ({
    data: state.events,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useUpdateEvent: () => ({ mutateAsync: state.update }),
  useCreateEvent: () => ({ mutateAsync: state.create }),
  useDeleteEvent: () => ({ mutate: state.del }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/events',
}));

function renderEvents() {
  return render(
    <ToastProvider>
      <TransitionProvider>
        <EventsView />
      </TransitionProvider>
    </ToastProvider>,
  );
}

const sampleFutureEvent = (overrides: Partial<EventItem> = {}): EventItem => ({
  id: 'meeting',
  title: 'Project review',
  category: 'meeting',
  startAt: '2026-11-20T09:00:00+07:00',
  endAt: null,
  description: 'Description',
  notes: null,
  location: null,
  locationType: 'in_person',
  url: 'https://example.com',
  isExam: false,
  preparationTaskId: null,
  recurrence: null,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-10T00:00:00.000Z',
  ...overrides,
});

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

describe('EventsView production redesign workflows', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    state.events = [];
    state.update.mockReset();
    state.create.mockReset();
    state.del.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('retains entered values on failure, guards repeated saves, refreshes inline desktop details, and preserves unexposed fields', async () => {
    const event = sampleFutureEvent();
    state.events = [event];
    state.update.mockRejectedValueOnce(new Error('Save failed'));

    renderEvents();

    fireEvent.click(screen.getByRole('button', { name: /Project review/ }));
    const supportAside = screen.getByRole('complementary', {
      name: 'Supporting calendar and details',
    });
    expect(within(supportAside).getByRole('heading', { name: 'Project review' })).toBeInTheDocument();

    fireEvent.click(within(supportAside).getByRole('button', { name: 'Edit event' }));
    const editor = screen.getByRole('dialog', { name: 'Edit event' });
    const title = within(editor).getByLabelText('Title');
    expect(title).toHaveValue('Project review');

    fireEvent.change(title, { target: { value: 'Updated review' } });
    fireEvent.submit(title.closest('form')!);
    await within(editor).findByText('Save failed');
    expect(title).toHaveValue('Updated review');
    expect(state.update).toHaveBeenLastCalledWith({
      id: event.id,
      patch: { title: 'Updated review' },
    });

    let resolve!: (saved: EventItem) => void;
    state.update.mockImplementationOnce(
      () =>
        new Promise<EventItem>((done) => {
          resolve = done;
        }),
    );
    fireEvent.submit(title.closest('form')!);
    fireEvent.submit(title.closest('form')!);
    expect(state.update).toHaveBeenCalledTimes(2);

    resolve({ ...event, title: 'Updated review', updatedAt: '2026-11-13T12:00:00.000Z' });
    await waitFor(() =>
      expect(
        within(supportAside).getByRole('heading', { name: 'Updated review' }),
      ).toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Edit event' })).toBeNull());
    expect(within(supportAside).getByText('https://example.com')).toBeInTheDocument();
  });

  it('supports Month date filtering, Upcoming reset, Past view ordering, and coordinated Week navigation', () => {
    const pastOlder = sampleFutureEvent({
      id: 'past-old',
      title: 'Past workshop',
      startAt: '2026-11-02T09:00:00+07:00',
      category: 'school',
    });
    const pastRecent = sampleFutureEvent({
      id: 'past-new',
      title: 'Past midterm',
      startAt: '2026-11-10T09:00:00+07:00',
      category: 'exam',
      isExam: true,
    });
    const day20 = sampleFutureEvent({
      id: 'nov-20',
      title: 'Lab critique',
      startAt: '2026-11-20T14:00:00+07:00',
      category: 'meeting',
    });
    const day25 = sampleFutureEvent({
      id: 'nov-25',
      title: 'Algorithms exam',
      startAt: '2026-11-25T08:30:00+07:00',
      category: 'exam',
      isExam: true,
    });
    state.events = [pastOlder, pastRecent, day20, day25];

    renderEvents();

    // Filter agenda via Month calendar day button for Nov 20
    const supportAside = screen.getByRole('complementary', {
      name: 'Supporting calendar and details',
    });
    fireEvent.click(within(supportAside).getByRole('button', { name: /Nov 20, 2026/ }));
    expect(screen.getByText(/Showing events for .*Nov 20, 2026/)).toBeInTheDocument();
    const agendaList = screen.getByRole('list', { name: 'Events agenda' });
    expect(within(agendaList).getByRole('button', { name: /Lab critique/ })).toBeInTheDocument();
    expect(within(agendaList).queryByRole('button', { name: /Algorithms exam/ })).toBeNull();

    // Reset via Upcoming (show all)
    fireEvent.click(screen.getByRole('button', { name: 'Upcoming (show all)' }));
    expect(
      within(screen.getByRole('list', { name: 'Events agenda' })).getByRole('button', {
        name: /Algorithms exam/,
      }),
    ).toBeInTheDocument();

    // Past tab shows past events newest-first
    fireEvent.click(screen.getByRole('tab', { name: 'Past' }));
    const pastHeadings = within(screen.getByRole('list', { name: 'Events agenda' }))
      .getAllByRole('heading', { level: 3 })
      .map((node) => node.textContent);
    expect(pastHeadings).toEqual(['Past midterm', 'Past workshop']);

    // Week calendar tab shows Nov 16 - Nov 22 around Nov 20 and navigates weeks
    fireEvent.click(within(supportAside).getByRole('button', { name: /Nov 20, 2026/ }));
    fireEvent.click(screen.getByRole('tab', { name: 'Week calendar' }));
    expect(screen.getByText(/Nov 16.*Nov 22/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(screen.getByText(/Nov 23.*Nov 29/)).toBeInTheDocument();
  });

  it('persists explicit local drafts across remounts, clears on create/delete, and surfaces orphaned edit drafts without recreation', async () => {
    const existing = sampleFutureEvent({ id: 'evt-del', title: 'Disappearing talk' });
    state.events = [existing];

    // Seed an orphan draft for an absent record alongside testing live drafts
    saveEditorDraft({
      formId: 'event',
      recordId: 'orphan-1',
      recordUpdatedAt: null,
      values: {
        title: 'Deleted record draft',
        category: 'school',
        date: '2026-11-28',
        time: '10:00',
        location: '',
        isOnline: false,
        isExam: false,
        notes: 'Keep safely',
      },
    });

    const firstRender = renderEvents();
    expect(
      screen.getByText(/1 saved local edit draft refers to an event that is no longer in your schedule/),
    ).toBeInTheDocument();
    expect(state.create).not.toHaveBeenCalled();

    // New event untouched closes immediately; edited prompts 3 choices and saves draft cleanly
    fireEvent.click(screen.getByRole('button', { name: 'New event' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close event editor' }));
    expect(screen.queryByRole('dialog', { name: 'Save changes before closing?' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'New event' }));
    const dialog = screen.getByRole('dialog', { name: 'New event' });
    fireEvent.change(within(dialog).getByLabelText('Title'), {
      target: { value: 'Draft Ocean seminar' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close event editor' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save draft and close' }));

    expect(window.localStorage.getItem(makeEditorDraftKey('event', null))).not.toBeNull();

    // Unmount and remount: New event offers Resume draft and restores input
    firstRender.unmount();
    renderEvents();

    fireEvent.click(screen.getByRole('button', { name: 'New event' }));
    expect(screen.getByText(/Local draft saved/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume draft' }));
    expect(screen.getByLabelText('Title')).toHaveValue('Draft Ocean seminar');

    // Creating consumes and clears the new-event draft
    state.create.mockResolvedValueOnce(
      sampleFutureEvent({ id: 'created-1', title: 'Draft Ocean seminar' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }));
    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));
    expect(loadEditorDraft('event', null)).toEqual({ ok: true, draft: null });

    // Deleting an event removes its edit draft
    saveEditorDraft({
      formId: 'event',
      recordId: existing.id,
      recordUpdatedAt: existing.updatedAt,
      values: {
        title: 'Edited talk',
        category: 'meeting',
        date: '2026-11-20',
        time: '09:00',
        location: '',
        isOnline: false,
        isExam: false,
        notes: '',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /Disappearing talk/ }));
    state.del.mockImplementationOnce((_id, options?: { onSuccess?: () => void }) => {
      options?.onSuccess?.();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Delete event' }));
    expect(loadEditorDraft('event', existing.id)).toEqual({ ok: true, draft: null });

    // User can discard orphaned draft explicitly
    fireEvent.click(screen.getByRole('button', { name: 'Discard missing drafts' }));
    expect(loadEditorDraft('event', 'orphan-1')).toEqual({ ok: true, draft: null });
  });
});
