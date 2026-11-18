// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventItemSchema, type EventItem, type EventItemInput } from '@/contracts/event';
import type { EventDraftRecord } from '@/contracts/event-draft';
import { blankEditorValues } from '@/domain/event-editor-values';
import { buildClassSchedule } from '@/domain/event-occurrence';
import { buildZonedInstant } from '@/domain/time';
import { EventsView } from '@/features/events/EventsView';
import { TransitionProvider } from '@/features/transitions/TransitionProvider';
import { ToastProvider } from '@/ui/Toast';

const state = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  return {
    version: 0,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state.version,
    notify: () => {
      state.version += 1;
      for (const listener of listeners) listener();
    },
    create: vi.fn(),
    update: vi.fn(),
    del: vi.fn(),
    mutateOccurrence: vi.fn(),
    saveDraft: vi.fn(),
    deleteDraft: vi.fn(),
    publishDraft: vi.fn(),
    events: [] as EventItem[],
    drafts: [] as EventDraftRecord[],
  };
});

vi.mock('@/ui/use-item-anchor', () => ({ useItemAnchor: vi.fn() }));

vi.mock('@/client/queries/events', async () => {
  const { listOccurrencesInRange } = await import('@/domain/event-occurrence');
  return {
    eventKeys: { all: ['events'] as const },
    useEvents: () => {
      useSyncExternalStore(state.subscribe, state.getSnapshot, state.getSnapshot);
      return { data: state.events, isLoading: false, isError: false, refetch: vi.fn() };
    },
    useEventOccurrenceWindow: (from: string, to: string) => {
      useSyncExternalStore(state.subscribe, state.getSnapshot, state.getSnapshot);
      return {
        occurrences: listOccurrencesInRange(state.events, from, to),
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      };
    },
    useCreateEvent: () => ({ mutateAsync: state.create, isPending: false }),
    useUpdateEvent: () => ({ mutateAsync: state.update, isPending: false }),
    useDeleteEvent: () => ({ mutate: state.del, isPending: false }),
    useMutateOccurrence: () => ({ mutateAsync: state.mutateOccurrence, isPending: false }),
  };
});

vi.mock('@/client/queries/event-drafts', () => ({
  eventDraftKeys: { all: ['event-drafts'] as const },
  useEventDrafts: () => {
    useSyncExternalStore(state.subscribe, state.getSnapshot, state.getSnapshot);
    return { data: state.drafts, isLoading: false, isError: false, refetch: vi.fn() };
  },
  useSaveEventDraft: () => ({ mutateAsync: state.saveDraft, isPending: false }),
  useDeleteEventDraft: () => ({ mutateAsync: state.deleteDraft, isPending: false }),
  usePublishEventDraft: () => ({ mutateAsync: state.publishDraft, isPending: false }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/events',
}));

const NOW = new Date('2026-11-17T03:00:00.000Z'); // Tue 17 Nov 2026, 10:00 Saigon

function event(input: Partial<EventItemInput> & { id: string }): EventItem {
  return eventItemSchema.parse({
    title: input.id,
    category: 'meeting',
    startAt: '2026-11-20T09:00:00+07:00',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...input,
  });
}

function weeklyClass(id: string, title: string, date: string, start = '07:30', end = '09:30') {
  const schedule = buildClassSchedule(
    {
      title,
      startAt: buildZonedInstant(date, start),
      endAt: buildZonedInstant(date, end),
      location: 'B101',
      url: null,
      notes: null,
      highlighted: false,
    },
    { weekly: true, endDate: null },
  );
  return event({
    id,
    kind: 'class',
    title,
    category: null,
    startAt: buildZonedInstant(date, start),
    endAt: buildZonedInstant(date, end),
    classSchedule: schedule,
  });
}

function renderEvents() {
  return render(
    <ToastProvider>
      <TransitionProvider>
        <EventsView />
      </TransitionProvider>
    </ToastProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  state.events = [];
  state.drafts = [];
  for (const fn of [
    state.create,
    state.update,
    state.del,
    state.mutateOccurrence,
    state.saveDraft,
    state.deleteDraft,
    state.publishDraft,
  ]) {
    fn.mockReset();
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query === '(min-width: 768px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Events & schedule dashboard (v3.1 §6)', () => {
  it('uses the new heading, upcoming-exams copy, and horizon-labelled counts', () => {
    state.events = [
      event({ id: 'exam-soon', category: 'exam', startAt: '2026-11-19T09:00:00+07:00' }),
      event({
        id: 'legacy-exam',
        category: 'school',
        isExam: true,
        startAt: '2026-11-21T09:00:00+07:00',
      }),
      event({ id: 'meeting-later', startAt: '2026-12-15T09:00:00+07:00' }),
    ];
    renderEvents();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Events & schedule');
    const summary = screen.getByText(/upcoming \(Nov 17 – Feb 8\)/);
    expect(summary).toHaveTextContent('3 upcoming');
    expect(summary).toHaveTextContent('2 this week');
    expect(summary).toHaveTextContent('2 upcoming exams');
    expect(summary).toHaveTextContent('(next 7 days)');
    expect(screen.queryByText(/approaching/i)).toBeNull();
  });

  it('shows the nearest three highlights and expands in place with Show all / Show less', () => {
    state.events = [
      event({ id: 'h4', highlighted: true, startAt: '2026-11-24T09:00:00+07:00' }),
      event({ id: 'h1', highlighted: true, startAt: '2026-11-18T09:00:00+07:00' }),
      event({ id: 'h3', highlighted: true, startAt: '2026-11-22T09:00:00+07:00' }),
      event({ id: 'h2', highlighted: true, startAt: '2026-11-19T09:00:00+07:00' }),
      event({ id: 'plain', startAt: '2026-11-18T10:00:00+07:00' }),
    ];
    renderEvents();
    const list = screen.getByRole('list', { name: 'Highlighted events' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining('h1'),
      expect.stringContaining('h2'),
      expect.stringContaining('h3'),
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Show all (4)' }));
    expect(
      within(screen.getByRole('list', { name: 'Highlighted events' })).getAllByRole('listitem'),
    ).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(
      within(screen.getByRole('list', { name: 'Highlighted events' })).getAllByRole('listitem'),
    ).toHaveLength(3);
  });

  it('moves Week calendar out of the tabs into a panel with overview, day, and whole-week modes', () => {
    state.events = [
      event({ id: 'Lab review', startAt: '2026-11-18T09:00:00+07:00' }),
      event({
        id: 'Retreat',
        startAt: '2026-11-21T09:00:00+07:00',
        endAt: '2026-11-23T12:00:00+07:00',
      }),
    ];
    renderEvents();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Upcoming',
      'Past',
      'Drafts',
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Week calendar' }));
    const panel = screen.getByRole('dialog', { name: 'Week calendar' });
    expect(within(panel).getByText(/Nov 16 – Nov 22/)).toBeInTheDocument();
    expect(within(panel).getAllByRole('listitem')).toHaveLength(7);
    // Multi-day events appear on each intersected date in the week.
    expect(within(panel).getAllByText('Retreat')).toHaveLength(2);

    fireEvent.click(
      within(panel).getByRole('button', { name: /Wed, Nov 18, 2026.*Open day agenda/ }),
    );
    expect(within(panel).getByRole('region', { name: 'Wed, Nov 18, 2026' })).toBeInTheDocument();
    expect(within(panel).getByText('Lab review')).toBeInTheDocument();

    fireEvent.click(within(panel).getByRole('button', { name: 'Whole week' }));
    expect(within(panel).getAllByRole('region')).toHaveLength(7);
    fireEvent.click(within(panel).getByRole('button', { name: 'Next' }));
    expect(within(panel).getByText(/Nov 23 – Nov 29/)).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole('button', { name: 'Back to overview' }));
    fireEvent.click(within(panel).getByRole('button', { name: 'Today' }));
    expect(within(panel).getByText(/Nov 16 – Nov 22/)).toBeInTheDocument();
  });

  it('simplifies the editor: required category without School, highlight opt-in, one location-or-link field', async () => {
    renderEvents();
    fireEvent.click(screen.getByRole('button', { name: 'New event' }));
    const dialog = screen.getByRole('dialog', { name: 'New event' });
    expect(within(dialog).queryByRole('checkbox', { name: 'Online meeting' })).toBeNull();
    expect(within(dialog).queryByRole('checkbox', { name: 'Mark as examination' })).toBeNull();
    expect(within(dialog).getByRole('checkbox', { name: 'Highlight this event' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(within(dialog).getByLabelText('Location or link')).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText('Title'), {
      target: { value: 'Robotics final' },
    });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Add to schedule' }));
    });
    expect(state.create).not.toHaveBeenCalled();
    expect(within(dialog).getAllByText('Choose a category').length).toBeGreaterThan(1);

    fireEvent.click(within(dialog).getByRole('button', { name: /Category/i }));
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).queryByRole('option', { name: /School/ })).toBeNull();
    fireEvent.click(within(listbox).getByRole('option', { name: 'Contest' }));
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Highlight this event' }));
    fireEvent.change(within(dialog).getByLabelText('Location or link'), {
      target: { value: 'https://contest.example.com' },
    });
    state.create.mockResolvedValueOnce(event({ id: 'created', category: 'contest' }));
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Add to schedule' }));
    });
    await waitFor(() =>
      expect(state.create).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'event',
          title: 'Robotics final',
          category: 'contest',
          highlighted: true,
          location: 'https://contest.example.com',
        }),
      ),
    );
  });

  it('sends only changed fields plus the expected revision on a title-only edit', async () => {
    state.events = [
      event({
        id: 'legacy',
        title: 'Old seminar',
        category: 'school',
        isExam: true,
        location: 'Room 4',
        url: 'https://example.com/legacy',
        notes: 'Keep me',
      }),
    ];
    renderEvents();
    fireEvent.click(screen.getByRole('button', { name: /Old seminar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit event' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit event' });
    expect(within(dialog).getByRole('button', { name: 'Convert to class' })).toBeInTheDocument();
    expect(within(dialog).getByText(/Saved link kept/)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Title'), { target: { value: 'New seminar' } });
    state.update.mockResolvedValueOnce({ ...state.events[0]!, title: 'New seminar', revision: 1 });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Apply changes' }));
    });
    await waitFor(() =>
      expect(state.update).toHaveBeenCalledWith({
        id: 'legacy',
        patch: { title: 'New seminar', expectedRevision: 0 },
      }),
    );
  });

  it('clamps the detail preview and opens the full reader through See more only on overflow', async () => {
    const longNotes = Array.from({ length: 12 }, (_, i) => `Line ${i + 1}`).join('\n');
    state.events = [event({ id: 'Briefing', notes: longNotes, location: 'Hall A' })];
    const heights = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.dataset.testid === 'event-notes-preview' ? 240 : 0;
      });
    const clients = vi
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.dataset.testid === 'event-notes-preview' ? 120 : 0;
      });
    renderEvents();
    fireEvent.click(screen.getAllByRole('button', { name: /Briefing/ })[0]!);
    const pane = screen.getByTestId('event-detail-pane');
    expect(within(pane).getByText('Hall A')).toBeInTheDocument();
    fireEvent.click(within(pane).getByRole('button', { name: 'See more' }));
    const reader = await screen.findByRole('dialog', { name: /Briefing — event details/ });
    expect(within(reader).getByText(/Line 12/)).toBeInTheDocument();
    expect(within(reader).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    fireEvent.click(within(reader).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Briefing/ })).toBeNull());
    expect(screen.getByTestId('event-detail-pane')).toBeInTheDocument();
    heights.mockRestore();
    clients.mockRestore();
  });

  it('switches to the School timetable with periods, an afternoon divider, canceled styling, and class creation', async () => {
    const math = weeklyClass('math', 'Math', '2026-11-16');
    const schedule = math.classSchedule!;
    const canceled = event({
      ...math,
      id: 'lit',
      title: 'Literature',
      classSchedule: {
        ...buildClassSchedule(
          {
            title: 'Literature',
            startAt: buildZonedInstant('2026-11-17', '13:30'),
            endAt: buildZonedInstant('2026-11-17', '15:30'),
            location: null,
            url: null,
            notes: null,
            highlighted: false,
          },
          { weekly: true, endDate: null },
        ),
        canceledFromWeek: '2026-11-16',
      },
    });
    expect(schedule.startWeek).toBe('2026-11-16');
    state.events = [
      math,
      canceled,
      event({
        id: 'Same-time meeting',
        startAt: buildZonedInstant('2026-11-18', '07:30'),
        endAt: buildZonedInstant('2026-11-18', '09:30'),
      }),
    ];
    renderEvents();
    fireEvent.click(screen.getByRole('button', { name: 'School timetable' }));
    const grid = screen.getByRole('grid', { name: 'Weekly school timetable' });
    expect(within(grid).getByRole('separator', { name: 'Afternoon' })).toBeInTheDocument();
    expect(
      within(grid)
        .getAllByRole('rowheader')
        .map((cell) => cell.getAttribute('aria-label')),
    ).toEqual(['07:30 to 09:30', '09:30 to 11:30', '13:30 to 15:30', '15:30 to 17:30']);
    expect(
      within(grid).getByRole('button', { name: /^Math, Mon, Nov 16, 2026/ }),
    ).toBeInTheDocument();
    expect(
      within(grid).getByRole('button', { name: /Literature \(canceled\)/ }),
    ).toBeInTheDocument();
    // Ordinary events never occupy a timetable cell, even at a matching time.
    expect(within(grid).queryByText('Same-time meeting')).toBeNull();

    fireEvent.click(
      within(grid).getByRole('button', { name: 'Add a class on Wed, Nov 18, 2026, 09:30–11:30' }),
    );
    const editor = screen.getByRole('dialog', { name: 'New class' });
    expect(within(editor).getByLabelText('Start time')).toHaveValue('09:30');
    expect(within(editor).getByLabelText('End time')).toHaveValue('11:30');
    expect(
      within(editor).getByRole('checkbox', { name: 'Set Default · repeat weekly' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(within(editor).queryByRole('button', { name: /Category/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Close event editor' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to Events dashboard' }));
    expect(screen.getByRole('heading', { name: 'Highlights' })).toBeInTheDocument();
  });

  it('applies class cancellation with an explicit scope and keeps drafts out of Highlights', async () => {
    state.events = [weeklyClass('math', 'Math', '2026-11-16')];
    state.drafts = [
      {
        id: 'draft-1',
        sourceEventId: null,
        sourceUpdatedAt: null,
        sourceRevision: null,
        occurrence: null,
        values: blankEditorValues('2026-11-19', {
          title: 'Highlighted draft',
          category: 'exam',
          highlighted: true,
        }),
        importKey: null,
        createdAt: '2026-11-12T08:00:00.000Z',
        updatedAt: '2026-11-12T08:00:00.000Z',
      },
    ];
    renderEvents();
    expect(screen.queryByText('Highlighted draft')).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: /Math/ })[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel class…' }));
    const dialog = screen.getByRole('dialog', { name: 'Cancel class' });
    fireEvent.click(within(dialog).getByRole('radio', { name: 'This week onward' }));
    state.mutateOccurrence.mockResolvedValueOnce({ item: null, occurrence: null, removed: false });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel class' }));
    });
    expect(state.mutateOccurrence).toHaveBeenCalledWith({
      id: 'math',
      mutation: {
        action: 'cancel',
        // 16 Nov's class ended before 10:00 Tue, so the first upcoming row is 23 Nov.
        originalWeek: '2026-11-23',
        scope: 'this-week-onward',
        expectedRevision: 0,
      },
    });

    fireEvent.click(screen.getByRole('tab', { name: /Drafts/ }));
    expect(screen.getByText('Highlighted draft')).toBeInTheDocument();
  });
});
