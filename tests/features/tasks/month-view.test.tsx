// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TaskDto } from '@/contracts';
import { MonthView } from '@/features/tasks/MonthView';

afterEach(cleanup);

const now = new Date('2027-02-01T09:00:00.000Z');

function task(overrides: Partial<TaskDto>): TaskDto {
  return {
    id: 'scheduled',
    title: 'Scheduled task',
    description: '',
    priority: 'urgent',
    pinned: false,
    deadlineAt: '2027-02-01T08:00:00.000Z',
    scheduledDate: '2027-02-01',
    status: 'active',
    completedAt: null,
    reminderAt: '2027-01-31T12:00:00.000Z',
    createdAt: '2027-01-31T12:00:00.000Z',
    updatedAt: '2027-01-31T12:00:00.000Z',
    isOverdue: true,
    isDueSoon: false,
    timeLeftMs: -3_600_000,
    ...overrides,
  };
}

function renderMonth(tasks: TaskDto[], onToggleComplete = vi.fn()) {
  const noop = () => {};
  render(
    <MonthView
      anchorDate="2027-02-01"
      tasks={tasks}
      now={now}
      recentlyCreatedId={null}
      onToggleComplete={onToggleComplete}
      onEdit={noop}
      onScheduleDate={noop}
      onOpenPickDate={noop}
      onOpenTransfer={noop}
      onRequestDelete={noop}
    />,
  );
}

describe('Daily Month view', () => {
  it('keeps six Monday-first rows and counts only tasks scheduled for each day', () => {
    renderMonth([
      task({}),
      task({
        id: 'done',
        status: 'completed',
        priority: 'normal',
        completedAt: '2027-02-01T07:00:00.000Z',
        isOverdue: false,
      }),
      task({ id: 'unscheduled', scheduledDate: null, priority: 'optional' }),
    ]);

    const calendar = screen.getByRole('region', { name: 'February 2027 calendar' });
    const days = within(calendar).getAllByRole('button');
    expect(days).toHaveLength(42);
    expect(days.at(-1)).toHaveAccessibleName('2027-03-14, 0 of 0 done');
    expect(days[0]).toHaveAccessibleName(
      '2027-02-01, 1 of 2 done, 1 urgent, 1 normal, overdue tasks',
    );
    expect(days[0]).toHaveAttribute('aria-current', 'date');
    expect(within(days[0]!).getByText('1/2')).toBeInTheDocument();
    expect(within(days[0]!).getByText('1 urgent')).toBeInTheDocument();
    expect(within(days[0]!).getByText('1 normal')).toBeInTheDocument();
  });

  it('opens the existing day drawer and passes task actions through', () => {
    const scheduled = task({});
    const onToggleComplete = vi.fn();
    renderMonth([scheduled, task({ id: 'unscheduled', scheduledDate: null })], onToggleComplete);

    fireEvent.click(screen.getByRole('button', { name: /2027-02-01, 0 of 1 done/ }));
    const drawer = screen.getByRole('dialog', { name: 'Monday, 01/02' });
    expect(within(drawer).getAllByRole('checkbox')).toHaveLength(1);
    fireEvent.click(within(drawer).getByRole('checkbox', { name: 'Complete Scheduled task' }));
    expect(onToggleComplete).toHaveBeenCalledWith(scheduled);
  });
});
