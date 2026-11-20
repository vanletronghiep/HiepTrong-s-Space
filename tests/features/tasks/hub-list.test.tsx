// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskDto } from '@/contracts';
import { HubList } from '@/features/tasks/hub/HubList';
import { TaskCard } from '@/features/tasks/shared/TaskCard';
import { TransitionProvider } from '@/features/transitions/TransitionProvider';
import { ToastProvider } from '@/ui/Toast';

const navState = vi.hoisted(() => ({
  search: '',
}));

const queryState = vi.hoisted(() => ({
  tasks: [] as TaskDto[],
  create: vi.fn(),
  update: vi.fn(),
  complete: vi.fn(),
  uncomplete: vi.fn(),
  transfer: vi.fn(),
  del: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/tasks',
  useSearchParams: () => new URLSearchParams(navState.search),
}));

vi.mock('@/client/queries/tasks', () => ({
  useTasks: () => ({
    data: queryState.tasks,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCreateTask: () => ({ mutateAsync: queryState.create, isPending: false }),
  useUpdateTask: () => ({ mutate: queryState.update, mutateAsync: queryState.update, isPending: false }),
  useCompleteTask: () => ({ mutate: queryState.complete, isPending: false }),
  useUncompleteTask: () => ({ mutate: queryState.uncomplete, isPending: false }),
  useTransferTask: () => ({ mutateAsync: queryState.transfer, isPending: false }),
  useDeleteTask: () => ({ mutate: queryState.del, isPending: false }),
  usePromoteSubtask: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/client/use-minute-ticker', () => ({
  useMinuteTicker: () => new Date('2026-10-30T03:00:00.000Z'), // 2026-10-30 10:00 ICT
}));

beforeEach(() => {
  navState.search = '';
  queryState.tasks = [];
  queryState.create.mockReset();
  queryState.update.mockReset();
  queryState.complete.mockReset();
  queryState.uncomplete.mockReset();
  queryState.transfer.mockReset();
  queryState.del.mockReset();
});

afterEach(() => {
  cleanup();
});

async function findFilesMatching(dir: string, pattern: RegExp): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findFilesMatching(fullPath, pattern)));
    } else if (pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function makeTask(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    title: overrides.title ?? 'Read Transformer paper',
    description: overrides.description ?? 'Attention Is All You Need section 3',
    priority: overrides.priority ?? 'normal',
    pinned: overrides.pinned ?? false,
    deadlineAt: overrides.deadlineAt ?? '2026-11-02T12:00:00.000Z', // 19:00 ICT
    scheduledDate: overrides.scheduledDate === undefined ? '2026-10-31' : overrides.scheduledDate,
    status: overrides.status ?? 'active',
    completedAt: overrides.completedAt ?? null,
    reminderAt: overrides.reminderAt ?? '2026-11-01T12:00:00.000Z',
    createdAt: overrides.createdAt ?? '2026-10-29T01:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-10-29T01:00:00.000Z',
    isOverdue: overrides.isOverdue ?? false,
    isDueSoon: overrides.isDueSoon ?? false,
    timeLeftMs: overrides.timeLeftMs ?? 86_400_000,
  };
}

function renderHub() {
  return render(
    <ToastProvider>
      <TransitionProvider>
        <HubList timeZone="Asia/Saigon" />
      </TransitionProvider>
    </ToastProvider>,
  );
}

describe('Tasks Hub reuse, compact cards, and simplified grouping (§2.5, §9.4)', () => {
  it('maintains strictly one TaskCard and one TaskForm component across the entire codebase', async () => {
    const srcRoot = path.resolve(process.cwd(), 'src');
    const cardFiles = await findFilesMatching(srcRoot, /TaskCard\.tsx$/i);
    const formFiles = await findFilesMatching(srcRoot, /TaskForm\.tsx$/i);

    expect(cardFiles).toHaveLength(1);
    expect(formFiles).toHaveLength(1);
  });

  it('formats Hub cards compactly with HH:mm · ddd · d MMM, no leading middle-dot before time-left, plain-text description preview, and inspects on click', () => {
    const onInspect = vi.fn();
    const now = new Date('2026-10-30T03:00:00.000Z');
    const task = makeTask({
      description: '**Section 3** overview\n- Check attention weights',
      deadlineAt: '2026-11-02T12:00:00.000Z', // 19:00 · Mon · 2 Nov ICT
      scheduledDate: '2026-10-31',
    });

    render(
      <TaskCard
        task={task}
        now={now}
        context="hub"
        onInspect={onInspect}
        onToggleComplete={() => {}}
        onEdit={() => {}}
        onScheduleDate={() => {}}
        onOpenPickDate={() => {}}
        onOpenTransfer={() => {}}
        onRequestDelete={() => {}}
      />,
    );

    expect(screen.getByText('Scheduled 31/10')).toBeInTheDocument();
    expect(screen.getByText('19:00 · Mon · 2 Nov')).toBeInTheDocument();
    expect(screen.getByText(/3d 9h left/)).toBeInTheDocument();
    expect(screen.queryByText(/·\s+3d 9h left/)).toBeNull();
    expect(screen.getByText(/Section 3 overview/)).toBeInTheDocument();
    expect(screen.queryByText(/\*\*/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Read Transformer paper' }));
    expect(onInspect).toHaveBeenCalledWith(task);
  });

  it('groups tasks under Overdue, On-going, and permanently rendered collapsible Completed with Add task in the controls bar', async () => {
    const overdue = makeTask({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Overdue essay',
      deadlineAt: '2026-10-29T12:00:00.000Z',
    });
    const dueSoon = makeTask({
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Due soon lab',
      description: 'Run **regression** tests',
      deadlineAt: '2026-10-30T06:00:00.000Z',
      reminderAt: '2026-10-30T02:00:00.000Z',
    });
    const later = makeTask({
      id: '33333333-3333-4333-8333-333333333333',
      title: 'Later reading',
      deadlineAt: '2026-11-05T12:00:00.000Z',
    });
    const completed = makeTask({
      id: '44444444-4444-4444-8444-444444444444',
      title: 'Archived review',
      status: 'completed',
      completedAt: '2026-10-28T09:00:00.000Z',
    });
    queryState.tasks = [overdue, dueSoon, later, completed];

    renderHub();

    expect(screen.getByRole('heading', { name: 'Overdue' })).toBeInTheDocument();
    const ongoingHeading = screen.getByRole('heading', { name: 'On-going' });
    expect(ongoingHeading).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Due soon' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Later' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Show completed/i })).toBeNull();

    const ongoingSection = ongoingHeading.closest('section')!;
    expect(within(ongoingSection).getByText('Due soon lab')).toBeInTheDocument();
    expect(within(ongoingSection).getByText('Later reading')).toBeInTheDocument();
    expect(within(ongoingSection).getByText('Due soon')).toBeInTheDocument();

    // Add task sits in the controls row rather than the page header
    const header = screen
      .getByRole('heading', { name: 'Tasks hub' })
      .closest('[data-feature-heading]')! as HTMLElement;
    expect(within(header).queryByRole('button', { name: 'Add task' })).toBeNull();
    const addButtons = screen.getAllByRole('button', { name: 'Add task' });
    expect(addButtons).toHaveLength(1);
    expect(addButtons[0]).toHaveClass('ml-auto');

    // Completed group is permanently present and collapsed by default
    const completedToggle = screen.getByRole('button', { name: /^Completed\s+\d+$/i });
    expect(completedToggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Archived review')).toBeNull();

    fireEvent.click(completedToggle);
    expect(completedToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Archived review')).toBeInTheDocument();

    // Search matches stripped rich-note plain text cleanly
    const searchInput = screen.getByRole('searchbox', { name: 'Search tasks' });
    fireEvent.change(searchInput, { target: { value: 'regression tests' } });
    expect(screen.getByText('Due soon lab')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Later reading')).toBeNull());
  });

  it('keeps Completed collapsible section rendered when count is 0 and auto-expands on completed ?task=<id> clickthrough', () => {
    const doneId = '55555555-5555-4555-8555-555555555555';
    queryState.tasks = [];

    const first = renderHub();
    const emptyCompletedToggle = screen.getByRole('button', { name: /^Completed\s+\d+$/i });
    expect(emptyCompletedToggle).toHaveAttribute('aria-expanded', 'false');
    expect(within(emptyCompletedToggle).getByText('0')).toBeInTheDocument();
    fireEvent.click(emptyCompletedToggle);
    expect(emptyCompletedToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('No completed tasks yet.')).toBeInTheDocument();
    first.unmount();

    navState.search = `task=${doneId}`;
    queryState.tasks = [
      makeTask({
        id: doneId,
        title: 'Completed deep link task',
        description: 'Target notes inside **deep link**',
        status: 'completed',
        completedAt: '2026-10-29T09:00:00.000Z',
      }),
    ];

    renderHub();
    const toggle = screen.getByRole('button', { name: /^Completed\s+\d+$/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const cardButton = screen.getByRole('button', { name: 'Completed deep link task' });
    expect(cardButton).toBeInTheDocument();

    fireEvent.click(cardButton);
    expect(screen.getByRole('dialog', { name: 'Completed deep link task' })).toBeInTheDocument();
  });
});
