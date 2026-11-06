// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { TaskDto } from '@/contracts';
import { WeekView } from '@/features/tasks/WeekView';

afterEach(cleanup);

function task(id: string, title: string, overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id,
    title,
    description: '',
    priority: 'urgent',
    pinned: false,
    status: 'active',
    scheduledDate: '2026-11-02',
    deadlineAt: '2026-11-02T17:30:00.000Z',
    completedAt: null,
    reminderAt: null,
    createdAt: '2026-11-01T05:00:00.000Z',
    updatedAt: '2026-11-01T05:00:00.000Z',
    isDueSoon: false,
    isOverdue: false,
    timeLeftMs: 0,
    ...overrides,
  };
}

it('counts scheduled tasks and zoned deadlines separately and keeps task actions in the day drawer', async () => {
  const draft = task('draft', 'Draft lesson');
  const tasks = [
    draft,
    task('review', 'Review lecture', {
      priority: 'normal',
      status: 'completed',
      completedAt: '2026-11-02T11:00:00.000Z',
      deadlineAt: '2026-11-02T12:00:00.000Z',
    }),
    task('practice', 'Practice questions', {
      priority: 'optional',
      deadlineAt: '2026-11-09T00:00:00.000Z',
    }),
    task('unscheduled', 'Unscheduled reminder', {
      scheduledDate: null,
      deadlineAt: '2026-11-03T18:00:00.000Z',
    }),
  ];
  const onToggleComplete = vi.fn();
  const onEdit = vi.fn();
  const onScheduleDate = vi.fn();
  const onOpenTransfer = vi.fn();
  const onRequestDelete = vi.fn();
  render(
    <WeekView
      anchorDate="2026-11-02"
      tasks={tasks}
      now={new Date('2026-11-04T18:10:00.000Z')}
      recentlyCreatedId={null}
      onToggleComplete={onToggleComplete}
      onEdit={onEdit}
      onScheduleDate={onScheduleDate}
      onOpenPickDate={vi.fn()}
      onOpenTransfer={onOpenTransfer}
      onRequestDelete={onRequestDelete}
    />,
  );
  const summaries = within(screen.getByRole('group', { name: 'Week task summaries' }));
  expect(summaries.getAllByRole('button')).toHaveLength(7);
  const monday = summaries.getByRole('button', { name: /Monday.*1 of 3 done, 1 due this day/ });
  const mondayCard = within(monday.closest('article')!);
  expect(mondayCard.getByText('33%')).toBeInTheDocument();
  for (const priority of ['urgent', 'normal', 'optional']) {
    expect(
      within(mondayCard.getByText(priority).closest('li')!).getByText('1'),
    ).toBeInTheDocument();
  }
  expect(
    summaries.getByRole('button', { name: /Tuesday.*0 of 0 done, 1 due this day/ }),
  ).toBeInTheDocument();
  expect(
    summaries.getByRole('button', { name: /Wednesday.*0 of 0 done, 1 due this day/ }),
  ).toBeInTheDocument();
  expect(summaries.getByRole('button', { name: /Thursday/ })).toHaveAttribute(
    'aria-current',
    'date',
  );

  monday.focus();
  fireEvent.click(monday);
  const drawer = within(screen.getByRole('dialog', { name: /Monday/ }));
  await waitFor(() => expect(drawer.getByRole('button', { name: 'Close drawer' })).toHaveFocus());
  fireEvent.click(drawer.getByRole('checkbox', { name: 'Complete Draft lesson' }));
  expect(onToggleComplete).toHaveBeenCalledWith(draft);
  expect(drawer.queryByText('Unscheduled reminder')).toBeNull();

  const act = (name: string) => {
    fireEvent.click(drawer.getByRole('button', { name: 'Actions for Draft lesson' }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Menu for Draft lesson' })).getByRole('button', {
        name,
      }),
    );
  };
  act('Edit');
  expect(onEdit).toHaveBeenCalledWith(draft);
  act('Remove from daily');
  expect(onScheduleDate).toHaveBeenCalledWith(draft, null);
  act('Transfer…');
  expect(onOpenTransfer).toHaveBeenCalledWith(draft);
  act('Delete');
  expect(onRequestDelete).toHaveBeenCalledWith(draft);
  await waitFor(() =>
    expect(screen.queryByRole('dialog', { name: 'Menu for Draft lesson' })).not.toBeInTheDocument(),
  );
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(monday).toHaveFocus());
});
