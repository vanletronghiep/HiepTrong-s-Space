// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientApiError } from '@/client/api-client';
import { loadEditorDraft, makeEditorDraftKey, saveEditorDraft } from '@/client/editor-drafts';
import type { EventItem } from '@/contracts/event';
import type { EventDraftRecord, SaveEventDraftInput } from '@/contracts/event-draft';
import { EventsView } from '@/features/events/EventsView';
import styles from '@/features/events/events.module.css';
import { TransitionProvider } from '@/features/transitions/TransitionProvider';
import { ToastProvider } from '@/ui/Toast';

const state = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  return {
    version: 0,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state.version,
    notify: () => {
      state.version += 1;
      for (const listener of listeners) {
        listener();
      }
    },
    update: vi.fn(),
    create: vi.fn(),
    del: vi.fn(),
    saveDraft: vi.fn(),
    updateDraft: vi.fn(),
    deleteDraft: vi.fn(),
    publishDraft: vi.fn(),
    events: [] as EventItem[],
    drafts: [] as EventDraftRecord[],
  };
});

vi.mock('@/ui/use-item-anchor', () => ({ useItemAnchor: vi.fn() }));

vi.mock('@/client/queries/events', () => ({
  eventKeys: {
    all: ['events'] as const,
    list: () => ['events', 'list'] as const,
    detail: (id: string) => ['events', 'detail', id] as const,
  },
  useEvents: () => {
    useSyncExternalStore(state.subscribe, state.getSnapshot, state.getSnapshot);
    return {
      data: state.events,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
  },
  useUpdateEvent: () => ({ mutateAsync: state.update }),
  useCreateEvent: () => ({ mutateAsync: state.create }),
  useDeleteEvent: () => ({ mutate: state.del }),
}));

vi.mock('@/client/queries/event-drafts', () => ({
  eventDraftKeys: {
    all: ['event-drafts'] as const,
    list: () => ['event-drafts', 'list'] as const,
    detail: (id: string) => ['event-drafts', 'detail', id] as const,
  },
  useEventDrafts: () => {
    useSyncExternalStore(state.subscribe, state.getSnapshot, state.getSnapshot);
    return {
      data: state.drafts,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
  },
  useSaveEventDraft: () => ({ mutateAsync: state.saveDraft, isPending: false }),
  useUpdateEventDraft: () => ({ mutateAsync: state.updateDraft, isPending: false }),
  useDeleteEventDraft: () => ({ mutateAsync: state.deleteDraft, isPending: false }),
  usePublishEventDraft: () => ({ mutateAsync: state.publishDraft, isPending: false }),
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

const sampleDraft = (overrides: Partial<EventDraftRecord> = {}): EventDraftRecord => ({
  id: 'draft-1',
  sourceEventId: null,
  sourceUpdatedAt: null,
  values: {
    title: 'Draft seminar',
    category: 'school',
    date: '2026-11-28',
    time: '14:00',
    location: '',
    isOnline: false,
    isExam: false,
    notes: '',
  },
  importKey: null,
  createdAt: '2026-11-12T08:00:00.000Z',
  updatedAt: '2026-11-12T08:00:00.000Z',
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
    state.drafts = [];
    state.update.mockReset();
    state.create.mockReset();
    state.del.mockReset();

    state.saveDraft.mockReset();
    state.saveDraft.mockImplementation(async (input: SaveEventDraftInput) => {
      const existing =
        (input.importKey && state.drafts.find((d) => d.importKey === input.importKey)) ||
        (input.sourceEventId &&
          state.drafts.find((d) => d.sourceEventId === input.sourceEventId)) ||
        (input.id && state.drafts.find((d) => d.id === input.id)) ||
        undefined;
      const nowIso = '2026-11-13T10:00:00.000Z';
      if (existing) {
        const updated: EventDraftRecord = {
          ...existing,
          sourceUpdatedAt:
            input.sourceUpdatedAt !== undefined ? input.sourceUpdatedAt : existing.sourceUpdatedAt,
          values: {
            title: input.values.title ?? '',
            category: input.values.category ?? 'school',
            date: input.values.date ?? '',
            time: input.values.time ?? '',
            location: input.values.location ?? '',
            isOnline: input.values.isOnline ?? false,
            isExam: input.values.isExam ?? false,
            notes: input.values.notes ?? '',
          },
          updatedAt: nowIso,
        };
        state.drafts = state.drafts.map((d) => (d.id === existing.id ? updated : d));
        state.notify();
        return { item: updated, created: false };
      }
      const created = sampleDraft({
        id: input.id ?? `draft-${state.drafts.length + 1}`,
        sourceEventId: input.sourceEventId ?? null,
        sourceUpdatedAt: input.sourceUpdatedAt ?? null,
        importKey: input.importKey ?? null,
        values: {
          title: input.values.title ?? '',
          category: input.values.category ?? 'school',
          date: input.values.date ?? '',
          time: input.values.time ?? '',
          location: input.values.location ?? '',
          isOnline: input.values.isOnline ?? false,
          isExam: input.values.isExam ?? false,
          notes: input.values.notes ?? '',
        },
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      state.drafts = [created, ...state.drafts];
      state.notify();
      return { item: created, created: true };
    });

    state.updateDraft.mockReset();
    state.deleteDraft.mockReset();
    state.deleteDraft.mockImplementation(async (id: string) => {
      state.drafts = state.drafts.filter((d) => d.id !== id);
      state.notify();
    });

    state.publishDraft.mockReset();
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
    expect(within(editor).getByRole('button', { name: 'Apply changes' })).toBeInTheDocument();
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

  it('supports Month filtering, Week navigation, bounded Past scroller only for > 3 events, and 24h separated Date/Time + formatted notes', () => {
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
      startAt: '2026-11-20T19:00:00+07:00',
      endAt: '2026-11-20T21:00:00+07:00',
      category: 'meeting',
      description: 'Bring **laptop**\n- Test slides',
      notes: 'Bring **laptop**\n- Test slides',
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

    // Agenda card renders extracted plain text without raw markdown markers and 24h time
    const critiqueCard = screen.getByRole('button', { name: /Lab critique/ });
    expect(within(critiqueCard).getByText(/Bring laptop/)).toBeInTheDocument();
    expect(within(critiqueCard).queryByText(/\*\*laptop\*\*/)).toBeNull();
    expect(within(critiqueCard).getByText(/19:00/)).toBeInTheDocument();

    // Selecting event separates Date and Time into distinct detail rows and renders formatted notes once
    fireEvent.click(critiqueCard);
    const supportAside = screen.getByRole('complementary', {
      name: 'Supporting calendar and details',
    });
    expect(within(supportAside).getByText('Date')).toBeInTheDocument();
    expect(within(supportAside).getByText('Fri, 20 Nov 2026')).toBeInTheDocument();
    expect(within(supportAside).getByText('Time')).toBeInTheDocument();
    expect(within(supportAside).getByText(/19:00 – 21:00/)).toBeInTheDocument();
    expect(within(supportAside).queryByText(/\b(AM|PM)\b/i)).toBeNull();
    expect(within(supportAside).getByText('laptop').tagName).toBe('STRONG');
    expect(within(supportAside).getByText('Test slides')).toBeInTheDocument();
    expect(within(supportAside).queryByText(/Bring \*\*laptop\*\*/)).toBeNull();

    // Close detail pane back to Month calendar and filter Nov 20
    fireEvent.click(within(supportAside).getByRole('button', { name: 'Close event details' }));
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

    // Past tab with <= 3 events renders newest-first without bounded scroller class
    fireEvent.click(screen.getByRole('tab', { name: 'Past' }));
    const shortPastList = screen.getByRole('list', { name: 'Events agenda' });
    expect(shortPastList).not.toHaveClass(styles.pastEventsScroller!);
    const pastHeadings = within(shortPastList)
      .getAllByRole('heading', { level: 3 })
      .map((node) => node.textContent);
    expect(pastHeadings).toEqual(['Past midterm', 'Past workshop']);

    // Adding more past events (> 3) activates bounded scroller container
    state.events = [
      ...state.events,
      sampleFutureEvent({
        id: 'past-3',
        title: 'Past quiz',
        startAt: '2026-11-01T08:00:00+07:00',
      }),
      sampleFutureEvent({
        id: 'past-4',
        title: 'Past orientation',
        startAt: '2026-10-28T08:00:00+07:00',
      }),
    ];
    act(() => {
      state.notify();
    });
    expect(screen.getByRole('list', { name: 'Events agenda' })).toHaveClass(
      styles.pastEventsScroller!,
    );

    // Week calendar tab shows Nov 16 - Nov 22 around Nov 20 and navigates weeks
    fireEvent.click(within(supportAside).getByRole('button', { name: /Nov 20, 2026/ }));
    fireEvent.click(screen.getByRole('tab', { name: 'Week calendar' }));
    expect(screen.getByText(/Nov 16.*Nov 22/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(screen.getByText(/Nov 23.*Nov 29/)).toBeInTheDocument();
  });

  it('persists server drafts via Save draft and close, keeps failed saves open, surfaces Drafts dashboard statuses, and resolves stale conflicts', async () => {
    const existing = sampleFutureEvent({
      id: 'evt-existing',
      title: 'Systems Seminar',
      updatedAt: '2026-11-12T10:00:00.000Z',
    });
    state.events = [existing];

    renderEvents();

    // Untouched New event closes without prompting
    fireEvent.click(screen.getByRole('button', { name: 'New event' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close event editor' }));
    expect(screen.queryByRole('dialog', { name: 'Save changes before closing?' })).toBeNull();

    // Edited New event failing Save draft and close keeps incomplete edits open inside editor
    fireEvent.click(screen.getByRole('button', { name: 'New event' }));
    const createDialog = screen.getByRole('dialog', { name: 'New event' });
    fireEvent.change(within(createDialog).getByLabelText('Title'), {
      target: { value: 'Draft Ocean seminar' },
    });
    state.saveDraft.mockRejectedValueOnce(new Error('Draft service unavailable'));
    fireEvent.click(within(createDialog).getByRole('button', { name: 'Close event editor' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save draft and close' }));
    });
    await waitFor(() =>
      expect(screen.getByText('Draft service unavailable')).toBeInTheDocument(),
    );
    expect(screen.getByRole('dialog', { name: 'New event' })).toBeInTheDocument();
    expect(within(createDialog).getByLabelText('Title')).toHaveValue('Draft Ocean seminar');

    // Retrying Save draft and close persists draft on server and updates Drafts badge
    fireEvent.click(within(createDialog).getByRole('button', { name: 'Close event editor' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save draft and close' }));
    });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'New event' })).toBeNull());
    expect(screen.getByRole('tab', { name: /Drafts/i })).toHaveTextContent('1');

    // Add incomplete new draft, stale edit draft, and missing-source edit draft
    state.drafts = [
      ...state.drafts,
      sampleDraft({
        id: 'draft-blank',
        values: {
          title: '   ',
          category: 'deadline',
          date: '',
          time: '',
          location: '',
          isOnline: false,
          isExam: false,
          notes: 'Need **rubric**',
        },
      }),
      sampleDraft({
        id: 'draft-stale',
        sourceEventId: existing.id,
        sourceUpdatedAt: '2026-11-10T00:00:00.000Z',
        values: {
          title: 'Systems Seminar (Draft)',
          category: 'meeting',
          date: '2026-11-20',
          time: '15:00',
          location: 'Room 201',
          isOnline: false,
          isExam: false,
          notes: '',
        },
      }),
      sampleDraft({
        id: 'draft-missing',
        sourceEventId: 'deleted-id',
        sourceUpdatedAt: '2026-11-01T00:00:00.000Z',
        values: {
          title: 'Orphaned update',
          category: 'school',
          date: '2026-11-22',
          time: '11:00',
          location: '',
          isOnline: false,
          isExam: false,
          notes: '',
        },
      }),
    ];
    act(() => {
      state.notify();
    });

    fireEvent.click(screen.getByRole('tab', { name: /Drafts/i }));
    const draftsList = screen.getByRole('list', { name: 'Saved event drafts' });
    expect(within(draftsList).getByRole('heading', { name: 'Untitled event' })).toBeInTheDocument();
    expect(within(draftsList).getByText('Need rubric')).toBeInTheDocument();
    expect(within(draftsList).getByText('Stale — source changed')).toBeInTheDocument();
    expect(within(draftsList).getByText('Original event missing')).toBeInTheDocument();

    // Clicking Add to schedule on incomplete draft opens the editor cleanly with validation prompt
    const blankCard = within(draftsList)
      .getByRole('heading', { name: 'Untitled event' })
      .closest('li')!;
    fireEvent.click(within(blankCard).getByRole('button', { name: 'Add to schedule' }));
    const incompleteEditor = screen.getByRole('dialog', { name: 'Resume event draft' });
    expect(
      within(incompleteEditor).getByText(/Complete title, date \(YYYY-MM-DD\), and 24-hour time/),
    ).toBeInTheDocument();
    fireEvent.click(within(incompleteEditor).getByRole('button', { name: 'Close event editor' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Resume event draft' })).toBeNull(),
    );

    // Stale edit draft returns 409 CONFLICT and requires explicit Overwrite and apply confirmation
    state.publishDraft.mockRejectedValueOnce(
      new ClientApiError({
        code: 'CONFLICT',
        httpStatus: 409,
        message: 'Event changed since this draft was saved.',
      }),
    );
    const staleCard = within(draftsList)
      .getByRole('heading', { name: 'Systems Seminar (Draft)' })
      .closest('li')!;
    await act(async () => {
      fireEvent.click(within(staleCard).getByRole('button', { name: 'Apply changes' }));
    });
    const conflictEditor = await screen.findByRole('dialog', { name: 'Edit event' });
    expect(
      within(conflictEditor).getByText('Event changed since this draft was saved.'),
    ).toBeInTheDocument();
    const overwriteBtn = within(conflictEditor).getByRole('button', {
      name: 'Overwrite and apply',
    });

    const overwrittenEvent = {
      ...existing,
      title: 'Systems Seminar (Draft)',
      updatedAt: '2026-11-15T12:00:00.000Z',
    };
    state.publishDraft.mockImplementationOnce(
      async ({ id, forceOverwrite }: { id: string; forceOverwrite?: boolean }) => {
        expect(forceOverwrite).toBe(true);
        state.events = state.events.map((e) => (e.id === existing.id ? overwrittenEvent : e));
        state.drafts = state.drafts.filter((d) => d.id !== id);
        state.notify();
        return { event: overwrittenEvent, alreadyPublished: false, mode: 'update' as const };
      },
    );
    await act(async () => {
      fireEvent.click(overwriteBtn);
    });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Edit event' })).toBeNull());

    // Delete missing draft cleanly
    fireEvent.click(screen.getByRole('tab', { name: /Drafts/i }));
    const missingCard = screen
      .getByRole('heading', { name: 'Orphaned update' })
      .closest('li')!;
    await act(async () => {
      fireEvent.click(within(missingCard).getByRole('button', { name: 'Delete' }));
    });
    expect(state.deleteDraft).toHaveBeenCalledWith('draft-missing');
  });

  it('imports browser-stored event drafts idempotently into Drafts while retaining failed copies and leaving other features untouched', async () => {
    saveEditorDraft({
      formId: 'event',
      recordId: null,
      recordUpdatedAt: null,
      values: {
        title: 'Legacy browser new',
        category: 'school',
        date: '2026-12-01',
        time: '10:00',
        location: '',
        isOnline: false,
        isExam: false,
        notes: 'Browser note',
      },
    });
    saveEditorDraft({
      formId: 'event',
      recordId: 'evt-legacy',
      recordUpdatedAt: '2026-11-01T00:00:00.000Z',
      values: {
        title: 'Legacy browser edit',
        category: 'meeting',
        date: '2026-12-02',
        time: '15:30',
        location: 'Room 12',
        isOnline: false,
        isExam: false,
        notes: '',
      },
    });
    saveEditorDraft({
      formId: 'milestone',
      recordId: null,
      recordUpdatedAt: null,
      values: { title: 'Keep milestone draft' },
    });
    saveEditorDraft({
      formId: 'blog',
      recordId: 'blog-1',
      recordUpdatedAt: null,
      values: { title: 'Keep blog draft' },
    });

    renderEvents();
    fireEvent.click(screen.getByRole('tab', { name: /Drafts/i }));

    expect(screen.getByText('2 event drafts found in browser storage.')).toBeInTheDocument();

    // Fail the second draft import to confirm only successful browser copies are cleared
    const defaultSave = state.saveDraft.getMockImplementation()!;
    state.saveDraft
      .mockImplementationOnce(defaultSave)
      .mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Import browser drafts' }));
    });

    await waitFor(() =>
      expect(screen.getByText(/Imported 1 browser draft\(s\); 1 failed/)).toBeInTheDocument(),
    );
    expect(screen.getByText('1 event draft found in browser storage.')).toBeInTheDocument();

    // Non-event feature drafts stay completely untouched
    expect(loadEditorDraft('milestone', null)).toMatchObject({
      ok: true,
      draft: { values: { title: 'Keep milestone draft' } },
    });
    expect(loadEditorDraft('blog', 'blog-1')).toMatchObject({
      ok: true,
      draft: { values: { title: 'Keep blog draft' } },
    });

    // Retry clears the remaining browser event draft with deterministic importKey
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Import browser drafts' }));
    });
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Browser draft import' })).toBeNull(),
    );
    expect(window.localStorage.getItem(makeEditorDraftKey('event', null))).toBeNull();
    expect(window.localStorage.getItem(makeEditorDraftKey('event', 'evt-legacy'))).toBeNull();
    expect(state.drafts.map((d) => d.importKey)).toEqual(
      expect.arrayContaining([
        'browser:event:new',
        expect.stringMatching(/^browser:event:edit:evt-legacy:/),
      ]),
    );
  });

  it('uses Milestone 5 shared editor controls and 24-hour midnight submission with Add to schedule', async () => {
    renderEvents();

    fireEvent.click(screen.getByRole('button', { name: 'New event' }));
    const dialog = screen.getByRole('dialog', { name: 'New event' });

    expect(within(dialog).getByRole('button', { name: 'Add to schedule' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Bullet list' })).toBeInTheDocument();
    expect(
      within(dialog).getByRole('textbox', { name: 'Notes & instructions' }),
    ).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText('Title'), {
      target: { value: 'Midnight check-in' },
    });

    // SelectField category -> Exam
    fireEvent.click(within(dialog).getByRole('button', { name: /Category/i }));
    const listbox = screen.getByRole('listbox');
    fireEvent.click(within(listbox).getByRole('option', { name: 'Exam' }));

    // DatePickerField (mode="iso") + TimeFieldControl (24h midnight)
    fireEvent.change(within(dialog).getByLabelText('Date'), {
      target: { value: '2026-11-24' },
    });
    fireEvent.change(within(dialog).getByLabelText('Time'), {
      target: { value: '00:15' },
    });

    // Checkbox controls
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Online meeting' }));
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Mark as examination' }));

    const createdEvent = sampleFutureEvent({
      id: 'created-midnight',
      title: 'Midnight check-in',
      category: 'exam',
      startAt: '2026-11-23T17:15:00.000Z',
      locationType: 'online',
      isExam: true,
      description: null,
    });
    state.create.mockResolvedValueOnce(createdEvent);

    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Add to schedule' }));
    });

    await waitFor(() =>
      expect(state.create).toHaveBeenCalledWith({
        title: 'Midnight check-in',
        description: null,
        category: 'exam',
        startAt: '2026-11-23T17:15:00.000Z',
        endAt: null,
        locationType: 'online',
        location: null,
        url: null,
        isExam: true,
        notes: null,
      }),
    );
  });
});
