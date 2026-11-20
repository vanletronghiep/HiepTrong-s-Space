// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TaskDto } from '@/contracts';
import { TaskForm } from '@/features/tasks/shared/TaskForm';

afterEach(() => {
  cleanup();
});

const NOW = new Date('2026-11-06T03:00:00.000Z'); // 2026-11-06 10:00 Asia/Saigon

function makeTask(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Weekly review',
    description: '',
    priority: 'normal',
    pinned: false,
    deadlineAt: '2026-11-10T16:59:00.000Z', // 2026-11-10 23:59 ICT
    scheduledDate: '2026-11-10',
    status: 'active',
    completedAt: null,
    reminderAt: null,
    createdAt: '2026-11-01T01:00:00.000Z',
    updatedAt: '2026-11-01T01:00:00.000Z',
    isOverdue: false,
    isDueSoon: false,
    timeLeftMs: 400_000_000,
    ...overrides,
  };
}

function renderEdit(task: TaskDto, onUpdate = vi.fn().mockResolvedValue(task)) {
  render(
    <TaskForm
      open
      mode="edit"
      initialTask={task}
      now={NOW}
      onClose={() => {}}
      onCreate={vi.fn()}
      onUpdate={onUpdate}
    />,
  );
  return onUpdate;
}

describe('Weekly repeat in the shared task form (v3.3)', () => {
  it('offers Repeat weekly, reveals an optional Repeat until, and sends both on save', async () => {
    const onUpdate = renderEdit(makeTask());
    const toggle = screen.getByRole('switch', { name: 'Repeat weekly' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByLabelText('Repeat until (optional)')).toBeNull();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.change(screen.getByLabelText('Repeat until (optional)'), {
      target: { value: '2026-12-25' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    const [, payload] = onUpdate.mock.calls[0]!;
    expect(payload).toMatchObject({ repeatWeekly: true, repeatUntil: '2026-12-25' });
  });

  it('repeats with no end date when Repeat until is left empty, and turns off cleanly', async () => {
    const onUpdate = renderEdit(makeTask({ repeatWeekly: true, repeatUntil: '2026-12-25' }));
    const toggle = screen.getByRole('switch', { name: 'Repeat weekly' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('Repeat until (optional)')).toHaveValue('25/12');

    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(onUpdate.mock.calls[0]![1]).toMatchObject({ repeatWeekly: false, repeatUntil: null });
  });

  it('refuses a Repeat until date before the deadline', async () => {
    const onUpdate = renderEdit(makeTask());
    fireEvent.click(screen.getByRole('switch', { name: 'Repeat weekly' }));
    fireEvent.change(screen.getByLabelText('Repeat until (optional)'), {
      target: { value: '2026-11-09' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Repeat until must be on or after the deadline date.'),
    ).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
