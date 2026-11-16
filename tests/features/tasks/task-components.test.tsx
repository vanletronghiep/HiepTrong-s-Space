// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TaskDto } from '@/contracts';
import { LayoutGroup } from 'motion/react';
import { OverdueList } from '@/features/tasks/OverdueList';
import { TaskCard } from '@/features/tasks/TaskCard';
import { TaskForm } from '@/features/tasks/TaskForm';
import { TaskInspector } from '@/features/tasks/TaskInspector';
import { ScheduleDateDialog, TransferDialog } from '@/features/tasks/TransferDialog';

afterEach(() => {
  cleanup();
});

function makeTaskDto(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    title: overrides.title ?? 'Implement Celestial Workspace',
    description: overrides.description ?? '',
    priority: overrides.priority ?? 'normal',
    pinned: overrides.pinned ?? false,
    deadlineAt: overrides.deadlineAt ?? '2026-10-30T16:59:00.000Z',
    scheduledDate: overrides.scheduledDate === undefined ? '2026-10-30' : overrides.scheduledDate,
    status: overrides.status ?? 'active',
    completedAt: overrides.completedAt ?? null,
    reminderAt: overrides.reminderAt ?? '2026-10-30T12:00:00.000Z',
    createdAt: overrides.createdAt ?? '2026-10-29T01:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-10-29T01:00:00.000Z',
    isOverdue: overrides.isOverdue ?? false,
    isDueSoon: overrides.isDueSoon ?? false,
    timeLeftMs: overrides.timeLeftMs ?? 3_600_000,
  };
}

describe('TaskCard component states', () => {
  const noop = () => {};

  it('omits description paragraph when description is empty and toggles completion without expanding', () => {
    const onToggle = vi.fn();
    const now = new Date('2026-10-30T10:00:00.000Z');
    const task = makeTaskDto({ description: '' });

    const { container } = render(
      <TaskCard
        task={task}
        now={now}
        onToggleComplete={onToggle}
        onEdit={noop}
        onScheduleDate={noop}
        onOpenPickDate={noop}
        onOpenTransfer={noop}
        onRequestDelete={noop}
      />,
    );

    expect(container.querySelector('p')).toBeNull();
    const checkbox = screen.getByRole('checkbox', {
      name: /Complete Implement Celestial Workspace/i,
    });
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders composable urgent, pinned, due-soon, and overdue labels with text (never colour alone)', () => {
    const dueSoonNow = new Date('2026-10-30T13:00:00.000Z');
    const urgentPinnedTask = makeTaskDto({
      priority: 'urgent',
      pinned: true,
      deadlineAt: '2026-10-30T15:00:00.000Z',
      reminderAt: '2026-10-30T12:00:00.000Z',
    });

    const { rerender } = render(
      <TaskCard
        task={urgentPinnedTask}
        now={dueSoonNow}
        onToggleComplete={noop}
        onEdit={noop}
        onScheduleDate={noop}
        onOpenPickDate={noop}
        onOpenTransfer={noop}
        onRequestDelete={noop}
      />,
    );

    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByLabelText('Pinned to top of day')).toBeInTheDocument();
    expect(screen.getByText('Due soon')).toBeInTheDocument();

    // Advance clock past deadline -> turns overdue live without refetch
    const overdueNow = new Date('2026-10-30T17:00:00.000Z');
    rerender(
      <TaskCard
        task={urgentPinnedTask}
        now={overdueNow}
        context="overdue"
        onToggleComplete={noop}
        onEdit={noop}
        onScheduleDate={noop}
        onOpenPickDate={noop}
        onOpenTransfer={noop}
        onRequestDelete={noop}
      />,
    );

    expect(screen.getByText(/Overdue by 2h/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Transfer/i })).toBeInTheDocument();
  });

  it('opens TaskInspector via card click or keyboard and restores focus after Escape without completing the task', async () => {
    const onToggle = vi.fn();
    const onScheduleDate = vi.fn();
    const now = new Date('2026-10-30T10:00:00.000Z');
    const task = makeTaskDto({
      title: 'Keyboard expandable task',
      description: 'Detailed **notes** for keyboard expansion test',
      scheduledDate: null,
    });

    function HubCardWithInspector() {
      const [inspected, setInspected] = useState<TaskDto | null>(null);
      return (
        <>
          <TaskCard
            task={task}
            now={now}
            context="hub"
            onInspect={setInspected}
            onToggleComplete={onToggle}
            onEdit={noop}
            onScheduleDate={onScheduleDate}
            onOpenPickDate={noop}
            onOpenTransfer={noop}
            onRequestDelete={noop}
          />
          <TaskInspector
            portal
            task={inspected}
            open={inspected !== null}
            onClose={() => setInspected(null)}
            now={now}
            onToggleComplete={onToggle}
            onEdit={noop}
            onScheduleDate={onScheduleDate}
            onOpenPickDate={noop}
            onOpenTransfer={noop}
            onRequestDelete={noop}
          />
        </>
      );
    }

    render(<HubCardWithInspector />);

    const inspectBtn = screen.getByRole('button', { name: 'Keyboard expandable task' });
    expect(inspectBtn).toHaveAttribute('aria-haspopup', 'dialog');
    expect(screen.queryByRole('button', { name: /Schedule for today/i })).not.toBeInTheDocument();
    // Hub card description strips bold markdown markers in preview
    expect(screen.getByText('Detailed notes for keyboard expansion test')).toBeInTheDocument();

    // Activate inspection trigger via keyboard focus + click
    inspectBtn.focus();
    fireEvent.click(inspectBtn);

    const dialog = screen.getByRole('dialog', { name: task.title });
    expect(within(dialog).getByText('notes').tagName).toBe('STRONG');
    expect(dialog.closest('article')).toBeNull();
    expect(onToggle).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Schedule for today' }));
    expect(onScheduleDate).toHaveBeenCalledWith(task, '2026-10-30');

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: task.title })).not.toBeInTheDocument(),
    );
    expect(inspectBtn).toHaveFocus();
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('aligns daily and overdue content in one left-aligned column without pl-8 and ignores action button clicks for inspection', () => {
    const onInspect = vi.fn();
    const onToggle = vi.fn();
    const onOpenTransfer = vi.fn();
    const onRequestDelete = vi.fn();
    const now = new Date('2026-10-30T18:00:00.000Z');
    const task = makeTaskDto({
      title: 'Overdue reading',
      description: 'Page 14 through 28',
      deadlineAt: '2026-10-30T15:00:00.000Z',
    });

    const { container } = render(
      <TaskCard
        task={task}
        now={now}
        context="overdue"
        onInspect={onInspect}
        onToggleComplete={onToggle}
        onEdit={noop}
        onScheduleDate={noop}
        onOpenPickDate={noop}
        onOpenTransfer={onOpenTransfer}
        onRequestDelete={onRequestDelete}
      />,
    );

    expect(container.querySelector('.pl-8')).toBeNull();

    // Checkbox, menu trigger, Transfer, and Delete must NOT open TaskInspector
    fireEvent.click(screen.getByRole('checkbox', { name: /Complete Overdue reading/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Overdue reading' }));
    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }));
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]!);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onOpenTransfer).toHaveBeenCalledTimes(1);
    expect(onRequestDelete).toHaveBeenCalledTimes(1);
    expect(onInspect).not.toHaveBeenCalled();

    // Clicking the card description body opens TaskInspector
    fireEvent.click(screen.getByText('Page 14 through 28'));
    expect(onInspect).toHaveBeenCalledTimes(1);
    expect(onInspect).toHaveBeenCalledWith(task);
  });

  it('generates distinct DOM IDs when the same task is rendered in daily carousel and overdue lane (C12)', () => {
    const now = new Date('2026-10-30T18:00:00.000Z');
    const overdueTask = makeTaskDto({
      id: '99999999-9999-4999-8999-999999999999',
      title: 'Shared overdue task',
      deadlineAt: '2026-10-30T15:00:00.000Z',
      scheduledDate: '2026-10-30',
    });

    const { container } = render(
      <div>
        <TaskCard
          task={overdueTask}
          now={now}
          context="daily"
          carousel
          onToggleComplete={noop}
          onEdit={noop}
          onScheduleDate={noop}
          onOpenPickDate={noop}
          onOpenTransfer={noop}
          onRequestDelete={noop}
        />
        <TaskCard
          task={overdueTask}
          now={now}
          context="overdue"
          onToggleComplete={noop}
          onEdit={noop}
          onScheduleDate={noop}
          onOpenPickDate={noop}
          onOpenTransfer={noop}
          onRequestDelete={noop}
        />
      </div>,
    );

    const articles = Array.from(container.querySelectorAll('article'));
    expect(articles).toHaveLength(2);
    expect(articles[0]?.id).toBeTruthy();
    expect(articles[1]?.id).toBeTruthy();
    expect(articles[0]?.id).not.toBe(articles[1]?.id);
  });
});

describe('TaskForm validation', () => {
  it('shows inline validation errors for empty title and invalid date/time', async () => {
    const onCreate = vi.fn();
    const now = new Date('2026-10-30T03:00:00.000Z');

    render(
      <TaskForm
        open
        mode="create"
        defaultScheduledDate="2026-10-30"
        now={now}
        onClose={() => {}}
        onCreate={onCreate}
        onUpdate={vi.fn()}
      />,
    );

    const title = screen.getByRole('textbox', { name: 'Title' });
    const feedback = document.getElementById('task-title-feedback');
    expect(feedback).toBeInTheDocument();
    const reserve = feedback?.querySelector('[aria-hidden="true"]');
    expect(reserve).toBeInTheDocument();
    expect(reserve?.getAttribute('role')).toBeNull();
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: /^Today$|^Tomorrow$/ })).toBeNull();
    const timeInput = screen.getByLabelText(/Deadline time/i);
    fireEvent.change(timeInput, { target: { value: '99:99' } });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    expect(await screen.findByText('Enter a task title.')).toBeInTheDocument();
    expect(await screen.findByText(/Enter a valid 24-hour time/i)).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
    expect(title).toHaveFocus();
    fireEvent.change(title, { target: { value: '  ' } });
    expect(screen.getByText('Enter a task title.')).toBeInTheDocument();
    fireEvent.change(title, { target: { value: 'Valid title' } });
    await waitFor(() => expect(screen.queryByText('Enter a task title.')).toBeNull());
    expect(document.getElementById('task-title-feedback')).toBe(feedback);
  });

  it('uses shared RichNoteEditor, DatePickerField, and TimeFieldControl across TaskForm, TransferDialog, and ScheduleDateDialog', () => {
    const now = new Date('2026-10-30T03:00:00.000Z');
    const task = makeTaskDto({ scheduledDate: '2026-10-30' });

    const { container } = render(
      <>
        <TaskForm
          open
          mode="create"
          defaultScheduledDate="2026-10-30"
          now={now}
          onClose={() => {}}
          onCreate={vi.fn()}
          onUpdate={vi.fn()}
        />
        <TransferDialog
          open
          task={task}
          now={now}
          onClose={() => {}}
          onSubmitTransfer={vi.fn()}
        />
        <ScheduleDateDialog
          open
          task={task}
          now={now}
          onClose={() => {}}
          onSelectDate={vi.fn()}
        />
      </>,
    );

    expect(container.querySelector('input[type="date"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bullet list' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
    expect(screen.getByLabelText('Deadline date (DD/MM)')).toBeInTheDocument();
    expect(screen.getByLabelText('Deadline time (HH:mm)')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Open calendar' })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Open 24-hour time picker' })).toHaveLength(2);
  });
});

describe('OverdueList layout hygiene', () => {
  it('renders TaskCard articles directly inside the overdue stack without duplicate layout wrappers', () => {
    const noop = () => {};
    const now = new Date('2026-10-30T18:00:00.000Z');
    const overdueA = makeTaskDto({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      title: 'Overdue A',
      deadlineAt: '2026-10-30T15:00:00.000Z',
      isOverdue: true,
    });
    const overdueB = makeTaskDto({
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      title: 'Overdue B',
      deadlineAt: '2026-10-30T16:00:00.000Z',
      isOverdue: true,
    });

    const { container, rerender } = render(
      <LayoutGroup>
        <OverdueList
          tasks={[overdueA, overdueB]}
          now={now}
          recentlyCreatedId={null}
          onToggleComplete={noop}
          onEdit={noop}
          onScheduleDate={noop}
          onOpenPickDate={noop}
          onOpenTransfer={noop}
          onRequestDelete={noop}
        />
      </LayoutGroup>,
    );

    const articles = Array.from(container.querySelectorAll('article'));
    expect(articles).toHaveLength(2);
    expect(articles[0]?.parentElement).toBe(articles[1]?.parentElement);
    expect(articles[0]?.parentElement?.children).toHaveLength(2);

    rerender(
      <LayoutGroup>
        <OverdueList
          tasks={[overdueB]}
          now={now}
          recentlyCreatedId={null}
          onToggleComplete={noop}
          onEdit={noop}
          onScheduleDate={noop}
          onOpenPickDate={noop}
          onOpenTransfer={noop}
          onRequestDelete={noop}
        />
      </LayoutGroup>,
    );

    expect(screen.getByText('Overdue B')).toBeInTheDocument();
  });
});
