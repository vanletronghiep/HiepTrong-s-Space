// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projectItemSchema, type ProjectItem } from '@/contracts/project';
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
  deleteMutate: vi.fn(),
}));

vi.mock('@/ui/use-item-anchor', () => ({ useItemAnchor: () => undefined }));

vi.mock('@/client/queries/projects', () => ({
  useProjects: () => ({
    data: state.projects,
    isLoading: state.isLoading,
    isError: state.isError,
    refetch: state.refetch,
  }),
  useCreateProject: () => ({ mutateAsync: state.createAsync, isPending: false }),
  useUpdateProject: () => ({ mutate: state.updateMutate }),
  useDeleteProject: () => ({ mutate: state.deleteMutate, isPending: false }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/focus',
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

const block = (id: string, title: string, done = false) => ({
  id,
  title,
  description: '',
  done,
  doneAt: done ? '2026-11-10T00:00:00.000Z' : null,
});

const focus = (overrides: Record<string, unknown> = {}): ProjectItem =>
  projectItemSchema.parse({
    id: 'p1',
    title: 'IELTS 7.5',
    why: 'Needed for the exchange application.',
    priority: 'critical',
    status: 'moderate',
    deadlineAt: '2027-02-28',
    deadlinePhrase: 'end of February',
    roadmap: [block('c1', 'Diagnostic', true), block('c2', 'Essay drills'), block('c3', 'Mocks')],
    history: [],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-10T08:00:00.000Z',
    ...overrides,
  });

describe('ProjectsView current focus', () => {
  beforeEach(() => {
    state.projects = [];
    state.isLoading = false;
    state.isError = false;
    state.refetch.mockReset();
    state.createAsync.mockReset();
    state.updateMutate.mockReset();
    state.deleteMutate.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows a skeleton while loading and a retry alert when loading fails', () => {
    state.isLoading = true;
    renderProjects().unmount();
    state.isLoading = false;
    state.isError = true;
    renderProjects();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Could not load your focuses/);
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(state.refetch).toHaveBeenCalledTimes(1);
  });

  it('shows the chosen art, all decorative: masthead, emblems, bamboo rule and footer', () => {
    state.projects = [
      focus({ finishedAt: null }),
      focus({ id: 'p9', title: 'Done one', finishedAt: '2026-11-12T00:00:00.000Z' }),
    ];
    renderProjects();
    const srcs = Array.from(document.querySelectorAll('img')).map((img) => ({
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt'),
      hidden: img.getAttribute('aria-hidden'),
    }));
    for (const name of [
      'ridge-and-rising-sun',
      'emblem-seal',
      'emblem-bamboo',
      'emblem-mountain',
      'bamboo-rule',
      'distant-mountains',
      'jade-stamp-check',
    ]) {
      expect(srcs, name).toContainEqual({
        src: `/visuals/project/${name}.svg`,
        alt: '',
        hidden: 'true',
      });
    }
    expect(srcs.some((s) => s.src === '/visuals/project/dragon-over-the-ridge.svg')).toBe(false);
  });

  it('gives the open panel one piece of corner art and lotus markers on the roadmap', () => {
    state.projects = [focus()];
    renderProjects();
    const dialog = openPanel();
    const art = Array.from(dialog.querySelectorAll('img[class*="watermarkArt"]')).map((img) =>
      img.getAttribute('src'),
    );
    expect(art).toHaveLength(1);
    expect(art[0]).toMatch(
      /crane-against-the-moon|scholars-pavilion|pine-and-full-moon|paper-lantern|plum-blossom-branch|cloud-curls/,
    );
    expect(dialog.querySelectorAll('img[src*="lotus-"]').length).toBe(9); // 3 checkpoints x 3 states
    expect(dialog.querySelector('img[src*="summit-pennant"]')).not.toBeNull();
  });

  it('drops the removed sections and shows the tier switcher', () => {
    state.projects = [focus()];
    renderProjects();
    expect(screen.queryByText('Total focuses')).toBeNull();
    expect(screen.queryByText('Average progress')).toBeNull();
    expect(screen.queryByRole('button', { name: /Increase progress/ })).toBeNull();
    const group = screen.getByRole('radiogroup', { name: 'Focus tier' });
    expect(
      within(group)
        .getAllByRole('radio')
        .map((r) => r.textContent?.replace(/\d+$/, '')),
    ).toEqual(['All', 'Background', 'Active', 'Critical']);
  });

  it('shows progress from the roadmap, status, priority and the next checkpoint on the card', () => {
    state.projects = [focus()];
    renderProjects();
    const card = screen.getByRole('button', { name: 'Open IELTS 7.5' });
    expect(within(card).getByText('33%')).toBeInTheDocument();
    expect(within(card).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
    expect(within(card).getByText('Critical')).toBeInTheDocument();
    expect(within(card).getByText('Moderate')).toBeInTheDocument();
    expect(within(card).getByText('Essay drills')).toBeInTheDocument();
  });

  it('filters by tier with the switcher and moves with arrow keys', async () => {
    state.projects = [
      focus(),
      focus({ id: 'p2', title: 'Running habit', priority: 'background', deadlineAt: null }),
    ];
    renderProjects();
    expect(screen.getAllByRole('button', { name: /^Open / })).toHaveLength(2);

    fireEvent.click(screen.getByRole('radio', { name: /^Background/ }));
    expect(screen.getByRole('radio', { name: /^Background/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Open Running habit' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Open IELTS 7.5' })).toBeNull(),
    );

    fireEvent.keyDown(screen.getByRole('radiogroup', { name: 'Focus tier' }), {
      key: 'ArrowRight',
    });
    expect(screen.getByRole('radio', { name: /^Active/ })).toHaveAttribute('aria-checked', 'true');
    expect(await screen.findByText(/No active focuses right now/)).toBeInTheDocument();
  });

  it('puts finished focuses in a folded list instead of the grid', () => {
    state.projects = [focus({ finishedAt: '2026-11-12T00:00:00.000Z' })];
    renderProjects();
    expect(screen.queryByRole('button', { name: 'Open IELTS 7.5' })).toBeNull();
    expect(screen.getByText('Finished (1)')).toBeInTheDocument();
  });

  const NOTES = [
    { id: 'n1', at: '2026-11-18T01:00:00.000Z', text: 'Speaking mock 2', editedAt: null },
    { id: 'n2', at: '2026-11-17T01:00:00.000Z', text: 'Timed essay', editedAt: null },
  ];

  const openPanel = (mode: 'view' | 'edit' = 'view') => {
    fireEvent.click(screen.getByRole('button', { name: 'Open IELTS 7.5' }));
    const dialog = screen.getByRole('dialog', { name: 'IELTS 7.5' });
    if (mode === 'edit') fireEvent.click(within(dialog).getByRole('button', { name: 'Edit' }));
    return dialog;
  };

  const deleteInEditor = (dialog: HTMLElement) => {
    const editor = within(dialog).getByLabelText('Edit note', { selector: 'textarea' });
    return within(editor.parentElement as HTMLElement).getByRole('button', { name: 'Delete' });
  };

  it('opens in View mode with text locked and the edit tools hidden', () => {
    state.projects = [focus()];
    renderProjects();
    const dialog = openPanel();
    expect(within(dialog).getByRole('button', { name: 'View' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // Text is plain display elements, not read-only fields: no caret, nothing to focus.
    expect(within(dialog).queryByLabelText('Focus title')).toBeNull();
    expect(within(dialog).queryByRole('textbox', { name: 'Why' })).toBeNull();
    expect(within(dialog).queryByLabelText(/^Checkpoint \d+ title/)).toBeNull();
    expect(within(dialog).queryByLabelText(/^Checkpoint \d+ description/)).toBeNull();
    const shownTitle = within(dialog).getByText('IELTS 7.5');
    expect(shownTitle.tagName).toBe('DIV');
    expect(within(dialog).getByText('Needed for the exchange application.').tagName).toBe('SPAN');
    expect(within(dialog).getByText('Essay drills').tagName).toBe('DIV');
    // Double-clicking text does nothing.
    fireEvent.doubleClick(shownTitle);
    expect(within(dialog).queryByLabelText('Focus title')).toBeNull();
    expect(within(dialog).getByRole('button', { name: 'Delete' })).toBeEnabled();
    expect(within(dialog).queryByLabelText('New checkpoint')).toBeNull();
    expect(within(dialog).queryByRole('button', { name: /^Remove checkpoint/ })).toBeNull();
    // Chips show the values but are not menus.
    expect(within(dialog).queryByRole('button', { name: 'Status' })).toBeNull();
    expect(within(dialog).getByText('Moderate')).toBeInTheDocument();
    expect(within(dialog).getByText('Critical')).toBeInTheDocument();
  });

  it('locks ticking and logging in View mode and unlocks them in Edit mode', () => {
    state.projects = [focus()];
    renderProjects();
    const dialog = openPanel();
    expect(within(dialog).getByRole('progressbar', { name: 'Progress' })).toHaveAttribute(
      'aria-valuenow',
      '33',
    );
    expect(within(dialog).getByText('You are here')).toBeInTheDocument();

    const tick = within(dialog).getByRole('button', { name: 'Mark done: Essay drills' });
    expect(tick).toBeDisabled();
    fireEvent.click(tick);
    expect(within(dialog).getByLabelText('What did you do?')).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Log' })).toBeDisabled();
    expect(state.updateMutate).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Edit' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mark done: Essay drills' }));
    const [{ id, patch }] = state.updateMutate.mock.calls[0] as [
      { id: string; patch: { roadmap: ProjectItem['roadmap'] } },
    ];
    expect(id).toBe('p1');
    expect(patch.roadmap.map((b) => b.done)).toEqual([true, true, false]);

    fireEvent.change(within(dialog).getByLabelText('What did you do?'), {
      target: { value: 'Speaking mock 3' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Log' }));
    expect(state.updateMutate.mock.calls[1]?.[0]).toEqual({
      id: 'p1',
      patch: { logNote: 'Speaking mock 3' },
    });
  });

  it('unlocks text, Delete and the checkpoint tools in Edit mode', () => {
    state.projects = [focus()];
    renderProjects();
    const dialog = openPanel('edit');
    expect(within(dialog).getByLabelText('Focus title')).toBeEnabled();
    expect(within(dialog).getByLabelText('Why')).toBeEnabled();
    expect(within(dialog).getByLabelText('Checkpoint 2 title')).toBeEnabled();
    expect(within(dialog).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(within(dialog).getByLabelText('New checkpoint')).toBeInTheDocument();
    expect(
      within(dialog).getAllByRole('button', { name: /^Remove checkpoint/ }).length,
    ).toBeGreaterThan(0);
    // Back to View locks it again.
    fireEvent.click(within(dialog).getByRole('button', { name: 'View' }));
    expect(within(dialog).queryByLabelText('Focus title')).toBeNull();
  });

  it('changes status and priority from the chip menus in Edit mode', async () => {
    state.projects = [focus()];
    renderProjects();
    const dialog = openPanel('edit');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Status' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Intensive', hidden: true }));
    expect(state.updateMutate.mock.calls[0]?.[0]).toEqual({
      id: 'p1',
      patch: { status: 'intensive' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Priority' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Background', hidden: true }));
    expect(state.updateMutate.mock.calls[1]?.[0]).toEqual({
      id: 'p1',
      patch: { priority: 'background' },
    });
  });

  it('previews a typed deadline and saves the resolved date after a pause', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-18T05:00:00Z'));
    try {
      state.projects = [focus({ deadlineAt: null, deadlinePhrase: null })];
      renderProjects();
      const dialog = openPanel('edit');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Deadline' }));
      const input = await screen.findByLabelText('Deadline', { selector: 'input' });

      fireEvent.change(input, { target: { value: 'next friday' } });
      expect(screen.getByText(/2026-11-27 · in 9 days/)).toBeInTheDocument();
      await waitFor(
        () =>
          expect(state.updateMutate.mock.calls.at(-1)?.[0]).toEqual({
            id: 'p1',
            patch: { deadlineAt: '2026-11-27', deadlinePhrase: 'next friday' },
          }),
        { timeout: 2000 },
      );

      state.updateMutate.mockClear();
      fireEvent.change(input, { target: { value: 'sometime soon-ish' } });
      expect(screen.getByText(/Not sure what date that is/)).toBeInTheDocument();
      await new Promise((resolve) => setTimeout(resolve, 800));
      expect(state.updateMutate).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  const describedFocus = (description: string) =>
    focus({
      roadmap: [
        { id: 'c1', title: 'Write plan', description, done: false, doneAt: null },
        block('c2', 'Second'),
      ],
    });

  it('renders checkpoint descriptions as formatted text in View mode, with no Markdown markers', () => {
    state.projects = [
      describedFocus(
        '# Plan\n## Steps\n### Detail\n- **bold** item\n- *soft* item\nrun `npm test` now',
      ),
    ];
    renderProjects();
    const dialog = openPanel();
    expect(within(dialog).getByRole('heading', { name: 'Plan', level: 4 })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Steps', level: 5 })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Detail', level: 6 })).toBeInTheDocument();
    expect(dialog.querySelectorAll('ul li')).toHaveLength(2);
    expect(within(dialog).getByText('bold').tagName).toBe('STRONG');
    expect(within(dialog).getByText('soft').tagName).toBe('EM');
    expect(within(dialog).getByText('npm test').tagName).toBe('CODE');
    const text = dialog.textContent ?? '';
    expect(text).not.toMatch(/\*\*|`|# Plan|- bold/);
  });

  it('grows a description to fit all its text in Edit mode, with no length cap at two lines', () => {
    const scrollHeight = vi
      .spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(240);
    state.projects = [describedFocus('long text '.repeat(120))];
    renderProjects();
    const dialog = openPanel('edit');
    const box = within(dialog).getByLabelText('Checkpoint 1 description') as HTMLTextAreaElement;
    expect(box.style.height).toBe('240px');
    expect(box.maxLength).toBe(4000);
    scrollHeight.mockReturnValue(400);
    fireEvent.change(box, { target: { value: `${box.value} and more` } });
    expect(box.style.height).toBe('400px');
  });

  it.each([
    ['Windows or Linux', 'Win32', { ctrlKey: true }],
    ['macOS', 'MacIntel', { metaKey: true }],
  ])(
    'bolds and italicises with the keyboard on %s, without any visible toolbar',
    (_name, platform, mod) => {
      vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
      state.projects = [describedFocus('make this bold')];
      renderProjects();
      const dialog = openPanel('edit');
      expect(within(dialog).queryByRole('button', { name: /bold|italic/i })).toBeNull();

      const box = within(dialog).getByLabelText('Checkpoint 1 description') as HTMLTextAreaElement;
      box.focus();
      box.setSelectionRange(5, 9);
      fireEvent.keyDown(box, { key: 'b', ...mod });
      expect(box.value).toBe('make **this** bold');
      expect([box.selectionStart, box.selectionEnd]).toEqual([7, 11]);

      fireEvent.keyDown(box, { key: 'i', ...mod });
      expect(box.value).toBe('make ***this*** bold');

      // The other platform's modifier does nothing.
      const wrong = platform === 'MacIntel' ? { ctrlKey: true } : { metaKey: true };
      fireEvent.keyDown(box, { key: 'b', ...wrong });
      expect(box.value).toBe('make ***this*** bold');
    },
  );

  it('opens a bold pair at the caret so the next typing is bold', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
    state.projects = [describedFocus('')];
    renderProjects();
    const dialog = openPanel('edit');
    const box = within(dialog).getByLabelText('Checkpoint 1 description') as HTMLTextAreaElement;
    box.focus();
    fireEvent.keyDown(box, { key: 'b', ctrlKey: true });
    expect(box.value).toBe('****');
    expect(box.selectionStart).toBe(2);
    fireEvent.change(box, { target: { value: '**hi**' } });
    expect(box.value).toBe('**hi**');
  });

  it('has no automatic events control and shows only notes in History', () => {
    state.projects = [focus({ history: NOTES })];
    renderProjects();
    const dialog = openPanel();
    expect(within(dialog).queryByText('Show automatic events')).toBeNull();
    expect(within(dialog).getByText('Speaking mock 2')).toBeInTheDocument();
    expect(within(dialog).getByText('Timed essay')).toBeInTheDocument();
  });

  it('edits a note by double-click in Edit mode, saves on Enter and cancels on Escape', () => {
    state.projects = [focus({ history: NOTES })];
    renderProjects();
    const dialog = openPanel();

    // View mode: double-click does nothing.
    fireEvent.doubleClick(within(dialog).getByText('Speaking mock 2'));
    expect(within(dialog).queryByLabelText('Edit note', { selector: 'textarea' })).toBeNull();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Edit' }));
    fireEvent.doubleClick(within(dialog).getByText('Speaking mock 2'));
    const box = within(dialog).getByLabelText('Edit note', { selector: 'textarea' });
    expect(box).toHaveValue('Speaking mock 2');

    // Escape cancels and leaves the panel open.
    fireEvent.change(box, { target: { value: 'Something else' } });
    fireEvent.keyDown(box, { key: 'Escape' });
    expect(within(dialog).queryByLabelText('Edit note', { selector: 'textarea' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'IELTS 7.5' })).toBeInTheDocument();
    expect(state.updateMutate).not.toHaveBeenCalled();

    fireEvent.doubleClick(within(dialog).getByText('Speaking mock 2'));
    const again = within(dialog).getByLabelText('Edit note', { selector: 'textarea' });
    fireEvent.change(again, { target: { value: 'Speaking mock 2, fluency better' } });
    fireEvent.keyDown(again, { key: 'Enter' });
    expect(state.updateMutate.mock.calls[0]?.[0]).toEqual({
      id: 'p1',
      patch: { editNote: { id: 'n1', text: 'Speaking mock 2, fluency better' } },
    });
  });

  it('deletes a note after the Undo window and can undo it first', () => {
    vi.useFakeTimers();
    try {
      state.projects = [focus({ history: NOTES })];
      renderProjects();
      const dialog = openPanel('edit');

      fireEvent.doubleClick(within(dialog).getByText('Speaking mock 2'));
      fireEvent.click(deleteInEditor(dialog));
      expect(within(dialog).queryByText('Speaking mock 2')).toBeNull();
      // Undo brings it back and nothing is sent.
      fireEvent.click(within(dialog).getByRole('button', { name: 'Undo' }));
      expect(within(dialog).getByText('Speaking mock 2')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(7000);
      });
      expect(state.updateMutate).not.toHaveBeenCalled();

      // Without Undo it is removed for good.
      fireEvent.doubleClick(within(dialog).getByText('Timed essay'));
      fireEvent.click(deleteInEditor(dialog));
      act(() => {
        vi.advanceTimersByTime(7000);
      });
      expect(state.updateMutate.mock.calls[0]?.[0]).toEqual({
        id: 'p1',
        patch: { deleteNote: 'n2' },
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('lets one column take the whole panel with the view switch', () => {
    state.projects = [focus()];
    renderProjects();
    const dialog = openPanel();
    const body = dialog.querySelector('[class*="panelBody"]');
    expect(body?.className).not.toMatch(/bodyRoadmap|bodyHistory/);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Roadmap' }));
    expect(body?.className).toMatch(/bodyRoadmap/);
    fireEvent.click(within(dialog).getByRole('button', { name: 'History' }));
    expect(body?.className).toMatch(/bodyHistory/);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Split' }));
    expect(body?.className).not.toMatch(/bodyRoadmap|bodyHistory/);
  });

  it('offers Mark as finished only once every checkpoint is done, and only in Edit mode', () => {
    state.projects = [focus({ roadmap: [block('a', 'Only step', true)] })];
    renderProjects();
    openPanel();
    expect(screen.getByRole('button', { name: 'Mark as finished' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark as finished' }));
    expect(state.updateMutate.mock.calls[0]?.[0]).toEqual({ id: 'p1', patch: { finished: true } });
  });

  const startNewFocus = () => {
    fireEvent.click(screen.getAllByRole('button', { name: 'New focus' })[0]!);
    return screen.getByRole('dialog', { name: 'Focus details' });
  };

  it('opens a new focus as an unsaved draft without creating anything', () => {
    renderProjects();
    fireEvent.click(screen.getByRole('radio', { name: /^Critical/ }));
    const dialog = startNewFocus();
    expect(state.createAsync).not.toHaveBeenCalled();
    expect(within(dialog).getByLabelText('Focus title')).toHaveValue('');
    expect(within(dialog).getByRole('button', { name: 'Save focus' })).toBeDisabled();
    expect(within(dialog).queryByRole('button', { name: 'View' })).toBeNull();
    expect(within(dialog).getByLabelText('What did you do?')).toBeDisabled();
  });

  it('closes an empty draft silently, with nothing saved and no prompt', async () => {
    renderProjects();
    const dialog = startNewFocus();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close focus' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(state.createAsync).not.toHaveBeenCalled();
  });

  it('asks to save or discard when leaving a draft that has content', async () => {
    renderProjects();
    const dialog = startNewFocus();
    fireEvent.change(within(dialog).getByLabelText('Focus title'), {
      target: { value: 'Learn Rust' },
    });

    // Clicking the backdrop, the close button and Escape all ask first.
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close focus' }));
    const prompt = await screen.findByRole('dialog', { name: 'Save this focus before leaving?' });
    expect(state.createAsync).not.toHaveBeenCalled();

    // Keep editing returns to the draft.
    fireEvent.click(within(prompt).getByRole('button', { name: 'Keep editing' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Save this focus before leaving?' })).toBeNull(),
    );
    expect(screen.getByRole('dialog', { name: 'Learn Rust' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      await screen.findByRole('dialog', { name: 'Save this focus before leaving?' }),
    ).toBeInTheDocument();
  });

  it('discards a draft without saving it', async () => {
    renderProjects();
    const dialog = startNewFocus();
    fireEvent.change(within(dialog).getByLabelText('Focus title'), {
      target: { value: 'Learn Rust' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close focus' }));
    const prompt = await screen.findByRole('dialog', { name: 'Save this focus before leaving?' });
    fireEvent.click(within(prompt).getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(state.createAsync).not.toHaveBeenCalled();
  });

  it('saves a draft from the leave prompt and closes, creating it with what was written', async () => {
    state.createAsync.mockImplementation(async (input: { title: string }) =>
      focus({ id: 'new', title: input.title }),
    );
    renderProjects();
    fireEvent.click(screen.getByRole('radio', { name: /^Critical/ }));
    const dialog = startNewFocus();
    fireEvent.change(within(dialog).getByLabelText('Focus title'), {
      target: { value: 'Learn Rust' },
    });
    fireEvent.change(within(dialog).getByLabelText('Why'), { target: { value: 'Systems work' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close focus' }));
    const prompt = await screen.findByRole('dialog', { name: 'Save this focus before leaving?' });
    await act(async () => {
      fireEvent.click(within(prompt).getByRole('button', { name: 'Save' }));
    });
    expect(state.createAsync).toHaveBeenCalledTimes(1);
    expect(state.createAsync.mock.calls[0]?.[0]).toMatchObject({
      title: 'Learn Rust',
      why: 'Systems work',
      priority: 'critical',
      status: 'steady',
      roadmap: [],
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('saves a draft from the header button and stays open on the saved focus in View mode', async () => {
    state.createAsync.mockImplementation(async (input: { title: string }) => {
      const created = focus({ id: 'new', title: input.title });
      state.projects = [created];
      return created;
    });
    renderProjects();
    const dialog = startNewFocus();
    fireEvent.change(within(dialog).getByLabelText('Focus title'), {
      target: { value: 'Learn Rust' },
    });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save focus' }));
    });
    expect(state.createAsync).toHaveBeenCalledTimes(1);
    const saved = await screen.findByRole('dialog', { name: 'Learn Rust' });
    expect(within(saved).getByRole('button', { name: 'View' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('keeps the leave prompt open with the error when saving fails', async () => {
    state.createAsync.mockRejectedValue(new Error('Disk is full'));
    renderProjects();
    const dialog = startNewFocus();
    fireEvent.change(within(dialog).getByLabelText('Focus title'), {
      target: { value: 'Learn Rust' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close focus' }));
    const prompt = await screen.findByRole('dialog', { name: 'Save this focus before leaving?' });
    await act(async () => {
      fireEvent.click(within(prompt).getByRole('button', { name: 'Save' }));
    });
    expect(within(prompt).getByRole('alert')).toHaveTextContent('Disk is full');
  });

  it('needs a title to save a draft from the leave prompt', async () => {
    renderProjects();
    const dialog = startNewFocus();
    fireEvent.change(within(dialog).getByLabelText('Why'), { target: { value: 'Only a reason' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close focus' }));
    const prompt = await screen.findByRole('dialog', { name: 'Save this focus before leaving?' });
    expect(within(prompt).getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(within(prompt).getByText(/Give it a title/)).toBeInTheDocument();
  });

  it.each(['view', 'edit'] as const)('asks before deleting a focus in %s mode', (mode) => {
    state.projects = [focus()];
    renderProjects();
    const dialog = openPanel(mode);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(state.deleteMutate).not.toHaveBeenCalled();
    const confirm = screen.getByRole('dialog', { name: 'Delete focus?' });
    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));
    expect(state.deleteMutate.mock.calls[0]?.[0]).toBe('p1');
  });
});
