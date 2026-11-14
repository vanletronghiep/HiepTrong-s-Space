// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadEditorDraft, makeEditorDraftKey, saveEditorDraft } from '@/client/editor-drafts';
import type { AchievementItem } from '@/contracts/achievement';
import { AchievementsView } from '@/features/achievements/AchievementsView';
import { TransitionProvider } from '@/features/transitions/TransitionProvider';
import { ToastProvider } from '@/ui/Toast';

const state = vi.hoisted(() => ({
  achievements: [] as AchievementItem[],
  isLoading: false,
  isError: false,
  lastRequestedEra: undefined as string | undefined,
  refetch: vi.fn(),
  createAsync: vi.fn(),
  updateAsync: vi.fn(),
  deleteMutate: vi.fn(),
  deleteIsPending: false,
  anchorSpy: vi.fn(),
}));

vi.mock('@/ui/use-item-anchor', () => ({
  useItemAnchor: (items: readonly { id: string }[]) => state.anchorSpy(items),
}));

vi.mock('@/client/queries/achievements', () => ({
  useAchievements: (era?: string) => {
    state.lastRequestedEra = era;
    return {
      data: state.achievements,
      isLoading: state.isLoading,
      isError: state.isError,
      refetch: state.refetch,
    };
  },
  useCreateAchievement: () => ({
    mutateAsync: state.createAsync,
  }),
  useUpdateAchievement: () => ({
    mutateAsync: state.updateAsync,
  }),
  useDeleteAchievement: () => ({
    mutate: state.deleteMutate,
    isPending: state.deleteIsPending,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/achievements',
}));

function renderAchievements() {
  return render(
    <ToastProvider>
      <TransitionProvider>
        <AchievementsView />
      </TransitionProvider>
    </ToastProvider>,
  );
}

const sampleAchievement = (overrides: Partial<AchievementItem> = {}): AchievementItem => ({
  id: 'ach-1',
  title: 'National Informatics Olympiad',
  era: 'high_school',
  year: '2024',
  awardOrRole: 'Silver medal',
  organization: 'Ministry of Education',
  description: 'Solved algorithmic optimization and dynamic programming problems over two days.',
  lessonsLearned: 'Calmly decomposing edge cases under time pressure prevents costly rewrites.',
  futureDate: null,
  reminderEnabled: false,
  featured: true,
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

describe('AchievementsView Roman Marble Gallery', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    state.achievements = [];
    state.isLoading = false;
    state.isError = false;
    state.lastRequestedEra = undefined;
    state.refetch.mockReset();
    state.createAsync.mockReset();
    state.updateAsync.mockReset();
    state.deleteMutate.mockReset();
    state.deleteIsPending = false;
    state.anchorSpy.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('ships exactly 5 safe static SVGs in public/visuals/personal-achievements and renders decorative SVGs cleanly', async () => {
    const publicDir = path.resolve(process.cwd(), 'public', 'visuals', 'personal-achievements');
    const files = (await fs.readdir(publicDir)).sort();
    expect(files).toEqual([
      'acanthus-column-edge.svg',
      'ceremonial-marble-plinth.svg',
      'laurel-spray.svg',
      'marble-arcade.svg',
      'roman-mosaic-band.svg',
    ]);

    for (const file of files) {
      const svg = await fs.readFile(path.join(publicDir, file), 'utf8');
      expect(svg).not.toMatch(/<script|\bon[a-z]+=|<animate|<foreignObject/i);
    }

    const { container } = renderAchievements();
    const images = Array.from(container.querySelectorAll('img'));
    const srcs = images.map((img) => img.getAttribute('src') ?? '').sort();

    expect(srcs).toEqual([
      '/visuals/personal-achievements/acanthus-column-edge.svg',
      '/visuals/personal-achievements/ceremonial-marble-plinth.svg',
      '/visuals/personal-achievements/laurel-spray.svg',
      '/visuals/personal-achievements/marble-arcade.svg',
      '/visuals/personal-achievements/roman-mosaic-band.svg',
    ]);
    for (const img of images) {
      expect(img).toHaveAttribute('alt', '');
      expect(img).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('renders loading skeletons and non-blocking Retry banner on load error', () => {
    state.isLoading = true;
    const { rerender } = renderAchievements();
    expect(screen.getByLabelText('Loading achievements gallery')).toBeInTheDocument();

    state.isLoading = false;
    state.isError = true;
    rerender(
      <ToastProvider>
        <TransitionProvider>
          <AchievementsView />
        </TransitionProvider>
      </ToastProvider>,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Could not load your achievements gallery right now/i);
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(state.refetch).toHaveBeenCalledTimes(1);
  });

  it('renders all 6 era filter radio chips including Elementary and supports roving keyboard navigation', () => {
    renderAchievements();

    const radioGroup = screen.getByRole('radiogroup', { name: 'Filter by era' });
    const radios = within(radioGroup).getAllByRole('radio');
    expect(radios.map((r) => r.textContent)).toEqual([
      'All eras',
      'University',
      'High school',
      'Secondary',
      'Elementary',
      'Upcoming contests',
    ]);

    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(state.lastRequestedEra).toBeUndefined();

    // Keyboard roving navigation: End -> Upcoming contests, ArrowLeft -> Elementary, Home -> All eras
    radios[0]!.focus();
    fireEvent.keyDown(radios[0]!, { key: 'End' });
    expect(radios[5]).toHaveAttribute('aria-checked', 'true');
    expect(radios[5]).toHaveFocus();
    expect(state.lastRequestedEra).toBe('future_contest');

    fireEvent.keyDown(radios[5]!, { key: 'ArrowLeft' });
    expect(radios[4]).toHaveAttribute('aria-checked', 'true');
    expect(radios[4]).toHaveFocus();
    expect(state.lastRequestedEra).toBe('elementary');

    fireEvent.keyDown(radios[4]!, { key: 'Home' });
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveFocus();
    expect(state.lastRequestedEra).toBeUndefined();

    fireEvent.click(radios[4]!);
    expect(radios[4]).toHaveAttribute('aria-checked', 'true');
    expect(state.lastRequestedEra).toBe('elementary');
  });

  it('switches between View mode and Edit mode, formats future_contest dates in Asia/Saigon, and handles featured toggle', async () => {
    state.achievements = [
      sampleAchievement({
        id: 'ach-featured',
        title: 'ICPC Regional Finals',
        era: 'university',
        featured: true,
      }),
      sampleAchievement({
        id: 'ach-future-dated',
        title: 'ACM Collegiate Cup',
        era: 'future_contest',
        year: '2027',
        futureDate: '2027-03-15T18:30:00.000Z',
        reminderEnabled: true,
        featured: false,
      }),
      sampleAchievement({
        id: 'ach-future-tbd',
        title: 'Autumn Systems Challenge',
        era: 'future_contest',
        year: '2027',
        futureDate: null,
        reminderEnabled: false,
        featured: false,
      }),
    ];
    state.updateAsync.mockResolvedValue({ ...state.achievements[1], featured: true });

    renderAchievements();

    // View mode hides editing controls
    expect(screen.queryByRole('button', { name: 'Add record' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit ICPC Regional Finals' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete ICPC Regional Finals' }),
    ).not.toBeInTheDocument();

    // Sentence-case era badge, featured badge, and Asia/Saigon date formatting (18:30Z -> Mar 16 in +07:00)
    expect(screen.getAllByText('Upcoming contest').length).toBe(2);
    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(
      screen.getByText(/Connected to notification reminders · Upcoming on Mar 16, 2027/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Notification reminder off · Contest date to be scheduled/i),
    ).toBeInTheDocument();

    // Switch to Edit mode
    fireEvent.click(screen.getByRole('button', { name: 'Edit mode' }));
    expect(screen.getByRole('button', { name: 'Add record' })).toBeInTheDocument();

    const featureBtn = screen.getByRole('button', { name: 'Feature ACM Collegiate Cup' });
    await act(async () => {
      fireEvent.click(featureBtn);
    });
    expect(state.updateAsync).toHaveBeenCalledWith({
      id: 'ach-future-dated',
      patch: { featured: true },
    });
  });

  it('uses ConfirmDialog instead of window.confirm for delete and clears saved edit draft on success', () => {
    const item = sampleAchievement({ id: 'ach-del', title: 'Physics Medal' });
    state.achievements = [item];
    const confirmSpy = vi.spyOn(window, 'confirm');

    saveEditorDraft({
      formId: 'achievement',
      recordId: item.id,
      recordUpdatedAt: null,
      values: {
        title: 'Physics Medal Draft',
        era: item.era,
        year: item.year,
        awardOrRole: item.awardOrRole,
        organization: item.organization,
        description: item.description,
        lessonsLearned: item.lessonsLearned,
        futureDate: '',
        reminderEnabled: false,
        featured: item.featured,
      },
    });

    state.deleteMutate.mockImplementation((_id: string, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });

    renderAchievements();
    fireEvent.click(screen.getByRole('button', { name: 'Edit mode' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete Physics Medal' }));

    expect(confirmSpy).not.toHaveBeenCalled();
    const confirmDialog = screen.getByRole('dialog', { name: 'Remove achievement record?' });
    expect(confirmDialog).toHaveTextContent('“Physics Medal”');

    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Remove' }));

    expect(state.deleteMutate).toHaveBeenCalledWith('ach-del', expect.any(Object));
    expect(window.localStorage.getItem(makeEditorDraftKey('achievement', 'ach-del'))).toBeNull();
  });

  it('creates and edits records via LargeEditorDialog + LargeEditorTwoColumn, retains input on validation/mutation failure, and supports featured + future_contest', async () => {
    const existing = sampleAchievement({
      id: 'ach-edit',
      title: 'Regional Math Contest',
      era: 'secondary',
      year: '2021',
      featured: false,
    });
    state.achievements = [existing];
    state.createAsync.mockRejectedValueOnce(new Error('Database unavailable'));
    state.createAsync.mockResolvedValueOnce(
      sampleAchievement({ id: 'ach-new', title: 'ICPC Asia', era: 'future_contest' }),
    );
    state.updateAsync.mockResolvedValueOnce({
      ...existing,
      title: 'Regional Math Contest Honors',
      featured: true,
    });

    renderAchievements();
    fireEvent.click(screen.getByRole('button', { name: 'Edit mode' }));

    // Create flow with validation retention & mutation error retention
    fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
    const createDialog = screen.getByRole('dialog', { name: 'Add achievement or contest' });

    const titleInput = within(createDialog).getByLabelText('Title');
    await waitFor(() => {
      expect(titleInput).toHaveFocus();
    });

    // Submit empty title -> inline validation alert without closing
    fireEvent.click(within(createDialog).getByRole('button', { name: 'Save record' }));
    expect(within(createDialog).getByRole('alert')).toHaveTextContent(
      'Enter an achievement or contest title.',
    );

    fireEvent.change(titleInput, { target: { value: 'ICPC Asia' } });
    fireEvent.change(within(createDialog).getByLabelText('Era'), {
      target: { value: 'future_contest' },
    });
    fireEvent.change(within(createDialog).getByLabelText('Year'), {
      target: { value: '2027' },
    });
    fireEvent.change(within(createDialog).getByLabelText('Scheduled contest date'), {
      target: { value: '2027-05-20' },
    });
    fireEvent.click(
      within(createDialog).getByRole('checkbox', { name: 'Connect to shared notification system' }),
    );
    fireEvent.click(within(createDialog).getByRole('checkbox', { name: 'Featured in gallery' }));

    // First submit fails -> error alert & input retained
    await act(async () => {
      fireEvent.click(within(createDialog).getByRole('button', { name: 'Save record' }));
    });
    expect(within(createDialog).getByRole('alert')).toHaveTextContent('Database unavailable');
    expect(within(createDialog).getByLabelText('Title')).toHaveValue('ICPC Asia');

    // Retry submit succeeds
    await act(async () => {
      fireEvent.click(within(createDialog).getByRole('button', { name: 'Save record' }));
    });
    expect(state.createAsync).toHaveBeenLastCalledWith({
      title: 'ICPC Asia',
      era: 'future_contest',
      year: '2027',
      awardOrRole: '',
      organization: '',
      description: '',
      lessonsLearned: '',
      futureDate: '2027-05-20',
      reminderEnabled: true,
      featured: true,
    });
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Add achievement or contest' }),
      ).not.toBeInTheDocument();
    });

    // Edit flow via useUpdateAchievement
    fireEvent.click(screen.getByRole('button', { name: 'Edit Regional Math Contest' }));
    const editDialog = screen.getByRole('dialog', { name: 'Edit achievement or contest' });
    fireEvent.change(within(editDialog).getByLabelText('Title'), {
      target: { value: 'Regional Math Contest Honors' },
    });
    fireEvent.click(within(editDialog).getByRole('checkbox', { name: 'Featured in gallery' }));

    await act(async () => {
      fireEvent.click(within(editDialog).getByRole('button', { name: 'Save changes' }));
    });

    expect(state.updateAsync).toHaveBeenCalledWith({
      id: 'ach-edit',
      patch: {
        title: 'Regional Math Contest Honors',
        featured: true,
      },
    });
  });

  it('guards dirty close with 3-choice prompt, saves and resumes local drafts across remount, and discards orphaned drafts', () => {
    // Seed an orphaned edit draft whose recordId is absent from loaded achievements
    saveEditorDraft({
      formId: 'achievement',
      recordId: 'ach-missing',
      recordUpdatedAt: null,
      values: {
        title: 'Missing Record Draft',
        era: 'university',
        year: '2025',
        awardOrRole: '',
        organization: '',
        description: '',
        lessonsLearned: '',
        futureDate: '',
        reminderEnabled: false,
        featured: false,
      },
    });

    const firstMount = renderAchievements();

    // Orphan banner & discard
    expect(
      screen.getByText(
        /1 saved local edit draft refers to a record that is no longer in your gallery/i,
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Discard missing drafts' }));
    expect(
      window.localStorage.getItem(makeEditorDraftKey('achievement', 'ach-missing')),
    ).toBeNull();

    // Open editor, dirty it, and trigger dirty-close prompt
    fireEvent.click(screen.getByRole('button', { name: 'Edit mode' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
    const dialog = screen.getByRole('dialog', { name: 'Add achievement or contest' });
    fireEvent.change(within(dialog).getByLabelText('Title'), {
      target: { value: 'Unfinished Olympiad Entry' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    const prompt = screen.getByRole('dialog', { name: 'Save changes before closing?' });
    expect(within(prompt).getByRole('button', { name: 'Discard changes' })).toBeInTheDocument();
    expect(within(prompt).getByRole('button', { name: 'Continue editing' })).toBeInTheDocument();
    expect(
      within(prompt).getByRole('button', { name: 'Save draft and close' }),
    ).toBeInTheDocument();

    // Save draft and close
    fireEvent.click(within(prompt).getByRole('button', { name: 'Save draft and close' }));
    const saved = loadEditorDraft('achievement', null);
    expect(saved.ok).toBe(true);
    if (saved.ok) {
      expect(saved.draft?.recordUpdatedAt).toBeNull();
      expect((saved.draft?.values as { title: string }).title).toBe('Unfinished Olympiad Entry');
    }

    // Remount and resume saved local draft
    firstMount.unmount();
    renderAchievements();
    fireEvent.click(screen.getByRole('button', { name: 'Edit mode' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add record' }));
    const reopened = screen.getByRole('dialog', { name: 'Add achievement or contest' });
    expect(within(reopened).getByText(/Local draft saved/i)).toBeInTheDocument();

    fireEvent.click(within(reopened).getByRole('button', { name: 'Resume draft' }));
    expect(within(reopened).getByLabelText('Title')).toHaveValue('Unfinished Olympiad Entry');
  });
});
