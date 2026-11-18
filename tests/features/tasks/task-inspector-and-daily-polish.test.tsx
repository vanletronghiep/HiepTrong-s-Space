// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskDto } from '@/contracts';
import { DailyBoard } from '@/features/tasks/DailyBoard';
import { DailyDashboard } from '@/features/tasks/DailyDashboard';
import { DailySky } from '@/features/tasks/DailySky';
import { TaskInspector } from '@/features/tasks/TaskInspector';
import { ScheduleDateDialog } from '@/features/tasks/TransferDialog';
import { TransitionProvider } from '@/features/transitions/TransitionProvider';
import { ToastProvider } from '@/ui/Toast';

const dailyPrefState = vi.hoisted(() => ({
  mode: 'day' as 'day' | 'week' | 'month',
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
  usePathname: () => '/tasks/daily',
}));

vi.mock('@/client/preferences', () => ({
  getDailyViewPreference: () => dailyPrefState.mode,
  setDailyViewPreference: (next: 'day' | 'week' | 'month') => {
    dailyPrefState.mode = next;
  },
  getRouteLoadHistoryRaw: () => null,
  setRouteLoadHistoryRaw: () => {},
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
}));

vi.mock('@/client/use-minute-ticker', () => ({
  useMinuteTicker: () => new Date('2026-11-15T03:00:00.000Z'), // 2026-11-15 10:00 ICT
}));

beforeEach(() => {
  dailyPrefState.mode = 'day';
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

function makeTask(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: overrides.id ?? 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    title: overrides.title ?? 'Observe winter constellations',
    description: overrides.description ?? 'Bring **star chart**\n\n- Check <script>xss()</script>',
    priority: overrides.priority ?? 'urgent',
    pinned: overrides.pinned ?? true,
    deadlineAt: overrides.deadlineAt ?? '2026-11-15T12:00:00.000Z', // 19:00 ICT
    scheduledDate: overrides.scheduledDate === undefined ? '2026-11-15' : overrides.scheduledDate,
    status: overrides.status ?? 'active',
    completedAt: overrides.completedAt ?? null,
    reminderAt: overrides.reminderAt ?? '2026-11-15T10:00:00.000Z',
    createdAt: overrides.createdAt ?? '2026-11-10T01:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-11-10T01:00:00.000Z',
    isOverdue: overrides.isOverdue ?? false,
    isDueSoon: overrides.isDueSoon ?? false,
    timeLeftMs: overrides.timeLeftMs ?? 32_400_000,
  };
}

describe('TaskInspector modal behavior and nested Escape layering', () => {
  it('renders formatted notes safely, shows complete deadline/scheduled dates with year, and groups Daily placement separately from Overdue transfer', () => {
    const now = new Date('2026-11-15T03:00:00.000Z');
    const onScheduleDate = vi.fn();
    const onOpenTransfer = vi.fn();
    const activeTask = makeTask();

    const { rerender } = render(
      <TaskInspector
        portal
        task={activeTask}
        open
        onClose={() => {}}
        now={now}
        timeZone="Asia/Saigon"
        onToggleComplete={() => {}}
        onEdit={() => {}}
        onScheduleDate={onScheduleDate}
        onOpenPickDate={() => {}}
        onOpenTransfer={onOpenTransfer}
        onRequestDelete={() => {}}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: activeTask.title });
    expect(dialog).toHaveClass('sm:w-[min(75vw,960px)]', 'max-w-none', 'max-h-[88dvh]');
    expect(within(dialog).getByText('star chart').tagName).toBe('STRONG');
    expect(within(dialog).getByText(/<script>xss\(\)<\/script>/)).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();

    expect(within(dialog).getByText('19:00 · Sun · 15 Nov 2026')).toBeInTheDocument();
    expect(within(dialog).getByText('Sun · 15 Nov 2026')).toBeInTheDocument();
    // v3.2: no Active badge, no placement box, no divider above the footer buttons.
    expect(within(dialog).queryByText('Active')).toBeNull();
    expect(within(dialog).queryByText('Daily calendar placement')).toBeNull();
    expect(within(dialog).queryByText('Overdue deadline reschedule')).toBeNull();
    expect(dialog.querySelector('.border-t')).toBeNull();
    const chooseDay = within(dialog).getByRole('button', { name: 'Choose day' });
    fireEvent.click(chooseDay);
    expect(within(dialog).getByRole('menuitem', { name: 'Today' })).toBeInTheDocument();
    expect(within(dialog).getByRole('menuitem', { name: 'Tomorrow' })).toBeInTheDocument();
    expect(within(dialog).getByRole('menuitem', { name: 'Specific date…' })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('menuitem', { name: 'Remove from Daily' }));
    expect(onScheduleDate).toHaveBeenLastCalledWith(activeTask, null);

    const overdueTask = makeTask({
      deadlineAt: '2026-11-14T12:00:00.000Z',
      scheduledDate: null,
      description: '',
    });

    rerender(
      <TaskInspector
        portal
        task={overdueTask}
        open
        onClose={() => {}}
        now={now}
        timeZone="Asia/Saigon"
        onToggleComplete={() => {}}
        onEdit={() => {}}
        onScheduleDate={onScheduleDate}
        onOpenPickDate={() => {}}
        onOpenTransfer={onOpenTransfer}
        onRequestDelete={() => {}}
      />,
    );

    expect(within(dialog).getByText('No description added.')).toBeInTheDocument();
    expect(within(dialog).getByText('Not scheduled on Daily')).toBeInTheDocument();
    expect(within(dialog).getByText('Overdue')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Choose day' }));
    expect(within(dialog).getByText('Moves the day and the deadline.')).toBeInTheDocument();
    expect(within(dialog).queryByRole('menuitem', { name: 'Remove from Daily' })).toBeNull();
    fireEvent.click(within(dialog).getByRole('menuitem', { name: 'Today' }));
    expect(onOpenTransfer).toHaveBeenLastCalledWith(overdueTask, '2026-11-15');
    expect(onScheduleDate).toHaveBeenCalledTimes(1);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Choose day' }));
    fireEvent.click(within(dialog).getByRole('menuitem', { name: 'Specific date…' }));
    expect(onOpenTransfer).toHaveBeenLastCalledWith(overdueTask);

    // Escape closes only the menu; the dialog stays open
    fireEvent.click(within(dialog).getByRole('button', { name: 'Choose day' }));
    fireEvent.keyDown(within(dialog).getByRole('menu'), { key: 'Escape' });
    expect(within(dialog).queryByRole('menu')).toBeNull();
    expect(screen.getByRole('dialog', { name: overdueTask.title })).toBeInTheDocument();
  });

  it('closes nested ScheduleDateDialog on first Escape before closing TaskInspector', async () => {
    const now = new Date('2026-11-15T03:00:00.000Z');
    const task = makeTask();

    function LayeredInspector() {
      const [inspectOpen, setInspectOpen] = useState(true);
      const [pickOpen, setPickOpen] = useState(false);

      return (
        <>
          <TaskInspector
            portal
            task={task}
            open={inspectOpen}
            onClose={() => setInspectOpen(false)}
            now={now}
            onToggleComplete={() => {}}
            onEdit={() => {}}
            onScheduleDate={() => {}}
            onOpenPickDate={() => setPickOpen(true)}
            onOpenTransfer={() => {}}
            onRequestDelete={() => {}}
          />
          <ScheduleDateDialog
            portal
            task={pickOpen ? task : null}
            open={pickOpen}
            onClose={() => setPickOpen(false)}
            onSelectDate={vi.fn()}
            now={now}
          />
        </>
      );
    }

    render(<LayeredInspector />);

    fireEvent.click(screen.getByRole('button', { name: 'Choose day' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Specific date…' }));
    expect(screen.getByRole('dialog', { name: 'Schedule for a day' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: task.title })).toBeInTheDocument();

    // First Escape closes ScheduleDateDialog only
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Schedule for a day' })).toBeNull(),
    );
    expect(screen.getByRole('dialog', { name: task.title })).toBeInTheDocument();

    // Second Escape closes TaskInspector
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: task.title })).toBeNull());
  });
});

describe('DailyBoard visual asset retirement, stable Week/Month navigation, and Daily card inspection', () => {
  it('renders the two-word masthead with an italic second word, a subtitle, and no title star or arc deadline star (v3.2)', () => {
    queryState.tasks = [];
    const { container } = render(
      <ToastProvider>
        <DailyBoard timeZone="Asia/Saigon" />
      </ToastProvider>,
    );

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Task management');
    expect(heading.querySelector('span')).toHaveTextContent('management');
    expect(heading.querySelector('svg')).toBeNull();
    expect(heading.parentElement?.querySelector('p')).not.toBeNull();
    expect(container.querySelector('[class*="deadlineStar"]')).toBeNull();
  });

  it('retires galaxy, glint shooting-star, and forecast planet from Daily sky & dashboard', () => {
    const { container } = render(
      <ToastProvider>
        <TransitionProvider>
          <DailySky />
          <DailyDashboard done={1} total={3} timeZone="Asia/Saigon" />
        </TransitionProvider>
      </ToastProvider>,
    );

    expect(container.querySelector('[class*="galaxy"]')).toBeNull();
    expect(container.querySelector('[class*="forecastPlanet"]')).toBeNull();
    expect(container.innerHTML).not.toContain('daily-shooting-star');
    expect(container.innerHTML).not.toContain('spiral-galaxy');
  });

  it('uses stable 3-part Week/Month date navigation and opens shared TaskInspector across Day, Week drawer, Month drawer, and Overdue', async () => {
    const todayTask = makeTask({
      id: 'today-1',
      title: 'Inspect from Day board',
      scheduledDate: '2026-11-15',
      deadlineAt: '2026-11-15T15:00:00.000Z',
    });
    const overdueTask = makeTask({
      id: 'overdue-1',
      title: 'Inspect from Overdue lane',
      scheduledDate: null,
      deadlineAt: '2026-11-14T12:00:00.000Z',
    });
    queryState.tasks = [todayTask, overdueTask];

    const { container } = render(
      <ToastProvider>
        <DailyBoard timeZone="Asia/Saigon" />
      </ToastProvider>,
    );

    // Day carousel card opens TaskInspector
    fireEvent.click(screen.getByRole('button', { name: 'Inspect from Day board' }));
    expect(screen.getByRole('dialog', { name: 'Inspect from Day board' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Inspect from Day board' })).toBeNull(),
    );

    // Overdue card opens TaskInspector
    fireEvent.click(screen.getByRole('button', { name: 'Inspect from Overdue lane' }));
    expect(screen.getByRole('dialog', { name: 'Inspect from Overdue lane' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Inspect from Overdue lane' })).toBeNull(),
    );

    // Switch to Week view and verify 3-part dateNav + Drawer card inspection
    fireEvent.click(screen.getByRole('radio', { name: 'Week' }));
    const weekNavPrev = await screen.findByRole('button', { name: 'Previous week' });
    const weekNav = weekNavPrev.parentElement!;
    expect(weekNav.className).toContain('dateNavWeek');
    expect(weekNav.children).toHaveLength(3);
    expect(within(weekNav).getByRole('button', { name: 'Next week' })).toBe(weekNav.children[2]);

    const weekGroup = await screen.findByRole('group', { name: 'Week task summaries' });
    const sundayBtn = within(weekGroup).getByRole('button', {
      name: /Sunday/i,
    });
    fireEvent.click(sundayBtn);
    const weekDrawer = screen.getByRole('dialog', { name: /Sunday/i });
    fireEvent.click(within(weekDrawer).getByRole('button', { name: 'Inspect from Day board' }));
    expect(screen.getByRole('dialog', { name: 'Inspect from Day board' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Inspect from Day board' })).toBeNull(),
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Sunday/i })).toBeNull());

    // Switch to Month view and verify stable 3-part dateNav across May & September
    fireEvent.click(screen.getByRole('radio', { name: 'Month' }));
    const prevMonth = await screen.findByRole('button', { name: 'Previous month' });
    const monthNav = prevMonth.parentElement!;
    expect(monthNav.className).toContain('dateNavMonth');
    expect(monthNav.children).toHaveLength(3);
    expect(within(monthNav).getByText('November 2026')).toBeInTheDocument();
    expect(container.querySelector('[class*="dateNavLabel"]')).toBeInTheDocument();
  });

  it('publishes night-bloom-corner and starlit-thread-divider, deletes retired Daily SVGs, and sizes Hub cards to their content (v3.1)', async () => {
    const publicDir = path.resolve(process.cwd(), 'public', 'visuals', 'daily-v2');
    const publishedFiles = await fs.readdir(publicDir);

    expect(publishedFiles).toContain('night-bloom-corner.svg');
    expect(publishedFiles).toContain('starlit-thread-divider.svg');
    expect(publishedFiles).not.toContain('eclipse-broken-orbit.svg');
    expect(publishedFiles).not.toContain('spiral-galaxy.svg');

    const cardCss = await fs.readFile(
      path.resolve(process.cwd(), 'src/features/tasks/daily-task-card.module.css'),
      'utf8',
    );
    expect(cardCss).toContain('/visuals/daily-v2/night-bloom-corner.svg');
    expect(cardCss).toContain('/visuals/daily-v2/starlit-thread-divider.svg');
    expect(cardCss).not.toContain('spiral-galaxy.svg');
    expect(cardCss).not.toContain('eclipse-broken-orbit.svg');

    const noteCss = await fs.readFile(
      path.resolve(process.cwd(), 'src/features/tasks/task-note.module.css'),
      'utf8',
    );
    // v3.1 §5.3: Hub cards no longer reserve a fixed 240px body.
    expect(noteCss).not.toContain('height: 240px');
    expect(noteCss).not.toContain('aspect-ratio: 4 / 5');
  });
});
