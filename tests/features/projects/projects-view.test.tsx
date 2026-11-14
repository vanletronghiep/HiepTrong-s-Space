// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadEditorDraft, makeEditorDraftKey, saveEditorDraft } from '@/client/editor-drafts';
import type { ProjectItem } from '@/contracts/project';
import { ProjectsView } from '@/features/projects/ProjectsView';
import { TransitionProvider } from '@/features/transitions/TransitionProvider';
import { ToastProvider } from '@/ui/Toast';

const state = vi.hoisted(() => ({
  projects: [] as ProjectItem[],
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
  createAsync: vi.fn(),
  updateMutate: vi.fn(),
  updateAsync: vi.fn(),
  deleteMutate: vi.fn(),
  deleteIsPending: false,
  anchorSpy: vi.fn(),
}));

vi.mock('@/ui/use-item-anchor', () => ({
  useItemAnchor: (items: readonly { id: string }[]) => state.anchorSpy(items),
}));

vi.mock('@/client/queries/projects', () => ({
  useProjects: () => ({
    data: state.projects,
    isLoading: state.isLoading,
    isError: state.isError,
    refetch: state.refetch,
  }),
  useCreateProject: () => ({
    mutateAsync: state.createAsync,
  }),
  useUpdateProject: () => ({
    mutate: state.updateMutate,
    mutateAsync: state.updateAsync,
  }),
  useDeleteProject: () => ({
    mutate: state.deleteMutate,
    isPending: state.deleteIsPending,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/projects',
}));

function renderProjects() {
  return render(
    <ToastProvider>
      <TransitionProvider>
        <ProjectsView />
      </TransitionProvider>
    </ToastProvider>,
  );
}

const sampleProject = (overrides: Partial<ProjectItem> = {}): ProjectItem => ({
  id: 'proj-1',
  title: 'Go Game AI',
  overview: 'Monte Carlo tree search engine for 9x9 Go.',
  status: 'active',
  progressPercent: 45,
  deadlineAt: '2026-12-15',
  blockers: 'Need faster rollout heuristic',
  nextStep: 'Benchmark UCT exploration constant',
  techStack: ['TypeScript', 'WebAssembly'],
  repoUrl: 'https://github.com/hieptrong/go-ai',
  liveUrl: 'https://go-ai.example.com',
  linkedTaskIds: ['task-a', 'task-b'],
  linkedMilestoneIds: ['mile-1'],
  createdAt: '2026-11-01T00:00:00.000Z',
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

describe('ProjectsView Eastern Strategy Workspace', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    state.projects = [];
    state.isLoading = false;
    state.isError = false;
    state.refetch.mockReset();
    state.createAsync.mockReset();
    state.updateMutate.mockReset();
    state.updateAsync.mockReset();
    state.deleteMutate.mockReset();
    state.deleteIsPending = false;
    state.anchorSpy.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('ships exactly 5 safe static SVGs in public/visuals/project and renders them decoratively', async () => {
    const publicDir = path.resolve(process.cwd(), 'public', 'visuals', 'project');
    const files = (await fs.readdir(publicDir)).sort();
    expect(files).toEqual([
      'auspicious-cloud-pillar.svg',
      'auspicious-cloud-scroll.svg',
      'dragon-over-the-ridge.svg',
      'jade-knot-talisman.svg',
      'wooden-training-dummy.svg',
    ]);

    for (const file of files) {
      const svg = await fs.readFile(path.join(publicDir, file), 'utf8');
      expect(svg).not.toMatch(/<script|\bon\w+\s*=|<animate|<foreignObject/i);
      const withoutXmlns = svg.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '');
      expect(withoutXmlns).not.toMatch(/https?:\/\//i);
    }

    // Empty state renders wooden-training-dummy.svg + page assets
    renderProjects();
    const decorativeImgs = Array.from(document.querySelectorAll('img')).map((img) => ({
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt'),
      ariaHidden: img.getAttribute('aria-hidden'),
    }));
    expect(decorativeImgs).toEqual(
      expect.arrayContaining([
        { src: '/visuals/project/auspicious-cloud-pillar.svg', alt: '', ariaHidden: 'true' },
        { src: '/visuals/project/dragon-over-the-ridge.svg', alt: '', ariaHidden: 'true' },
        { src: '/visuals/project/auspicious-cloud-scroll.svg', alt: '', ariaHidden: 'true' },
        { src: '/visuals/project/wooden-training-dummy.svg', alt: '', ariaHidden: 'true' },
      ]),
    );

    // Editor renders jade-knot-talisman.svg decoratively
    fireEvent.click(screen.getAllByRole('button', { name: 'New project' })[0]!);
    const jade = document.querySelector('img[src="/visuals/project/jade-knot-talisman.svg"]');
    expect(jade).not.toBeNull();
    expect(jade).toHaveAttribute('alt', '');
    expect(jade).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders skeleton loading, non-blocking retry alert, KPI strip, status chip filters, and useItemAnchor targets', () => {
    state.isLoading = true;
    const loadingView = renderProjects();
    expect(screen.getByLabelText('Loading projects')).toBeInTheDocument();
    loadingView.unmount();

    state.isLoading = false;
    state.isError = true;
    const errorView = renderProjects();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Could not load your projects/);
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(state.refetch).toHaveBeenCalledTimes(1);
    errorView.unmount();

    state.isError = false;
    state.projects = [
      sampleProject({
        id: 'p-active',
        title: 'Compiler Core',
        status: 'active',
        progressPercent: 30,
      }),
      sampleProject({
        id: 'p-prog',
        title: 'Kernel Lab',
        status: 'in_progress',
        progressPercent: 60,
      }),
      sampleProject({
        id: 'p-done',
        title: 'Chess Engine',
        status: 'completed',
        progressPercent: 100,
      }),
    ];

    renderProjects();
    expect(state.anchorSpy).toHaveBeenCalledWith(state.projects);

    const kpiSection = screen.getByRole('region', { name: 'Project statistics' });
    expect(within(kpiSection).getByText('3')).toBeInTheDocument();
    expect(within(kpiSection).getByText('2')).toBeInTheDocument();
    expect(within(kpiSection).getByText('1')).toBeInTheDocument();
    expect(within(kpiSection).getByText('63%')).toBeInTheDocument();

    const compilerCard = document.getElementById('item-p-active');
    expect(compilerCard).not.toBeNull();
    expect(compilerCard).toHaveAttribute('tabindex', '-1');

    // Filter chips with aria-pressed and filtered empty state recovery
    const filterGroup = screen.getByRole('group', { name: 'Project status filter' });
    const inProgressChip = within(filterGroup).getByRole('button', { name: 'In progress' });
    fireEvent.click(inProgressChip);
    expect(inProgressChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Kernel Lab' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Compiler Core' })).toBeNull();

    fireEvent.click(within(filterGroup).getByRole('button', { name: 'On hold' }));
    expect(screen.getByText('No on hold projects right now.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show all projects' }));
    expect(screen.getByRole('heading', { name: 'Compiler Core' })).toBeInTheDocument();
  });

  it('supports -5%/+5% progress controls with clamping, completion status sync, pending guard, and scoped error alert', () => {
    const nearlyDone = sampleProject({
      id: 'p-98',
      title: 'Ray Tracer',
      status: 'in_progress',
      progressPercent: 98,
    });
    const completed = sampleProject({
      id: 'p-100',
      title: 'Lexer',
      status: 'completed',
      progressPercent: 100,
    });
    const zero = sampleProject({
      id: 'p-0',
      title: 'Shader Toy',
      status: 'active',
      progressPercent: 0,
    });
    state.projects = [nearlyDone, completed, zero];

    renderProjects();

    // Clamps to 100 and promotes status to completed, with pending guard preventing double-fire
    const inc98 = screen.getByRole('button', { name: 'Increase progress for Ray Tracer by 5%' });
    fireEvent.click(inc98);
    expect(inc98).toBeDisabled();
    fireEvent.click(inc98);
    expect(state.updateMutate).toHaveBeenCalledTimes(1);
    expect(state.updateMutate).toHaveBeenCalledWith(
      { id: 'p-98', patch: { progressPercent: 100, status: 'completed' } },
      expect.objectContaining({ onError: expect.any(Function), onSettled: expect.any(Function) }),
    );

    // Simulate failure from server -> shows page alert outside modals and clears pending lock
    const firstOpts = state.updateMutate.mock.calls[0]![1] as {
      onError: (err: Error) => void;
      onSettled: () => void;
    };
    act(() => {
      firstOpts.onError(new Error('Network hiccup'));
      firstOpts.onSettled();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Network hiccup');
    expect(inc98).not.toBeDisabled();

    // Decreasing from completed (100%) transitions status back to in_progress
    fireEvent.click(screen.getByRole('button', { name: 'Decrease progress for Lexer by 5%' }));
    expect(state.updateMutate).toHaveBeenLastCalledWith(
      { id: 'p-100', patch: { progressPercent: 95, status: 'in_progress' } },
      expect.any(Object),
    );

    // Decreasing at 0% clamps to 0
    fireEvent.click(screen.getByRole('button', { name: 'Decrease progress for Shader Toy by 5%' }));
    expect(state.updateMutate).toHaveBeenLastCalledWith(
      { id: 'p-0', patch: { progressPercent: 0, status: 'active' } },
      expect.any(Object),
    );
  });

  it('requires ConfirmDialog for deletion and clears local draft on delete', () => {
    const target = sampleProject({ id: 'p-del', title: 'Legacy Parser' });
    state.projects = [target];
    saveEditorDraft({
      formId: 'project',
      recordId: target.id,
      recordUpdatedAt: target.updatedAt,
      values: {
        title: 'Legacy Parser edited',
        overview: target.overview,
        status: target.status,
        progressPercent: target.progressPercent,
        deadlineDate: '2026-12-15',
        nextStep: '',
        blockers: '',
        techStackText: 'Rust',
        repoUrl: '',
        liveUrl: '',
      },
    });

    renderProjects();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Legacy Parser' }));
    const confirm = screen.getByRole('dialog', { name: 'Delete project?' });
    expect(state.deleteMutate).not.toHaveBeenCalled();

    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));
    expect(state.deleteMutate).toHaveBeenCalledWith(target.id, expect.any(Object));
    const opts = state.deleteMutate.mock.calls[0]![1] as { onSuccess: () => void };
    act(() => {
      opts.onSuccess();
    });

    const loaded = loadEditorDraft('project', target.id);
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.draft).toBeNull();
    }
  });

  it('runs unified LargeEditorDialog lifecycle: validation, double-submit lock, Ctrl+S, dirty 3-choice prompt, local drafts, stale warning, orphans, and linked ID preservation', async () => {
    const existing = sampleProject({
      id: 'p-edit',
      title: 'Distributed KV',
      updatedAt: '2026-11-10T08:00:00.000Z',
      linkedTaskIds: ['t-1', 't-2'],
      linkedMilestoneIds: ['m-9'],
    });
    state.projects = [existing];

    // Seed orphaned draft for absent project
    saveEditorDraft({
      formId: 'project',
      recordId: 'missing-proj',
      recordUpdatedAt: null,
      values: {
        title: 'Ghost project',
        overview: 'Should not auto-create',
        status: 'active',
        progressPercent: 10,
        deadlineDate: '',
        nextStep: '',
        blockers: '',
        techStackText: '',
        repoUrl: '',
        liveUrl: '',
      },
    });

    const firstMount = renderProjects();
    expect(
      screen.getByText(
        /1 saved local edit draft refers to a project that is no longer in your workspace/,
      ),
    ).toBeInTheDocument();
    expect(state.createAsync).not.toHaveBeenCalled();

    // Discard orphaned drafts cleanly
    fireEvent.click(screen.getByRole('button', { name: 'Discard missing drafts' }));
    expect(screen.queryByRole('button', { name: 'Discard missing drafts' })).toBeNull();

    // Untouched New project editor closes without 3-choice prompt
    fireEvent.click(screen.getByRole('button', { name: 'New project' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close project editor' }));
    expect(screen.queryByRole('dialog', { name: 'Save changes before closing?' })).toBeNull();

    // Dirty New project editor -> validation retains input -> 3-choice prompt saves draft across remount
    fireEvent.click(screen.getByRole('button', { name: 'New project' }));
    const createDialog = screen.getByRole('dialog', { name: 'New project' });
    const titleInput = within(createDialog).getByLabelText('Title');
    const overviewInput = within(createDialog).getByLabelText('Overview');
    fireEvent.change(overviewInput, { target: { value: 'Draft overview retained' } });
    fireEvent.submit(titleInput.closest('form')!);
    expect(within(createDialog).getByRole('alert')).toHaveTextContent('Enter a project title.');
    expect(overviewInput).toHaveValue('Draft overview retained');

    fireEvent.change(titleInput, { target: { value: 'Drafted Build' } });
    fireEvent.click(within(createDialog).getByRole('button', { name: 'Close project editor' }));
    const closePrompt = screen.getByRole('dialog', { name: 'Save changes before closing?' });
    expect(
      within(closePrompt).getByRole('button', { name: 'Discard changes' }),
    ).toBeInTheDocument();
    expect(
      within(closePrompt).getByRole('button', { name: 'Continue editing' }),
    ).toBeInTheDocument();
    fireEvent.click(within(closePrompt).getByRole('button', { name: 'Save draft and close' }));
    expect(window.localStorage.getItem(makeEditorDraftKey('project', null))).not.toBeNull();

    firstMount.unmount();

    // Remount -> resume draft -> submit via Ctrl+S with double-submit lock & cleanup
    renderProjects();
    fireEvent.click(screen.getByRole('button', { name: 'New project' }));
    const resumedDialog = screen.getByRole('dialog', { name: 'New project' });
    fireEvent.click(within(resumedDialog).getByRole('button', { name: 'Resume draft' }));
    expect(within(resumedDialog).getByLabelText('Title')).toHaveValue('Drafted Build');
    expect(within(resumedDialog).getByLabelText('Overview')).toHaveValue('Draft overview retained');

    let resolveCreate!: (saved: ProjectItem) => void;
    state.createAsync.mockImplementationOnce(
      () =>
        new Promise<ProjectItem>((resolve) => {
          resolveCreate = resolve;
        }),
    );

    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    expect(state.createAsync).toHaveBeenCalledTimes(1);

    resolveCreate(sampleProject({ id: 'created-1', title: 'Drafted Build' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'New project' })).toBeNull());
    expect(window.localStorage.getItem(makeEditorDraftKey('project', null))).toBeNull();

    // Stale edit draft warning + linkedTaskIds / linkedMilestoneIds preservation on edit
    saveEditorDraft({
      formId: 'project',
      recordId: existing.id,
      recordUpdatedAt: '2026-11-05T00:00:00.000Z', // older than existing.updatedAt
      values: {
        title: 'Distributed KV v2',
        overview: existing.overview,
        status: existing.status,
        progressPercent: existing.progressPercent,
        deadlineDate: '2026-12-15',
        nextStep: existing.nextStep ?? '',
        blockers: existing.blockers ?? '',
        techStackText: existing.techStack.join(', '),
        repoUrl: existing.repoUrl ?? '',
        liveUrl: existing.liveUrl ?? '',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit details for Distributed KV' }));
    const editDialog = screen.getByRole('dialog', { name: 'Edit project' });
    expect(
      within(editDialog).getByText(/This project was updated after your local draft was saved/),
    ).toBeInTheDocument();
    fireEvent.click(within(editDialog).getByRole('button', { name: 'Resume draft' }));

    state.updateAsync.mockRejectedValueOnce(new Error('Patch failed'));
    fireEvent.submit(within(editDialog).getByLabelText('Title').closest('form')!);
    await within(editDialog).findByText('Patch failed');
    expect(within(editDialog).getByLabelText('Title')).toHaveValue('Distributed KV v2');

    // Patch must only change edited fields so linkedTaskIds/linkedMilestoneIds stay untouched on server
    const sentPatch = state.updateAsync.mock.calls[0]![0] as {
      id: string;
      patch: Record<string, unknown>;
    };
    expect(sentPatch).toEqual({
      id: existing.id,
      patch: { title: 'Distributed KV v2' },
    });
    expect(sentPatch.patch).not.toHaveProperty('linkedTaskIds');
    expect(sentPatch.patch).not.toHaveProperty('linkedMilestoneIds');

    state.updateAsync.mockResolvedValueOnce({ ...existing, title: 'Distributed KV v2' });
    fireEvent.submit(within(editDialog).getByLabelText('Title').closest('form')!);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Edit project' })).toBeNull());
    expect(window.localStorage.getItem(makeEditorDraftKey('project', existing.id))).toBeNull();
  });
});
