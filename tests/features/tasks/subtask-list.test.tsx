// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Subtask } from '@/contracts';
import { SubtaskBadge } from '@/features/tasks/shared/SubtaskBadge';
import { TaskCard } from '@/features/tasks/shared/TaskCard';
import { SubtaskList } from '@/features/tasks/shared/SubtaskList';

afterEach(cleanup);

const sub = (title: string, priority: Subtask['priority'], done = false): Subtask => ({
  id: crypto.randomUUID(),
  title,
  priority,
  done,
  createdAt: '2026-11-19T01:00:00.000Z',
});

describe('SubtaskList', () => {
  it('adds a subtask with the chosen priority when Enter is pressed', () => {
    const onChange = vi.fn();
    render(<SubtaskList subtasks={[]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Urgent' }));
    const input = screen.getByLabelText('New subtask');
    fireEvent.change(input, { target: { value: '  Draft outline ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]![0]).toEqual([
      expect.objectContaining({ title: 'Draft outline', priority: 'urgent', done: false }),
    ]);
  });

  it('ignores blank titles', () => {
    const onChange = vi.fn();
    render(<SubtaskList subtasks={[]} onChange={onChange} />);
    const input = screen.getByLabelText('New subtask');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('lists items by priority with done items last, and deletes with one click', () => {
    const onChange = vi.fn();
    const items = [
      sub('Optional thing', 'optional'),
      sub('Finished thing', 'urgent', true),
      sub('Urgent thing', 'urgent'),
    ];
    render(<SubtaskList subtasks={items} onChange={onChange} />);

    const rows = screen.getAllByRole('listitem').map((row) => row.textContent);
    expect(rows[0]).toContain('Urgent thing');
    expect(rows[1]).toContain('Optional thing');
    expect(rows[2]).toContain('Finished thing');

    fireEvent.click(screen.getByRole('button', { name: 'Delete Urgent thing' }));
    expect(onChange).toHaveBeenCalledWith(items.filter((item) => item.title !== 'Urgent thing'));
  });

  it('toggles done and offers promotion when a handler is given', () => {
    const onChange = vi.fn();
    const onPromote = vi.fn();
    const items = [sub('Alpha', 'normal')];
    render(<SubtaskList subtasks={items} onChange={onChange} onPromote={onPromote} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Complete Alpha' }));
    expect(onChange).toHaveBeenCalledWith([{ ...items[0]!, done: true }]);

    fireEvent.click(screen.getByRole('button', { name: 'Make Alpha its own task' }));
    expect(onPromote).toHaveBeenCalledWith(items[0]!.id);
  });
});

describe('SubtaskBadge', () => {
  it('shows nothing without subtasks and a done/total count with them', () => {
    const { container, rerender } = render(<SubtaskBadge subtasks={[]} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<SubtaskBadge subtasks={[sub('a', 'normal', true), sub('b', 'normal')]} />);
    expect(screen.getByLabelText('1 of 2 subtasks done')).toHaveTextContent('1/2');
  });
});

describe('SubtaskBadge on Overdue cards', () => {
  it('sits in the action row, not in the bottom-right corner over the buttons', () => {
    const noop = () => {};
    const { container } = render(
      <TaskCard
        context="overdue"
        now={new Date('2026-11-20T03:00:00.000Z')}
        onToggleComplete={noop}
        onEdit={noop}
        onScheduleDate={noop}
        onOpenPickDate={noop}
        onOpenTransfer={noop}
        onRequestDelete={noop}
        task={{
          id: '11111111-1111-4111-8111-111111111111',
          title: 'Late task',
          description: '',
          priority: 'normal',
          pinned: false,
          deadlineAt: '2026-11-19T10:00:00.000Z',
          scheduledDate: '2026-11-19',
          status: 'active',
          completedAt: null,
          reminderAt: null,
          createdAt: '2026-11-01T01:00:00.000Z',
          updatedAt: '2026-11-01T01:00:00.000Z',
          isOverdue: true,
          isDueSoon: false,
          timeLeftMs: -1,
          subtasks: [sub('a', 'normal', true), sub('b', 'normal')],
        }}
      />,
    );
    const badge = screen.getByLabelText('1 of 2 subtasks done');
    expect(badge.closest('article')).not.toBeNull();
    // Rendered inside the row that holds Transfer and Delete.
    const row = screen.getByRole('button', { name: /transfer/i }).parentElement;
    expect(row?.contains(badge)).toBe(true);
    expect(container.querySelectorAll('[aria-label="1 of 2 subtasks done"]')).toHaveLength(1);
  });
});

describe('SubtaskList editing', () => {
  it('turns a row into an editor on double click and saves the new title and priority', () => {
    const onChange = vi.fn();
    const items = [sub('Draft outline', 'normal'), sub('Other', 'optional')];
    render(<SubtaskList subtasks={items} onChange={onChange} />);

    fireEvent.doubleClick(screen.getByText('Draft outline'));
    const input = screen.getByLabelText('Edit subtask title');
    expect(input).toHaveValue('Draft outline');

    fireEvent.change(input, { target: { value: '  Final outline ' } });
    fireEvent.click(screen.getAllByRole('radio', { name: 'Urgent' })[0]!);
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith([
      { ...items[0]!, title: 'Final outline', priority: 'urgent' },
      items[1],
    ]);
    expect(screen.queryByLabelText('Edit subtask title')).toBeNull();
  });

  it('cancels with Escape and ignores an empty title', () => {
    const onChange = vi.fn();
    render(<SubtaskList subtasks={[sub('Keep me', 'normal')]} onChange={onChange} />);

    fireEvent.doubleClick(screen.getByText('Keep me'));
    const input = screen.getByLabelText('Edit subtask title');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Keep me')).toBeInTheDocument();
  });
});
