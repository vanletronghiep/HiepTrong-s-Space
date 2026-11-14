// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadEditorDraft, makeEditorDraftKey, saveEditorDraft } from '@/client/editor-drafts';
import type { MilestoneItem } from '@/contracts/milestone';
import { MilestonesView } from '@/features/milestones/MilestonesView';
import { TransitionProvider } from '@/features/transitions/TransitionProvider';
import { ToastProvider } from '@/ui/Toast';

const state = vi.hoisted(() => ({
  milestones: [] as MilestoneItem[],
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
  createAsync: vi.fn(),
  updateMutate: vi.fn(),
  updateAsync: vi.fn(),
  toggleMutate: vi.fn(),
  deleteMutate: vi.fn(),
  deleteIsPending: false,
  anchorSpy: vi.fn(),
}));

vi.mock('@/ui/use-item-anchor', () => ({
  useItemAnchor: (items: readonly { id: string }[]) => state.anchorSpy(items),
}));

vi.mock('@/client/queries/milestones', () => ({
  useMilestones: () => ({
    data: state.milestones,
    isLoading: state.isLoading,
    isError: state.isError,
    refetch: state.refetch,
  }),
  useCreateMilestone: () => ({
    mutateAsync: state.createAsync,
  }),
  useUpdateMilestone: () => ({
    mutate: state.updateMutate,
    mutateAsync: state.updateAsync,
  }),
  useToggleLandmark: () => ({
    mutate: state.toggleMutate,
  }),
  useDeleteMilestone: () => ({
    mutate: state.deleteMutate,
    isPending: state.deleteIsPending,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/milestones',
}));

function renderMilestones() {
  return render(
    <ToastProvider>
      <TransitionProvider>
        <MilestonesView />
      </TransitionProvider>
    </ToastProvider>,
  );
}

const sampleMilestone = (overrides: Partial<MilestoneItem> = {}): MilestoneItem => ({
  id: 'mile-1',
  title: 'Master Machine Learning Foundations',
  meaning: 'Build deep mathematical intuition alongside real systems work.',
  category: 'academic',
  timeframe: 'Year I (2026–2027)',
  targetDate: '2027-06-15',
  status: 'in_progress',
  reflection: 'Linear algebra and probability proofs are now solid.',
  landmarks: [
    {
      id: 'lm-1',
      title: 'Finish linear algebra notes',
      completed: true,
      completedAt: '2026-10-01T10:00:00.000Z',
    },
    {
      id: 'lm-2',
      title: 'Train transformer from scratch',
      completed: false,
      completedAt: null,
    },
  ],
  linkedProjectIds: ['proj-ml'],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-11-10T08:00:00.000Z',
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

describe('MilestonesView Yearbook of Ambitions', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    state.milestones = [];
    state.isLoading = false;
    state.isError = false;
    state.refetch.mockReset();
    state.createAsync.mockReset();
    state.updateMutate.mockReset();
    state.updateAsync.mockReset();
    state.toggleMutate.mockReset();
    state.deleteMutate.mockReset();
    state.deleteIsPending = false;
    state.anchorSpy.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('ships exactly 5 safe static SVGs in public/visuals/annual-milestones and renders all 5 decoratively', async () => {
    const publicDir = path.resolve(process.cwd(), 'public', 'visuals', 'annual-milestones');
    const files = (await fs.readdir(publicDir)).sort();
    expect(files).toEqual([
      'celebration-streamer.svg',
      'champions-cup.svg',
      'hall-of-golden-years.svg',
      'honor-ribbon.svg',
      'victory-pennant-edge.svg',
    ]);

    for (const file of files) {
      const svg = await fs.readFile(path.join(publicDir, file), 'utf8');
      expect(svg).not.toMatch(/<script|\bon\w+\s*=|<animate|<foreignObject/i);
      const withoutXmlns = svg.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '');
      expect(withoutXmlns).not.toMatch(/https?:\/\//i);
    }

    renderMilestones();
    const decorativeImgs = Array.from(document.querySelectorAll('img')).map((img) => ({
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt'),
      ariaHidden: img.getAttribute('aria-hidden'),
    }));
    expect(decorativeImgs).toEqual(
      expect.arrayContaining([
        {
          src: '/visuals/annual-milestones/victory-pennant-edge.svg',
          alt: '',
          ariaHidden: 'true',
        },
        {
          src: '/visuals/annual-milestones/hall-of-golden-years.svg',
          alt: '',
          ariaHidden: 'true',
        },
        {
          src: '/visuals/annual-milestones/champions-cup.svg',
          alt: '',
          ariaHidden: 'true',
        },
        {
          src: '/visuals/annual-milestones/celebration-streamer.svg',
          alt: '',
          ariaHidden: 'true',
        },
        {
          src: '/visuals/annual-milestones/honor-ribbon.svg',
          alt: '',
          ariaHidden: 'true',
        },
      ]),
    );
  });

  it('renders skeleton loading, non-blocking retry alert, trajectory strip, status/category chip filters, and useItemAnchor targets', () => {
    state.isLoading = true;
    const loadingView = renderMilestones();
    expect(screen.getByLabelText('Loading milestones')).toBeInTheDocument();
    loadingView.unmount();

    state.isLoading = false;
    state.isError = true;
    const errorView = renderMilestones();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Could not load your milestones/);
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(state.refetch).toHaveBeenCalledTimes(1);
    errorView.unmount();

    state.isError = false;
    state.milestones = [
      sampleMilestone({
        id: 'm-prog',
        title: 'Publish Research Monograph',
        category: 'academic',
        status: 'in_progress',
        landmarks: [
          {
            id: 'a1',
            title: 'Draft literature review',
            completed: true,
            completedAt: '2026-10-01',
          },
          { id: 'a2', title: 'Run ablation study', completed: false, completedAt: null },
        ],
      }),
      sampleMilestone({
        id: 'm-done',
        title: 'Run First Half Marathon',
        category: 'personal',
        status: 'achieved',
        landmarks: [
          { id: 'b1', title: 'Complete 15km tempo', completed: true, completedAt: '2026-09-12' },
        ],
      }),
    ];

    renderMilestones();
    expect(state.anchorSpy).toHaveBeenCalledWith(state.milestones);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Annual Milestones' }),
    ).toBeInTheDocument();

    const trajectorySection = screen.getByRole('region', { name: 'Yearbook trajectory' });
    expect(within(trajectorySection).getByText('2')).toBeInTheDocument();
    expect(within(trajectorySection).getByText('2 / 3')).toBeInTheDocument();
    expect(within(trajectorySection).getByText('67%')).toBeInTheDocument();

    const firstCard = document.getElementById('item-m-prog');
    expect(firstCard).not.toBeNull();
    expect(firstCard).toHaveAttribute('tabindex', '-1');

    // Status filter chips
    const statusGroup = screen.getByRole('group', { name: 'Status filter' });
    const achievedChip = within(statusGroup).getByRole('button', { name: 'Achieved' });
    fireEvent.click(achievedChip);
    expect(achievedChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Run First Half Marathon' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Publish Research Monograph' })).toBeNull();

    // Category filter yields filtered empty state & reset button
    const categoryGroup = screen.getByRole('group', { name: 'Category filter' });
    const careerChip = within(categoryGroup).getByRole('button', { name: 'Career' });
    fireEvent.click(careerChip);
    expect(careerChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('No milestones match the active filters.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show all milestones' }));
    expect(screen.getByRole('heading', { name: 'Publish Research Monograph' })).toBeInTheDocument();
  });

  it('toggles landmarks via Checkbox with pending guard and card-scoped alert without leaking into editor', () => {
    const first = sampleMilestone({ id: 'm-1', title: 'First Ambition' });
    const second = sampleMilestone({
      id: 'm-2',
      title: 'Second Ambition',
      landmarks: [{ id: 'lm-other', title: 'Other landmark', completed: false, completedAt: null }],
    });
    state.milestones = [first, second];

    renderMilestones();

    const checkbox = screen.getByRole('checkbox', {
      name: 'Toggle landmark: Train transformer from scratch',
    });
    fireEvent.click(checkbox);
    expect(checkbox).toBeDisabled();
    fireEvent.click(checkbox);
    expect(state.toggleMutate).toHaveBeenCalledTimes(1);
    expect(state.toggleMutate).toHaveBeenCalledWith(
      { milestoneId: 'm-1', landmarkId: 'lm-2' },
      expect.objectContaining({ onError: expect.any(Function), onSettled: expect.any(Function) }),
    );

    const opts = state.toggleMutate.mock.calls[0]![1] as {
      onError: (err: Error) => void;
      onSettled: () => void;
    };
    act(() => {
      opts.onError(new Error('Toggle failed for card 1'));
      opts.onSettled();
    });

    const card1 = document.getElementById('item-m-1')!;
    const card2 = document.getElementById('item-m-2')!;
    expect(within(card1).getByRole('alert')).toHaveTextContent('Toggle failed for card 1');
    expect(within(card2).queryByRole('alert')).toBeNull();
    expect(checkbox).not.toBeDisabled();

    // Must not leak card toggle error into LargeEditorDialog
    fireEvent.click(screen.getByRole('button', { name: 'New milestone' }));
    const dialog = screen.getByRole('dialog', { name: 'New milestone' });
    expect(within(dialog).queryByRole('alert')).toBeNull();
  });

  it('supports inline quick status update via useUpdateMilestone and ConfirmDialog deletion with draft cleanup', () => {
    const target = sampleMilestone({
      id: 'm-del',
      title: 'Build Compiler Suite',
      status: 'planned',
    });
    state.milestones = [target];
    saveEditorDraft({
      formId: 'milestone',
      recordId: target.id,
      recordUpdatedAt: target.updatedAt,
      values: {
        title: 'Build Compiler Suite v2',
        meaning: target.meaning,
        reflection: '',
        timeframe: target.timeframe,
        targetDate: '2027-06-15',
        category: target.category,
        status: 'in_progress',
        landmarks: target.landmarks.map((l) => ({
          id: l.id,
          title: l.title,
          completed: l.completed,
          completedAt: l.completedAt ?? null,
        })),
      },
    });

    renderMilestones();

    // Quick status select triggers useUpdateMilestone
    const statusSelect = screen.getByLabelText('Update status for Build Compiler Suite');
    fireEvent.change(statusSelect, { target: { value: 'achieved' } });
    expect(statusSelect).toBeDisabled();
    expect(state.updateMutate).toHaveBeenCalledWith(
      { id: target.id, patch: { status: 'achieved' } },
      expect.objectContaining({ onError: expect.any(Function), onSettled: expect.any(Function) }),
    );
    const statusOpts = state.updateMutate.mock.calls[0]![1] as { onSettled: () => void };
    act(() => {
      statusOpts.onSettled();
    });
    expect(statusSelect).not.toBeDisabled();

    // Delete requires ConfirmDialog; Cancel preserves item
    fireEvent.click(screen.getByRole('button', { name: 'Delete Build Compiler Suite' }));
    const confirm = screen.getByRole('dialog', { name: 'Delete milestone?' });
    fireEvent.click(within(confirm).getByRole('button', { name: 'Cancel' }));
    expect(state.deleteMutate).not.toHaveBeenCalled();

    // Confirm delete calls deleteMutation and clears local edit draft
    fireEvent.click(screen.getByRole('button', { name: 'Delete Build Compiler Suite' }));
    const confirmAgain = screen.getByRole('dialog', { name: 'Delete milestone?' });
    fireEvent.click(within(confirmAgain).getByRole('button', { name: 'Delete' }));
    expect(state.deleteMutate).toHaveBeenCalledWith(target.id, expect.any(Object));
    const delOpts = state.deleteMutate.mock.calls[0]![1] as { onSuccess: () => void };
    act(() => {
      delOpts.onSuccess();
    });

    const loaded = loadEditorDraft('milestone', target.id);
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.draft).toBeNull();
    }
  });

  it('runs LargeEditorDialog lifecycle: create with explicit status/targetDate/landmarks, validation, dirty 3-choice close, draft resume & stale warning, orphan discard, and landmark ID preservation', async () => {
    const existing = sampleMilestone({
      id: 'm-edit',
      title: 'Publish Systems Paper',
      updatedAt: '2026-11-10T08:00:00.000Z',
      linkedProjectIds: ['proj-keep'],
      landmarks: [
        {
          id: 'lm-keep-1',
          title: 'Finish benchmark suite',
          completed: true,
          completedAt: '2026-10-20T12:00:00.000Z',
        },
        {
          id: 'lm-keep-2',
          title: 'Submit camera-ready draft',
          completed: false,
          completedAt: null,
        },
      ],
    });
    state.milestones = [existing];

    // Seed orphaned draft for a missing milestone
    saveEditorDraft({
      formId: 'milestone',
      recordId: 'missing-milestone',
      recordUpdatedAt: null,
      values: {
        title: 'Orphaned ambition',
        meaning: 'Should not auto-create',
        reflection: '',
        timeframe: '2026',
        targetDate: '',
        category: 'personal',
        status: 'planned',
        landmarks: [],
      },
    });

    const firstMount = renderMilestones();
    expect(
      screen.getByText(
        /1 saved local edit draft refers to a milestone that is no longer in your yearbook/,
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Discard missing drafts' }));
    expect(screen.queryByRole('button', { name: 'Discard missing drafts' })).toBeNull();

    // Untouched New milestone closes without dirty prompt
    fireEvent.click(screen.getByRole('button', { name: 'New milestone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close milestone editor' }));
    expect(screen.queryByRole('dialog', { name: 'Save changes before closing?' })).toBeNull();

    // Dirty New milestone -> validation retains input -> 3-choice prompt saves draft across remount
    fireEvent.click(screen.getByRole('button', { name: 'New milestone' }));
    const createDialog = screen.getByRole('dialog', { name: 'New milestone' });
    const titleInput = within(createDialog).getByLabelText('Ambition title');
    const meaningInput = within(createDialog).getByLabelText('Meaning & significance');

    fireEvent.change(meaningInput, {
      target: { value: 'Deepen mastery across distributed systems.' },
    });
    fireEvent.submit(titleInput.closest('form')!);
    expect(within(createDialog).getByRole('alert')).toHaveTextContent('Enter an ambition title.');
    expect(meaningInput).toHaveValue('Deepen mastery across distributed systems.');

    fireEvent.change(titleInput, { target: { value: 'Build Distributed Consensus Lab' } });
    fireEvent.change(within(createDialog).getByLabelText('Target date'), {
      target: { value: '2027-08-20' },
    });
    fireEvent.change(within(createDialog).getByLabelText('Status'), {
      target: { value: 'planned' },
    });
    fireEvent.change(within(createDialog).getByLabelText('Category'), {
      target: { value: 'project' },
    });

    // Add structured landmark row
    fireEvent.click(within(createDialog).getByRole('button', { name: 'Add landmark' }));
    fireEvent.change(within(createDialog).getByLabelText('Landmark 1 title'), {
      target: { value: 'Implement Raft leader election' },
    });

    // Close dirty editor -> 3-choice prompt -> Save draft and close
    fireEvent.click(within(createDialog).getByRole('button', { name: 'Close milestone editor' }));
    const closePrompt = screen.getByRole('dialog', { name: 'Save changes before closing?' });
    expect(
      within(closePrompt).getByRole('button', { name: 'Discard changes' }),
    ).toBeInTheDocument();
    expect(
      within(closePrompt).getByRole('button', { name: 'Continue editing' }),
    ).toBeInTheDocument();
    fireEvent.click(within(closePrompt).getByRole('button', { name: 'Save draft and close' }));
    expect(window.localStorage.getItem(makeEditorDraftKey('milestone', null))).not.toBeNull();

    firstMount.unmount();

    // Remount -> resume draft -> submit via Ctrl+S with double-submit guard
    renderMilestones();
    fireEvent.click(screen.getByRole('button', { name: 'New milestone' }));
    const resumedDialog = screen.getByRole('dialog', { name: 'New milestone' });
    fireEvent.click(within(resumedDialog).getByRole('button', { name: 'Resume draft' }));
    expect(within(resumedDialog).getByLabelText('Ambition title')).toHaveValue(
      'Build Distributed Consensus Lab',
    );
    expect(within(resumedDialog).getByLabelText('Target date')).toHaveValue('2027-08-20');
    expect(within(resumedDialog).getByLabelText('Status')).toHaveValue('planned');
    expect(within(resumedDialog).getByLabelText('Landmark 1 title')).toHaveValue(
      'Implement Raft leader election',
    );

    let resolveCreate!: (saved: MilestoneItem) => void;
    state.createAsync.mockImplementationOnce(
      () =>
        new Promise<MilestoneItem>((resolve) => {
          resolveCreate = resolve;
        }),
    );

    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    expect(state.createAsync).toHaveBeenCalledTimes(1);
    expect(state.createAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Build Distributed Consensus Lab',
        meaning: 'Deepen mastery across distributed systems.',
        status: 'planned',
        category: 'project',
        targetDate: '2027-08-20',
        landmarks: [
          expect.objectContaining({
            title: 'Implement Raft leader election',
            completed: false,
            completedAt: null,
          }),
        ],
      }),
    );

    resolveCreate(sampleMilestone({ id: 'created-1', title: 'Build Distributed Consensus Lab' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'New milestone' })).toBeNull());
    expect(window.localStorage.getItem(makeEditorDraftKey('milestone', null))).toBeNull();

    // Stale edit draft warning + existing landmark ID/completed/completedAt preservation on edit
    saveEditorDraft({
      formId: 'milestone',
      recordId: existing.id,
      recordUpdatedAt: '2026-11-01T00:00:00.000Z', // older than existing.updatedAt
      values: {
        title: 'Publish Systems Paper (Extended)',
        meaning: existing.meaning,
        reflection: existing.reflection ?? '',
        timeframe: existing.timeframe,
        targetDate: '2027-06-15',
        category: existing.category,
        status: existing.status,
        landmarks: [
          {
            id: 'lm-keep-1',
            title: 'Finish benchmark suite v2',
            completed: true,
            completedAt: '2026-10-20T12:00:00.000Z',
          },
          {
            id: 'lm-keep-2',
            title: 'Submit camera-ready draft',
            completed: false,
            completedAt: null,
          },
        ],
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit Publish Systems Paper' }));
    const editDialog = screen.getByRole('dialog', { name: 'Edit milestone' });
    expect(
      within(editDialog).getByText(/This milestone was updated after your local draft was saved/),
    ).toBeInTheDocument();
    fireEvent.click(within(editDialog).getByRole('button', { name: 'Resume draft' }));

    state.updateAsync.mockResolvedValueOnce({
      ...existing,
      title: 'Publish Systems Paper (Extended)',
    });
    fireEvent.submit(within(editDialog).getByLabelText('Ambition title').closest('form')!);
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Edit milestone' })).toBeNull(),
    );

    expect(state.updateAsync).toHaveBeenCalledWith({
      id: existing.id,
      patch: {
        title: 'Publish Systems Paper (Extended)',
        landmarks: [
          {
            id: 'lm-keep-1',
            title: 'Finish benchmark suite v2',
            completed: true,
            completedAt: '2026-10-20T12:00:00.000Z',
          },
          {
            id: 'lm-keep-2',
            title: 'Submit camera-ready draft',
            completed: false,
            completedAt: null,
          },
        ],
      },
    });
    expect(window.localStorage.getItem(makeEditorDraftKey('milestone', existing.id))).toBeNull();
  });
});
